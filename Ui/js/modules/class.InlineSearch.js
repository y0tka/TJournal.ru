/**
 * InlineSearch class
 *
 */
Air.defineClass(
    'class.InlineSearch',
    `lib.DOM, lib.keys, lib.ajax`,
    function( $, keys, ajax ) {

        'use strict';

        /**
         * Classnames
         */
        var CSS = {
            inlineWrapper: 'inline-search-item',
            dropdown: 'inline-dropdown',
            dropdownHidden: 'inline-dropdown--hidden',
            dropdownItemCustom: 'inline-dropdown__found-item',
            dropdownItemBasic: 'dropdown__found__item',
            dropdownItemSelected: 'dropdown__found__item--selected',
        };

        /**
         * InlineSearch base class
         *
         * @property {string}           initialChar         Symbol that start search
         * @property {string}           bemModifier         Modifier to add to the inline-wrapper
         * @property {Boolean}          activated           Status means user is typing search string
         * @property {Element|null}     inlineWrapper       Element that wrapps text
         * @property {Array}            _predefinedItems     Items that will be immediately shown in found-list
         * @property {Element|null}     dropdown            Element with found items
         * @property {Array}            foundItems          Rendered found items in dropdown
         * @property {Number|null}      selectedItemIndex   Selected item number in dropdown
         * @property {String}           searchURL           Search request endpoint
         * @property {XMLHttpRequest}   searchRequest       Search request instance
         * @property {TimoutId|null}    searchDebounceTimer Search request starting timer
         */
        return class InlineSearch {

            /**
             * InlineSearch item
             *
             * @constructor
             *
             * @param {object} options
             * @param {string} options.initialChar - this symbol will be wrapped
             * @param {string} options.searchURL   - search request endpoint
             * @param {string} options.bemModifier - Modifier to add to the inline-wrapper
             */
            constructor({initialChar, searchURL, bemModifier}) {

                this.initialChar = initialChar;
                this.bemModifier = bemModifier;
                this.searchURL = searchURL;
                this.activated = false;
                this.inlineWrapper = null;
                this._predefinedItems = [];

                this.dropdown = null;
                this.foundItems = [];
                this.selectedItemIndex = null;
                this.searchRequest = null;
                this.searchDebounceTimer = null;

                $.on(document, 'click.InlineSearch', event => this.documentClickHandler(event) );
                $.on(document, 'scroll.InlineSearch', event => this.documentScrolled(event) );

            }

            /**
             * Sets predefined items
             *
             * @param  {Object[]} items
             * @param  {string}   items[].name
             */
            set predefinedItems( items ) {
                this._predefinedItems = items;
            }

            /**
             * If click outside inline-search-wrapper, deactivate search and hide dropdown
             * @param {MouseEvent} event - click
             */
            documentClickHandler(event) {

                let selection = window.getSelection(),
                    range,
                    focusedNode;

                if (!selection || !selection.rangeCount) {
                    return;
                }

                /**
                 * Get focused node with caret
                 */
                range = selection.getRangeAt(0);
                focusedNode = range.endContainer;

                if (focusedNode.nodeType !== Node.ELEMENT_NODE) {
                    focusedNode = focusedNode.parentNode;
                }

                // let clickedElement = event.target,
                //     clickInsideInlineWrapper = $.belong(clickedElement, `.${CSS.inlineWrapper}`);
                let clickInsideInlineWrapper = $.belong(focusedNode, `.${CSS.inlineWrapper}`);

                /**
                 * Click on the inline-wrapper: re-activate
                 */
                if (clickInsideInlineWrapper) {

                    if (this.activated) {
                        return;
                    }

                    this.activate({ onElement: focusedNode });

                } else {

                    /**
                     * Click on the dropdown: select
                     */
                    let clickedOnFoundItem = $.belong(focusedNode, `.${CSS.dropdownItemCustom}`);
                    if (clickedOnFoundItem) {

                        this.foundItemClicked(focusedNode);

                    /**
                     * Click on the document: deactivate
                     */
                    } else {

                        if (!this.activated) {
                            return;
                        }
                        this.deactivate();

                    }
                }
            }

            /**
             * Dropdown item clicks handler
             */
            foundItemClicked(clickedElement ){

                this.selectItem(clickedElement);

            }

            /**
             * Closes dropdown by scroll
             */
            documentScrolled(){

                if (this.activated && this.dropdown) {
                    this.dropdown.classList.add(CSS.dropdownHidden);
                }

            }

            /**
             * Reactivate search when user moves caret inside inline-wrapper
             * @fires this.activate
             */
            activateIfCaretMovedInsideWrapper(){

                let range = window.getSelection().getRangeAt(0),
                    caretInsideInlineWrapper = false,
                    caretNode = range.startContainer;

                /**
                 * Allow to select text with shift
                 */
                if (!range.collapsed) {
                    return;
                }

                if (caretNode.nodeType === Node.TEXT_NODE) {
                    caretNode = range.startContainer.parentNode;
                } else {
                    caretNode = range.startContainer;
                }

                /**
                 * Check if node with cursour is inside inline wrapper
                 * @description Looking upward with 'while' works faster than $.belongs
                 * @type {Boolean}
                 */
                caretInsideInlineWrapper = caretNode.classList ? caretNode.classList.contains(CSS.inlineWrapper) : false;

                while ( caretNode.classList && !caretNode.classList.contains(CSS.inlineWrapper) &&
                    caretNode.parentNode !== null){

                    caretNode = caretNode.parentNode;
                    caretInsideInlineWrapper = caretNode.classList ? caretNode.classList.contains(CSS.inlineWrapper) : false;
                }

                if (caretInsideInlineWrapper && !this.activated) {

                    let currentInlineWrapper = this.findInlineWrapperFromCaret();
                    this.activate({ onElement: currentInlineWrapper });

                } else if (!caretInsideInlineWrapper && this.activated) {

                    this.deactivate();

                }
            }

            /**
             * Keydowns processor
             * @param  {KeyboardEvent} keydownEvent  - pass original input's keydown event
             */
            test( keydownEvent ){

                let key = keydownEvent.keyCode;

                /**
                 * Block paste on the inline wrapper
                 */
                if (this.activated && key === keys.V && (keydownEvent.metaKey || keydownEvent.ctrlKey) ) {
                    keydownEvent.preventDefault();
                    return false;
                }

                /**
                 * If dropdown is activated, let navigate by Up and Down keys
                 */
                if ( this.activated && [keys.UP, keys.DOWN].includes(key) && this.foundItems.length) {

                    keydownEvent.preventDefault();
                    this.preformUpAndDownKeys(key);

                    /**
                     * Return false to prevent default CodeX Editor keydown callback
                     */
                    return false;

                }

                /**
                 * Re-active class if user move-iside caret by keyboard arrows
                 */
                if ([keys.RIGHT, keys.LEFT, keys.UP, keys.DOWN, keys.ENTER, keys.BACKSPACE, keys.DELETE].includes(key)) {

                    /** Timeout uses for waiting when caret will be moved */
                    setTimeout(() => this.activateIfCaretMovedInsideWrapper(), 100);

                    // return;
                }

                /**
                 * Workaround: select some chars inside wrapper and press backspace
                 */
                if (this.activated && key === keys.BACKSPACE){

                    let customBackspaceBehaviourAccepted = this.handleBackSpace();

                    /**
                     * If no one chars selected (regular backspace with collapsed range),
                     * use default behaviour. Otherwise, use custom and prevent default
                     */
                    if (customBackspaceBehaviourAccepted) {
                        keydownEvent.preventDefault();
                        return false;
                    }
                }

                /**
                 * Switch off typing by specified key press
                 */
                // let exitTypingKeys = [keys.ENTER, keys.RIGHT, keys.LEFT, keys.SPACE];
                let exitTypingKeys = [keys.ENTER];
                if ( this.activated && isNaN(parseInt(this.selectedItemIndex)) && exitTypingKeys.includes(key) ) {

                    this.exitCaret(null, key === keys.LEFT);

                    keydownEvent.preventDefault();
                    keydownEvent.stopImmediatePropagation();
                    keydownEvent.stopPropagation();

                    this.deactivate();

                    /**
                     * Return false to prevent default CodeX Editor keydown callback
                     */
                    return false;

                }

                /**
                 * On space press: split wrappers's content and move second part outside the wrapper
                 */
                if (this.activated && key === keys.SPACE){

                    keydownEvent.preventDefault();
                    keydownEvent.stopImmediatePropagation();
                    keydownEvent.stopPropagation();

                    this.handleSpace();

                    /**
                     * Return false to prevent default CodeX Editor keydown callback
                     */
                    return false;
                }

                /**
                 * If dropdown is activated, and item selected, handle Enter key press
                 */
                if ( this.activated &&
                     this.foundItems[this.selectedItemIndex] &&
                     key === keys.ENTER
                ){
                    keydownEvent.preventDefault();
                    keydownEvent.stopImmediatePropagation();
                    keydownEvent.stopPropagation();
                    this.selectItem();
                    return false;
                }

                if (keydownEvent.key === this.initialChar) {

                    keydownEvent.preventDefault();

                    if (this.activated) {
                        return;
                    }

                    this.activate();

                    if (this._predefinedItems.length) {
                        this.renderFoundItems(this._predefinedItems);
                    }

                } else if (this.activated && this.inlineWrapper) {

                    /**
                     * Deactivate if:
                     * - user attempts to delete last symbol or
                     * - user select all text and press backspace
                     */
                    if (key === keys.BACKSPACE || key === keys.DELETE) {
                        this.deactivateIfEmpty(keydownEvent);
                    }

                    if (this.searchDebounceTimer) {
                        window.clearTimeout(this.searchDebounceTimer);
                    }

                    this.searchDebounceTimer = setTimeout(() => this.search(), 400);

                }

            }

            /**
             * Custom backspace handler
             *
             * Workaround case when user select some chars (inside wrapper) and press backspace:
             *  - previously: all wrapper removed by browser
             *  - now: only selected chars will be removed
             *
             * @return {boolean} - true if custom behaviour accepted
             */
            handleBackSpace(){

                let sel = window.getSelection(),
                    range = sel.getRangeAt(0);

                if (range.collapsed){
                    return false;
                }

                range.extractContents();

                return true;
            }

            /**
             * If space pressed inside the wrapper, extract right part and move it outside the wrapper
             */
            handleSpace(){

                let rightPart = this.extractBlockContentFromCaret();

                if (!rightPart){
                    return;
                }

                this.exitCaret();
                this.deactivate();

                setTimeout(()=>{

                    var sel = window.getSelection(),
                        range = sel.getRangeAt(0);

                    range.insertNode(rightPart);
                    range.collapse(true);

                    sel.removeAllRanges();
                    sel.addRange(range);

                }, 50)

            }

            /**
             * Extracts content from the caret to the end of block
             *
             * @return {DocumentFragment|null} - fragment with extracted content
             */
            extractBlockContentFromCaret() {

                let sel = window.getSelection();

                if (!sel.rangeCount) {

                    return null;

                }

                let selRange = sel.getRangeAt(0),
                    blockEl = this.inlineWrapper;

                if (!blockEl) {

                    return null;

                }

                let range = selRange.cloneRange();

                range.selectNodeContents(blockEl);
                range.setStart(selRange.endContainer, selRange.endOffset);

                /**
                 * @type {DocumentFragment}
                 */
                let blockContentWrapped = range.extractContents();

                if (!blockContentWrapped) {

                    return null;

                }
                return blockContentWrapped;
            }

            /**
             * When user removes all chars from wrapper, deactivate and remove it
             * @param {KeyboardEvent} event
             */
            deactivateIfEmpty(event){

                let content = this.inlineWrapper.textContent.trim();

                let range = window.getSelection().getRangeAt(0),
                    leftTextNodeContent = range.startContainer.textContent,
                    rightTextNodeContent = range.endContainer.textContent,
                    rangeOverContent = !range.collapsed && (leftTextNodeContent.length >= content.length || rightTextNodeContent.length >= content.length);

                if (content.length > 1 && !rangeOverContent) {
                    return;
                }

                event.preventDefault();

                this.deactivate();
                this.exitCaret(this.inlineWrapper);

                setTimeout(() => {
                    this.inlineWrapper.remove();
                    this.inlineWrapper = null;
                }, 50);

            }

            /**
             * Insert search wrapper at the current caret position
             * @return {Element|undefined}  inline search wrapper
             */
            _insertWrapper() {

                var sel = window.getSelection(),
                    range;

                if (!sel.rangeCount) {
                    _log('InlineSearch: Can not get current caret position');
                    return;
                }

                /**
                 * Get caret position
                 */
                range = sel.getRangeAt(0);
                range.collapse(true);

                /**
                 * Make wrapper
                 * @type {Element}
                 */
                let wrapper = $.make('em', [CSS.inlineWrapper], {
                    contentEditable: true,
                    textContent: this.initialChar
                });

                if (this.bemModifier){
                    wrapper.classList.add(CSS.inlineWrapper + '--' + this.bemModifier);
                }

                /**
                 * Add zero-width char to allow set caret into created node
                 */
                // wrapper.appendChild(document.createTextNode('\u200B'));

                /**
                 * Insert node and set caret after it
                 */

                range.insertNode(wrapper);

                range.setStartAfter(wrapper);
                range.collapse(true);

                sel.removeAllRanges();
                sel.addRange(range);

                return wrapper;

            }

            /**
             * Insert search wrapper at the current caret position
             * @return {Element|undefined}  inline search wrapper
             *
             * @deprecated  Safari renders <span> with inline-styles instead of <em> with classes
             *              when caret is inside <p>-tag
             */
            insertWrapper(){

                let wrapperHTML = `<em class="${CSS.inlineWrapper} ${
                                        this.bemModifier ? CSS.inlineWrapper + '--' + this.bemModifier : ''
                                    }" contenteditable="true">${this.initialChar}</em>`;

                document.execCommand('insertHTML', false , wrapperHTML);

                let range = window.getSelection().getRangeAt(0),
                    insertedElement;

                if (range.startContainer.nodeType === Node.TEXT_NODE) {
                    insertedElement = range.startContainer.parentNode;
                } else {
                    insertedElement = range.startContainer;
                }

                /**
                 * Add zero-width char to allow set caret into created node
                 */
                // insertedElement.appendChild(document.createTextNode('\u200B'));
                //

                return insertedElement;
            }

            /**
             * Activates inlinse search
             * @param  {onElement} options.onElement - pass element to re-activate for that
             */
            activate({onElement} = {}){

                if (!onElement) {

                    this.inlineWrapper = this._insertWrapper();

                    _log('InlineSearch activated: ', this.inlineWrapper);

                } else {

                    _log('Reactivating inline search on element: %o', onElement);

                    this.inlineWrapper = onElement;

                }

                this.activated = true;

            }

            /**
             * Deactivation method
             *     - clears found items
             *     - changes this.activated state to false
             *     - aborts search request pending
             */
            deactivate(){

                this.clear();
                this.activated = false;

                if (this.searchRequest) {
                    this.searchRequest.abort();
                }

                _log('InlinseSearch deactivated');
            }

            /**
             * Look upward and find inline-wrapper fro current caret position
             */
            findInlineWrapperFromCaret() {

                let selection = window.getSelection(),
                    range = selection.getRangeAt(0),
                    focusedNode = selection.baseNode || range.endContainer,
                    currentInlineWrapper;

                /**
                 * Sometimes caret placed in TEXT_NODE instead of ELEMENT_NODE
                 */
                if (focusedNode.nodeType === Node.ELEMENT_NODE) {
                    currentInlineWrapper = focusedNode;
                } else {
                    currentInlineWrapper = focusedNode.parentNode;
                }

                while ( currentInlineWrapper.classList &&
                    !currentInlineWrapper.classList.contains(CSS.inlineWrapper) &&
                    focusedNode.parentNode !== null){

                    currentInlineWrapper = currentInlineWrapper.parentNode;
                }

                if (currentInlineWrapper === document) {
                    return null;
                }

                return currentInlineWrapper;
            }

            /**
             * Move caret out from the inline item wrapper
             * @param {Element|undefined} wrapper  - pass element if you know inline wrapper node.
             *                                       Otherwise it will be found upward from caret
             * @param {Boolean} toTheLeft          - pass true to set caret to the left from wrapper
             */
            exitCaret( wrapper , toTheLeft ){

                let currentInlineWrapper = wrapper || this.findInlineWrapperFromCaret(),
                    nodeToSetFocus = document.createTextNode('\u200B');

                if (!currentInlineWrapper) {
                    return;
                }

                if (!toTheLeft) {
                    $.after(currentInlineWrapper, nodeToSetFocus);
                } else {
                    $.before(currentInlineWrapper, nodeToSetFocus);
                }

                let newRange  = document.createRange(),
                    selection = window.getSelection();

                window.setTimeout(function () {

                    newRange.setStart(nodeToSetFocus, nodeToSetFocus.length);
                    newRange.setEnd(nodeToSetFocus, nodeToSetFocus.length);

                    selection.removeAllRanges();
                    selection.addRange(newRange);

                }, 50);

            }

            search(){

                if (!this.inlineWrapper || !this.inlineWrapper.textContent) {
                    return;
                }

                let textToSearch = this.inlineWrapper.textContent.trim();

                /**
                 * Remove # symbol
                 */
                textToSearch = textToSearch.slice(1);

                /** Clear dropdown */
                //if (textToSearch.length < 2) {

                //    this.clear();
                //    return;
                //}

                /**
                 * Stop previously opened request
                 */
                if (this.searchRequest) {
                    this.searchRequest.abort();
                }

                /**
                 * Server-side search
                 */
                this.searchRequest = ajax.get( {
                    url: this.searchURL,
                    dataType: 'json',
                    data: {
                        query: textToSearch,
                    },
                    success: response => {

                        if (!this.activated) {
                            return;
                        }

                        if (!response.data || response.rc !== 200) {
                            _log('Wrong inline-search response');
                            return;
                        }

                        let foundItems = response.data.items;

                        if (!foundItems) {
                            return;
                        }

                        this.renderFoundItems(foundItems, textToSearch);
                    },
                    error: () => _log('Error performing inline search')
                } );
            }

            /**
             * Renders dropdown items
             * @param  {Array.[]Object} foundItems
             * @param  {String} searchString        - original search string
             */
            renderFoundItems(items, searchString) {

                if (!this.dropdown) {
                    this.dropdown = $.make('div', [CSS.dropdown]);
                    document.body.appendChild(this.dropdown);
                }

                /**
                 * Clear dropdown
                 */
                this.clear();

                /**
                 * Show and move dropdown;
                 */
                this.moveDropdown();

                items.forEach( item => {
                    let itemEl = $.make('div', [CSS.dropdownItemBasic, CSS.dropdownItemCustom]);

                    if (this.bemModifier) {
                        itemEl.classList.add(CSS.dropdownItemCustom + '--' + this.bemModifier);
                    }

                    if (searchString) {
                        itemEl.innerHTML = item.name.replace( new RegExp( '(' + searchString + ')', 'gi' ), '<b style="font-weight: bold">$1</b>' );
                    } else {
                        itemEl.innerHTML = item.name;
                    }

                    this.dropdown.appendChild(itemEl);
                    this.foundItems.push(itemEl);
                });
            }

            /**
             * Clears found items list
             */
            clear(){

                this.foundItems = [];
                this.selectedItemIndex = null;

                if (this.dropdown) {
                    this.dropdown.innerHTML = '';
                    this.dropdown.classList.add(CSS.dropdownHidden);
                }
            }

            /**
             * Changes this.dropdown's position to correspondes currently active inline wrapper
             */
            moveDropdown(){

                /**
                 *
                 * @var {object} pos Current element position and bounding rect
                 *
                 * @var {Number} pos.top
                 * @var {Number} pos.right
                 * @var {Number} pos.bottom
                 * @var {Number} pos.left
                 * @var {Number} pos.width
                 * @var {Number} pos.height
                 */
                let pos = this.inlineWrapper.getBoundingClientRect();

                this.dropdown.style.left = pos.left + 'px';
                this.dropdown.style.top = (pos.top + pos.height) + 'px';

                this.dropdown.classList.remove(CSS.dropdownHidden);
            }

            /**
             * Arrow navigation on the found list dropdown
             * @param  {Number} key  - keycode
             */
            preformUpAndDownKeys( key ){

                let isUp = key === keys.UP,
                    currentSelected,
                    itemToSelect;

                /** Clear highlighting from current selected element */
                if (this.foundItems[this.selectedItemIndex]) {
                    currentSelected = this.foundItems[this.selectedItemIndex];
                    currentSelected.classList.remove(CSS.dropdownItemSelected);
                }

                if ( isNaN( parseInt(this.selectedItemIndex, 10) ) ) {
                    this.selectedItemIndex = 0;
                } else if (!isUp) {
                    this.selectedItemIndex++;
                } else {
                    this.selectedItemIndex--;
                }

                /**
                 * Stop at the first and last item
                 */
                if (this.selectedItemIndex === this.foundItems.length) {
                    this.selectedItemIndex = this.foundItems.length - 1;
                } else if (this.selectedItemIndex < 0){
                    this.selectedItemIndex = 0;
                }

                itemToSelect = this.foundItems[this.selectedItemIndex];
                itemToSelect.classList.add(CSS.dropdownItemSelected);
                this.selectedItemIndex = this.selectedItemIndex;

            }

            /**
             * @abstract
             *
             * Process selection founded item and substitution its value
             *
             * @param  {Element} selectedItem
             */
            substitution( selectedItem ){
                throw new Error('Substitution method must be implemented by subclass');
            }

            /**
             * Select item in dropdron
             * @param  {Element} item  - optional clicked item for mouse click hadler
             */
            selectItem( item ){

                let itemToSelect = item || this.foundItems[this.selectedItemIndex];

                this.substitution(itemToSelect);
                this.dropdown.classList.add(CSS.dropdownHidden);

                this.exitCaret(this.inlineWrapper);
                this.deactivate();

            }

            /**
             * Class instance destroy
             */
            destroy(){

                $.off(document, 'click.InlineSearch');
                $.off(document, 'scroll.InlineSearch');
            }

        };

    }
);

/**
 * «List» plugin for CodeX Editor
 */
Air.defineClass(
    'class.ListTool',
    'lib.DOM',
    function($) {

        'use strict';

        let listSettings = [
            {
                name    : 'unordered',
                title   : 'Обычный',
                icon    : 'list-unordered-icon',
                default : true
            },
            {
                name    : 'ordered',
                title   : 'Нумерованный',
                icon    : 'list-ordered-icon',
                default : false
            }
        ];

        const FirstLevelBlock = 'ce-block';

        /**
         * List View class
         *
         * @module ListTool
         *
         * @typedef {ListTool} ListTool
         * @property elements - List elements
         * @property elements.settings - List settings
         */
        class ListView {

            /**
             * @constructor
             */
            constructor() {

                this.elements = {};
                this.elements.settings = [];

            };

            /**
             * Returns CSS classes
             */
            static get CSS() {

                return {
                    listToolIcon : 'ce-icon-list-bullet',

                    listWrapper : 'list-tool',
                    listItem : 'list-tool__item',

                    listSettings : 'cdx-plugin-settings',
                    listSettingItem : 'cdx-plugin-settings__item',
                    listSettingItemActive : 'cdx-plugin-settings__item--active',

                    listInput : 'cdx-input',
                    CommonToolClass : 'cdx-tool'
                }

            }

            /**
             * Draws list with items
             * @param type - list type (Ordered|Unordered)
             * @param items - list items
             */
            drawListWithItems(type, items) {

                this.elements.listTag = $.make(type, [ListView.CSS.CommonToolClass, ListView.CSS.listWrapper], {
                    contentEditable: true
                });

                let fragment = $.fragment(),
                    item;

                if (items.length > 0) {

                    for(let i = 0; i < items.length; i++) {
                        item = $.make('LI', [ListView.CSS.listItem, ListView.CSS.listInput], {
                            innerHTML: items[i] || ''
                        });
                        $.append(fragment, item);
                    }

                } else {

                    item = $.make('LI', [ListView.CSS.listItem, ListView.CSS.listInput], {
                        innerHTML: ''
                    });
                    $.append(fragment, item);

                }

                // add items to list tag
                $.append(this.elements.listTag, fragment);

                $.on(this.elements.listTag, 'keydown', (event) => { this.keydownHandler(event) });
                return this.elements.listTag;

            }

            /**
             * Keydown handler on list items
             * @param event
             */
            keydownHandler(event) {

                let controlKeyPressed = event.ctrlKey || event.metaKey,
                    keyCodeForA = 65,
                    enterKeyCode = 13;

                if (event.keyCode === enterKeyCode) {
                    this.enterPressed(event);
                } else if (controlKeyPressed && event.keyCode == keyCodeForA) {
                    this.selectOnlyItem(event);
                }

            }

            /**
             * Handle Enter key press
             * @param event
             */
            enterPressed(event) {

                let selection = window.getSelection(),
                    currentAnchor = selection.anchorNode;

                if ( currentAnchor.nodeType === Node.TEXT_NODE ) {
                    currentAnchor = currentAnchor.parentElement;
                }

                let listItem = currentAnchor.closest(`.${ListView.CSS.listItem}`),
                    listHolder = listItem.closest(`.${ListView.CSS.listWrapper}`),
                    isCurrentItemEmpty = listItem && !listItem.textContent.trim();

                if (isCurrentItemEmpty && listItem === listHolder.lastElementChild) {
                    listItem.remove();

                    event.preventDefault();
                    event.stopPropagation();
                    event.stopImmediatePropagation();

                    // add initial block and set caret
                    codex.editor.content.insertBlockAfter();
                }
            }

            /**
             * If CTRL+A (CMD+A) pressed, we should select only one list item,
             * not all <OL> or <UI>
             *
             * @param {MouseEvent} event
             */
            selectOnlyItem(event) {

                event.preventDefault();

                /**
                 * Select <LI> content
                 */
                let selection = window.getSelection(),
                    currentSelectedNode = selection.anchorNode.parentNode,
                    range = new Range();

                /** Search for <LI> element */
                while ( currentSelectedNode && currentSelectedNode.tagName != 'LI' ) {
                    currentSelectedNode = currentSelectedNode.parentNode;

                    if (currentSelectedNode && currentSelectedNode.classList && currentSelectedNode.classList.contains(FirstLevelBlock)) {
                        break;
                    }
                }

                range.selectNodeContents(currentSelectedNode);

                selection.removeAllRanges();
                selection.addRange(range);

            }

            /**
             * Draws settings item. Binds callback and so on
             *
             * @param {Object} option - list options
             * @param {String} option.type - setting type
             * @param {String} option.title - text after icon
             * @param {String} option.icon - option icon
             * @param {Boolean} option.default - is active by default
             *
             * @param {Boolean} isActive - is type activated
             * @param {Function} callback - we'll be fired on click
             */
            drawSettingsItem(option, isActive, callback) {

                let item = $.make('DIV', [ListView.CSS.listSettingItem], {}),
                    icon = $.svg(option.icon, 14, 14);

                if (isActive) {
                    item.classList.add(ListView.CSS.listSettingItemActive);
                }

                $.append(item, icon);
                $.append(item, document.createTextNode(option.title));

                $.on(item, 'click', callback.bind(item, option.name));

                this.elements.settings.push(item);

                return item;

            }

            /**
             * Toggles active class
             * @param {Element} item - setting item
             * @parma {String} optionName - option name
             */
            changeListType(item, optionName) {

                // clear all settings option
                this.elements.settings.forEach( (option) => {
                    option.classList.remove(ListView.CSS.listSettingItemActive);
                });

                // make active clicked
                item.classList.toggle(ListView.CSS.listSettingItemActive);

                let newListTag = optionName === 'ordered' ? 'OL' : 'UL',
                    newListElement = $.make(newListTag, [ListView.CSS.CommonToolClass, ListView.CSS.listWrapper], {
                        contentEditable : true,
                        innerHTML : this.elements.listTag.innerHTML
                    });

                this.elements.listTag.replaceWith(newListElement);

                // change link
                this.elements.listTag = newListElement;
            }

            /**
             * Destroy everything
             */
            destroy() {
                $.off(this.elements.listTag);

                for(let i = 0; i < this.elements.settings.length; i++) {
                    $.off(this.elements.settings[i]);
                }

                this.elements.settings = [];
                this.elements.listTag = null;

                this.elements = null;
            }

        }

        /**
         * List Model class
         *
         * @property {String} this.type - list type
         * @property {Array} this.items - list of items
         */
        class ListModel {

            /**
             * @constructor
             *
             * @param {Object} data - list data
             */
            constructor(data = {}) {
                this.type   = data.type  || 'UL';
                this.items  = data.items || [];
            }

            /** Data Setter */
            set data(listData = {}) {

                this.type   = listData && (listData.type == 'ordered' || listData.type == 'OL') ? 'OL' : 'UL';
                this.items  = listData.items || [];

            }

            /** Data Getter */
            get data() {

                return {
                    type  : this.type,
                    items : this.items
                }
            }

            /**
             * Changes list state
             * @param {String} newType
             */
            listTypeChanged( newType ) {
                this.type = newType === 'ordered' ? 'OL' : 'UL';
            }

            /**
             * Destroy properties and variables
             */
            destroy() {
                this.type  = null;
                this.items = null;
            }

        }

        /**
         * Codex Editor list tool
         *
         * @property {ListView} this.view - List plugin view class. Responsible for DOM interaction
         * @property {ListModel} this.model - List plugin model class. Responsible for plugin data
         */
        return class ListTool {

            /**
             * @constructor
             */
            constructor() {
                this.view = new ListView();
                this.model = new ListModel();
            }

            /**
             * Tool type
             * @return {string}
             */
            static get type(){
                return 'list';
            }

            /**
             * Tool title. Uses in toolbar hover helper
             * @return {string}
             */
            static get title(){
                return 'Список';
            }

            /**
             * Tool icon CSS classname
             * @return {string}
             */
            static get iconClassname(){
                return ListView.CSS.listToolIcon;
            }

            /**
             * Is need to display in toolbox
             * @return {Boolean}
             */
            static get displayInToolbox(){
                return true;
            }

            /**
             * By ENTER keypress on the contenteditbale field, it will add paragraph, not create new block
             * @return {Boolean}
             */
            static get enableLineBreaks(){
                return true;
            }

            /**
             * Enable to showing inline toolbar
             * @return {Boolean}
             */
            static get inlineToolbar() {
                return true;
            }

            /**
             * Handle this tags on paste
             * @return {Object}
             */
            static get handleTags() {
                return {
                    tags: ['UL', 'OL', 'LI'], // these tags will rendered as QuoteTool
                    fill: 'items', // this field will be passed from tag innerHTML to the render method
                    pasteParser : ListTool.pasteParser
                };
            }

            /**
             * Always highlight
             * @returns {boolean}
             */
            static get contentless() {
                return true;
            }

            /**
             * Paste parer methodw
             * Get UL or OL content on input
             * Returns items array
             * @param  {Element} input  - HTML element OL or UL or LI
             * @return {Array}          - list of items expected by render method
             */
            static pasteParser(input) {

                let childs,
                    items = [];

                let pushItem = function (node) {

                    let content = node.innerHTML;

                    content = content ? content.trim() : '';

                    if (content.length === 0) {

                        return;

                    }

                    items.push(content);

                };

                switch (input.tagName) {
                    case 'UL':
                    case 'OL':
                        childs = input.childNodes;

                        for (let i = 0; i < childs.length; i++) {

                            pushItem(childs[i]);

                        }

                        break;

                    default:
                    case 'LI':
                        pushItem(input);
                        break;

                }

                return items;
            }

            /**
             * Method to render HTML block from JSON
             *
             * @param {Object} data
             */
            render(data) {

                this.model.data = data;

                return this.view.drawListWithItems(
                    this.model.type,
                    this.model.items
                );

            }

            /**
             * Validate data
             * @param {Object} data
             */
            validation(data) {

                let isEmpty = data.items.every(function(item){
                    return item.trim() === '';
                });

                if (isEmpty){
                    return false;
                }

                if (data.type != 'UL' && data.type != 'OL'){
                    console.warn('CodeX Editor List-tool: wrong list type passed %o', data.type);
                    return false;
                }

                return true;

            }

            /**
             * Return JSON from HTML
             */
            save(listWrapper) {
                return this.extractData(listWrapper);
            }

            /**
             * Make settings function according to the Codex Editor API
             * @returns {*}
             */
            makeSettings() {

                let holder = $.make('DIV', [ListView.CSS.listSettings], {}),
                    fragment = $.fragment(),
                    item,
                    self = this,
                    isActive;

                listSettings.forEach((option) => {

                    isActive = (self.model.type === 'OL' ? 'ordered' : 'unordered') === option.name;
                    item = self.view.drawSettingsItem(option, isActive, function ( optionName ) {

                        let item = this;
                        self.view.changeListType(item, optionName);
                        self.model.listTypeChanged( optionName );
                    });

                    $.append(fragment, item);

                });


                $.append(holder, fragment);
                return holder;

            }

            /**
             * Extracts data from the DOM
             * @param {Element} listWrapper - better search for <li> inside passed wrapper for correct CMD+Z handling
             * @return {object}
             */
            extractData(listWrapper) {

                let listTag = listWrapper,
                    listElements = listTag.querySelectorAll(`li.${ListView.CSS.listItem}`),
                    listItems = [],
                    sanitizerConfig = {
                        tags : {
                            a: {
                                href: true,
                                target: '_blank',
                                rel: 'nofollow'
                            },
                            b: {},
                            i: {},
                            p: {},
                            mark: el => el.classList.contains('cdx-marked-text'),
                            span: el => el.classList.contains('cdx-marked-text'),
                        }
                    };

                for(let i = 0; i < listElements.length; i++) {
                    let clearItem = codex.editor.sanitizer.clean(listElements[i].innerHTML, sanitizerConfig, true),
                        trimmed = clearItem.trim();

                    if (trimmed != '') {
                        listItems.push(clearItem);
                    }
                }

                this.model.items = listItems;
                return this.model.data;
            }

            destroy() {

                this.view.destroy();
                this.model.destroy();

                this.view  = null;
                this.model = null;
            }

        }

    }
);

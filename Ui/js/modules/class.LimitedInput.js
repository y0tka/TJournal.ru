/**
 * Limited Input
 */
Air.defineClass(
    'class.LimitedInput',
    `lib.DOM, module.notify`,
    function( $, notify ) {

        'use strict';

        /**
         * Classnames
         */
        const CSS = {
            wrapper: 'ui-limited-input',
            wrapperWarning: 'ui-limited-input--warn',
            wrapperBig: 'ui-limited-input--big',
            counterShowed: 'ui-limited-input--showed',
        };

        /**
         * Chars left counter will be RED below this limit
         * @type {Number}
         */
        const WARNING_LIMIT = 10;


        /**
         * Counter will be shown only if value less than this number
         * @type {Number}
         */
        const VALUE_TO_SHOW_COUNTER = 20;

        /**
         * LimitedInput
         *
         * @property {Element} this.input       - input with 'maxlength' attribute
         * @property {Element} this.wrapper     - input's wrapper
         *
         * @property {Number}  this.charsLeft   - allowed chars length
         * @property {Number}  this.maxLength   - maximum value length
         *
         * @property {TimeoutID|null} this.changeDebounce - timer for detect changing finish
         */
        return class LimitedInput {

            /**
             * @constructor LimitedInput item
             *
             * @param {Object} options
             * @param {Element} options.input - input to handle limit
             */
            constructor({input}) {

                this.input = input;
                this.changeDebounce = null;

                let wrapper;

                /**
                 * Check for already processed inputs
                 */
                if (input.dataset.processed !== 'true' ) {

                    wrapper = $.make('div', [CSS.wrapper]);

                    $.after(input, wrapper);
                    $.append(wrapper, input);

                } else {

                    /**
                     * On repeated prepare calls, find wrapper
                     * @type {Element}
                     */
                    wrapper = $.parents(input, `.${CSS.wrapper}`);

                    if (!wrapper) {
                        return;
                    }

                }

                /**
                 * Mark textareas and contenteditable wrappers with modificator --big
                 * They may have different styles (chars number displays at bottom)
                 */
                if (input.tagName === 'TEXTAREA' || input.getAttribute('contentEditable') === 'true') {
                    wrapper.classList.add(CSS.wrapperBig);
                }

                this.wrapper = wrapper;
                this.maxLength = parseInt(input.getAttribute('maxlength'), 10);

                /**
                 * Set initial allowed chars value
                 * @type {Number}
                 */
                this.charsLeft = this.maxLength - this.length;

                input.dataset.processed = true;

                $.on(input, 'input.LimitedInput', event => { this.change(event); });
                $.on(input, 'keydown.LimitedInput', event => { this.keydown(event); });
                $.on(input, 'paste.LimitedInput', event => {
                    setTimeout(() => { // workaround case: 'select all title and paste new one'
                        this.paste(event);
                    }, 100);
                });
            }

            /**
             * Current length setter
             *
             * @param {Number} - value to set as length
             */
            set charsLeft (val) {

                if (!this.wrapper) {
                    return;
                }

                if (val > VALUE_TO_SHOW_COUNTER) {
                    this.wrapper.classList.remove(CSS.counterShowed);
                } else {
                    this.wrapper.classList.add(CSS.counterShowed);
                }

                if (val < WARNING_LIMIT) {
                    this.wrapper.classList.add(CSS.wrapperWarning);
                } else {
                    this.wrapper.classList.remove(CSS.wrapperWarning);
                }

                this.wrapper.setAttribute('data-length', val);

            }

            /**
             * Current length getter
             */
            get length () {

                return this.value ? this.value.trim().length : 0;

            }

            /**
             * Returns value of input or contenteditable element
             * @return {Number}
             */
            get value () {

                let val = this.input.value || this.input.textContent || '';

                val = val.replace(/\s+/g, ' ');

                return val.trim();

            }

            /**
             * Sets value of input or contenteditable element
             */
            set value ( val ) {

                if ( this.input.value ){
                    this.input.value = val;
                } else {
                    this.input.innerHTML = val;
                }

            }

            /**
             * Paste event behaviour
             * @param  {ClipboardEvent} event
             */
            paste (event) {
                let pastedData = event.clipboardData.getData('text/plain');

                if (this.maxLength - this.length - pastedData.length < 1) {
                    notify.error('Слишком длинный текст');
                    event.preventDefault();
                }

            }

            /**
             * Keydowns handler
             * @param  {KeyboardEvent} event
             */
            keydown (event){

                /**
                 * Printable keys
                 * @see  http://stackoverflow.com/questions/12467240
                 */
                var key = event.keyCode,
                    printable =
                    (key > 47 && key < 58)   || // 1—0 numbers
                    key === 32 || key === 13 || // spacebar & return
                    (key > 64 && key < 91)   || // letters
                    (key > 95 && key < 112)  || // numpad keys
                    (key > 185 && key < 193) || // ;=,-./` (in order)
                    (key > 218 && key < 223);   // [\]' (in order)

                /**
                 * Allow controls (Enter, backspace etc)
                 */
                if (printable && ( this.maxLength <= this.length ) ) {
                    event.preventDefault();
                }
            }

            /**
             * Input value changed
             */
            change() {

                /**
                 * Update lenght left
                 */
                this.charsLeft = this.maxLength - this.length;


                /**
                 * Add additional check after 200ms
                 * to avoid mouse-up pasting, such as drag-n-drop
                 */
                if ( this.changeDebounce ) {
                    window.clearTimeout(this.changeDebounce);
                }

                this.changeDebounce = window.setTimeout(() => { this.check(); }, 200);

            }

            /**
             * Performs validation and trimming
             * Uses to avoid mouse-up pasting, such as drag-n-drop
             */
            check() {

                if (this.maxLength - this.length < 0) {

                    /**
                     * Trim
                     */
                    this.value = this.value.substr(0, this.maxLength);

                    /**
                     * Place caret at the end
                     */
                    this.placeCaretAtEnd();
                }

                /**
                 * Update lenght left
                 */
                this.charsLeft = this.maxLength - this.length;

            }

            /**
             * Places caret at the end of contenteditable element
             */
            placeCaretAtEnd() {

                let el = this.input;

                /**
                 * For native inputs
                 */
                el.focus();

                /**
                 * For [contenteditable]
                 */
                var range = document.createRange(),
                    sel = window.getSelection();

                range.selectNodeContents(el);
                range.collapse(false);

                sel.removeAllRanges();
                sel.addRange(range);

            }

            /**
             * Remove wrapper around input
             */
            unwrap(){

                if (!this.wrapper) {
                    return;
                }

                let el = this.wrapper;

                // get the element's parent node
                let parent = el.parentNode;

                if (!parent) {
                    return;
                }

                // move all children out of the element
                while (el.firstChild) {
                    parent.insertBefore(el.firstChild, el);
                }

                // remove the empty element
                parent.removeChild(el);

                this.wrapper = null;
            }

            /**
             * Class instance destroy
             */
            destroy(){

                if ( this.changeDebounce ) {
                    window.clearTimeout(this.changeDebounce);
                }

                this.changeDebounce = null;

                this.unwrap();

                $.off(this.input, '.LimitedInput');

                this.maxLength = 0;

                if (this.input) {
                    this.input.dataset.processed = null;
                }


                this.input = null;
                this.wrapper = null;


            }

        };

    }
);

/**
 * «Number» plugin for CodeX Editor
 */
Air.defineClass(
    'class.NumberTool',
    `lib.DOM, module.inputs`,
    function( $, inputs ) {

        'use strict';

        /**
         * Classnames
         */
        var CSS = {
            /**
             * Base classes
             */
            baseToolClass: 'cdx-tool',
            input: 'cdx-input',

            /**
             * Number tool
             */
            wrapper: 'number-tool',
            inputNumber: 'number-tool__digit',
            inputTitle: 'number-tool__title',
        };

        /**
         * Number base class
         *
         * @module NumberTool
         *
         * @typedef {NumberTool} NumberTool
         * @property {Element} this.element          - attach item main wrapper
         */
        return class NumberTool {

            /**
             * Number item class
             *
             * @constructor
             */
            constructor() {
            }

            /**
             * Makes HTML node with passed data
             * @param {object|null} numberData
             * @param {number} numberData.number
             * @param {string} numberData.title
             * @return {Element}
             */
            static render( numberData ){

                let wrapper = $.make('div', [CSS.wrapper, CSS.baseToolClass]),
                    numberInput = $.make('input', [CSS.input, CSS.inputNumber], {
                        placeholder: 'Цифры'
                    }),
                    title = $.make('div', [CSS.input, CSS.inputTitle], {
                        contentEditable: true,
                        placeholder: 'Расшифровка'
                    });

                title.setAttribute('maxlength', 128);

                if (numberData) {
                    numberInput.value = numberData.number || '';
                    title.innerHTML = numberData.title || '';
                }

                wrapper.appendChild(numberInput);
                wrapper.appendChild(title);

                /**
                 * Activate limited input
                 */
                inputs.processVisibleIn(wrapper);

                return wrapper;
            }

            /**
             * Saving data validation
             * @param  {object} data
             * @param  {number} data.number
             * @param  {string} data.title
             * @return {Boolean}
             */
            static validate( data ){

                if (!data) {
                    return false;
                }

                if (!data.number) {
                    return false;
                }

                if (!data.title) {
                    return false;
                }

                return true;
            }

            /**
             * Extract tool's data from HTML block
             * @param  {Element} block
             * @return {Object}
             */
            static save( block ){

                let number = block.querySelector(`.${CSS.inputNumber}`),
                    title = block.querySelector(`.${CSS.inputTitle}`),
                    titleValue = title.innerHTML;

                /**
                 * @todo replace CodeX Editor HTML sanitizer with Air-sanitizer
                 */
                titleValue = codex.editor.sanitizer.clean(titleValue.trim(), {
                    tags : {
                        a: {
                            href: true,
                            target: '_blank',
                            rel: 'nofollow'
                        },
                        b: {},
                        i: {},
                        p: {},
                        span: el => el.classList.contains('cdx-marked-text'),
                        mark: el => el.classList.contains('cdx-marked-text'),
                    }
                }, true);

                /**
                 * @todo  replace with air-module for wrapping text with <p>
                 */
                titleValue = codex.editor.content.wrapTextWithParagraphs(titleValue);

                return {
                    number : number.value.trim(),
                    title : titleValue
                };
            }

            destroy(){
            }

        };

    }
);

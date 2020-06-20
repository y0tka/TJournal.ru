/**
 * «Warning» plugin for CodeX Editor
 */
Air.defineClass(
    'class.WarningTool',
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
            wrapper: 'warning-tool',
            icon : 'warning-tool__icon',
            inputTitle: 'warning-tool__title',
            inputText: 'warning-tool__text',
        };

        /**
         * Number base class
         *
         * @module WarningTool
         *
         * @typedef {WarningTool} WarningTool
         * @property {Element} this.element          - attach item main wrapper
         */
        return class WarningTool {

            /**
             * Number item class
             *
             * @constructor
             */
            constructor() {
            }



            /**
             * Tool type
             * @return {string}
             */
            static get type(){
                return 'warning';
            }

            /**
             * Tool title. Uses in toolbar hover helper
             * @return {string}
             */
            static get title(){
                return 'Пометка редакции';
            }

            /**
             * Tool icon CSS classname
             * @return {string}
             */
            static get iconClassname() {
                return CSS.icon;
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
             * Always highlight
             * @returns {boolean}
             */
            static get contentless() {
                return true;
            }

            /**
             * Makes HTML node with passed data
             * @param {object|null} toolData
             * @param {string} toolData.title
             * @param {string} toolData.text
             * @return {Element}
             */
            render( toolData ){
                let wrapper = $.make('div', [CSS.wrapper, CSS.baseToolClass]),
                    titleInput = $.make('input', [CSS.input, CSS.inputTitle], {
                        placeholder: 'Пометка редакции',
                    }),
                    text = $.make('div', [CSS.input, CSS.inputText], {
                        contentEditable: true,
                        placeholder: 'Расшифровка'
                    });

                titleInput.setAttribute('maxlength', 30);

                if (toolData) {
                    titleInput.value = toolData.title || '';
                    text.innerHTML = toolData.text || '';
                }

                wrapper.appendChild(titleInput);
                wrapper.appendChild(text);

                /**
                 * Activate limited input
                 */
                inputs.processVisibleIn(wrapper);

                return wrapper;
            }

            /**
             * Saving data validation
             * @param  {object} data
             * @param  {string} data.text
             * @param  {string} data.title
             * @return {Boolean}
             */
            validate( data ){
                if (!data) {
                    return false;
                }

                if (!data.text && !data.title) {
                    return false;
                }

                return true;
            }

            /**
             * Extract tool's data from HTML block
             * @param  {Element} block
             * @return {Object}
             */
            save( block ){
                let title = block.querySelector(`.${CSS.inputTitle}`),
                    text = block.querySelector(`.${CSS.inputText}`),
                    textValue = text.innerHTML;

                /**
                 * @todo replace CodeX Editor HTML sanitizer with Air-sanitizer
                 */
                textValue = codex.editor.sanitizer.clean(textValue.trim(), {
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

                return {
                    title : title.value.trim(),
                    text : textValue
                };
            }

            destroy(){
            }

        };

    }
);

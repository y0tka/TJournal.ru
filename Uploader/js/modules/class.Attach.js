/**
 * @module Attach
 *
 * @description Attach class
 * Can be inherited by
 *     LinkAttach
 *     ImageAttach
 *     VideoAttach
 *
 * @typedef {Attach} Attach
 * @property {Element} element          - attach item main wrapper
 * @property {Element} removeButton     - removing button
 * @property {Boolean} _removed         - removing state
 * @property {Boolean} _onRemove        - removing callback (optional)
 */
Air.defineClass(
    'class.Attach',
    `lib.DOM, module.andropov`,
    function( $ , andropov) {

        'use strict';

        /**
         * Classnames
         */
        var CSS = {
            attach: 'attachment',
            attachContent: 'attachment__content',
            button: 'attachment__button',
            buttonRemove: 'attachment__button--remove',
            fadedOut: 'attachment--fadedOut',
            loading: 'attachment--loading'
        };

        /**
         * Attach base class
         */
        return class Attach {

            /**
             * Attach item class
             *
             * @constructor
             */
            constructor() {

                this.element = $.make('div', [CSS.attach]);
                this.content = $.make('div', [CSS.attachContent]);
                this._removed = false;
                this._onRemove = null;

                /**
                 * Make remove button
                 */
                this.removeButton = $.make('span', [CSS.button, CSS.buttonRemove]);
                this.element.appendChild(this.content);
                this.element.appendChild(this.removeButton);

                $.on(this.removeButton, 'click', (event) => {
                    event.stopPropagation();
                    event.stopImmediatePropagation();
                    this.remove();
                });
            }

            /**
             * Attach data getter
             *
             * @abstract
             *
             * @return {object}
             */
            get data(){
                throw new Error('Attach data getter must be implemented by subclass');
            }

            /**
             * Sets optionnal removing callback
             *
             * @param {Function} callback
             *
             */
            set onRemove( callback ){
                if (typeof callback === 'function') {
                    this._onRemove = callback;
                } else {
                    throw new Error(`Attach removing callback must be a function, ${typeof callback} given`);
                }
            }

            /**
             * Removed state setter
             * @param {Boolean}
             */
            set removed( value ){
                this._removed = value;
            }

            /**
             * Removed state getter
             * @return {Boolean}
             */
            get removed(){
                return this._removed;
            }

            /**
             * Removes attach
             * @this {Attach}
             */
            remove(){
                $.off(this.removeButton);
                this.element.remove();
                this.removed = true;

                if (typeof this._onRemove === 'function') {
                    this._onRemove(this);
                }
            }

            /**
             * Appends attach with entrance animation
             * @param {Element} parent
             */
            appendTo( parent ){

                if (this._removed) {
                    _log('Attach: couldn\'t proccess appendTo with removed state');
                    return;
                }

                let el = this.element;

                el.classList.add(CSS.fadedOut);
                parent.appendChild(el);

                setTimeout(() => el.classList.remove(CSS.fadedOut), 50);
            }

            /**
             * Shows loader instead of preview
             */
            showLoader() {
                this.element.classList.add(CSS.loading);
            }

            /**
             * Shows loader instead of preview
             */
            hideLoader() {
                this.element.classList.remove(CSS.loading);
            }

            /**
             * Render passed HTML (Andropov template)
             * @param {string} html
             */
            render(html){
                this.content.innerHTML = html;
                andropov.refresh();
            }

            /**
             * Class instance destroy
             */
            destroy(){
                if (this.removeButton) {
                    $.off(this.removeButton);
                    this.removeButton = null;
                }

                this.element = null;
                this._removed = null;
                this._onRemove = null;
            }

        };

    }
);

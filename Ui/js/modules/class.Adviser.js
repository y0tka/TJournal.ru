/**
 * Module for the UX advises
 */
/**
 * @typedef {object} AdviceData
 * @property {string} type - advice template type: 'shortcuts', 'rawhtml' etc.
 * @property {string} title - advice title
 * ... other data handled by Advice's render method
 */


Air.defineClass(
    'class.Adviser',
    `class.PersistentStateObject, lib.DOM`,
    function( PersistentStateObject, $ ) {

        'use strict';

        /**
         * Block with useful advises (supported shortcuts, features etc)
         */
        class Adviser extends PersistentStateObject {

            /**
             * Helper constructor
             * @param {AdviceData[]} advices - list of advices in JSON
             */
            constructor({advices}) {

                /**
                 * Enable persistent state
                 */
                super({
                    storageKey: 'adviser',
                    initialState: {
                        openingsCount: 0,
                        closingsCount: 0,
                        viewedAdvicesIds: []
                    }
                });

                this.nodes = {
                    wrapper: $.make('div', [Adviser.CSS.wrapper]),
                    toggler: $.make('div', [Adviser.CSS.toggler]),
                    container: $.make('div', [Adviser.CSS.container]),
                    cross: $.make('div', [Adviser.CSS.cross]),
                    itemsWrapper: $.make('div', [Adviser.CSS.itemsWrapper]),
                    showMore: $.make('div', Adviser.CSS.showNext, {
                        textContent: 'Еще совет'
                    }),
                    restart: $.make('div', Adviser.CSS.close, {
                        textContent: 'К началу'
                    }),
                };

                this.nodes.wrapper.appendChild(this.nodes.toggler);
                this.nodes.wrapper.appendChild(this.nodes.container);
                this.nodes.container.appendChild(this.nodes.cross);
                this.nodes.container.appendChild(this.nodes.itemsWrapper);
                this.nodes.container.appendChild(this.nodes.showMore);
                this.nodes.container.appendChild(this.nodes.restart);

                document.body.appendChild(this.nodes.wrapper);

                this.advices = advices || [];

                /**
                 * Find unread advice's index
                 * @type {number}
                 */
                let unreadAdviceIndex = this.unreadAdviceIndex;

                /**
                 * If there we have unread advice, show it
                 * otherwise, render the first, but don't open adviser
                 */
                if (unreadAdviceIndex !== -1) {
                    this.currentAdviceIndex = unreadAdviceIndex;
                    this.renderAdvice();
                    this.open();
                } else {
                    this.currentAdviceIndex = 0;
                    this.renderAdvice();
                }


                /**
                 * Activate toggler
                 */
                $.on(this.nodes.toggler, 'click', () => {
                    if (!this.opened){
                        this.open();
                    } else {
                        this.close();
                    }
                });

                $.on(this.nodes.cross, 'click', () => {
                    this.close();
                });

                $.on(this.nodes.showMore, 'click', () => {
                    this.leaf();
                });

                $.on(this.nodes.restart, 'click', () => {
                    this.currentAdviceIndex = 0;
                    this.renderAdvice();
                });
            }

            /**
             * CSS dictionary
             * @return {{wrapper, opened, toggler, container, cross}}
             */
            static get CSS(){
                return {
                    wrapper: 'adviser',
                    opened: 'opened',
                    toggler: 'adviser__toggler',
                    container: 'adviser__container',
                    cross: 'adviser__cross',
                    itemsWrapper: 'adviser__items',
                    showNext: 'adviser__show-next',
                    showNextShowed: 'adviser__show-next--showed',
                    close: 'adviser__close',
                    closeShowed: 'adviser__close--showed',
                };
            };

            /**
             * Returns opened state
             * @return {boolean}
             */
            get opened(){
                return $.bem.hasMod(this.nodes.wrapper, Adviser.CSS.opened);
            }

            /**
             * Getter for the current advice
             * @return {AdviceData}
             */
            get currentAdvice(){
                return this.advices[this.currentAdviceIndex];
            }

            /**
             * Opens container
             */
            open(){
                $.bem.toggle(this.nodes.wrapper, Adviser.CSS.opened, true);

                /**
                 * Increment openings count
                 */
                this.mutateState('openingsCount', '++');

                /**
                 * Save viewed advice to the state
                 */
                if (this.currentAdvice.id && !this.state.viewedAdvicesIds.includes(this.currentAdvice.id)){
                    this.mutateState('viewedAdvicesIds', 'push', this.currentAdvice.id);
                }
            }

            /**
             * Close container
             */
            close(){
                $.bem.toggle(this.nodes.wrapper, Adviser.CSS.opened, false);

                /**
                 * Increment closings count
                 */
                this.mutateState('closingsCount', '++');
            }

            /**
             * Return index of unread advice from this.advices array
             * @return {number} index from this.advices array. -1 if there is not unread advices
             */
            get unreadAdviceIndex(){
                let readAdvices = this.state.viewedAdvicesIds;

                return this.advices.findIndex((item) => {
                    let returnValue = !readAdvices.includes(item.id);
                    return returnValue;
                });
            }

            /**
             * Shows Advice content
             */
            renderAdvice(){
                let advice = this.currentAdvice,
                    renderer;

                switch (advice.type){
                    case 'shortcuts': renderer = new ShortcutsAdvice(advice); break;
                    case 'rawhtml': renderer = new HTMLAdvice(advice); break;
                    case 'list': renderer = new ListAdvice(advice); break;
                    default:
                        console.warn('Adviser: no rendering method specified for the advice type:' + advice.type);
                        return;
                }

                this.nodes.itemsWrapper.innerHTML = '';
                this.nodes.itemsWrapper.appendChild(renderer.wrapper);

                let isLast = this.currentAdviceIndex === this.advices.length - 1;

                $.bem.toggle(this.nodes.showMore, 'showed', this.advices.length > 1 && !isLast);
                $.bem.toggle(this.nodes.restart, 'showed', isLast);

                /**
                 * Show warning if somebody forgot to set up the advice id
                 */
                console.assert(advice.id, 'It is recommended to specify the id of the advice', advice);

            }

            /**
             * Render next advice
             */
            leaf(){
                this.currentAdviceIndex = this.currentAdviceIndex + 1;

                if (this.currentAdviceIndex >= this.advices.length ){
                    this.currentAdviceIndex = 0;
                }

                this.renderAdvice();

                /**
                 * Save viewed advice to the state
                 */
                if (this.currentAdvice.id && !this.state.viewedAdvicesIds.includes(this.currentAdvice.id)){
                    this.mutateState('viewedAdvicesIds', 'push', this.currentAdvice.id);
                }
            }

            /**
             * Destroy all stuff
             */
            destroy() {
                $.off(this.nodes.showMore);
                $.off(this.nodes.toggler);
                $.off(this.nodes.cross);
                $.off(this.nodes.restart);

                this.nodes.wrapper.remove();

                /**
                 * Clear this.nodes map
                 */
                for (let key in this.nodes){
                    if (this.nodes.hasOwnProperty(key)) {
                        this.nodes[key] = null;
                    }
                }
            }
        }

        /**
         * ------------------------------------------------------------------------
         *
         *      Advices rendering types
         *
         * ------------------------------------------------------------------------
         */
        /**
         * Base Renderer interface
         */
        class AdviceRenderer {
            constructor({title}){
                this.title = title;
            }

            static get CSS(){
                return {
                    wrapper: 'advice',
                    title: 'advice__title',
                    list: 'advice__list'
                }
            }

            get wrapper(){
                let container = $.make('div', [AdviceRenderer.CSS.wrapper]),
                    title = $.make('div', [AdviceRenderer.CSS.title], {
                        innerHTML: this.title || ''
                    });
                $.append(container, title);
                return container;
            }
        }

        /**
         * Advice with shortcuts list
         * @augments AdviceRenderer
         */
        class ShortcutsAdvice extends AdviceRenderer {
            /**
             * @param {string} title
             * @param {{label: string, shortcut: string|string[]}[]} items
             */
            constructor({title, items}){
                super({title});
                this.items = items;
            }

            get wrapper(){
                let wrapper = super.wrapper;
                let content = `<div class="${AdviceRenderer.CSS.list}">`;
                this.items.forEach(item => {
                    let shortcut = '';
                    if (Array.isArray(item.shortcut)){
                        item.shortcut.forEach(key => {
                            shortcut += `<dt>${this.replaceKeys(key)}</dt>`;
                        });
                    } else {
                        shortcut = `<dt>${this.replaceKeys(item.shortcut)}</dt>`;
                    }
                    content += `<dl><dd>${item.label}</dd><hr>${shortcut}</dl>`
                });
                content += '</div>';
                wrapper.innerHTML += content;

                return wrapper;
            }

            /**
             * Replace special keys on platforms:
             * for example. CMD -> CTRL
             * @param {string} key - shortcut
             */
            replaceKeys(key) {
                const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

                if (!isMac){
                    key = key.replace('<span class="key">⌘</span>', 'Ctrl');
                }

                return key;
            }
        }



        /**
         * Advice with raw HTML injection
         * @augments AdviceRenderer
         */
        class HTMLAdvice extends AdviceRenderer {
            /**
             * @param {string} title
             * @param {string} html
             */
            constructor({title, html}){
                super({title});
                this.html = html;
            }

            get wrapper(){
                let wrapper = super.wrapper;
                wrapper.innerHTML += this.html;

                return wrapper;
            }
        }

        /**
         * Advice with list items
         * @augments AdviceRenderer
         */
        class ListAdvice extends AdviceRenderer {
            /**
             * @param {string} title
             * @param {string[]} items
             */
            constructor({title, items}){
                super({title});
                this.items = items;
            }

            get wrapper(){
                let wrapper = super.wrapper;
                let content = `<div class="${AdviceRenderer.CSS.list}">`;
                this.items.forEach(item => {
                    content += `<li>${item}</li>`
                });
                content += '</div>';
                wrapper.innerHTML += content;

                return wrapper;
            }
        }

        return Adviser;
    }
);

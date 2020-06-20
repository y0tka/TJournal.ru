/**
 * Instagram Tool for Codex Editor
 * @module InstagramTool
 */

/**
 * @typedef {Object} AndropovInstagramFetchResponse
 * @property {AndropovInstagramData} data
 * @property {String} render
 * @property {String} type
 */

/**
 * @typedef {Object} AndropovInstagramData
 * @property {String} service - instagram
 * @property {Object} data - instagram data
 */

/**
 * @typedef {Object} InstagramToolData
 * @property {Boolean} hide_title - show widget with caption or not
 * @property {String} title - block caption}
 * @property {AndropovInstagramData} instagram - instagram data
 */

Air.defineClass(
    'class.InstagramTool', '' +
    'lib.DOM, module.notify, lib.ajax, module.andropov',
    function($, notify, ajax, andropov) {

        'use strict';

        /**
         * @type {{toolboxIcon: string, instagramWrapper: string, instagramTitle: string, editorInput: string, instagramSettings: string, instagramSettingsItem: string, instagramSettingsIcon: string, settingsItemtoggled: string}}
         */
        let CSS = {
            toolboxIcon     : 'ce-icon-instagram',
            instagramTool   : 'instagram-tool',
            instagramWidget : 'instagram-tool__widget',
            instagramTitle  : 'instagram-tool__title',
            editorInput     : 'cdx-input',

            instagramSettings       : 'instagram-settings',
            instagramSettingsItem   : 'instagram-settings__item',
            instagramSettingsIcon   : 'instagram-settings__item-icon',
            settingsItemtoggled     : 'instagram-settings__item--toggled',

            widgetLoading : 'instagram-tool__widget--loading'
        };

        let instagramSettings = [
            {
                name    : 'hide_title',
                title   : 'Показывать подпись',
                icon    : 'instagram-hidetitle-icon',
                default : true
            }
        ];

        class InstagramView {

            /**
             * Render widget. Make UI
             * @param {InstagramToolData} data
             */
            renderWidget(data) {
                this.wrapper = $.make('div', CSS.instagramTool);
                this.widget = $.make('div', CSS.instagramWidget);
                this.title = $.make('div', [CSS.editorInput, CSS.instagramTitle], {
                    contentEditable: true
                });

                this.title.innerHTML = data.title || '';
                this.title.dataset.placeholder = 'Подпись';

                if (data.instagram && data.instagram.render) {
                    this.widget.innerHTML = data.instagram.render;
                }

                this.wrapper.appendChild(this.widget);
                this.wrapper.appendChild(this.title);
                return this.wrapper;
            }

            /**
             * Push rendered instagram widget
             * @param {AndropovInstagramFetchResponse} instagramData
             */
            fetchSuccessCallback(instagramData) {
                this.widget.innerHTML = instagramData.render;
                andropov.refresh();

                // Check Iframe height
                window.setTimeout( () => {
                    let iframe = $.find(this.widget, 'iframe');
                    if ( !iframe || (iframe && !iframe.clientHeight && !iframe.offsetHeight) ) {
                        notify.error('Не удалось загрузить инстаграм');
                        codex.editor.content.currentNode.remove();
                    }
                }, 300);
            }

            /**
             * Can't load instagram widget
             * @param {String} msg
             */
            fetchErrorCallback(msg) {
                notify.error('Не удалось загрузить инстаграм');

                let editorBlock = $.parents(this.widget, '.ce-block');
                codex.editor.content.removeBlock(editorBlock);

            }

            /**
             * Draws settings item via title
             * @param {Object} option - setting item
             *        {String} option.title - setting item title
             *        {String} option.name - setting item name
             *        {String} option.icon - setting item icon
             *        {Boolean} option.default - is active by default or not
             *
             * @param {Boolean} isActive - is active or not
             */
            drawSettingsItem(option, isActive) {

                let item = $.make('DIV', [CSS.instagramSettingsItem], {}),
                    icon = $.svg(option.icon, 14, 14);

                /** Activate previously selected settings */
                if (!isActive && option.name === 'hide_title' || isActive && option.name !== 'hide_title') {
                    item.classList.add(CSS.settingsItemtoggled);
                }

                $.append(item, icon);
                $.append(item, document.createTextNode(option.title));

                return item;

            };

            /**
             * Toggles active class
             * @param {MouseEvent} event - Mouse event on clicked item
             */
            toggleSettingItem(event) {
                let item = event.target;
                item.classList.toggle(CSS.settingsItemtoggled);
            };

            /**
             * @constructor
             */
            constructor() {
                this.wrapper = null;
                this.title = null;
                this.widget = null;
            }
            /**
             * destroy instance, clear listeners and variables
             */
            destroy() {
                this.wrapper = null;
                this.title = null;
                this.widget = null;
            };

        }

        class InstagramModel {

            /**
             * Instagram Model constructor
             * @constructor
             *
             * @property {String}  this.instagram_url
             * @property {Boolean} this.hide_title
             * @property {String}  this.title
             */
            constructor() {
                this.hide_title = true;
                this.title = null;
                this.instagram = {};
            }

            /**
             * Setter for model data
             * @param {instagramData} instagramData
             *
             * @typedef {Object} instagramData
             * @property {Boolean} instagramData.hide_title - hide title or not
             * @property {String} instagramData.title - instagram block title
             * @property {String} instagramData.instagram - instagram URL
             *
             */
            set data( instagramData = {}) {
                this.hide_title    = (instagramData.hide_title === false) ? instagramData.hide_title : true;
                this.title         = instagramData.title || '';
                this.instagram     = instagramData.instagram || {};
            }

            /**
             * Returns model data
             */
            get data() {
                return {
                    hide_title : this.hide_title,
                    title      : this.title,
                    instagram  : this.instagram
                };
            }

            /**
             * Model destroyer
             */
            destroy(){
                this.hide_title = null;
                this.title      = null;
                this.instagram  = {};
            };

            /** Setting item listener */
            toggleHideTitleOption() {
                this.hide_title = !this.hide_title;
            };

        }

        /**
         * @constructor
         *
         * Instagram plugin main class
         *
         * @typedef {InstagramTool} module:InstagramTool.InstagramTool
         * @property {InstagramView} view - instagram view controller
         * @property {InstagramModel} model - instagram model controller
         *
         */
        return class InstagramTool {
            constructor() {
                this.fetchURL = '/andropov/extract/render';
                this.view = new InstagramView();
                this.model = new InstagramModel();
                this.renderWidgetMethod = null;
            }

            /**
             * Tool type
             * @return {string}
             */
            static get type(){
                return 'instagram';
            }

            /**
             * Tool title. Uses in toolbar hover helper
             * @return {string}
             */
            static get title(){
                return 'Инстаграм';
            }

            /**
             * Tool icon CSS classname
             * @return {string}
             */
            static get iconClassname(){
                return CSS.toolboxIcon;
            }

            /**
             * Is need to display in toolbox
             * @return {Boolean}
             */
            static get displayInToolbox(){
                return false;
            }

            /**
             * Enable to showing inline toolbar
             * @return {Boolean}
             */
            static get inlineToolbar() {
                return true;
            }

            /**
             * List of URLs that plugin will handle
             * @returns {[*]}
             */
            // static get renderOnPastePatterns() {
            //     return [
            //         {
            //             type: 'instagram',
            //             regex: /http?.+instagram.com\/p\/([a-zA-Z0-9]*)\S*/
            //         }
            //     ];
            // }

            /**
             * Load external widget
             * @returns {Promise}
             */
            static prepare () {
                return Promise.resolve();
            }

            /**
             * Paste callback.
             * Fetch Instagram info via rendered Widget
             *
             * @param {String} matchedString - pasted data
             */
            // pastePatternParsed (matchedString) {
            //     this.fetchInfo(matchedString);
            // }

            /**
             * @param {String} instagramURL
             */
            fetchInfo(instagramURL) {

                this.view.widget.classList.add(CSS.widgetLoading);

                ajax.get({
                    url: this.fetchURL,
                    data: {
                        url: instagramURL
                    },
                    dataType: 'json',
                    /**
                     * @param {Array} response
                     * @param {AndropovInstagramFetchResponse} response.result
                     */
                    success: (response) => {
                        let andropovData = response.result.pop();

                        // remove loader to show the result
                        this.view.widget.classList.remove(CSS.widgetLoading);

                        if (andropovData.type === 'error' || andropovData.data.box_data && !(andropovData.data.box_data.image || andropovData.data.box_data.title)) {
                            this.view.fetchErrorCallback(andropovData.data.error_text);
                            return;
                        }

                        /** Save parsed data and render widget */
                        this.model.instagram = andropovData;
                        this.view.fetchSuccessCallback(andropovData);
                    },
                    error: msg => { this.view.fetchErrorCallback(msg); }
                });
            }

            /**
             * Extract's data from DOM or from memory
             */
            extractData () {
                /**
                 * Sanitizer module config
                 * @type {Object}
                 */
                let sanitizerConfig = {
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
                this.model.title = codex.editor.sanitizer.clean(this.view.title.innerHTML, sanitizerConfig , true);
                return this.model.data;
            }

            /**
             * Render instagram block from given JSON
             * @param {InstagramToolData} data
             * @return {Element} instagram - HTML element via Instagram block
             */
            render (data = {}) {
                this.model.data = data;

                let widget = this.view.renderWidget(data);
                this.renderWidgetMethod = () => {
                    andropov.refresh();
                };
                window.setTimeout( this.renderWidgetMethod, 100);

                return widget;
            }

            /**
             * Draw settings block
             */
            makeSettings() {

                let self = this,
                    settingsHolder,
                    item;

                settingsHolder = $.make('DIV', [CSS.instagramSettings], {});

                instagramSettings.forEach((option) => {
                    let isActive = this.model[option.name];
                    item = this.view.drawSettingsItem(option, isActive);
                    switch (option.name) {
                        case 'hide_title':
                            // add listener
                            $.on(item, 'click', function(event) {
                                self.model.toggleHideTitleOption(event);
                                self.view.toggleSettingItem(event);
                            });
                            break;
                    }
                    settingsHolder.appendChild(item);
                });

                return settingsHolder;

            }

            /**
             * Extract data from DOM node
             * @returns {{instagram, hide_title: boolean, title: (*|string)}|*}
             */
            save () {
                return Promise.resolve().then(() => {
                    return this.extractData();
                });
            }

            destroy() {
                this.view.destroy();
                this.model.destroy();

                if (this.renderWidgetMethod) {
                    window.clearTimeout(this.renderWidgetMethod);
                    this.renderWidgetMethod = null;
                }

                this.view = null;
                this.model = null;
            }
        }

});

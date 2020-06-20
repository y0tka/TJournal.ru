Air.defineClass(
    'class.Editor',
    `lib.DOM, lib.ajax, lib.console,
     class.NumberTool, class.QuoteTool, class.TwitterTool, class.InstagramTool, class.ListTool, class.SpecialButton,
     class.Hashtag, class.UnsavedChangesDetector, class.WarningTool, class.AndropovTool,
     module.notify, module.andropov`,
    /**
     * @param {module:libDom} $
     * @param {module:libAjax} ajax
     * @param {module:notify} notify
     * @param {module:utility} util
     * @param {module:NumberTool} NumberTool
     * @param {module:QuoteTool} QuoteTool
     * @param {module:TwitterTool} TwitterTool
     * @param {module:InstagramTool.InstagramTool} InstagramTool
     * @param {module:ListTool} ListTool
     * @param {module:SpecialButton} SpecialButton
     * @param {module:Hashtag} Hashtag
     * @param {module:UnsavedChangesDetector} UnsavedChangesDetector
     * @returns {{new(): Editor}}
     */
    function(
        $, ajax, console,
        NumberTool, QuoteTool, TwitterTool, InstagramTool, ListTool, SpecialButton,
        Hashtag, UnsavedChangesDetector, WarningTool, AndropovTool,
        notify, andropov,
        util
    ) {

        'use strict';

        /*!
         * Editor Class.
         * Based on CodeX Editor {@link https://github.com/codex-team/codex.editor} fork
         */
        /**
         * @module Editor
         * @typedef {Editor} Editor
         * @property {Element} holder           - where to append the CodeX Editor
         * @property {String} cdn               - Editor CDN path
         * @property {String} cdnVersion        - CDN revision number for cache invalidation
         * @property {Array} externalTools      - CodeX Editor Plugins that need to be loaded from the CDN
         * @property {Promise<void>} editorLoading - loading sequence
         * @property {Hashtag} hashtagInstance  - instance of Hashtag Inline Search class
         * @property {object} customToolsConfig - custom tools configuration
         */
        return class Editor {
            /**
             * @constructor
             * @param {Element} holder - where to append the CodeX Editor
             * @param {object} [editorSettings]     - overrides for default initialization settings
             * @param {Function} [onReady]          - Editor ready callback
             * @param {string} cdnPath              - CDN path
             * @param {number} cdnVersion           - CDN revision number for cache invalidation
             * @param {Array} plugins               - List of CodeX Editor Plugins
             * @param {object} customToolsConfig    - settings for the Tools
             * @param {boolean} disableUnsavedChangesDetector - pass true to disable detection of unsaved changes with ajax-segues
             */
            constructor({
                            holder,
                            editorSettings,
                            onReady,
                            cdnPath,
                            cdnVersion,
                            plugins,
                            customToolsConfig,
                            disableUnsavedChangesDetector
                        }) {

                this.holder = holder;
                this.editorSettings = editorSettings;

                if (document.location.hostname.includes('osnova.io')) {
                    this.cdn = '//staging.paragraph.osnova.io/';
                } else if (cdnPath) {
                    this.cdn = cdnPath;
                } else {
                    console.warn('CDN path for the CodeX Editor does not specified');
                    this.cdn = '//s38736.cdn.ngenix.net/paragraph/';
                }

                this.cdnVersion = cdnVersion;

                // this.cdn = 'http://127.0.0.1:8083/';
                // this.cdn = '//paragraph.local/';

                this.plugins = plugins;
                this.customToolsConfig = customToolsConfig || {};

                /**
                 * We don't need to require internal air-tools, because they are already in a bundle
                 */
                let internalTools = new Set([
                        'number',
                        'quote',
                        'twitter',
                        'instagram',
                        'list',
                        'special_button',
                        'warning',
                        'andropov',
                    ]);

                this.externalTools = this.plugins.filter( tool => !internalTools.has(tool) );

                /**
                 * Hashtag InlineSearch instance
                 * @type {Hashtag}
                 */
                this.hashtagInstance = new Hashtag();

                /**
                 * Instance for detector
                 * @type {UnsavedChangesDetector}
                 */
                this.unsavedChangesDetector = !disableUnsavedChangesDetector ? new UnsavedChangesDetector({
                    alertText: 'Текст статьи не сохранен. Если уйти со страницы, то данные потеряются.'
                }) : null;

                /**
                 * Start loading sequence
                 * @type {Promise<void>}
                 */
                this.editorLoading = this.loadSources()
                    .then(() => {
                        console.log('codex', 'All resources loaded');
                        return this.showEditor();
                    })
                    .then(() => {
                        console.log('codex', 'Ready');
                        if (typeof onReady === 'function') {
                            onReady(true);
                        }
                    })
                    .catch(error => {
                        console.error('codex', 'Initialization failed because of:', error);
                    });

            }

            /**
             * Load CodeX Editor sources
             * @returns {Promise<void>}
             * @throws {Error} - resource loading error
             */
            loadSources() {
                console.time('codex', 'Resources loading');
                return Promise.all([
                    util.loadResource(this.cdn + 'codex-editor.js?v=' + this.cdnVersion),
                    util.loadResource(this.cdn + 'codex-editor.css?v=' + this.cdnVersion),
                    ...this.loadPlugins()
                ])
                    .catch(error => {
                        console.timeEnd('codex', 'Resources loading');
                        notify.error('Редактор недоступен. Попробуйте перезагрузить страницу.');
                        throw Error(error);
                    })
                    .then(() => {
                        console.timeEnd('codex', 'Resources loading');
                    })
            }

            /**
             * Prepare sequence of loading-queries for Plugins JavaScript and CSS files
             * @returns {Promise[]}
             */
            loadPlugins() {
                let pluginsQuery = [];

                this.externalTools.forEach(plugin => {
                    pluginsQuery.push(...[
                        util.loadResource(this.cdn + 'plugins/' + plugin + '/' + plugin + '.js?v=' + this.cdnVersion),
                        util.loadResource(this.cdn + 'plugins/' + plugin + '/' + plugin + '.css?v=' + this.cdnVersion),
                    ])
                });

                return pluginsQuery;
            }

            /**
             * Decorator for making CodeX Editor Tool's configuration object
             * @param {string} filename  - plugin's global name. Ex: 'paragraph' for window.paragraph
             * @param {string} type      - plugin's type. Ex: 'heading_styled'
             * @param {string} icon      - Toolbar icon
             * @param {string} title     - Toolbar icon caption
             * @param {object} options   - Tool's option
             * @return {object}
             */
            getToolConfig({filename, type, icon, title, options}) {
                let tool = window[filename];

                if (!tool) {
                    return {}
                }

                let config = {
                    type: type,
                    iconClassname: icon,
                    title: title || ''
                };

                ['render', 'save', 'validate', 'makeSettings', 'destroy', 'appendCallback', 'prepare'].forEach(method => {
                   if (tool[method]) {
                        config[method] = tool[method];
                   }
                });

                if (tool.pastePatterns){
                    config.renderOnPastePatterns = tool.pastePatterns;
                }

                if (options) {
                    for (let key in options) {
                        if (options.hasOwnProperty(key)) {
                            config[key] = options[key];
                        }
                    }
                }

                /**
                 * Override default config with custom (passed with tht Editor constructor)
                 */
                if (this.customToolsConfig[type]){
                    config = Object.assign(config, this.customToolsConfig[type]);
                }

                return config;

            }

            /**
             * Compose object with Tools for this.plugins
             * @return {{}}
             */
            get toolsConfig() {
                let config = {};

                /**
                 * order in this object corresponds order at the Toolbox
                 */

                if (this.plugins.includes('paragraph') && window.paragraph) {
                    config.text = this.getToolConfig({
                        filename: 'paragraph',
                        type: 'text',
                        icon: 'ce-icon-paragraph',
                        title: 'Параграф',
                        options: {
                            allowedToPaste: true,
                            inlineToolbar: true,
                            allowRenderOnPaste: true,
                            keydownCallback: (block, event) => {
                                return this.hashtagInstance.keydownHandler(block, event);
                            }
                        }
                    });
                }

                if (this.plugins.includes('header') && window.header) {
                    config.header = this.getToolConfig({
                        filename: 'header',
                        type: 'header',
                        icon: 'ce-icon-header',
                        title: 'Заголовок',
                        options: {
                            displayInToolbox: true,
                            enableLineBreaks: false,
                            allowRenderOnPaste: true,
                            inlineToolbar: ['link'],
                            contentless: true,
                            handleTags: {
                                tags: ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'],
                                fill: 'text'
                            }
                        }
                    });
                }

                if (this.plugins.includes('image') && window.image) {
                    config.image = this.getToolConfig({
                        filename: 'image',
                        type: 'image',
                        icon: 'ce-icon-picture',
                        title: 'Изображение',
                        options: {
                            displayInToolbox: true,
                            enableLineBreaks: false,
                            inlineToolbar: true,
                            config : {
                                uploadImage         : '/andropov/upload',
                                uploadFromUrl       : '/andropov/upload/urls',
                                fetchURL            : '/andropov/extract/render'
                            }
                        }
                    });
                }

                if ( this.plugins.includes('embed') && window.embed) {
                    config.video = this.getToolConfig({
                        filename: 'embed',
                        type: 'video',
                        icon: 'ce-icon-embed',
                        title: 'Видео',
                        options: {
                            displayInToolbox: true,
                            allowRenderOnPaste: true,
                            inlineToolbar    : true,
                            config: {
                                fetchURL : '/andropov/extract/render'
                            }
                        }
                    });
                }

                if ( this.plugins.includes('quote') ) {
                    config.quote = QuoteTool;
                }

                if ( this.plugins.includes('list') ) {
                    config.list = ListTool;
                }

                if ( this.plugins.includes('instagram') ) {
                    config.instagram = InstagramTool;
                }

                if ( this.plugins.includes('twitter') ) {
                    config.tweet = TwitterTool;
                }

                if ( this.plugins.includes('andropov') ) {
                    config.andropov = AndropovTool;
                }

                if ( this.plugins.includes('link') && window.link) {
                    config.link = this.getToolConfig({
                        filename: 'link',
                        type : 'link',
                        icon : 'ce-icon-link',
                        title : 'Внешняя ссылка',
                        options: {
                            displayInToolbox: true,
                            enableLineBreaks: true,
                            config: {
                                fetchUrl: '/andropov/extract/render'
                            }
                        }
                    });
                }

                if ( this.plugins.includes('gallery') && window.galleryTool ) {
                    config.gallery = this.getToolConfig({
                        filename: 'galleryTool',
                        type: 'gallery',
                        title: 'Галерея',
                        icon: 'cdx-gallery-icon',
                        options: {
                            displayInToolbox: true,
                            enableLineBreaks: true,
                            config: {
                                uploadURL: '/andropov/upload',
                            }
                        }
                    });
                }

                if ( this.plugins.includes('delimiter') && window.cdxDelimiter ) {
                    config.delimiter = this.getToolConfig({
                        filename: 'cdxDelimiter',
                        type: 'delimiter',
                        title: 'Разделитель',
                        icon: 'cdx-delimiter-icon',
                        options: {
                            displayInToolbox: true,
                            contentless: true
                        }
                    });
                }


                if ( this.plugins.includes('raw') && window.rawPlugin ) {
                    config.rawhtml = this.getToolConfig({
                        filename: 'rawPlugin',
                        type: 'rawhtml',
                        title: 'HTML-код',
                        icon: 'raw-plugin-icon',
                        options: {
                            displayInToolbox: true,
                            enableLineBreaks: true,
                            allowPasteHTML: true
                        }
                    });
                }

                if ( this.plugins.includes('audio') && window.audioTool ) {
                    config.audio = this.getToolConfig({
                        filename: 'audioTool',
                        type: 'audio',
                        title: 'Аудио',
                        icon: 'cdx-audio-icon',
                        options: {
                            displayInToolbox : true,
                            config: {
                                uploadImageURL : '/andropov/upload',
                                uploadAudioURL : '/andropov/upload/audio',
                            }
                        }
                    });
                }

                if ( this.plugins.includes('warning') ) {
                    config.warning = WarningTool;
                }

                if ( this.plugins.includes('wtrfall') && window.wtrfallTool) {
                    config.wtrfall = this.getToolConfig({
                        filename: 'wtrfallTool',
                        type: 'wtrfall',
                        title: 'Waterfall',
                        icon: 'cdx-wtrfall-icon',
                        options: {
                            displayInToolbox: true,
                            enableLineBreaks: true,
                            allowPasteHTML: true
                        }
                    });
                }

                if ( this.plugins.includes('quiz') && window.quizTool ) {
                    config.quiz = this.getToolConfig({
                        filename: 'quizTool',
                        type: 'quiz',
                        title: 'Опрос',
                        icon: 'cdx-quiz-icon',
                        options: {
                            displayInToolbox: true,
                            enableLineBreaks: true,
                            allowPasteHTML: true,
                            contentless: true
                        }
                    });
                }
                if ( this.plugins.includes('number') ) {
                    config.number = {
                        type: 'number',
                        title: 'Цифра',
                        displayInToolbox: true,
                        iconClassname: 'number-tool__icon',
                        render: NumberTool.render,
                        save: NumberTool.save,
                        validate: NumberTool.validate,
                        destroy: NumberTool.destroy,
                        enableLineBreaks: true,
                        inlineToolbar: true,
                        contentless: true
                    };
                }

                if ( this.plugins.includes('special_button') ) {
                    config.special_button = SpecialButton;
                }
                
                return config;
            }

            /**
             * Render CodeX Editor
             */
            showEditor() {
                let settings = {
                    beforeAjax: function (request) {
                        ajax.setCSRF( this );
                    },
                    holder: this.holder,
                    initialBlockPlugin: 'text',
                    brandColor: '#EEF2F5',
                    settings: this.editorSettings,
                    notifications : {
                        alert : notify.show
                    },
                    data: {
                        items: [],
                        count: 0
                    },
                    tools: this.toolsConfig,
                    modifyCallback: () => {
                        window.codex.editor.saver.save().then(data => {
                            if (this.unsavedChangesDetector){
                                this.unsavedChangesDetector.check(data);
                            }
                        })
                    }
                };

                /**
                 * Override default init settings
                 */
                if (this.editorSettings) {
                    settings = Object.assign(settings, this.editorSettings);
                }

                return window.codex.editor.start(settings)
                    .then(() => {
                        console.log('codex', `Initialised, version: ${window.codex.editor.version}`);
                        setTimeout(() => {
                            this.parseHashtags();
                        }, 500);
                    });
            }

            /**
             * Fills Editor with the data
             * @param {{items: [], count: number}} data - data similar to CodeX Editor's initial settings 'data' format
             */
            fill(data){
                window.codex.editor.content.fill(data);

                // fallback for out-air Tools
                setTimeout(() => {
                    andropov.refresh();
                }, 1000);
            }

            /**
             * Editor saving method
             * @return {Promise<object[]>}
             */
            save(params = {}) {
                return window.codex.editor.saver.save()
                    .then( editorBlocks => {
                        return this.processHashtags(editorBlocks);
                    });
            }

            /**
             * Replace #Hashtag with <b class="inline-hashtag">Hashtag</b>
             */
            parseHashtags() {
                let editableBlocks = $.findAll('.ce-paragraph');

                editableBlocks.forEach( block => {
                    this.hashtagInstance.originToParsed(block);
                });
            }

            /**
             * Replace <b class="inline-hashtag">Hashtag</b> with #Hashtag
             * @param {Array} blocks
             * @return {Array}
             */
            processHashtags(blocks) {

                /**
                 * Map with tools that may contain hashtags
                 * tool-name -> field-name
                 * @type {Object}
                 */
                let whereHashtagsCanBe = {
                    'text': 'text'
                    // 'quote': 'caption'
                };

                blocks.forEach( block => {
                    if ( whereHashtagsCanBe[block.type] ) {

                        console.assert(block.data[whereHashtagsCanBe[block.type]],
                            `Wrong field with hashtags specified. Plugin ${block.type} does not have
                            ${whereHashtagsCanBe[block.type]} field in data`);

                        let textWithHashtags = block.data[whereHashtagsCanBe[block.type]];

                        if (textWithHashtags) {
                            block.data[whereHashtagsCanBe[block.type]] = this.hashtagInstance.parsedToOrigin(textWithHashtags);
                        }

                    }

                });

                return blocks;
            }

            /**
             * Sets focus on the Editor
             * @param {boolean} atStart - true to set Caret at the start of Editor. By default, sets to the end.
             */
            focus(atStart) {

                if (atStart) {
                    // insert new block at start and set caret
                    // use insertBlockBefore according to the CodeX.Editor API
                    window.codex.editor.content.insertBlockBefore(1);
                } else {
                    // otherwise just focus at last block
                    window.codex.editor.caret.focusEditor();
                }

            }

            /**
             * Editor instance destroy method
             */
            destroy() {
                this.hashtagInstance.destroy();
                window.codex.editor.destroyer.destroy({
                    ui: true
                });
                if (this.unsavedChangesDetector) {
                    this.unsavedChangesDetector.destroy();
                }
            }
        };
    });

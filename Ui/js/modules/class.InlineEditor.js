/**
 * Inline Editor for the class.Form2.js
 */
Air.defineClass( 'class.InlineEditor',
    `class.Editor, class.Attaches, lib.DOM`,
    function( Editor, Attaches, $, util ) {

        'use strict';

        return class InlineEditor {

            /**
             * @param  {Element} wrapper       - Form fieldset with the inline editor
             * @param  {Element} originalInput - hidden input with data
             */
            constructor(wrapper, originalInput){

                this.elements = {
                    wrapper: wrapper,
                    originalInput: originalInput
                };

                /**
                 * Editor loading state
                 */
                this.editorIsReady = false;

                /**
                 * CodeX Editor instance for the Additional field
                 * @type {Editor}
                 */
                this.editorInstance = null;

                /**
                 * Attaches module for th Additional field
                 * @type {Attaches}
                 */
                this.attachesInstance = null;


                this.createStructure();
            }

            static get CSS() {
                return {
                    fieldWrapper: 'form2__inline-editor',
                    codexEditorInline: 'inline-editor',
                };
            }

            /**
             * Creates inine-editor with attachs structure
             */
            createStructure(){

                /**
                 * Main elements holder
                 *  _______________________
                 * |                       |
                 * | Write your story...   |
                 * |                       |
                 * | [Attach Image]        |
                 * | [Attaches List]       |
                 * |_______________________|
                 */
                let fieldWrapper = $.make('div', InlineEditor.CSS.fieldWrapper);

                /**
                 * Editor Holder is used to append Editor exactly before Attaches (because it may be loaded slower)
                 */
                let editorHolder = $.make('div', InlineEditor.CSS.codexEditorInline);
                $.append(fieldWrapper, editorHolder);

                /**
                 * Check editor's initial data
                 */
                let initialData = $.val(this.elements.originalInput);
                let pluginsList = ['paragraph'];

                /**
                 * Make Editor class instance
                 */
                this.editorInstance = new Editor({
                    cdnVersion: 99, // @todo get actual CDN revision from the module-settings
                    holder: editorHolder,
                    plugins: pluginsList,
                    editorSettings: {
                        hideToolbar: true,
                        placeholder: 'Напишите текст или вставьте ссылку...'
                    },
                    onReady: () => {
                        _log('Editor is ready');
                        this.editorIsReady = true;
                    },
                    customToolsConfig: {
                        text: {
                            pasteCallback: (event, htmlData, plainData) => {
                                return this.attachesInstance.pasteHandler(event, plainData);
                            },
                            inlineToolbar: ['link']
                        }
                    },
                    disableUnsavedChangesDetector: true
                });

                /**
                 * Activate module for Images attaches.
                 */
                this.attachesInstance = new Attaches({
                    limit: 1,
                    attachesAvailable: ['image', 'video']
                });

                /**
                 * Append Attach buttons and thumbnails zone
                 */
                let attachesList = this.attachesInstance.renderList(),
                    attachesButtons = this.attachesInstance.renderButtons();

                $.append(fieldWrapper, attachesList);
                $.append(fieldWrapper, attachesButtons);

                $.append(this.elements.wrapper, fieldWrapper);

                if (initialData.trim()) {
                    this.editorInstance.editorLoading.then(() => {
                        try {
                            /**
                             * @type {{
                             *    content: {
                             *      blocks: {type, data, anchor, cover}[]
                             *    },
                             *    attaches: []
                             *  }}
                             */
                            initialData = JSON.parse(initialData);

                            this.editorInstance.fill({
                                items: initialData.content.blocks,
                                count: initialData.content.blocks.length
                            });

                            if (initialData.attaches && initialData.attaches.length){
                                this.attachesInstance.fill(initialData.attaches)
                            }

                        } catch (err){
                            _log('InlineEditor: cannot fill Editor:', err);
                        }
                    });
                }

            }

            /**
             * Save CodeX Editor data for the Additional field
             *
             * @typedef {object} outputFormat
             * @property {array} content - CodeX Editor blocks
             * @property {array} attaches - Attaches list
             *
             * @return {Promise<outputFormat>} - CodeX Editor data and Attaches
             */
            save(){

                if (!this.editorIsReady){
                    return Promise.resolve({
                        content: null,
                        attaches: null
                    });
                }

                /**
                 * if
                 * @param  {[type]} res [description]
                 * @return {[type]}     [description]
                 */
                return this.editorInstance.save().then(res => {

                    /**
                     * Add attaches
                     */
                    return {
                        content: {blocks: res},
                        attaches: this.attachesInstance ? this.attachesInstance.data : []
                    };
                });
            }

            destroy() {
                if (this.editorInstance) {
                    this.editorInstance.destroy();
                }

                if (this.attachesInstance) {
                    this.attachesInstance.destroy();
                }
            }

            setValue(data){
                $.val(this.elements.originalInput, JSON.stringify(data));
            }

        };
    }
);

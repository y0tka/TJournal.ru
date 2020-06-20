/**
 * @module EntryEditor
 * @description Wrapper for the Editor class. Used for saving an Entries: with title and checkboxes
 *  _________________________________
 * |                                 |
 * |   Title______________________   |
 * |   - - - - - - - - - - - - - -   |
 * |  : Entry Settings checkboxes :  |
 * |   - - - - - - - - - - - - - -   |
 * |                                 |
 * |  (+) [CodeX Editor]             |
 * |                                 |
 * |_________________________________|
 */
Air.defineClass(
    'class.EntryEditor',
    `lib.DOM, lib.string, lib.keys, lib.console,
     fn.hashData,
     module.notify, module.smart_ajax, module.checkboxes, module.radioButtons, module.inputs,
     class.Editor, class.Entry, class.Timer
     `,
    /**
     * @param {module:libDom} $
     * @param {module:libString} libString
     * @param {module:libKeys} keys
     * @param {module:hashData} hashData
     * @param {module:notify} notify
     * @param {module:smartAjax} smartAjax
     * @param {module:Editor} Editor
     * @param {module:Entry} Entry
     * @param {module:Timer} Timer
     * @param {module:utility} util
     * @returns {{new(): Editor}}
     */
    function(
        $, libString, keys, console,
        hashData,
        notify, smartAjax, checkboxes, radioButtons, inputs,
        Editor, Entry, Timer,
        util
    ) {

        'use strict';

        /**
         * @class EntryEditor
         * @classdesc Wrapper for Editor class that uses to save an Entries: with title and checkboxes
         * @augments Editor
         *
         * @typedef {EntryEditor} EntryEditor
         * @property {String} cdn         - Editor CDN path
         * @property {Number} titleMaxLen - Entry's title maximum length
         * @property {String} saveURL     - Endpoint for Entry saving
         * @property {module:Attaches.Attaches} [Attaches] - Attaches instance if Editor may have an attaches
         * @property {Promise} loading    - EntryEditor loading process
         * @property {Element} moduleWrapper - Element that holds Module that contains an EntryEditor
         * @property {Timer} autosaving      - Autosaving Timer
         * @property {Number|null} lastSavingHash - hash of data from last saving
         */
        return class EntryEditor extends Editor {
            /**
             * @constructor
             * @param {object} params
             * @param {Element} params.holder          - where to append the CodeX Editor
             * @param {object} [params.editorSettings] - overrides for default initialization settings
             * @param {Function} [params.onReady]      - Editor ready callback
             * @param {Element} params.title            - Entry Title input
             * @param {Element} params.moduleWrapper    - Element of module that uses an EntryEditor
             * @param {module:Attaches.Attaches} params.attaches - Attaches class instance, if Editor may have an attaches
             * @param {Array} params.plugins            - List of CodeX Editor Plugins
             * @param {module:Entry.getEntryResponseFormat} params.entryData - predefined Entry's data
             */
            constructor(params){

                super(params);

                this.moduleWrapper = params.moduleWrapper;
                this.titleElement = params.title;



                /**
                 * Maximum allowed entry title length
                 * @type {Number}
                 */
                this.titleMaxLen = 120;

                /**
                 * Entry saving endpoint
                 * @type {string}
                 */
                this.saveURL = '/writing/save';

                /**
                 * Stores Attaches {@link module:Attaches#Attaches} instance, if Editor works with attaches,
                 * for example in miniEditor
                 * @type {module:Attaches.Attaches}
                 */
                this.attaches = params.attaches || null;

                /**
                 * Create an Entry exemplar with all settings
                 * @type {module:Entry.Entry}
                 */
                this.entry = new Entry(params.entryData);

                /**
                 * Entry autosaving endpoint
                 * @type {string}
                 */
                this.autosaveURL = '';
                this.autosaving = null;
                this.lastSavingHash = null;

                if (this.entry.id) {
                    this.autosaveURL = `/writing/${this.entry.id}/history/save`;
                }

                /**
                 * Fill predefined Entry's data, such as Section Id
                 */
                // if (params.entryData){
                //     this.entry.data = {
                //         data: params.entryData,
                //     };
                // }

                this.loading = Promise.all([
                        // this.entry.dataLoading, // load Entry data
                        this.editorLoading // load CodeX Editor sources
                    ])
                    .then(() => {
                        let content = this.entry.entry.blocks;

                        /**
                         * Fill Editor with the Entry data
                         */
                        super.fill({
                            items: content,
                            count: content.length
                        });

                        // // wait tools rendering
                        // setTimeout(() => {
                        //     inputs.processVisibleIn(this.moduleWrapper);
                        // }, 1500);

                        /**
                         * Handle Editor modifications to lock AJAX navigation if we have unsaved changes
                         */
                        this.unsavedChangesDetector.clear(content);
                    })
                    .then(() => {
                        this.prepareTitleInput();
                    })
                    .then(() => {
                        this.startAutosaving();
                    });

            }

            /**
             * Enable Title autoresizing and focus an Editor by enter
             */
            prepareTitleInput(){
                $.bindTextareaAutoResize( this.titleElement );

                /**
                 * Disable Enter key on title
                 */
                $.on( this.titleElement, 'keydown', event => {
                    if (event.keyCode === keys.ENTER) {
                        event.preventDefault();

                        /**
                         * Set focus at the Editor
                         */
                        super.focus(true);
                    }
                });
            }

            /**
             * Begin autosaving process
             */
            startAutosaving(){
                if ( !this.entry.id ) {
                    return;
                }

                const autoSavingInterval = 60 * 1000; // save every 60 seconds

                this.autosaving = new Timer(() => {
                    this.autoSave();
                }, autoSavingInterval );

                this.autosaving.start(undefined, false);
                console.log('entry', 'Autosaving started');

            }

            /**
             * Fills title, checkboxes with Entry data
             */
            fillForm(){

                $.val( this.titleElement, this.entry.title );

                /**
                 * Store Entry settings at the DOM elements
                 */
                let settings = this.entry.data.settings;
                for (let key in settings ){
                    if (settings.hasOwnProperty(key)) {
                        let inputs = $.findAll(this.moduleWrapper, `[name="${key}"]`);
                        inputs.forEach(input => $.val(input, settings[key]));
                    }
                }

                /**
                 * Enable custom checkboxes and radio buttons
                 */
                checkboxes.processVisibleIn(this.moduleWrapper);
                radioButtons.processVisibleIn(this.moduleWrapper);

            }

            /**
             * Save an Entry to the Edition History
             * (if something changed since last saving)
             */
            autoSave(){
                /**
                 * Stop autosaving process
                 */
                if ( this.autosaving ) {
                    console.log('entry', 'Autosaving: stopped before saving.');
                    this.autosaving.stop();
                }

                this.save({
                    url: this.autosaveURL,
                    additionalValidation: (entryData) => {
                        let hash = hashData({'blocks': entryData.entry.blocks});

                        if (hash === this.lastSavingHash){
                            throw 'Nothing changed';
                        }

                        console.log('entry', 'Autosaving: something changed, lets save an Entry');
                        return entryData;
                    }
                }).then(response => {
                    /**
                     * Update hash of saved data. Used by autosaving to check is something is changed
                     */
                    this.lastSavingHash = hashData({'blocks': response.blocks});
                    console.log('entry', 'Autosaving: history saved');

                    /**
                     * Start autosaving process
                     */
                    if ( this.autosaving ) {
                        this.autosaving.start(undefined, false);
                        console.log('entry', 'Autosaving: restarted');
                    }
                }).catch(error => {

                   console.error('entry', 'Autosaving:', error); // 'nothing changed' exception handling

                    /**
                     * Restart autosaving process
                     */
                    if ( this.autosaving ) {
                        this.autosaving.start(undefined, false);
                        console.log('entry', 'Autosaving: restarted');
                    }

                });

            }


            /**
             * Entry saving method:
             *  - save CodeX Editor
             *  - extract Title and Checkboxes
             *  - extract Attaches
             *  - validate
             *  - send to the Server
             * @param {object} [entryDataOverride]      - Entry's settings that needs to be sent
             * @param {string} [url]                    - Saving endpoint. Used to override default on autosaving
             * @param {Function} [additionalValidation] - Method to make additional validation of data before saving. Accepts an Entry's data
             * @param {boolean} [allowEmptyTitle]       - Used by 'open-full-screen' button {@link module:miniEditor#save}
             * @return {Promise<Object>}
             */
            save({entryDataOverride, url, additionalValidation, allowEmptyTitle} = {}){
                // get CodeX Editor's data
                return super.save({})
                    // mark blocks as Cover
                    .then(editorBlocks => {
                        return !this.entry.id ? this.markCoverBlocks(editorBlocks) : editorBlocks; // Only on the first saving
                    })
                    // prepare Entry data for saving
                    .then(editorData => {
                        return this.prepareEntryData(editorData, entryDataOverride || null);
                    })
                    // validation
                    .then(dataToSave => {
                        let validatedData = this.validate(dataToSave, allowEmptyTitle);

                        // accept additional validation. For example, for autosaving, checks for something was changed
                        if (typeof additionalValidation === 'function'){
                            return Promise.resolve(validatedData).then(data => {
                                return additionalValidation(data);
                            });
                        }

                        return validatedData;
                    })
                    // sending
                    .then(dataToSave => {
                        console.log('entry', 'Data to save:', dataToSave);

                        return this.send(dataToSave, url).then(response => {
                            /**
                             * Get hash from saved Editor data to handle in on checkEditorChanges
                             */
                            try {
                                let entryData = dataToSave.entry,
                                    savedBlocks = entryData.data;

                                /**
                                 * Remove unsaved-changes locker
                                 */
                                this.unsavedChangesDetector.clear(savedBlocks);

                            } catch ( e ){
                                console.log('entry', 'UnsavedChanges: cannot process saved data because of:', e);
                            }

                            return response;
                        })
                    });
            }

            /**
             * Combine CodeX Editor data and Entry settings: title, checkboxes etc
             * @param {object[]} editorBlocks           - JSON data from the CodeX Editor
             * @param {module:Entry.serverExpectedEntryDataFormat|null} [entryDataOverride] - Entry's data that used to override values extracted from the DOM
             * @return {module:Entry.serverExpectedEntryDataFormat}
             */
            prepareEntryData(editorBlocks, entryDataOverride){

                /**
                 * @type {module:Entry.getEntryResponseFormat}
                 */
                let entryData = {
                    title: '',
                    entry: null,
                    attaches: null,
                };

                /**
                 * Extract Entry settings from the DOM
                 * ==============================================
                 */
                // title
                let entryTitle = $.val( this.titleElement ) || $.attr( this.titleElement, 'default' );
                entryData.title = libString.removeUnbreakableSpaces(entryTitle);

                // settings (extract from inputs)
                let keysToExtract  = this.entry.data.settings;
                for (let key in keysToExtract){
                    if (keysToExtract.hasOwnProperty(key)) {
                        let input = $.findAll(this.moduleWrapper, `[name="${key}"]`).pop(), // can be several inputs (radio)
                            value;

                        if (input) {
                            value = $.val(input);
                            entryData[key] = value;
                        }
                    }
                }

                // Editor content
                entryData.entry = {
                    blocks: editorBlocks
                };

                // attaches
                if (this.attaches){
                    entryData.attaches = this.attaches.data;
                }

                /**
                 * Allow to force override Entry settings
                 */
                entryData = Object.assign(entryData, entryDataOverride || {});

                /**
                 * Fill the Entry exemplar with the new settings
                 * @type {module:Entry.getEntryResponseFormat}
                 */
                this.entry.data = entryData;

                return this.entry.data;
            }

            /**
             * Validate Entry data before save
             * @param {module:Entry.serverExpectedEntryDataFormat} entryData
             * @param {boolean} allowEmptyTitle - used for 'open-full-screen' button by miniEditor
             * @throws {String} - validation error message
             * @return {object}
             */
            validate(entryData, allowEmptyTitle = false) {

                /**
                 * Validate Entry Title
                 */
                let titleLen = entryData.settings.title ? entryData.settings.title.trim().length : 0;

                if ( titleLen === 0 && !allowEmptyTitle ) {
                    throw 'нет заголовка';
                } else if ( titleLen > this.titleMaxLen ) {
                    throw 'слишком большой заголовок';
                }

                // other validation stuff here...

                return entryData;
            }

            /**
             * Send Entry's saving request
             * @param {module:Entry.serverExpectedEntryDataFormat} entryData  - data for sending to the Server
             * @param {string} [url]  - saving endpoint. Used to override default Entry save URL, for ex. by autosaving
             */
            send(entryData, url) {
                return new Promise((resolve, reject) => {
                    smartAjax.post({
                        url: url || this.saveURL,
                        ignore_error_notify: true,
                        data: Object.assign(entryData, {mode: 'raw'}),
                        success: function (response) {
                            resolve(response);
                        },
                        error: function (error) {
                            reject(error);
                        }
                    });
                });
            }

            /**
             * If no one Blocks selected as a Cover, marks first Paragraph and first Media
             * @param {Array} editorData  - CodeX Editor blocks
             * @return {Array} editorData - CodeX Editor blocks
             */
            markCoverBlocks (editorData) {

                let presentCoverBlocks = editorData.filter( block => block.cover === true );

                /**
                 * If user marks something as cover, let him rule the game
                 */
                if ( presentCoverBlocks.length ){
                    return editorData;
                }

                /**
                 * This tools are media
                 * @type {Array}
                 */
                let mediaTools = [
                    'tweet',
                    'instagram',
                    'video',
                    'image',
                    'link',
                    'number',
                    'gallery'
                ];

                let firstParagraph = editorData.find( block => block.type === 'text' ),
                    firstMediaBlock = editorData.find( block => mediaTools.includes(block.type) );

                if ( firstParagraph ) {
                    firstParagraph.cover = true;
                    console.log('entry', 'First text block marked as cover:', firstParagraph);
                }

                if ( firstMediaBlock ){
                    firstMediaBlock.cover = true;
                    console.log('entry', 'First media block marked as cover:', firstMediaBlock);
                }
                
                return editorData;

            }

            destroy(){
                $.bindTextareaAutoResize(this.titleElement, false);
                $.off(this.titleElement);
                this.moduleWrapper = null;
                this.titleElement = null;
                this.attaches = null;
                this.entry = null;
                super.destroy();
            }

        }
    } );

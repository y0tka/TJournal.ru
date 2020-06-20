/**
 * «Andropov» plugin for CodeX Editor
 */
/**
 * Response after successful uploading
 *
 * @typedef {object} AndropovData
 * @property {string} type - 'link' or 'image'
 * @property {object} data
 * @property {string} render — Rendered template
 */
/**
 * @typedef {object} UniversalBox - wrapper for iframes
 * @property {string} service - "instagram"
 * @property {object} box_data
 * @property {number} box_data.version
 * @property {string} box_data.url
 * @property {string} box_data.title
 * @property {{type: string, data: AndropovImage}} box_data.image
 */
Air.defineClass(
    'class.AndropovTool',
    `lib.DOM, lib.ajax, module.andropov, module.notify`,
    function( $ , ajax, andropov, notify ) {

        'use strict';

        /**
         * Module for handling pasted URLs
         */
        return class AndropovTool {

            constructor() {
                this.wrapper = null;
                this.fetchURL = '/andropov/extract/render';
            }

            /**
             * This setting specifies list of paste-patterns configs
             * If Editor matches this pattern, it will fire callback specified by @see pastePatternParsed
             *
             * @typedef {Object} PastePattern
             * @property {RegEx} regex  - pattern to match URL that can be processed by our plugin
             *
             * @return {PastePattern[]}
             */
            static get renderOnPastePatterns() {
                return [
                    {
                        regex: /^https?:\/\/\S+/,
                    }
                ];
            }

            /**
             * Callback that will be fired when Editor matched pattern on paste
             *
             * @param  {String} stringMatched  - matched URL
             */
            pastePatternParsed(stringMatched){
                
                this.fetchInfo(stringMatched);

            }

            /**
             * Tool's required render method
             * @return {HTMLElement}
             */
            render(){

                this.wrapper = $.make('div');
                return this.wrapper;

            }

            /**
             * After pasted URL matched, query Andropov via AJAX
             * @param {string} url
             */
            fetchInfo(url){

                /**
                 * Remember block ID to replace it after AJAX will ended
                 * @type {string}
                 */
                const currentBlockId = codex.editor.content.getCurrentBlockId();

                ajax.get({
                    url: this.fetchURL,
                    data: {
                        url
                    },
                    dataType: 'json',
                    /**
                     * @param {AndropovData[]|AndropovError[]} result
                     */
                    success: ({result}) => {

                        /**
                         * Remove loader
                         */
                        // this.nodes.widgetHolder.classList.remove(CSS.widgetLoading);
                        //
                        /**
                         *
                         * @type {AndropovData}
                         */
                        let uploadedFile = result.pop();
                        if (uploadedFile.type === 'error'){
                            this.uploadError(uploadedFile.data.error_text);
                            return;
                        }

                        _log('Andropov response:', uploadedFile);

                        let newBlockData = {};

                        switch (uploadedFile.type){
                            case 'link':
                                newBlockData = {
                                    type: 'link',
                                    data: {
                                        link: uploadedFile
                                    }
                                };
                                break;
                            case 'tweet':
                                newBlockData = {
                                    type: 'tweet',
                                    data: {
                                        tweet: uploadedFile
                                    }
                                };
                                break;
                            case 'video':
                                newBlockData = {
                                    type: 'video',
                                    data: {
                                        video: uploadedFile
                                    }
                                };
                                break;
                            case 'image':
                                newBlockData = {
                                    type: 'image',
                                    data: {
                                        image: uploadedFile
                                    }
                                };
                                break;
                            case 'universalbox':
                                /**
                                 * @type {UniversalBox}
                                 */
                                let box = uploadedFile.data;
                                let subtype = box.service;

                                switch (subtype){
                                    case 'instagram':
                                        newBlockData = {
                                            type: 'instagram',
                                            data: {
                                                instagram: uploadedFile
                                            }
                                        };
                                        break;
                                    default:
                                        notify.error('Ошибка при обработке ссылки');
                                        _log('Andropov: unsupported universalbox service', subtype);
                                        let editorBlock = $.parents(this.wrapper, '.ce-block');
                                        codex.editor.content.removeBlock(editorBlock);
                                        return;
                                }

                                break;

                            default:
                                notify.error('Ошибка при обработке ссылки');
                                let editorBlock = $.parents(this.wrapper, '.ce-block');
                                codex.editor.content.removeBlock(editorBlock);
                                return;
                        }

                        codex.editor.content.oustBlock(currentBlockId, newBlockData, (block) => {
                            andropov.refresh();
                        });

                    },
                    error: msg => {
                        this.uploadError(msg);
                    }
                });

            };

            /**
             * Something went wrong during uploading
             * @param {string} msg - error text
             */
            uploadError(msg){

                _log('Andropov fetch error: ', msg );
                notify.error('Не удалось загрузить информацию об объекте');

                let editorBlock = $.parents(this.wrapper, '.ce-block');
                codex.editor.content.removeBlock(editorBlock);

            }



            destroy(){
                this.wrapper = null;
            }

        };

    }
);

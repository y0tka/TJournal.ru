/**
 * Abstract class describes Andropov File
 */
Air.defineClass('class.File',
    ``,
    function(){
        'use strict';

        /**
         * @module AndropovFile
         *
         * @typedef {AndropovFile} AndropovFile
         * @property {string} uuid - unique identifier
         */
        return class AndropovFile {

            constructor(fileData){
                this.uuid = '';

                if (fileData && fileData.uuid){
                    this.uuid = fileData.uuid;
                }
            }
        }
    }
);
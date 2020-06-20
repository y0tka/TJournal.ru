/**
 * Locks navigation if there are unsaved changes at the passed data.
 */
Air.defineClass(
    'class.UnsavedChangesDetector',
    `module.ajaxify,
    lib.console,
    fn.hashData`,
    function (ajaxify, console, hashData) {

        'use strict';

        /**
         * @module UnsavedChangesDetector
         *
         * @class UnsavedChangesDetector
         * @classdesc If there are unsaved changes in passed data, lock navigation
         */
        return class UnsavedChangesDetector {

            /**
             *
             * @param {object} params
             * @param {string} params.alertText - this text will be shown at the prompt
             */
            constructor(params){
                /**
                 * Hash from saved Editor data
                 * @type {Number}
                 */
                this.contentHash = null;

                /**
                 * This text will be shown at the prompt
                 */
                this.alertText = params.alertText;

            }

            /**
             * Updates hash with saved block
             * @param  {json} dataToCheck - any data to check, for example list of saved Editor's blocks
             */
            clear( dataToCheck ){

                if (dataToCheck) {
                    this.contentHash = hashData( dataToCheck );
                } else {
                    this.contentHash = null;
                }

                ajaxify.confirmLock(false);

                console.log('entry', 'Saved content hash updated:', this.contentHash);
                console.log('entry', 'Navigation unlocked');

            }

            /**
             * If there are unsaved changes, lock navigation. Otherwise, unlock
             * @param {*} data - data to check changes
             */
            check(data = null){

                let hash = hashData(data);

                if ( hash !== this.contentHash ) {

                    console.log('entry', 'There are unsaved changes. %o', hash, data);
                    console.log('entry', 'Navigation locked');
                    ajaxify.confirmLock(true, this.alertText);

                } else {

                    console.log('entry', 'Thats all saved. %o', hash, data);
                    console.log('entry', 'Navigation unlocked');
                    ajaxify.confirmLock(false);

                }
            }

            destroy(){
                this.clear();
            }
        }
    }
);

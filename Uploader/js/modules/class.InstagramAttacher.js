/**
 * @module InstagramAttacher
 * @description
 * Handle pasted text, extract Instagram Post Id, fetch data, compose preview
 * Used by {@link class.Attaches}
 *
 * @typedef {InstagramAttacher} module:InstagramAttacher.InstagramAttacher
 */
Air.defineClass(
    'class.InstagramAttacher',
    `class.InstagramAttach, lib.DOM, lib.ajax`,
    function( InstagramAttach, $, ajax ) {

        'use strict';

        /**
         * Attaches link on input paste
         *
         * @class
         * @classdesc Detects pasted link in input, then fetches link data and composes preview
         */
        return class InstagramAttacher {

            constructor({ attachesHolder, onRemove, onAdd }) {
                this.attachesHolder = attachesHolder;
                this.onRemove = onRemove;
                this.onAdd = onAdd;

                this.locked = false;
                this.instagramsAttached = [];
            }

            get data(){
                return this.instagramsAttached.map( instagram => instagram.data );
            }

            /**
             * Handles text pasted to the input
             * @param  {string} text  - pasted text
             * @return {Boolean}      - true if pasted text is URL
             */
            handlePastedText( text ) {

                let self = this;

                if (self.locked) {
                    _log('InstagramAttacher: fetcher is locked');
                    return false;
                }

                // let foundInstagramId = InstagramAttacher.getInstagramId(text);
                // if ( !foundInstagramId ) {
                //     _log('InstagramAttacher: pasted string is not valid URL for Instagram');
                //     return false;
                // }

                /**
                 * Compose preview
                 * @type {InstagramAttach}
                 */
                let attach = new InstagramAttach(text, true);

                /**
                 * Set removing callback if passed
                 */
                if (typeof self.onRemove === 'function') {
                    attach.onRemove = self.onRemove;
                }

                attach.appendTo(self.attachesHolder);

                /**
                 * Lock fetcher
                 * Uses to prevent multiple URL pasting
                 * @type {Boolean}
                 */
                self.locked = true;

                ajax.get({
                    url: '/andropov/extract',
                    data: {
                        url: text
                    },
                    dataType: 'json',
                    success: function( response ) {

                        let uploadedFile = response.result.pop();

                        if (uploadedFile.type === 'error'){
                            _log('InstagramAttacher got andropov error : ', uploadedFile.data.error_text);
                            attach.remove();
                            return;
                        }

                        attach.update(uploadedFile, false);

                        /**
                         * Save attachment
                         */
                        self.instagramsAttached.push(attach);

                        if (typeof self.onAdd === 'function') {
                            self.onAdd.call(this, attach);
                        }
                    },
                    error: function ( msg ){
                        _log('InstagramAttacher fetch error: ', msg );
                        attach.remove();
                    },
                    complete: () => self.locked = false
                });


                return true;

            }

            /**
             * Return Instagram Post Id by passed URL
             * @param {string} url
             * @returns {string|boolean}
             */
            static getInstagramId(url) {

                var pastedText = url.match(/http?.+instagram.com\/p\/([-a-zA-Z0-9]*)\S*/);
                return pastedText ? pastedText[1] : false;

            }

            /**
             * Remove listeners from feedback form
             * @param {Boolean} withAttaches  - need remove attaches. True by default
             */
            destroy(withAttaches = true) {

                this.onRemove = null;
                this.onAdd = null;

                if ( withAttaches ) {
                    if (this.instagramsAttached){
                        this.instagramsAttached.forEach( InstagramAttach => {
                            InstagramAttach.element.remove();
                            InstagramAttach.destroy();
                        });

                        this.instagramsAttached= [];
                    }
                }

                this.attachesHolder = null;
            }

        };

    }
);

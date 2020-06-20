/**
 * @module TwitterAttacher
 * @description Handle pasted text, extract Tweet Id, fetch data, compose preview
 * For example, used by {@link class.Attaches}
 *
 * @typedef {TwitterAttacher} module:TwitterAttacher.TwitterAttacher
 */
Air.defineClass(
    'class.TwitterAttacher',
    `class.TwitterAttach, lib.DOM, lib.ajax`,
    function( TwitterAttach, $, ajax ) {

        'use strict';

        /**
         * Attaches link on input paste
         *
         * @class
         * @classdesc Detects pasted link in input, then fetches link data and composes preview
         */
        return class TwitterAttacher {

            constructor( { attachesHolder, onRemove, onAdd }) {
                this.attachesHolder = attachesHolder;
                this.onRemove = onRemove;
                this.onAdd = onAdd;

                this.locked = false;

                this.tweetsAttached = [];
            }

            get data(){
                return this.tweetsAttached.map( tweet => tweet.data );
            }

            /**
             * Handles text pasted to the input
             * @param  {string} text  - pasted text
             * @return {Boolean}      - true if pasted text is URL
             */
            handlePastedText( text ) {

                let self = this;

                if (self.locked) {
                    _log('TwitterAttacher: fetcher is locked');
                    return false;
                }

                let foundTweetId = TwitterAttacher.isTwitterURL(text);
                if ( !foundTweetId ) {
                    _log('TwitterAttacher: pasted string is not valid URL for Twitter');
                    return false;
                }

                /**
                 * Compose preview
                 * @type {TwitterAttach}
                 */
                let attach = new TwitterAttach(null, true);

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
                    /**
                     * @param {object} response
                     * @param {AndropovTweetData[]|AndropovError[]} response.result
                     */
                    success: function( response ) {

                        let uploadedFile = response.result.pop();

                        if (uploadedFile.type === 'error'){
                            _log('TwitterAttacher got andropov error : ', uploadedFile.data.error_text);
                            attach.remove();
                            return;
                        }

                        attach.update(uploadedFile, false);

                        /**
                         * Save attachment
                         */
                        self.tweetsAttached.push(attach);

                        if (typeof self.onAdd === 'function') {
                            self.onAdd.call(this, attach);
                        }
                    },
                    error: function ( msg ){
                        _log('TwitterAttacher fetch error: ', msg );
                        attach.remove();
                    },
                    complete: () => self.locked = false
                });


                return true;

            }

            /**
             * Check is string is a Tweet URL
             * @param {string} text
             * @returns {boolean}
             */
            static isTwitterURL( text ) {

                let pastedText = text.match(/http?.+twitter.com?.+\/(\d+)$/);
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
                    if (this.tweetsAttached){
                        this.tweetsAttached.forEach( TwitterAttach => {
                            TwitterAttach.element.remove();
                            TwitterAttach.destroy();
                        });

                        this.tweetsAttached = [];
                    }
                }

                this.attachesHolder = null;
            }

        };

    }
);

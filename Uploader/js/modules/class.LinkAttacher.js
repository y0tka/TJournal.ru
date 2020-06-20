/**
 * @module LinkAttacher
 * @description Detects pasted URL, fetch data from the Server and render attached link widget
 *
 * @typedef {LinkAttacher} module:LinkAttacher.LinkAttacher
 * @property {Element} input                       - original input
 * @property {Element} attachesHolder              - attaches zone
 * @property {Function} onRemove                   - attach removing callback
 * @property {module:Attach_Link.LinkAttach[]} linksAttached    - array of attached links
 * @property {Boolean} locked                      - fetcher locked state
 *
 * Binds on input, detects paste, fetches data, composes preview
 * For example, used by module.miniEdior
 */

/**
 * Andropov uploading response
 *
 * @typedef {object} AndropovResponse
 * @property {AndropovData[]|AndropovError[]} result
 */

/**
 * Response in case of Error
 *
 * @typedef {object} AndropovError
 * @property {string} type - "error"
 * @property {object} data
 * @property {string} data.error_text
 */

/**
 * Response after successful uploading
 *
 * @typedef {object} AndropovData
 * @property {string} type - 'link' or 'image'
 * @property {PageData|ImageFileData|UniversalBox} data
 * @property {string} render — Rendered template
 */

/**
 * URL data extracted
 *
 * @typedef {object} PageData
 * @property {string} url           - "https:\/\/meduza.io\/feature\/2018\/04\/24\/rossiyskie-televidenie-proignorirovalo-protesty-v-erevane-no-smenu-vlasti-ob-yavilo-normalnoy",
 * @property {string} title         - "Российское телевидение проигнорировало протесты в Ереване, но смену власти объявило нормальной: «В Армении „западенцев“ нет», «это не антироссийский переворот»",
 * @property {string} description   - "23 апреля премьер-министр Армении Серж Саргсян, который до этого 10 лет руководил страной, ушел в отставку. Он выполнил требование оппозиции, которая 10 дней проводила многотысячные митинги, добиваясь сменяемости власти. Российские телеканалы до самого последнего дня игнорировали протесты в Армении, а о «бархатной революции» рассказали как о нейтральном для России событии. При этом по телевизору продолжают в ежедневном режиме обсуждать события на Украине, постоянно напоминая о Евромайдане. Вот что рассказали российским телезрителям о «бархатной революции» в Е��еване.",
 * @property {AndropovData} image  - cover image
 */

/**
 * Andropov Image data
 *
 * @typedef {object} ImageFileData
 * @property {ExternalService} external_service
 * @property {number} height          - 528
 * @property {number} width           - 1200
 * @property {number} size            - 216302 (in bytes)
 * @property {string} type            - "jpg"
 * @property {string} uuid            - ID from Leonardo. "6e14fca6-ec3e-47e7-a1b1-ed67edade33b" . May contain full URL for an old images.
 */

Air.defineClass(
    'class.LinkAttacher',
    `class.LinkAttach, lib.DOM, lib.ajax, lib.string, module.notify`,
    function( LinkAttach, $, ajax, libString, notify ) {

        'use strict';

        /**
         * Attaches link on input paste
         *
         * @class
         * @classdesc Detects pasted link in input, then fetches link data and composes preview
         */
        return class LinkAttacher {

            /**
             * LinkAttacher constructor
             *
             * @param  {Element|null} input     - input to paste link.
             *                                    You can attach paste-event handler manually to any input.
             *                                    See example {@link module:miniEditor#appendControls} on the title
             *
             * @param  {Element} attachesHolder - Element to put link preview
             * @param  {Function} onRemove      - Link attach removing handler
             * @param  {Function} onAdd         - Link attach addition handler
             */
            constructor({input, attachesHolder, onRemove, onAdd}) {

                this.input = input;
                this.attachesHolder = attachesHolder;
                this.onRemove = onRemove;
                this.onAdd = onAdd;
                this.locked = false;

                if (this.input) {
                    $.on(this.input, 'paste.LinkAttacher', (event) => this.inputPasteCallback(event) );
                }

                this.linksAttached = [];

            }

            /**
             * Link attacher getter
             * Returns an array of attached links data
             * @fires LinkAttach.data
             * @return {Array.<>}
             */
            get data(){
                return this.linksAttached.map( attach => attach.data );
            }

            /**
             * Paste handler. Detects URLs pasting
             * @param  {ClipboardEvent} event
             */
            inputPasteCallback(event) {

                let input = event.target,
                    self = this;

                setTimeout(function() {
                    self.handlePastedText.call(self, input.value);
                }, 50);

            }

            /**
             * Handles text pasted to the input
             * @param  {string} text  - pasted text
             * @return {Boolean}      - true if pasted text is URL
             */
            handlePastedText( text ){

                var self = this;

                if (self.locked) {
                    _log('LinkAttacher: fetcher is locked');
                    return false;
                }

                if (!libString.isURL(text)) {
                    _log('LinkAttacher: pasted string is not valid URL');
                    return false;
                }
                
                console.log('Preview data text',  text);

                /**
                 * Compose preview
                 * @type {LinkAttach}
                 */
                let attach = new LinkAttach({
                    isPreview: true
                });

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
                this.locked = true;

                ajax.get({
                    url: '/andropov/extract/render',
                    data: {
                        url: text
                    },
                    dataType: 'json',
                    /**
                     * Andropov response
                     * @param {AndropovResponse} response
                     */
                    success: function( response ) {

                        console.log('response', response);

                        let lastItem = response.result.pop();

                        /**
                         * Andropov Error handling
                         */
                        if (lastItem.type === "error") {
                            _log('LinkAttacher fetch error: ', msg );
                            notify.show( {
                                type: 'error',
                                message: 'Не удается получить данные о ссылке',
                            } );
                            attach.remove();
                            return;
                        }

                        /**
                         * Update preview with fetched data
                         */
                        attach.update({
                            link: lastItem
                        });

                        /**
                         * Save attachment
                         */
                        self.linksAttached.push(attach);

                        if (typeof self.onAdd === 'function') {
                            self.onAdd.call(this, attach);
                        }

                        /**
                         * Show warning when that link was previously published
                         */
                        if (response.duplicate_entry_id > 0) {
                            notify.show( {
                                type: 'warning',
                                message: 'Ссылка ранее использовалась в <a href="'+ document.location.protocol + '//' + document.location.hostname + '/' + response.duplicate_entry_id +'">другой статье</a>',
                            } );
                        }
                    },
                    error: function ( msg ){
                        _log('LinkAttacher fetch error: ', msg );
                        attach.remove();
                    },
                    complete: () => self.locked = false
                });

                return true;

            }

            /**
             * Remove listeners from feedback form
             * @param {Boolean} withAttaches  - need remove attaches. True by default
             */
            destroy(withAttaches = true) {

                $.off(this.input, 'paste.LinkAttacher');

                this.input = null;
                this.onRemove = null;
                this.onAdd = null;

                if ( withAttaches ) {
                    if (this.linksAttached){
                        this.linksAttached.forEach( linkAttach => {
                            linkAttach.element.remove();
                            linkAttach.destroy();
                        });

                        this.linksAttached = [];
                    }
                }

                this.attachesHolder = null;
            }

        };

    }
);

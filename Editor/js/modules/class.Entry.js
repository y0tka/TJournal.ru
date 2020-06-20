/**
 * @module Entry
 */
 /**
 * @typedef {object} module:Entry.serverExpectedEntryDataFormat
 * @description /writing/save  Server expected format
 * @property {string} entry     - JSON-stringified Editor data wrapper in 'data' field
 * @property {[]|null} attaches - list of Attaches
 * @property {object} settings  - all Entry settings and checkboxes
 *
 */
/**
 * @typedef {object} module:Entry.getEntryResponseFormat
 * @description Server returns Entry data via <air-settings> at the entryData in this format
 * @property {number|null} id                       - Entry id
 * @property {string|null} custom_style             - CSS for custom island style
 * @property {number}   date                        - entry creation date (1469558377)
 * @property {string}   date_str                    - stringified creation date ("26-07-2016 21:39")
 * @property {object}   entry                       - content
 * @property {array}    entry.blocks                - CodeX Editor blocks
 * @property {number}   forced_to_mainpage          - 1|0
 * @property {boolean}  is_advertisement            - false
 * @property {boolean}  is_clean_cover              - false
 * @property {boolean}  is_disabled_best_comments   - false
 * @property {boolean}  is_disabled_comments        - false
 * @property {boolean}  is_disabled_likes           - false
 * @property {boolean}  is_published                - true
 * @property {boolean}  is_enabled_amp              - true
 * @property {boolean}  is_enabled_instant_articles - true
 * @property {number}   is_holdonflash              - 0
 * @property {boolean}  is_holdonmain               - false
 * @property {boolean}  is_show_thanks              - false
 * @property {boolean}  is_still_updating           - false
 * @property {boolean}  is_wide                     - false
 * @property {boolean}  locked_by_admin             - false
 * @property {number}   modification_date           - 1479308623
 * @property {string}   modification_date_str       - "16-11-2016 18:03"
 * @property {string}   path                        - "hello-gamedev"
 * @property {boolean}  removed                     - false
 * @property {array}    similar                     - []
 * @property {number}   subsite_id                  - Subsite's id (2)
 * @property {number}   subsite_name                - Subsite's readable name (Gamedev)
 * @property {boolean}  title                       - "Никогда такого не было – и снова DTF"
 * @property {string}   url                         - "http://v.dtf.osnova.io/unknown/1-hello-gamedev"
 * @property {number}   user_id                     - 1*
 * @property {boolean}  is_editorial                - Материал редакции
 */
Air.defineClass(
    'class.Entry',
    `lib.date, lib.console,
    module.smart_ajax, module.modal_window, module.notify`,
    /**
     * @param {module:date} libDate
     * @param {module:smartAjax} smartAjax
     * @param {module:modalWindow} modalWindow
     * @param {module:notify} notify
     * @returns {{new(): Entry}}
     */
    function(
        libDate, console,
        smartAjax, modalWindow, notify
    ) {

        'use strict';


        /**
         * Entry data type
         *
         * @typedef {Entry} module:Entry.Entry
         */
        return class Entry {
            /**
             * @constructor
             * @param {module:Entry.getEntryResponseFormat} [entryData] - on editing stores entry data,
             *                                                            on creation may store subsite id
             */
            constructor(entryData){

                this.id = 0;
                this.type = 0;
                this.title = '';
                this.entry = {
                    blocks : []
                };
                this.date = '';
                this.modification_date = '';
                this.forced_to_mainpage = 0;
                this.is_published = false;
                this.is_advertisement = false;
                this.is_enabled_instant_articles = false;
                this.is_enabled_amp = true;
                this.is_disabled_likes = false;
                this.is_disabled_best_comments = false;
                this.is_disabled_comments = false;
                this.is_still_updating = false;
                this.is_approved_for_public_rss = false;
                this.is_show_thanks = false;
                this.is_clean_cover = false;
                this.locked_by_admin = false;
                this.external_access = '';
                this.path = '';
                this.subsite_id = 0;
                this.subsite_name = '';
                this.removed = false;
                this.similar = '';
                this.user_id = 0;
                this.is_wide = false;
                this.access_link = '';
                this.is_closed_editing = '';
                this.withheld = ''; // set 'ru' to hide entry for Russia
                this.custom_style = '';
                this.is_holdonmain = false;
                this.is_holdonflash = false;
                this.is_editorial = true;

                /**
                 * Attaches added with MiniEditor
                 * @type {array|null}
                 */
                this.attaches = null;

                /**
                 * If we have an Entry data, fill the model
                 */
                if (entryData){
                    this.data = entryData;
                }

                // /**
                //  * Entry loading sequence
                //  */
                // this.dataLoading = this.loadEntry().catch(err => {
                //     _log('Can not setup an EntryEditor:', err);
                //     notify.error('Не удалось загрузить данные статьи. Попробуйте обновить страницу.')
                // });

            }

            /**
             * Load Entry's data from the Server
             *
             * @return {Promise<object>}
             */
            loadEntry(){
                if (!this.id){
                    return Promise.resolve({});
                }

                return new Promise((resolve, reject) => {
                    smartAjax.get( {
                        url: '/writing/get/' + this.id,
                        ignore_error_notify: true,
                        success: function( response ) {
                            resolve(response);
                        },
                        error: function( error ) {
                            reject(error);
                        }
                    } );
                });
            }

            /**
             * Convert server-formatted Entry's data for the client
             * @param {module:Entry.getEntryResponseFormat} loadedData
             */
            set data (loadedData) {
                console.log('entry', 'class.Entry setter got data:', loadedData);

                /**
                 * Save passed settings to the class properties
                 */
                for (let field in loadedData){
                    if (loadedData.hasOwnProperty(field) && this[field] !== undefined){
                        this[field] = loadedData[field];
                    }
                }

                /**
                 *  Coverts date string from DD-MM-YYYYTMM:SS(:sss) to YYYY-MM-DDTMM:SS(:sss) format
                 */
                this.date_str = loadedData.date_str ? libDate.littleToBigEndian(loadedData.date_str) : null;
                this.modification_date_str = loadedData.modification_date_str ? libDate.littleToBigEndian(loadedData.modification_date_str) : null;

                /**
                 * Attaches added with MiniEditor
                 * @type {array|null}
                 */
                this.attaches = loadedData.attaches || null;

            }

            /**
             * Entry data in the Server-expected format
             *
             * @return {serverExpectedEntryDataFormat}
             */
            get data(){

                let settings = {};

                Object.getOwnPropertyNames(this).forEach( field => {

                    if (field === 'dataLoading'){
                        return;
                    }

                    /**
                     * Entry data and attaches goes outside settings as 'entry' {@link serverExpectedEntryDataFormat}
                     */
                    if (field === 'entry' || field === 'attaches') {
                        return;
                    }

                    /**
                     * Fill entry settings
                     */
                    if (this[field] !== undefined) {
                        settings[field] = this[field];
                    }
                });

                if (this.date_str) {
                    /**
                     * Covert 14-05-2016 13:13 (HTML format) to 2016-05-14 13:13 (Backend format)
                     */
                    settings.date_str = libDate.bigToLittleEndian(this.date_str);
                }

                return {
                    entry: this.entry,
                    attaches: this.attaches,
                    settings: settings
                }
            }

            /**
             * Remove current Entry
             * @fires module:modalWindow#show
             * @return {Promise<*>}
             */
            remove(){
                return new Promise((resolve, reject) => {
                    modalWindow.show({
                        name: 'remove',
                        onClose: (status) => {
                            if (!status) {
                                reject('declined');
                                return;
                            }
                            this.request('remove').then(()=>{
                                notify.success( 'Материал удален' );
                                resolve();
                            }).catch(error => {
                                reject(error);
                            });
                        }
                    });
                });
            }

            /**
             * Restore current Entry
             * @fires module:modalWindow#show
             * @return {Promise<*>}
             */
            restore(){
                return this.request('restore').then(()=>{
                    notify.success( 'Материал восстановлен' );
                });
            }

            /**
             * Send request for the Remove or Restore an Entry
             * @private
             * @param {string} action - remove|restore
             * @return {Promise}
             */
            request(action){
                return new Promise((resolve, reject) => {
                    smartAjax.post( {
                        url: '/writing/' + this.id + '/' + action,
                        success: function(response) {
                            resolve(response);
                        },
                        error: function( error ) {
                            reject(error);
                        }
                    } );
                });
            }

            /**
             * Sends mobile or web push
             *
             * @param {string} url
             * @param {object} payload
             * @param {string} payload.title
             * @param {string} payload.text
             * @param {string} payload.url
             * @param {string} [payload.icon]  - for web pushes
             * @param {boolean} [payload.is_enabled_mobile_push_sound] - only for mobile
             */
            push( url, payload ) {

                let pushRequest = (endpoint, data) => new Promise((resolve, reject) => {
                    smartAjax.post({
                        url: endpoint,
                        data: {values: data},
                        ignore_error_notify: true,
                        success: function() {
                            notify.success('Пуш-уведомление отправлено');
                            resolve();
                        },
                        error: function( error ) {
                            notify.error('Не удалось отправить пуш (' + error + ')');
                            reject(Error(error));
                        }
                    });
                });

                /**
                 * If sound checkbox enabled, show confirmation window
                 */
                if (payload.is_enabled_mobile_push_sound) {
                    return new Promise((resolve, reject) => {
                        modalWindow.show({
                            name: 'push_with_sound',
                            onClose: (status) => {
                                if (!status) {
                                    notify.error('Мудрое решение.');
                                    reject(Error('declined'));
                                } else {
                                    resolve(pushRequest(url, payload));
                                }
                            }
                        });
                    });
                } else {
                    return pushRequest(url, payload);
                }
            }

            /**
             * Unpublish an Entry
             */
            unpublish() {
                return new Promise((resolve, reject) => {
                    modalWindow.show({
                        name: 'unpublish',
                        onClose: (status, data) => {
                            if (!status) {
                                reject('declined');
                                return;
                            }
                            smartAjax.post({
                                url: '/content/unpublish/' + this.id,
                                data: {
                                    reason_text: data.reason_text,
                                    reason_id: 0
                                },
                                success: () => {
                                    notify.success('Статья распубликована');
                                    resolve();
                                },
                                error: (error) => {
                                    reject(error);
                                }
                            });
                        }
                    });
                });
            }

            /**
             * Unforce (hide from the main page)
             * @param id
             * @param callback
             */
            hideFromMain() {
                return new Promise((resolve, reject) => {
                    modalWindow.show({
                        name: 'confirm',
                        data: {
                            title: 'Не выводить?',
                            text: 'Убрать публикацию с главной, так как она на самом деле тупак?',
                            button_yes: 'Да',
                            button_no: 'Нет'
                        },
                        onClose: (status) => {
                            if (!status) {
                                reject('declined');
                                return;
                            }
                            smartAjax.post({
                                url: '/content/unforce/' + this.id,
                                data: {},
                                success: function () {
                                    notify.success('Тупак убран с главной');
                                    resolve();
                                },
                                error: function (error) {
                                    reject();
                                }
                            })

                        }
                    });
                });
            };

        }

    } );

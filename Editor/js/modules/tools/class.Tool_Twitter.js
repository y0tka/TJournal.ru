/**
 * «Twitter» plugin for CodeX Editor
 * ========================================
 */


/**
 * @typedef {object} TwitterToolData
 * @property {boolean} media            - has media content
 * @property {boolean} conversation     - has replies
 * @property {AndropovTweetData} tweet  - tweet data got from Andropov
 * @property {string} title             - caption
 *
 *
 */

/**
* @typedef {object} AndropovTweetData
* @property {string} type   - "tweet"
* @property {string} render - HTML template
* @property {object} data
* @property {Tweet}  data.tweet_data - any tweet info
 *@property {string} data.tweet_data_encoded - tweet info in base64 to for checking signature
* @property {string} data.signature - used to validate that tweet_data_encoded was created by Andropov
*/

/**
 * @typedef {object} AndropovError
 * @property {string} type - "error"
 * @property {object} data
 * @property {string} data.error_text
 */

/**
 * Tweet info type definition
 * @see  https://developer.twitter.com/en/docs/tweets/data-dictionary/overview/tweet-object
 *
 * @typedef {Object} Tweet
 * @property {Number}      id
 * @property {String}      id_str
 * @property {String}      text
 * @property {*}           contributors
 * @property {*}           coordinates
 * @property {String}      created_at          - "Fri Sep 29 09:48:07 +0000 2017"
 * @property {Object}      entities            - {hashtags: [], media: [], symbols: [], urls: [], user_mentions: []}
 * @property {Object}      extended_entities
 * @property {Object[]}    extended_entities.media
 * @property {Number}      favorite_count
 * @property {Boolean}     favorited
 * @property {*}           geo
 * @property {*}           in_reply_to_screen_name
 * @property {*}           in_reply_to_status_id
 * @property {*}           in_reply_to_status_id_str
 * @property {*}           in_reply_to_user_id
 * @property {*}           in_reply_to_user_id_str
 * @property {Boolean}     is_quote_status
 * @property {String}      lang
 * @property {*}           place
 * @property {Boolean}     possibly_sensitive
 * @property {Boolean}     possibly_sensitive_appealable
 * @property {Number}      retweet_count
 * @property {Boolean}     retweeted
 * @property {String}      source
 * @property {Boolean}     truncated
 * @property {TwitterUser} user
 */

/**
 * Twitter User type definition
 * @see  https://developer.twitter.com/en/docs/tweets/data-dictionary/overview/user-object
 *
 * @typedef {Object} TwitterUser
 * @property {Boolean}  contributors_enabled               - false
 * @property {String}   created_at                         - "Thu Feb 04 21:57:18 +0000 2010"
 * @property {Boolean}  default_profile                    - false
 * @property {Boolean}  default_profile_image              - false
 * @property {String}   description                        - "I rap in Russian. ↵CEO Booking Machine↵https://t.co/T2FHkK5PUP ↵https://t.co/De9gGjivjc https://t.co/rjnsIpjHRi  https://t.co/MkgiTiQwjQ↵https://t.co/BBYNWuqhu0"
 * @property {Object}   entities                           - {url: {…}, description: {…}}
 * @property {Number}   favourites_count                   - 5193
 * @property {Boolean}  follow_request_sent                - false
 * @property {Number}   followers_count                    - 1106474
 * @property {Boolean}  following                          - false
 * @property {Number}   friends_count                      - 209
 * @property {Boolean}  geo_enabled                        - true
 * @property {Boolean}  has_extended_profile               - false
 * @property {Number}   id                                 - 111425302
 * @property {String}   id_str                             - "111425302"
 * @property {Boolean}  is_translation_enabled             - false
 * @property {Boolean}  is_translator                      - false
 * @property {String}   lang                               - "ru"
 * @property {Number}   listed_count                       - 1004
 * @property {String}   location                           - "London / СПб"
 * @property {String}   name                               - "Oxxxymiron"
 * @property {Boolean}  notifications                      - false
 * @property {String}   profile_background_color           - "022330"
 * @property {String}   profile_background_image_url       - "http://pbs.twimg.com/profile_background_images/589070213234102273/6Xg_cM0d.png"
 * @property {String}   profile_background_image_url_https - "https://pbs.twimg.com/profile_background_images/589070213234102273/6Xg_cM0d.png"
 * @property {Boolean}  profile_background_tile            - true
 * @property {String}   profile_banner_url                 - "https://pbs.twimg.com/profile_banners/111425302/1496929655"
 * @property {String}   profile_image_url                  - "http://pbs.twimg.com/profile_images/588386549487636482/EEZgS-sX_normal.jpg"
 * @property {String}   profile_image_url_https            - "https://pbs.twimg.com/profile_images/588386549487636482/EEZgS-sX_normal.jpg"
 * @property {String}   profile_link_color                 - "3B94D9"
 * @property {String}   profile_sidebar_border_color       - "A8C7F7"
 * @property {String}   profile_sidebar_fill_color         - "C0DFEC"
 * @property {String}   profile_text_color                 - "333333"
 * @property {Boolean}  profile_use_background_image       - true
 * @property {Boolean}  protected                          - false
 * @property {String}   screen_name                        - "norimyxxxo"
 * @property {Number}   statuses_count                     - 11255
 * @property {String}   time_zone                          - "London"
 * @property {String}   translator_type                    - "none"
 * @property {String}   url                                - "https://t.co/R0L0MY0SRl"
 * @property {Number}   utc_offset                         - 0
 * @property {Boolean}  verified                           - true
 */


Air.defineClass(
    'class.TwitterTool',
    `lib.DOM, module.notify, lib.ajax, module.andropov`,
    function( $, notify, ajax, andropov ) {

        'use strict';

        /**
         * Class names
         */
        var CSS = {
            /**
             * Base classes
             */
            baseToolClass: 'cdx-tool',
            input: 'cdx-input',

            wrapper       : 'twitter-tool',
            widgetHolder  : 'twitter-tool__widget',
            widgetLoading : 'twitter-tool__widget--loading',
            title       : 'twitter-tool__title',

            settings  : {
                holder     : 'cdx-plugin-settings',
                buttons    : 'cdx-plugin-settings__item',
                activeType : 'cdx-plugin-settings__item--active'
            },

            setStyleButton: 'twitter-tool__button-style'
        };

        /**
         * Available block settings
         * @type {Object}
         */
        var settings = [
            {
                type: 'media',
                title: 'Показывать медиа',
                icon: 'tweet-media',
                enabled: 'visible',
                disabled: 'hidden',
                default: true
            },
            {
                type: 'conversation',
                title: 'Показывать беседу',
                icon: 'tweet-conversation',
                enabled: 'all',
                disabled: 'none',
                default: false
            },
        ];

        /**
         * Quote base class
         *
         * @module TwitterTool
         *
         * @typedef {TwitterTool} TwitterTool
         * @property {Object} nodes
         * @property {Element} nodes.wrapper
         * @property {Element} nodes.widgetHolder
         * @property {Element} nodes.title
         * @property {Object}  _data
         * @property {Boolean} _data.media          - is need to show media attaches (images, video etc)
         * @property {Boolean} _data.conversation   - is need to show conversation
         * @property {String}  _data.title          - Caption under widget
         * @property {AndropovTweetData}  _data.tweet
         */
        return class TwitterTool {

            /**
             * Quote item class
             *
             * @constructor
             *
             */
            constructor() {

                /**
                 * UI nodes cache
                 * @type {Object}
                 */
                this.nodes = {
                    wrapper: null,
                    widgetHolder: null,
                    title: null,
                    settings: []
                };

                /**
                 * Path to request tweet info and rendered template by URL
                 * @type {String}
                 */
                // this.fetchURL = '/andropov/extract/render';

                /**
                 * Data available with getter 'data'
                 * @type {Tweet}
                 */
                this._data = {
                    media: settings.find( item => item.type === 'media').default,
                    conversation: settings.find( item => item.type === 'conversation').default,
                    tweet: null,
                    title: null
                };
            }

            /**
             * Tool type
             * @return {string}
             */
            static get type(){
                return 'tweet';
            }

            /**
             * Tool title. Uses in toolbar hover helper
             * @return {string}
             */
            static get title(){
                return 'Твит';
            }

            /**
             * Is need to display in toolbox
             * @return {Boolean}
             */
            static get displayInToolbox(){
                return false;
            }

            /**
             * Enable to showing inline toolbar
             * @return {Boolean}
             */
            static get inlineToolbar() {
                return true;
            }

            /**
             * For plugins that can be rendered by pasting URL in the Editor
             * (in the tool that enable allowRenderOnPaste setting, for example, Paragraph)
             *
             * This setting specifies list of paste-patterns configs
             * If Editor matches this pattern, it will fire callback specified by @see pastePatternParsed
             *
             * @typedef {Object} PastePattern
             * @property {RegEx} regex  - pattern to match URL that can be processed by our plugin
             * @property {String} type  — type of matched service. Useful when plugin can process several patterns
             *
             * @return {PastePattern[]}
             */
            // static get renderOnPastePatterns() {
            //     return [
            //         {
            //             regex: /^https?:\/\/(?:mobile\.)?twitter\.com\/(?:#!\/)?(\w+)\/status(?:es)?\/(\d+)(?:\/.*)?$/,
            //             type: 'twitter'
            //         }
            //     ];
            // }

            /**
             * Plugins preparation
             * @return {Promise}
             */
            static prepare(){
                return Promise.resolve();
            }

            /**
             * Makes HTML node with passed data
             * @param {TwitterToolData} tweetData
             * @return {Element}
             */
            render( tweetData ){

                /**
                 * Make UI
                 */
                this.nodes.wrapper = $.make('div', [CSS.wrapper, CSS.baseToolClass]);
                this.nodes.widgetHolder = $.make('div', [CSS.widgetHolder]);
                this.nodes.title = $.make('div', [CSS.input, CSS.title], {
                    contentEditable: true
                });

                /**
                 * Placeholder for quote text
                 */
                this.nodes.title.setAttribute('data-placeholder', 'Подпись');

                /**
                 * Append created nodes
                 */
                this.nodes.wrapper.appendChild(this.nodes.widgetHolder);
                this.nodes.wrapper.appendChild(this.nodes.title);

                /**
                 * Store data
                 */
                if (Object.keys(tweetData).length) {
                    this.tweet = tweetData.tweet;
                    this.title = tweetData.title;
                    this.media = tweetData.media;
                    this.conversation = tweetData.conversation;
                }


                return this.nodes.wrapper;
            }

             /**
             * Callback that will be fired when Editor matched pattern on paste
             * @see renderOnPastePatterns
             *
             * @param  {String} stringMatched  - matched URL
             */
            // pastePatternParsed(stringMatched){
            //
            //     this.fetchInfo(stringMatched);
            //
            // }

            /**
             * Requests tweet info from the server crawler
             * @param  {String} tweetURL
             */
            // fetchInfo(tweetURL){
            //
            //     /**
            //      * Add loader
            //      */
            //     this.nodes.widgetHolder.classList.add(CSS.widgetLoading);
            //
            //     ajax.get({
            //         url: this.fetchURL,
            //         data: {
            //             url: tweetURL
            //         },
            //         dataType: 'json',
            //         /**
            //          * @param {object} response
            //          * @param {AndropovTweetData[]|AndropovError[]} response.result
            //          */
            //         success: (response) => {
            //
            //             /**
            //              * Remove loader
            //              */
            //             this.nodes.widgetHolder.classList.remove(CSS.widgetLoading);
            //
            //             let uploadedFile = response.result.pop();
            //
            //             if (uploadedFile.type === 'error'){
            //                 this.uploadError(uploadedFile.data.error_text);
            //                 return;
            //             }
            //
            //             /**
            //              * Save parsed data and render widget
            //              */
            //             this.tweetFetchCallback(uploadedFile);
            //         },
            //         error: msg => {
            //
            //             this.uploadError(msg);
            //
            //         }
            //     });
            // }

            /**
             * Something went wrong during uploading
             * @param {string} msg - error text
             */
            // uploadError(msg){
            //
            //     _log('Tweet fetch error: ', msg );
            //     notify.error('Не удалось загрузить информацию о твите');
            //
            //     let editorBlock = $.parents(this.nodes.wrapper, '.ce-block');
            //     codex.editor.content.removeBlock(editorBlock);
            //
            // }

            /**
             * Tweet info fetched form the Andropov
             *
             * @param {AndropovTweetData} tweetData
             */
            // tweetFetchCallback(tweetData){
            //
            //     if ( !tweetData.data || !tweetData.data.tweet_data_encoded ) {
            //         notify.error('Что-то не так с этим твитом. Попробуйте еще раз.');
            //         return;
            //     }
            //
            //     this.tweet = tweetData;
            // }

            /**
             * Renders tweet widget rendered by Andropov
             * @param {string} html - rendered Andropov tweet
             */
            renderWidget(html){
                this.nodes.widgetHolder.innerHTML = html;

                /**
                 * Handle rendered template
                 */
                setTimeout(function () {
                    andropov.refresh();
                }, 100);
            }

            /**
             * Tool settings renderer
             * @uses  quoteStyles  - dictionary with avalable quote sizes
             */
            makeSettings(){

                var holder  = $.make('div', [CSS.settings.holder]);

                settings.forEach( option => {

                    /**
                     * We dont need a 'Show parent reply' button, if there is no parent
                     */
                    if (!this._data.tweet.data.tweet_data.in_reply_to_status_id_str && option.type === 'conversation') {
                        return;
                    }

                    let optionButton = $.make('div', [
                            CSS.settings.buttons,
                            CSS.setStyleButton + '--' + option.type,
                        ], {
                            title: option.title
                        }),
                        icon = $.svg(option.icon, 14, 14);

                    optionButton.appendChild(icon);
                    optionButton.appendChild(document.createTextNode(option.title));
                    optionButton.dataset.type = option.type;

                    if (this._data[option.type] === true) {
                        optionButton.classList.add(CSS.settings.activeType);
                    }

                    optionButton.addEventListener('click', () => {
                        this.toggleOption(option);
                    }, false);

                    holder.appendChild(optionButton);

                    /**
                     * Save created button to this.nodes.styleButtons
                     */
                    this.nodes.settings.push(optionButton);

                });

                return holder;

            }

            /**
             * Enable/Disable tweet view option (show media/conversation)
             * @param  {Object} option
             * @param  {String} option.type          - 'media' or 'conversation'
             */
            toggleOption(option){

                let oldValue = this._data[option.type],
                    newValue = !oldValue;

                this[option.type] = newValue;

            }

            /**
             * Saving data validation
             * @param  {TwitterToolData} data
             * @return {Boolean}
             */
            validate( data ){

                if (!data || !Object.keys(data).length) {
                    return false;
                }

                if ( !data.tweet || !Object.keys(data.tweet).length) {
                    return false;
                }

                return true;
            }

            /**
             * Extracts and returns quote data
             * @return {tweet, title, media, conversation}
             */
            get data(){

                /**
                 * Extract data from HTML
                 */
                this.extractEditableData();

                return this._data;

            }

            /**
             * Stores tweet info
             * @param {AndropovTweetData} tweet
             */
            set tweet(tweet){

                /**
                 * @type {AndropovTweetData}
                 */
                this._data.tweet = tweet;
                _log("Tweet data was updated", this._data);

                /**
                 * Update widget
                 */
                if (tweet && tweet.render){
                    this.renderWidget(tweet.render);
                }
            }

            /**
             * Toggle 'show media' option
             * @param {boolean} val
             */
            set media(val){
                this._data.media = val;
                this.updateSettingsButtons();
                _log("Tweet data was updated", this._data);
            }

            /**
             * Toggle 'show conversation' option
             * @param {boolean} val
             */
            set conversation(val){
                this._data.conversation = val;
                this.updateSettingsButtons();
                _log("Tweet data was updated", this._data);
            }

            /**
             * Store title (caption)
             * @param {string} val
             */
            set title(val){
                this._data.title = val || '';
                _log("Tweet data was updated", this._data);

                if (val && this.nodes.title) {
                    this.nodes.title.innerHTML = val || '';
                }
            }

            /**
             * Update settings buttons to correspond with _data
             */
            updateSettingsButtons(){
                /**
                 * Update settings buttons
                 */
                if (this.nodes.settings.length) {
                    settings.forEach( option => {
                        let button = this.nodes.settings.find( btn => {
                            return btn.dataset.type === option.type;
                        });

                        if (!button) {
                            return;
                        }

                        if (this._data[option.type] === true) {
                            button.classList.add(CSS.settings.activeType);
                        } else {
                            button.classList.remove(CSS.settings.activeType);
                        }
                    });
                }
            }

            /**
             * Extracts data from HTML
             * Updates this._data property
             */
            extractEditableData() {

                /**
                 * Content editable fields or inputs
                 * @type {Object}
                 */
                let fieldsWithHTML = {
                    title: this.nodes.title
                };

                /**
                 * Sanitizer module config
                 * @type {Object}
                 */
                let sanitizerConfig = {
                    tags : {
                        a: {
                            href: true,
                            target: '_blank',
                            rel: 'nofollow'
                        },
                        b: {},
                        i: {},
                        p: {},
                        mark: el => el.classList.contains('cdx-marked-text'),
                        span: el => el.classList.contains('cdx-marked-text'),
                    }
                };

                for ( let field in fieldsWithHTML ){
                    let value = fieldsWithHTML[field].innerHTML || fieldsWithHTML[field].value;

                    if ( value ) {
                        value = value.trim();
                        value = codex.editor.sanitizer.clean(value, sanitizerConfig , true);
                    }

                    this._data[field] = value || '';
                }
            }

            /**
             * Extract tool's data from HTML block
             * @param {Element} wrapper - better to save data by this Node for correct CMD+Z behaviour
             * @return {Object}
             */
            save(wrapper){
                return Promise.resolve().then(() => {
                    this.nodes.title = $.find(wrapper, `.${CSS.title}`);
                    return this.data;
                });
            }

            destroy(){

                this.nodes.settings.forEach( button => $.off(button) );

                this.nodes = {
                    wrapper: null,
                    widgetHolder: null,
                    title: null,
                    settings: []
                };

                this.style = null;

                this._data = {
                    media: null,
                    conversation: null,
                    tweet: null,
                    title: null
                };
            }

        };

    }
);

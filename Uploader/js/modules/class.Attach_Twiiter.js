/**
 * Twitter Attach for Attaches
 */
Air.defineClass(
    'class.TwitterAttach',
    'class.Attach, lib.DOM, lib.string',
    function( Attach, $, libString ) {

        'use strict';

        const TITLE_MAX_LENGTH = 35;

        /*
        * Class names
        */
        var CSS = {
            attachedTweet : 'attachment--tweet',
            attachedTweetLoading : 'attachment--tweet--loading',
            attachedTweetText: 'attachment--tweet__text',
            attachedTweetAuthorName : 'attachment--tweet__name',
            attachedTweetLink: 'attachment--tweet__link',
            attachedTweetPhoto: 'attachment--tweet__photo',
        };

        /**
         * Update attach with new data
         *
         * @typedef {TwitterAttach} TwitterAttach
         * @property {Boolean} isPreview - show loader or not
         */
        return class TwitterAttach extends Attach {

            constructor( isPreview ) {

                super();

                this._data = {
                    type: '',
                    data: null
                };

                this.update( null, isPreview);
            }

            /**
             * Link attach data getter
             * @return {Object}
             */
            get data(){
                return this._data
            }


            /**
             * Update attach with new data
             *
             * @param {AndropovTweetData} andropovTweetData
             * @param {Boolean} isPreview - show loader or not
             */
            update( andropovTweetData, isPreview ) {

                if (andropovTweetData) {

                    /**
                     * Store fetched data
                     * @type {{type: string, data: object}}
                     */
                    this._data = {
                        type: andropovTweetData.type,
                        data: andropovTweetData.data
                    };

                    /**
                     * Update preview
                     * @type {Tweet}
                     */
                    let tweetInfo = andropovTweetData.data.tweet_data;

                    this.media = (tweetInfo.entities.media && tweetInfo.entities.media.length > 0);
                    this.conversation = tweetInfo.entities.user_mentions.length > 0;
                    this.user = {
                        profile_image_url: tweetInfo.user.profile_image_url,
                        profile_image_url_https: tweetInfo.user.profile_image_url_https,
                        screen_name : tweetInfo.user.screen_name,
                        name: tweetInfo.user.name
                    };

                    this.id = tweetInfo.id;
                    this.id_str = tweetInfo.id_str;
                    this.text = tweetInfo.full_text || '';
                    this.created_at = tweetInfo.created_at;

                    this.element.classList.add(CSS.attachedTweet);

                    // make photo
                    this.photoEl = $.make('DIV', [CSS.attachedTweetPhoto]);
                    this.photoEl.style.backgroundImage = `url(${this.user.profile_image_url_https})`;

                    // make name
                    this.nameEl = $.make('SPAN', [CSS.attachedTweetAuthorName]);
                    this.nameEl.textContent = `${this.user.name} `;

                    // make text
                    this.textEl = $.make('DIV', [CSS.attachedTweetText]);
                    let tweetTextCutted = `«${libString.cut(this.text, TITLE_MAX_LENGTH)}»`;
                    let tweetTextEl = document.createTextNode(tweetTextCutted);

                    // make link
                    this.linkEl = $.make('A', [CSS.attachedTweetLink]);
                    this.linkEl.textContent = 'twitter.com';

                    this.textEl.appendChild(this.nameEl);
                    this.textEl.appendChild(tweetTextEl);

                    // append to attach
                    this.element.appendChild(this.photoEl);
                    this.element.appendChild(this.textEl);
                    this.element.appendChild(this.linkEl);
                }

                if ( isPreview ) {
                    this.element.classList.add(CSS.attachedTweetLoading);
                } else {
                    this.element.classList.remove(CSS.attachedTweetLoading);
                }

            }

        }

    }
);

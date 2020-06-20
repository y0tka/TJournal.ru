/**
 * Instagram Attach for Attaches
 */
Air.defineClass(
    'class.InstagramAttach',
    'class.Attach, lib.DOM, lib.string',
    function( Attach, $, libString ) {

        'use strict';

        const TITLE_MAX_LENGTH = 35;

        /*
        * Classnames
        */
        var CSS = {
            attachedInstagram: 'attachment--instagram',
            attachedInstagramLoading: 'attachment--instagram--loading',
            attachedInstagramText: 'attachment--instagram__text',
            attachedInstagramAuthorName: 'attachment--instagram__name',
            attachedInstagramLink: 'attachment--instagram__link',
            attachedInstagramPhoto: 'attachment--instagram__photo',
        };

        /**
         * Instagram attach element
         *
         * @typedef {InstagramAttach} InstagramAttach
         * @property {Element} photoEl     - photo's wrapper
         * @property {Element} nameEl     - user's name
         * @property {Element} textEl     - instagram text
         * @property {Element} linkEl       - link Element
         */
        return class InstagramAttach extends Attach {

            constructor(url, isPreview) {

                super();

                this._data = {
                    type: 'instagram',
                    data: {
                        url: url || ''
                    }
                };

                this.update(null, isPreview);

            }

            /**
             * Link attach data getter
             * @return {{type, data}}
             */
            get data() {

                return this._data;

            }

            /**
             * Update attach with new data
             *
             * @param {{type, data}} andropovResponse
             * @param {Boolean} isPreview - show loader or not
             */
            update(andropovResponse, isPreview) {

                if (andropovResponse) {

                    let instagramInfo = andropovResponse.data;

                    this._data = {
                        type: andropovResponse.type,
                        data: andropovResponse.data
                    };

                    this.element.classList.add(CSS.attachedInstagram);

                    // make photo
                    if (instagramInfo.thumbnail_url) {
                        this.photoEl = $.make('DIV', [CSS.attachedInstagramPhoto]);
                        this.photoEl.style.backgroundImage = `url(${instagramInfo.thumbnail_url})`;
                        this.element.appendChild(this.photoEl);
                    }

                    // make name
                    if (instagramInfo.author && instagramInfo.title) {
                        this.nameEl = $.make('SPAN', [CSS.attachedInstagramAuthorName]);
                        this.nameEl.textContent = `${instagramInfo.author} `;

                        this.textEl = $.make('DIV', [CSS.attachedInstagramText]);
                        let tweetTextCutted = `«${libString.cut(instagramInfo.title, TITLE_MAX_LENGTH)}»`;
                        let tweetTextEl = document.createTextNode(tweetTextCutted);

                        this.textEl.appendChild(this.nameEl);
                        this.textEl.appendChild(tweetTextEl);
                        this.element.appendChild(this.textEl);
                    }

                    // make link
                    this.linkEl = $.make('A', [CSS.attachedInstagramLink]);
                    this.linkEl.textContent = 'instagram.com';
                    this.element.appendChild(this.linkEl);

                }

                if ( isPreview ) {
                    this.element.classList.add(CSS.attachedInstagramLoading);
                } else {
                    this.element.classList.remove(CSS.attachedInstagramLoading);
                }
            }
        }
    }
);

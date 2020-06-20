/**
 * @module Attach_Link
 * @description LinkAttach class extension for Attach
 **/
Air.defineClass(
    'class.LinkAttach',
    `class.Attach, lib.DOM, lib.string`,
    function( Attach, $, libString ) {

        'use strict';

        /**
         * Max length for the description to fit maximum 2 lines
         * @type {Number}
         */
        const DESC_MAX_LENGTH = 110;

        /**
         * Classnames
         */
        var CSS = {
            attachedLink : 'attachment--link',
            attachedLinkNoCover : 'attachment--link--nocover',
            attachedLinkPreview: 'attachment--link--preview',
            attachedLinkTitle: 'attachment--link__title',
            attachedLinkURL: 'attachment--link__url',
            attachedLinkCover: 'attachment--link__cover',
            attachedLinkDescription: 'attachment--link__description'
        };

        /**
         * Attached link block
         *
         * @typedef {LinkAttach} module:Attach_Link.LinkAttach
         * @property {Element} element     - main wrapper
         * @property {Element} titleEl     - title Element
         * @property {Element} descEl      - node for description
         * @property {Element} coverEl     - page cover Element
         * @property {Element} urlEl       - link Element
         */
        return class LinkAttach extends Attach {

            /**
             * Link Attach item
             *
             * @constructor
             *
             * @param  {AndropovData} link  - full Andropov's Link data
             * @param  {Boolean} isPreview  - flag for preview mode
             */
            constructor({link, isPreview}){

                super();

                this.element.classList.add(CSS.attachedLink);

                /**
                 * Uploaded link data in Andropov format
                 * @type {AndropovData|null}
                 */
                this.link = link || null;

                this.update({
                    link,
                    isPreview
                });

            }

            /**
             * Link attach data getter
             * @return {{link: AndropovData|null}}
             */
            get data(){
                return this.link;
            }

            /**
             * Update attach with new data
             *
             * @param  {AndropovData} link  - full Andropov's Link data
             * @param  {Boolean} [isPreview]  - true before sending
             */
            update({link, isPreview = false}) {

                if (isPreview){
                    this.showLoader();
                    return;
                }

                this.hideLoader();


                /**
                 * Store data that will be send to the server next
                 */
                this.link = link || null;


                this.render(link.render);

            }
        };

    }
);

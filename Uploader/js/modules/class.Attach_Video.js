/**
 * VideoAttach class extension for Attach
 *
 * @typedef {object} AndropovVideoExternal
 * @property {ExternalService} external_service - {name: "youtube", id: "zO8BAmC4ZN8"}
 * @property {number} height
 * @property {number} width
 * @property {{type: string, data: AndropovImage}} thumbnail
 * @property {number} time
 **/
Air.defineClass(
    'class.VideoAttach',
    `class.Attach, class.Image`,
    function( Attach, AndropovImage ) {

        'use strict';

        /**
         * Class names
         */
        const CSS = {
            attachedImage : 'attachment--video',
        };

        /**
         * Video attach element
         *
         * @property {Element} this.element    - main wrapper
         */
        return class VideoAttach extends Attach {

            /**
             * Video Attach item
             *
             * @constructor
             *
             * @param {string} type
             * @param {AndropovVideoExternal} data
             */
            constructor({type, data}){

                super();

                this.element.classList.add(CSS.attachedImage);

                let thumbnail = new AndropovImage(data.thumbnail.data);

                this.element.style.backgroundImage = `url(${thumbnail.url})`;

                this._data = {
                    type,
                    data
                };

            }

            /**
             * Video attach data getter
             * @return {Object}
             */
            get data(){
                return this._data;
            }
        };

    }
);

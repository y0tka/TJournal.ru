/**
 * ImageAttach class extension for Attach
 **/
Air.defineClass(
    'class.ImageAttach',
    `class.Attach`,
    function( Attach ) {

        'use strict';

        /**
         * Classnames
         */
        var CSS = {
            attachedImage : 'attachment--image',
        };

        /**
         * Image attach element
         *
         * @property {Element} this.element    - main wrapper
         * @property {Object} this.fileData    - uploaded file data got from FileUploader
         */
        return class ImageAttach extends Attach {

            /**
             * Image Attach item
             *
             * @constructor
             *
             * @param  {object} options
             * @param  {string} options.url - image URL
             *
             * @param {object} fileData                - Andropov response
             * @param {string} fileData.type           - "image"
             * @param {AndropovImage} fileData.data    - file data
             */
            constructor({url, fileData}){

                super();

                this.element.classList.add(CSS.attachedImage);

                this.element.style.backgroundImage = `url(${url})`;

                this.fileData = fileData;

            }

            /**
             * Image attach data getter
             * @return {Object}
             */
            get data(){
                return this.fileData;
            }
        };

    }
);

/**
 * Class describes Andropov Image File
 *
 * @typedef {object} ExternalService  - for MP4 gifs loaded from external services
 * @property {string} name
 * @property {string} id
 * @property {string} mp4_url
 */
Air.defineClass('class.Image',
    `class.File`,
    function (File) {
        'use strict';

        /**
         * @typedef {AndropovImage} AndropovImage
         * @property {string} uuid            - ID from Leonardo. "6e14fca6-ec3e-47e7-a1b1-ed67edade33b" . May contain full URL for an old images.
         * @property {string} type            - "jpg"
         * @property {number} height          - 528
         * @property {number} width           - 1200
         * @property {number} size            - 216302 (in bytes)
         * @property {string} color           - dominant color
         * @property {ExternalService} external_service
         *
         * @class AndropovImage
         * @augments AndropovFile
         */
        return class AndropovImage extends File {

            /**
             * @param {AndropovImage} fileData
             */
            constructor(fileData) {
                /**
                 * Fill parent constructor
                 */
                super(fileData);

                this.type = 'jpg';
                this.height = 0;
                this.width = 0;
                this.size = 0;
                this.color = '';
                this.external_service = [];

                if (fileData) {
                    this.data = fileData;
                }
            }

            /**
             * Store data in the class properties
             * @param {object} data
             */
            set data(data) {
                for (let key in data) {
                    if (data.hasOwnProperty(key)) {
                        this[key] = data[key];
                    }
                }
            }

            /**
             * Composes Image Source
             *  @return {string}
             */
            get url() {
                return this.getUrl();
            };

            /**
             * Composes Image Source by uuid
             * uuid can be:
             *  - clear uuid like '6e14fca6-ec3e-47e7-a1b1-ed67edade33b'
             *  - full URL for the backward-capability with the old images
             *  - base64 data
             *  @arguments filter
             *  @return {string}
             */
            getUrl(filter = '') {
                /**
                 * Path for image-uploader and storage service
                 * @type {String}
                 */
                const storagePath = 'https://leonardo.osnova.io/';

                // https://png.cmtt.ru/6e14fca6-ec3e-47e7-a1b1-ed67edade33b.jpg
                if (this.uuid.substring(0, 4) === 'http') {

                    return this.uuid;

                    // data:image/png;base64,LIAEDJADKA;DADLJDJADK;ADADKADLJFN,EME...
                } else if (this.uuid.substring(0, 21) === 'data:image/png;base64') {

                    return this.uuid;

                    // '6e14fca6-ec3e-47e7-a1b1-ed67edade33b'
                } else {

                    return storagePath + this.uuid + filter;

                }
            }

        }
    }
);
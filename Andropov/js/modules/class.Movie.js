/**
 * Abstract class describes Andropov Movie File
 */
Air.defineClass('class.Movie',
    `class.File`,
    function(File){
        'use strict';

        /**
         * @typedef {Movie} AndropovMovie
         * @property {string} uuid          - ID from Leonardo
         * @property {string} type          - mp4
         * @property {number} width         - video width
         * @property {number} height        - video height
         * @property {number} size          - video size in bytes
         * @property {number} duration      - video duration
         * @property {number} bitrate       - video bit rate
         * @property {boolean} has_audio    - false
         *
         * @class AndropovMovie
         * @augments AndropovFile
         */
        return class Movie extends File {

            constructor(){
                super();
                this.type = 'mp4';
                this.width = 0;
                this.height = 0;
                this.size = 0;
                this.duration = 0;
                this.bitrate = 0;
                this.has_audio = false;
            }

        }
    }
);
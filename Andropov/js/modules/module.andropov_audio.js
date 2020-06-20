Air.define('module.andropov_audio', function () {
    'use strict';

    const Picobel = require('vendor/picobel');

    /**
     * Picobel player instance
     * @see  https://github.com/tomhazledine/picobel
     * @type {Object|null}
     */
    var playerInstance = null;

    /**
     * Timeout uses for correct progressbar's width computing
     * @type {Number|null}
     */
    var playerInitTimeout = null;

    /**
     * Init
     */
    this.init = function () {
        /**
         * Player checks progressbar's width to compute Time-tooltip position
         * So we need to wait when Player will be rendered
         * @type {number}
         */
        playerInitTimeout = window.setTimeout(() => {
            playerInstance = new Picobel({ theme: 'pitchfork' });
        }, 200);
    };

    /**
     * Refresh
     */
    this.refresh = function () {
        if (playerInstance) {
            playerInstance.destroy();
        }

        playerInstance = new Picobel({ theme: 'pitchfork' });
    };

    /**
     * Destroy
     */
    this.destroy = function () {
        playerInstance.destroy();
        playerInstance = null;

        if (playerInitTimeout) {
            window.clearTimeout(playerInitTimeout);
        }
    };
});

/**
 * Listens messages from instagram iframes to set their height.
 */
Air.define('module.instagram_frames', 'lib.DOM, lib.console', function($, console) {

    /**
     * Returns true if string seems to be instagram origin
     *
     * @param str
     * @returns {boolean}
     */
    function hasInstagramOrigin(str) {
        return str.indexOf('instagram.com') >= 0;
    }

    /**
     * Returns true if iframe belongs to instagram
     *
     * @param iframe
     * @returns {boolean}
     */
    function isInstagramFrame(iframe) {
        return hasInstagramOrigin(iframe.src);
    }

    /**
     * Returns all instagram frames on the page
     *
     * @returns DOM-elements
     */
    function getFrames() {
        return $.findAll('iframe').filter(isInstagramFrame);
    }

    /**
     * Returns instagram-iframe by message event
     *
     * @param event
     * @returns DOM-element
     */
    function getFrameByEvent(event) {
        return getFrames().filter(function(iframe) {
            return iframe.contentWindow === event.source;
        })[0];
    }

    /**
     * Handles post message from Instagram and get iframe's height from that
     *
     * @param {MessageEvent} event - post message
     */
    function messageHandler(event) {
        var data = null,
            iframe;

        /**
         * Instagram sends a PostMessage with MEASURE 'type' and height in 'details'
         */
        if (hasInstagramOrigin(event.origin)) {
            try {
                data = JSON.parse(event.data);
            } catch (error) {
                console.log('andropov', 'Invalid instagram message data', data);
            }

            if (data !== null && data.type === 'MEASURE' && data.details && data.details.height) {
                iframe = getFrameByEvent(event);

                if (iframe !== undefined) {
                    $.css(iframe, 'height', data.details.height + 'px');
                }
            }
        }
    }

    this.init = function() {
        $.on(window, 'message.instagram_frames', messageHandler);
    };

    this.destroy = function() {
        $.off(window, 'message.instagram_frames');
    };

});
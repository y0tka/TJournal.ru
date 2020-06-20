Air.defineClass('class.ScrollHandler', 'lib.DOM', function($) {

    /**
     * @param {Object} config
     * @param {String} config.selector - element that will be listened
     * @param {Function} config.beforeHandling - do some stuff before
     * @param {Function} config.bottomReached - callback
     * @constructor
     */
    function ScrollHandler(config) {
        this.init(config);
    }

    ScrollHandler.prototype.init = function(config) {

        var self = this,
            selector = config.selector,
            element = $.find(document.body, selector);

        self.configuration = config;
        self.element = element;

        $.on(element, 'scroll', self.scrollWatchDecorator.bind(self));
    };

    ScrollHandler.prototype.scrollWatchDecorator = function(event) {

        var self = this;

        if (self.scrollStopWatcher) {

            window.clearTimeout(self.scrollStopWatcher);

        }

        self.scrollStopWatcher = window.setTimeout(self.eventHandler.bind(self, event), 150);

    };

    /**
     * Handles events:
     *  - beforeHandling
     *  - bottomReached
     * @param event
     */
    ScrollHandler.prototype.eventHandler = function(event) {

        var self = this;

        if (self.configuration.beforeHandling && typeof self.configuration.beforeHandling === 'function') {

            self.configuration.beforeHandling(event);

        }

        /**
         * check current scroll position.
         * @see reachedTheBottom
         */
        if (reachedTheBottom(event) && typeof self.configuration.bottomReached === 'function') {

            self.configuration.bottomReached(event);

        }
    };

    /**
     * Does scroll reached the end
     * @param event
     * @returns {boolean}
     */
    var reachedTheBottom = function (event) {

        return event.target.scrollTop >= event.target.scrollHeight - 500;

    };

    ScrollHandler.prototype.destroy = function() {
        this.configuration = null;
        $.off(this.element, 'scroll');
    };

    return ScrollHandler;
} );

Air.defineModule('module.sticky', 'class.Fabric, lib.DOM, module.metrics, class.Timer', function(Fabric, $, metrics, Timer, util) {
    var fabric;

    /**
     * Class for managering with single element.
     * @param {Object} parameters.
     */
    var Sticky = function(parameters) {
        this.id = util.uid();
        this.element = parameters.element;
        this.enabled = false;
        this.last_enabled = false;

        this.settings = {
            top_offset: parseInt($.attr(this.element, 'air-sticky-top')) || 0,
            width_from: parseInt($.attr(this.element, 'air-sticky-width-from')) || 0,
            width_to: parseInt($.attr(this.element, 'air-sticky-width-to')) || Infinity
        };

        // $.css(this.element, {
        //     'transform': 'translateZ(0)'
        // });

        this.resize();
    };

    Sticky.prototype.refresh = function() {
        this.resize();
        this.check();
    };

    Sticky.prototype.check = function() {
        if (this.enabled === true && this.last_enabled === false) {
            $.toggleClass(this.element, 'sticky', true);
            $.css(this.element, {
                'top': this.settings.top_offset + 'px'
            });

            this.last_enabled = true;
        }else if (this.enabled === false && this.last_enabled === true ) {
            $.toggleClass(this.element, 'sticky', false);
            $.css(this.element, {
                'top': ''
            });

            this.last_enabled = false;
        }
    };

    Sticky.prototype.resize = function() {
        if (metrics.window_width < this.settings.width_from || metrics.window_width > this.settings.width_to) {
            this.enabled = false;
        }else{
            this.enabled = true;
        }

        this.check();
    };

    Sticky.prototype.destroy = function() {
        this.element = this.settings = null;
    };

    /**
     * Init
     */
    this.init = function() {
        // fabric = new Fabric({
        //     selector: '[air-module*="module.sticky"]',
        //     Constructor: Sticky,
        //     onResize: 'resize'
        // });
    };

    /**
     * Refresh
     */
    this.refresh = function() {
        // fabric.update();
    };

    /**
     * Destroy
     */
    this.destroy = function() {
        // fabric.clear();
    };
});

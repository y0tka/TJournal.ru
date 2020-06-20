Air.defineModule('module.iframe_lazy_load', 'class.Fabric, lib.DOM', function(Fabric, $) {
    var self = this,
        fabric;

    var LazyLoad = function(parameters) {

        this.is_loaded = false;

        this.iframe = parameters.element;

        this.iframe_src = $.attr(this.iframe, 'data-src');

    };

    LazyLoad.prototype.load = function(state) {

        if (state === true && this.is_loaded !== true) {

            $.attr(this.iframe, 'src', this.iframe_src);

            $.attr(this.iframe, 'data-src', null);

            this.is_loaded = true;

            this.iframe = this.iframe_src = null;

        }
    };

    self.loadImmediately = function() {

        fabric.each(function (element, object) {
            object.load(true);
        });

    };

    self.init = function() {

        fabric = new Fabric({
            selector: 'iframe[data-src]',
            Constructor: LazyLoad,
            onVisibleMethod: 'load',
            throttle: 100,
            offset: 2000
        });

    };

    self.refresh = function() {
        fabric.update();
    };

    self.destroy = function() {
        fabric.clear();
    };
});
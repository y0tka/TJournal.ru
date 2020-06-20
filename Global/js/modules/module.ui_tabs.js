Air.defineModule('module.ui_tabs', 'class.Fabric, lib.DOM', function(Fabric, $, metr) {
    var fabric;

    var Tabs = function(parameters) {
        var that = this;

        this.element = parameters.element;
        this.scroll_wrapper = $.find(parameters.element, '.ui_tabs__wrp');
        this.gradient_shown = false;

        if (this.scroll_wrapper) {
            $.on(this.scroll_wrapper, 'scroll', function () {
                if (this.scrollLeft > 1 && !that.gradient_shown) {
                    that.gradient_shown = true;
                    $.toggleClass(that.element, 'ui_tabs--show_left_gradient', that.gradient_shown);
                }else if (this.scrollLeft <= 1 && that.gradient_shown) {
                    that.gradient_shown = false;
                    $.toggleClass(that.element, 'ui_tabs--show_left_gradient', that.gradient_shown);
                }
            });
        }
    };

    Tabs.prototype.destroy = function(state) {
        $.off(this.scroll_wrapper);
    };

    this.init = function() {
        fabric = new Fabric({
            module_name: 'module.ui_tabs',
            Constructor: Tabs
        });
    };

    this.refresh = function() {
        fabric.update();
    };

    this.destroy = function() {
        fabric.clear();
    };
});

Air.define( 'module.drag', 'lib.DOM', function($, util) {
    var self = this,
        drag_instances = [];

    var normalizeMouseCoord = function (event) {
        var coord = {};

        coord.x = event.pageX || event.clientX;
        coord.y = event.pageY || event.clientY;

        return coord;
    };

    var mousedownHandler = function (event) {
        var coord = normalizeMouseCoord(event);

        drag_instances.forEach(function (drag_instance) {

            if (drag_instance.el === event.target) {

                drag_instance.mouse_down = true;
                drag_instance.start_coord = coord;

                if (drag_instance.options.start) {
                    drag_instance.options.start();
                }

            }

        });

        $.on(document, 'mousemove.drag', mousemoveHandler);

    };

    var mousemoveHandler = function (event) {
        var coord = normalizeMouseCoord(event);

        drag_instances.forEach(function (drag_instance) {

            if (drag_instance.mouse_down) {

                if (drag_instance.options.move) {
                    drag_instance.options.move(coord.x - drag_instance.start_coord.x, coord.y - drag_instance.start_coord.y);
                }

            }

        });
    };

    var mouseupHandler = function (event) {
        var coord = normalizeMouseCoord(event);

        drag_instances.forEach(function (drag_instance) {

            if (drag_instance.mouse_down) {

                if (drag_instance.options.end) {
                    drag_instance.options.end(coord.x - drag_instance.start_coord.x, coord.y - drag_instance.start_coord.y);
                }

                drag_instance.mouse_down = false;
                drag_instance.start_coord = null;

            }

        });

        $.off(document, 'mousemove.drag');

    };

    self.bind = function (element, options) {

        drag_instances.push({
            el: element,
            options: options
        });

    };

    self.unbind = function (el) {
        var remove_i;

        drag_instances.forEach(function (drag_instance, i) {
            if (drag_instance.el === el) {
                remove_i = i;
            }
        });

        drag_instances.splice(remove_i, 1);
    };

    self.init = function() {

        $.on(document, 'mousedown.drag', mousedownHandler);

        $.on(document, 'mouseup.drag', mouseupHandler);

    };

    self.refresh = function() {

    };

    self.destroy = function() {
        $.on(document, '.drag');
    };

});

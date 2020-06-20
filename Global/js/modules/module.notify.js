/**
 * @module notify
 * @description Show alerts, errors and warnings in the bubbles
 */
Air.define('module.notify', 'lib.DOM, module.renderer',
    function($, renderer) {
    var self = this,
        notify_el,
        notify_item_container;

    var Notify = function(options) {
        var notify = this,
            notify_el,
            notify_el_button,
            life_time = 7000,
            hide_timeout,
            mousedown_x,
            text_height,
            item_height,
            min_height = 74;

        renderer.render({
            template: 'notify',
            data: {
                type: options.type,
                button_text: options.button_text,
                message: options.message
            },
            onReady: function(el) {
                notify_el = el;

                $.prepend(options.container, notify_el);

                text_height = $.height($.find(notify_el, 'p'));

                if (text_height > min_height) {
                    item_height = text_height + 14;
                } else {
                    item_height = min_height;
                }

                $.addEvent(notify_el, 'mousedown', function(event) {
                    mousedown_x = event.clientX;
                    $.css(notify_el, 'cursor', '-webkit-grab');
                });

                $.addEvent(notify_el, 'mousemove', function(event) {
                    if (mousedown_x !== undefined) {
                        if (event.clientX - mousedown_x > 20) {
                            clearTimeout(hide_timeout);
                            notify.show('swipe');
                            mousedown_x = undefined;
                        }
                    }
                });

                $.addEvent(notify_el, 'mouseup', function(event) {
                    mousedown_x = undefined;
                    $.css(notify_el, 'cursor', '');
                });

                if (options.onButtonClick) {
                    notify_el_button = $.find(notify_el, '.notify__item__button');

                    $.addEvent(notify_el_button, 'click', function() {

                        $.removeEvent(notify_el_button, 'click');

                        options.onButtonClick && options.onButtonClick();

                        notify.show(false);
                    });
                }

                // fix for transition after append
                setTimeout(function() {
                    notify.show(true);

                    hide_timeout = setTimeout(function() {
                        notify.show(false);
                    }, life_time);
                }, 100);

            }
        });

        notify.show = function(state) {
            if (state === true) {
                $.toggleClass(notify_el, 'notify__item--shown', true);
                $.css(notify_el, 'height', item_height + 'px');
            } else if (state === false) {
                $.toggleClass(notify_el, 'notify__item--hidden', true);
                $.css(notify_el, 'height', '0px');

                hide_timeout = setTimeout(function() {
                    notify.destroy()
                }, 600);
            } else if (state === 'swipe') {
                $.toggleClass(notify_el, 'notify__item--swiped', true);
                $.css(notify_el, 'height', '0px');

                hide_timeout = setTimeout(function() {
                    notify.destroy()
                }, 600);
            }
        };

        notify.destroy = function() {
            clearTimeout(hide_timeout);

            if (options.onButtonClick) {
                $.removeEvent(notify_el_button);
            }

            $.removeEvent(notify_el);
            $.remove(notify_el);

            notify_el = notify_el_button = options = null;
        };

    };

    self.init = function() {
        notify_el = self.elements[0].element;
        notify_item_container = $.parseHTML('<div class="notify"></div>');

        renderer.render({
            template: 'notify'
        });

        self.appendLayout();
    };

    self.appendLayout = function() {
        $.append(notify_el, notify_item_container);
    };

    self.show = function(options) {
        /**
 			type: 'success',
 			message: 'Hello ' + Math.random(),
 			button_text: 'Отменить',
 			onButtonClick: function(){}
		 */
        options.container = notify_item_container;
        new Notify(options);
    };

    self.setOffsetTop = function (value) {
        if (value === false) value = 30;

        if (parseInt(value) !== NaN) {

            $.css(notify_item_container, 'top', value + 'px');

        }
    };

    self.success = function( message ) {
        self.show( {
            type: 'success',
            message: message
        } );
    };

    self.warning = function( message ) {
        self.show( {
            type: 'warning',
            message: message
        } );
    };

    self.info = function( message ) {
        self.show( {
            type: 'info',
            message: message
        } );
    };

    self.error = function( message ) {
        self.show( {
            type: 'error',
            message: message
        } );
    };

    // window.Notify = self;
});

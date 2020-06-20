/**
 * @module popup
 */
Air.defineModule('module.popup', 'module.renderer, module.DOM, lib.DOM, module.scroll_locker', function(renderer, DOM, $, scroll_locker, util) {
    var fabric,
        self = this,
        is_loading = false,
        is_shown = false,
        is_in_progress = false,
        active_popup = {},
        history_popups = [];

    self.show = function(options) {
        if (is_shown === false) {
            active_popup = options;

            is_in_progress = true;

            if (is_loading === false) {

                is_loading = true;

                renderer.render({
                    el: '.popup__container__window__tpl',
                    template: options.template,
                    data: options.data,
                    onReady: function(el) {
                        is_loading = false;

                        active_popup.rendered_elements = el;

                        $.bem.toggle(self.window, 'styled', active_popup.style !== false);

                        active_popup.onReady && active_popup.onReady(active_popup.rendered_elements)

                        self.showLayout(true);

                        self.showPopup(true, function() {
                            scroll_locker.lock(true);
                            is_in_progress = false;
                            is_shown = true;
                        });
                    }
                });
            }
        }
    };

    self.replace = function (options) {
        is_shown = false;
        is_in_progress = false;

        if (!options.history) {
            active_popup.onClose && active_popup.onClose(active_popup.rendered_elements);
        }else{
            history_popups.push(active_popup);
        }

        active_popup = null;

        self.show(options);
    };

    self.historyBack = function () {

        if (history_popups.length > 0) {

            active_popup.onClose && active_popup.onClose(active_popup.rendered_elements);

            active_popup = history_popups.pop();

            $.html(self.popup, '');

            $.append(self.popup, active_popup.rendered_elements);
        }

    };

    self.hide = function() {
        if (is_shown === true) {
            is_in_progress = true;

            self.showLayout(false, function () {
                $.html(self.popup, '');
            });

            self.showPopup(false, function() {
                active_popup.onClose && active_popup.onClose(active_popup.rendered_elements);
                scroll_locker.lock(false);
                is_in_progress = false;
                is_shown = false;

                active_popup = null;

                // Clear history
                history_popups.forEach(function (history_popup) {
                    history_popup.onClose && history_popup.onClose(history_popup.rendered_elements);
                    history_popup = null;
                });

                history_popups = [];
            });
        }
    };

    self.appendLayout = function() {
        self.element = $.find('.popup');

        if (!self.element) {
            self.element = $.parseHTML('\
                <div class="popup">\
                    <div class="popup__layout"></div>\
                    <div class="popup__container">\
                        <div class="popup__container__window">\
                            <div class="popup__container__window__close">×</div>\
                            <div class="popup__container__window__tpl"></div>\
                        </div>\
                    </div>\
                </div>\
            ');

            $.append(document.body, self.element);

            self.layout = $.find(self.element, '.popup__layout');
            self.window = $.find(self.element, '.popup__container__window');
            self.popup = $.find(self.element, '.popup__container__window__tpl');
            self.container = $.find(self.element, '.popup__container');
            self.close = $.find(self.element, '.popup__container__window__close');

            $.addEvent(self.close, 'click', self.hide.bind(self));

            $.addEvent(self.element, 'click', function(event) {
                if (!$.belong(event.target, '.popup__container__window') && $.isExists(event.target)) {
                    self.hide();
                }
            });
        }
    };

    self.showLayout = function(state, callback) {
        $.toggleClass(self.layout, 'popup__layout--shown', state);

        $.off(self.element, 'transitionend.popup');
        $.one(self.element, 'transitionend.popup', function() {
            is_shown = state;

            callback && callback();
        });
    };

    self.showPopup = function(state, callback) {
        if (state) {
            $.toggleClass(self.container, 'popup__container--shown', true);
            self.container.scrollTo(0,0);
        } else {
            $.toggleClass(self.container, 'popup__container--shown', false);
        }

        callback && callback();
    };

    self.init = function() {
        self.appendLayout();

        DOM.on( 'popup_show', function( data ) {
            var name = $.data( data.el, 'popup-name' );

            if ( name ) {
                self.show( {
                    template: name
                } );
            }
        } );

        DOM.on( 'popup_hide', function( data ) {
            self.hide();
        } );

        DOM.on( 'popup_go_back', function( data ) {
            self.historyBack();
        } );
    };

    self.destroy = function() {
        DOM.off();
    };
});

Air.define('module.sticky_sidebar', 'lib.DOM, module.DOM, module.metrics, module.propaganda', function($, DOM, metr, propaganda) {
    var self = this,
        last_scroll_top = 0,
        sticky_sidebar,
        sticky_sidebar_scroll,
        top_margin = 50,
        is_enabled = false,
        entry_sidebar_banners;

    var scrollHandler = function() {
        var sidebar_scroll_top = sticky_sidebar_scroll.scrollTop,
            sticky_sidebar_y = $.rect(sticky_sidebar).y;

        if (sticky_sidebar_y === top_margin) {

            sticky_sidebar_scroll.scrollTop = sidebar_scroll_top + (metr.scroll_top - last_scroll_top);

        } else if (sticky_sidebar_y > top_margin) {

            sticky_sidebar_scroll.scrollTop = 0;

        } else if (sticky_sidebar_y < top_margin) {

            sticky_sidebar_scroll.scrollTop = 999999;

        }

        last_scroll_top = metr.scroll_top;
    };

    var resizeHandler = function () {
        $.bem.toggle(sticky_sidebar, 'height_auto', !(metr.window_height - top_margin < sticky_sidebar_scroll.scrollHeight));
    };

    var dealWithEntryCenter = function (banner_id) {
        if (banner_id == 5 || banner_id == 3) {
            entry_sidebar_banners[banner_id] = false;
        }

        if (entry_sidebar_banners[5] === false && entry_sidebar_banners[3] === false) {
            var page_entry = $.find('.page--entry');

            if (page_entry) {
                $.toggleClass(page_entry, 'with--entry_center', true);
                self.destroy();
            }

            page_entry = null;

        }

    };

    self.init = function() {
        sticky_sidebar = self.elements[0].element;
        sticky_sidebar_scroll = $.find(sticky_sidebar, '.sticky_sidebar__scroll');

        entry_sidebar_banners = {
            5: true,
            3: true
        };

        metr.on('Breakpoint changed', function (breakpoint_name) {

            if (breakpoint_name === 'wide' || breakpoint_name === 'desktop') {

                if (is_enabled === false) {

                    DOM.on('Window scroll', scrollHandler);
                    DOM.on('Window resize', resizeHandler);

                    resizeHandler();

                    is_enabled = true;

                }

            } else {

                if (is_enabled === true) {

                    DOM.off();
                    is_enabled = false;

                }

            }

        });

        propaganda.on('Propaganda shown', function(data) {

            if (is_enabled) {

                /** Append link to advertising page */
                if (data.id === 5) {

                    $.append(data.element, $.parseHTML('<div class="propaganda__link"><a href="/ad">Реклама на '+ self.config.site_name +'</a></div>'));

                    resizeHandler();

                }

            }

        });

        propaganda.on('Propaganda empty', function(data) {

            if (is_enabled) {

                // dealWithEntryCenter(data.id);
                resizeHandler();

            }

        });

        propaganda.on('Propaganda error', function(data) {

            if (is_enabled) {

                // dealWithEntryCenter(data.id);
                resizeHandler();

            }

        });

        let hideTopComment = $.find('.island__header__admin[data-comment-id]');

        if (hideTopComment) {
            $.on( hideTopComment, 'click', function() {
                smart_ajax.post( {
                    url: '/admin/comments/hide_top_comment_of_the_day/' + $.data(hideTopComment, 'comment-id'),
                    data: {
                        mode: 'raw'
                    },
                    success: function( response ) {
                        notify.success( 'В следующий раз на этом месте будет другой комментарий' );
                    },
                    error: function( error ) {
                    }
                } );
            } );
        }
    };

    self.refresh = function() {
        self.destroy();
        self.init();
    };

    self.destroy = function() {
        DOM.off();
        metr.off();
        propaganda.off();

        last_scroll_top = 0;
        sticky_sidebar = sticky_sidebar_scroll = null;
        is_enabled = false;
    };

});
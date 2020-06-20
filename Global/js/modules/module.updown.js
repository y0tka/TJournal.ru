Air.define( 'module.updown', 'lib.analytics, module.DOM, lib.DOM, module.metrics', function( lib_analytics, DOM, lib_DOM, metrics ) {
	var self = this,
		min_scroll_top = 400,
		saved_scroll_top,
		is_shown = false,
		updown_element,
		dom;

	var scrollHandler = function() {

		if (metrics.scroll_top >= min_scroll_top && !is_shown) {

			dom.updown.toggleClass('updown--shown', true);
			is_shown = true;

		} else if (metrics.scroll_top < min_scroll_top && is_shown && !saved_scroll_top) {

			dom.updown.toggleClass('updown--shown', false);
			is_shown = false;

		}

		if (metrics.scroll_top >= min_scroll_top && saved_scroll_top) {

			dom.updown.toggleClass('updown--go_down', false);
			saved_scroll_top = 0;

		}

	};

	self.init = function() {

		if (!metrics.is_mobile) {

			dom = DOM.list('.updown');

			DOM.on('updown:click', function(){

				if (saved_scroll_top) {

					DOM.scrollTo(saved_scroll_top);

					saved_scroll_top = 0;

					dom.updown.toggleClass('updown--go_down', false);

					self.trigger( 'Down' );

				}else {

					saved_scroll_top = metrics.scroll_top;

					DOM.scrollTo(0);

					dom.updown.toggleClass('updown--go_down', true);

					self.trigger( 'Up' );

				}
			});

			DOM.on('Window scroll', scrollHandler);

			scrollHandler();

		}

		// Прокрутка наверх
        self.on( 'Up', function(){
            lib_analytics.sendDefaultEvent( 'Scroll Up Button — Scrolled Up' );
        });

        // Прокрутка обратно вниз
        self.on( 'Down', function(){
            lib_analytics.sendDefaultEvent( 'Scroll Up Button — Scrolled Back Down' );
        });

	};

	self.refresh = function() {

	};

	self.destroy = function() {
		DOM.off();
		self.off();
	};
});

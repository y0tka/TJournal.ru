/**
 * TODO:
 * – morse on 27.05 (пасхалка)
 * – пасхалка: писать в консольки поздравления по программерским праздникам
 */

Air.defineModule( 'module.live', 'module.live_model, module.live_view, module.metrics, module.DOM, lib.DOM', function( live_model, live_view, metr, DOM, $ ) {
	var self = this,
		automatic_hidden = false;

	var resizeHandler = function() {
		if ( metr.breakpoint === 'desktop' && ( metr.window_width < 1240 ) ) {
			/* если десктоп, но маленький, то выносим эфир в правую колонку */
			live_view.placeIt( $.find( '[air-place="live"]' ) );
			live_view.enableWheel( false );
		} else {
			live_view.placeIt();
			live_view.enableWheel( true );
		}

		live_model.enable( metr.breakpoint === 'desktop' || metr.breakpoint === 'wide' );
	};

	var checkLiveVisibility = function () {
		var no_live = $.find('nolive');

		if (no_live) {

			self.show(false);

			automatic_hidden = true;

		} else if (automatic_hidden) {

			self.show(true);

			automatic_hidden = false;

		}

		no_live = null;
	};

	self.show = function (state) {
		$.toggleClass(document.body, 'with--live', state);
	};

	self.init = function() {
		resizeHandler();

		checkLiveVisibility();

		DOM.on( 'Window resize', resizeHandler );

		live_model.on( 'New items', live_view.processItems );
    };

    /**
     * Refresh
     */
    self.refresh = function() {

		checkLiveVisibility();

    };

    /**
     * Destroy
     */
    self.destroy = function() {
		DOM.off();
		live_model.off();
    };
} );

Air.define( 'module.island', 'lib.DOM, module.DOM, module.metrics', function($, DOM, metr) {
	var self = this,
		fabric;

	var headerClickHandler = function (data) {
        var island;

        if (metr.breakpoint == 'mobile' || metr.breakpoint == 'tablet') {
            island = $.parents(data.el, '.island');
            $.bem.toggle(island, 'expanded', true);

            island = null;
        }

    };

    var headerToggleHandler = function (data) {
        var island;

        island = $.parents(data.el, '.island');

		island.classList.toggle('island--expanded');

		island = null;
    };

	self.init = function() {
		DOM.on('island_header:click', headerClickHandler);
        DOM.on('island_header_toggle:click', headerToggleHandler);
	};

	self.destroy = function() {
		DOM.off();
	};

});

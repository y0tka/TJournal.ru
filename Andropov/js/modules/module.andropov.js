Air.define( 'module.andropov', 'module.instagram_frames, class.Andropov, class.Fabric, lib.DOM, lib.console', function( instagram_frames, Andropov, Fabric, $, console ) {

    var self = this,
        fabric;

    self.init = function() {
        console.define( 'andropov', 'Andropov (￢з￢)', '#939393' );

        fabric = new Fabric( {
			module_name: 'module.andropov',
			Constructor: Andropov,
			onVisible: 'onVisible',
            offset: $.windowHeight() * 3,
            throttle: 500,
            controlling_module: self
 		} );
    };

    self.refresh = function() {
        fabric.update();
    };

    self.destroy = function() {
        fabric.destroy();
    };

    self.loadImmediately = function() {
        fabric.each(function(element, instance) {
            instance.callMethod('load');
        });
    };

} );

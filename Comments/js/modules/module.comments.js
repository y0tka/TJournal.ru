Air.defineModule( 'module.comments', 'module.ajaxify, module.renderer, module.auth_data, module.notify, module.smart_ajax, class.Fabric, class.Comments, lib.DOM, lib.console', function( ajaxify, renderer, module_auth_data, module_notify, smart_ajax, Fabric, Comments, $, console ) {

    var self = this,
        fabric;

    self.init = function() {
        console.define( 'comm', 'Comments (°ᴥ°)', '#0FA3B1' );

        fabric = new Fabric( {
            selector: '[air-module="module.comments"]',
            Constructor: Comments,
            onVisible: 'activate',
            cache_boundings: false,
            debounce: 200,
            controlling_module: self
        } );

        ajaxify.addQueryEvent('comments', function(query) {
            if ((query.comments === true || query.comment !== undefined) && !query.hard) {
                return 'Scroll to comments';
            }
        });
    };

    self.refresh = function() {
        fabric.update();
    };

    self.destroy = function() {
        ajaxify.removeQueryEvent('comments');
        fabric.destroy();
    };

    // self.getSettings = function() {
    //     if ( self.elements[0] ) {
    //         return self.elements[0].settings;
    //     } else {
    //         return null;
    //     }
    // };

    // self.getSettingsUrl = function( name ) {
    //     var settings = self.getSettings();
    //
    //     if ( settings !== null && settings.urls && settings.urls[ name ] ) {
    //         return settings.urls[ name ];
    //     } else {
    //         return null;
    //     }
    // };

} );

Air.defineModule( 'module.static_version_watcher', 'module.system_messages, module.location, lib.cookie', function( system_messages, module_location, cookie ) {
    var self = this,
        cookie_name = 'static_version_timestamp',
        initial_time = Math.round( Date.now() / 1000 );

    var remember = function( value ) {
        if ( value !== undefined ) {
            cookie.set( cookie_name, value + '', 365 );
        } else {
            return cookie.get( cookie_name );
        }
    };

    var processVersion = function( version ) {
        var current_version = remember();
        // _log('>>> ',initial_time, current_version, version);
        if ( current_version === undefined ) {
            // _log('{a}');
            if ( version !== undefined ) {
                // _log('{b}');
                version = parseInt( version ) || 0;

                remember( version );

                if ( version > initial_time ) {
                    // _log('{c}');
                    module_location.unajaxNext();
                }
            }
        } else {
            // _log('{d}');
            current_version = parseInt( current_version ) || 0;

            if ( version !== undefined ) {
                // _log('{e}');
                version = parseInt( version ) || 0;

                if ( version > current_version ) {
                    // _log('{f}');
                    remember( version );

                    if ( version > initial_time ) {
                        // _log('{g}');
                        module_location.unajaxNext();
                    }
                }
            }
        }
    };

    self.init = function() {
        system_messages.on( 'Static version changed', processVersion );
    };

    self.destroy = function() {
        system_messages.off();
    };
} );

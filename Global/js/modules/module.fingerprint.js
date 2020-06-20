Air.defineModule( 'module.fingerprint', 'lib.cookie', function ( cookie ) {
    var cookie_name = 'fingerprint',
        Fingerprint2 = require('fingerprintjs2');

    var getFingerprint = function ( callback ) {
        new Fingerprint2().get( callback );
    };

    this.init = function () {
        if ( Fingerprint2 ) {
            XMLHttpRequest.before = function ( callback, method ) {
                if ( cookie.get( cookie_name ) === undefined ) {
                    getFingerprint( function ( fingerprint ) {
                        cookie.set( cookie_name, fingerprint, 30 );
                        callback();
                    } );
                } else {
                    callback();
                }
            };
        }
    };
} );

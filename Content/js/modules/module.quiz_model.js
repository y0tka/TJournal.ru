Air.define( 'module.quiz_model', 'module.smart_ajax, class.Buffer, lib.cookie', function( smart_ajax, Buffer, cookie ) {

    var self = this,
        buffer_getBundleResult;

    self.init = function() {
        buffer_getBundleResult = new Buffer( {
			delay: 200,
            onFlush: self.getBundleResult.bind( self )
		} );
    };

    self.destroy = function() {
        buffer_getBundleResult.destroy();
    };

    self.getResult = function( hash, callback ) {
        buffer_getBundleResult.add( { hash, callback } );
    };

    self.getBundleResult = function( items ) {

        var hash_callback_map = {},
            hashes = [];

        items.forEach( function( item, i ) {
            hash_callback_map[ item.hash ] = item.callback;
            hashes[ i ] = item.hash;
        } );

        smart_ajax.get( {
            url: '/quiz/bundleResult',
            data: {
                'hashes': hashes.join(','),
                'mode': 'raw'
            },
            headers: {
                'x-webview-device-token' : cookie.get( 'x-device-token' )
            },
            success: function( results ) {
                var hash;

                for ( hash in results ) {
                    hash_callback_map[ hash ]( results[ hash ] );
                }
            },
            error: function() {
                var hash;

                for ( hash in hash_callback_map ) {
                    hash_callback_map[ hash ]( null );
                }
            }
        });
    };

} );

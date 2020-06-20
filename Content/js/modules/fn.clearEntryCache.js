Air.defineFn( 'fn.clearEntryCache', function() {
    return function( url, callback ) {
        var window_vk = window.open( 'https://api.vk.com/method/pages.clearCache?url=' + url ),
            window_fb = window.open( 'https://developers.facebook.com/tools/debug/og/object/?q=' + url );

        setTimeout( function() {
            if ( window_vk && !window_vk.closed ) {
                window_vk.close();
            }

            if ( callback ) {
                callback( true );
            }
        }, 500 );
    };
} );

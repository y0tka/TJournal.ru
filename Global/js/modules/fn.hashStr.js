Air.define('fn.hashStr', function() {

    return function hashStr( str ) {
        // console.time(`hashStr ${str}`);
        var str_length = str.length,
            result = 0,
            i,
            chr;

        if ( str_length > 0 ) {
            for ( i = 0; i < str_length; i++ ) {
                chr = str.charCodeAt( i );
                result = ( ( result << 5 ) - result ) + chr;
                result |= 0;
            }
        }
        // console.timeEnd(`hashStr ${str}`);
        return result;
    };

});

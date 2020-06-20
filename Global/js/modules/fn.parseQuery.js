Air.define('fn.parseQuery', function() {

    return function( query ) {
        var result = {},
            query = query.split('&'),
            query_length,
            i,
            query_item;

        for ( i = 0, query_length = query.length; i < query_length; i++ ) {
            query[ i ] = query[ i ].split( '=' );

            result[ query[ i ][ 0 ] ] = query[ i ][ 1 ] === undefined ? true : query[ i ][ 1 ];
        }

        return result;
    };

});

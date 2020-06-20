Air.defineFn( 'fn.declineWord', function() {
    return function( num, words ) {
        var result = '';

    	num = Math.abs( num );

        if ( num.toString().indexOf( '.' ) > -1 ) {
            result = words[ 2 ];
        } else {
            result = (
                num % 10 === 1 && num % 100 !== 11
                    ? words[ 1 ]
                    : num % 10 >= 2 && num % 10 <= 4 && ( num % 100 < 10 || num % 100 >= 20)
                        ? words[ 2 ]
                        : words[ 0 ]
            );
        }

        return result;
    };
} );

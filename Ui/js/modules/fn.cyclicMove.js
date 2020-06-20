Air.defineFn( 'fn.cyclicMove', function() {
    return function( base, current, add, has_null ) {
        var result;

        if ( current === null ) {
            if ( add > 0 ) {
                result = add - 1;
            } else if ( add < 0 ) {
                result = base + add;
            }
        } else {
            result = current + add;
        }

        while ( result > base ) {
            result -= (base + 1);
        }

        while ( result < -1 ) {
            result += base + 1;
        }

        if ( has_null === true ) {
            if ( result === -1 || result === base ) {
                result = null;
            }
        } else {
            if ( result === -1 ) {
                result = base - 1;
            } else if ( result === base ) {
                result = 0;
            }
        }

        return result;
    };
} );

Air.defineFn( 'fn.random', function() {
    return function( min, max ) {
        var min = min || 0,
            max = max || Number.MAX_SAFE_INTEGER;

        return min + Math.round( Math.random() * ( max - min ) );
    };
} );

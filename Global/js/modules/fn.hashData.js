Air.defineFn('fn.hashData', 'fn.hashStr', function( hashStr ) {
    /**
     * @module hashData
     *
     * Composes digital-hash from passed data
     *
     * @param  {object} data - object to hash
     * @return {Number} hash looks like -8816650
     */
    return function hashData( data ) {
        return hashStr(JSON.stringify( data ));
    };
});

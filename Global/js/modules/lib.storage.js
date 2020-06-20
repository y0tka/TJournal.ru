/**
  * @library for working with browser local storage.
  */
Air.defineLib( 'lib.storage', {
    /**
     * Set item.
     * @param {string} name - Item name.
     * @param {string} value - Item value.
     * @param {boolean} [is_stringify=false] - True if need to stringify value.
     */
    set: function( name, value, is_stringify ) {
        if ( is_stringify === true ) {
			value = JSON.stringify( value );
		}

        try {
            localStorage.setItem( name, value );
        } catch( error ) {
            try {
                localStorage.clear();
                localStorage.setItem( name, value );
            } catch ( error ) {
                // Значит мы в инкогнито в сафари, и ничего с локалстораджем сделать нельзя
            }
        }

    },

    /**
     * Get item.
     * @param {string} name - Item name.
     * @param {boolean} [is_parse=false] - True if need to parse value.
     * @return {string} - Cookie value.
     */
    get: function( name, is_parse ) {
        var value = localStorage.getItem( name );

        if ( is_parse === true ) {
            value = JSON.parse( value );
        }

        return value;
    },

    /**
     * Remove item.
     * @param {string} name - Item name.
     */
    remove: function( name ) {
        localStorage.removeItem( name );
    },

    /**
     * Returns common length.
     */
    getLength: function() {
        return localStorage.length;
    },

    /**
     * Runs through all items.
     */
    each: function( iterator ) {
        var length = this.getLength(),
            i;

        for ( i = 0; i < length; i++ ) {
            if ( iterator( localStorage.key( i ), i, length ) === null ) {
                break;
            }
        }
    }
} );

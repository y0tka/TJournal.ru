/**
  * @library for working with browser cookies.
  */
Air.defineLib( 'lib.cookie', {
    /**
     * Set cookie.
     * @param {string} name - Cookie name.
     * @param {string} value - Cookie value.
     * @param {number} [days=0] - Shelf time in days.
     */
    set: function( name, value, days ) {
        var date,
            expires;

        if ( days ) {
            date = new Date();
            date.setTime( date.getTime() + ( days * 24 * 60 * 60 * 1000 ) );

            expires = '; expires=' + date.toGMTString();
        } else {
            expires = '';
        }

        document.cookie = name + '=' + ( value || '' ) + expires + '; path=/; domain=.' + location.hostname;
    },

    /**
     * Get cookie.
     * @param {string} name - Cookie name.
     * @return {string} - Cookie value.
     */
    get: function( name ) {
        var name_eq = name + '=',
            cookies = document.cookie.split( ';' ),
            cookies_length = cookies.length,
            i,
            cookie_item,
            cookie_item_length;

        for( i = 0; i < cookies_length; i++ ) {
            cookie_item = cookies[ i ];
            cookie_item_length = cookie_item.length;

            while ( cookie_item.charAt( 0 ) === ' ' ) {
                cookie_item = cookie_item.substring( 1, cookie_item_length );
            }

            if ( cookie_item.indexOf( name_eq ) === 0 ) {
                return cookie_item.substring( name_eq.length, cookie_item_length );
            }
        }
    },

    /**
     * Remove cookie.
     * @param {string} name - Cookie name.
     */
    remove: function( name ) {
        this.set( name, '', -1 );
    }
} );

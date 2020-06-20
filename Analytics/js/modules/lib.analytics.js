Air.defineLib( 'lib.analytics', {

    pushToDataLayer: function( data ) {
        if ( window.dataLayer !== undefined ) {
            window.dataLayer.push( data );
        }
    },

    sendDefaultEvent: function( description ) {
        if ( description ) {
            this.pushToDataLayer( {
                event: 'data_event',
                data_description: description
            } );
        }
    },

    send: function(array) {
        this.sendDefaultEvent(array.join(' — '));
    }

} );

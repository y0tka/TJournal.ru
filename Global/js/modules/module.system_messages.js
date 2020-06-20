Air.defineModule( 'module.system_messages', 'class.Socket', function( Socket ) {
    var self = this,
        socket = null;

    /**
     * Opens socket
     */
    var openSocket = function() {
        socket = new Socket( {
            url: self.config.socket_url,
            name: 'system',
            onMessage: processMessage
        } );

        socket.open();
    };

    /**
     * Closing socket
     */
    var closeSocket = function() {
		if ( socket ) {
			socket.close();
			socket = null;
		}
	};

    var processMessage = function( data ) {
        switch ( data.type ) {
            case 'static_version_changed':
                self.trigger( 'Static version changed', data.time );
            break;

            case 'new_entry':
                self.trigger( 'New entry received' );
            break;

            default:
                console.warn( 'module.system_messages: unknown message', data );
        }
    };

    self.init = function() {
        openSocket();
    };

    self.destroy = function() {
        closeSocket();
    };

} );

Air.defineModule( 'module.live_model', 'module.subsite_model, module.auth_data, class.Buffer, class.States, class.Socket', function( subsite_model, auth_data, Buffer, States, Socket ) {
    var self = this,
        states,
        buffer,
        socket = null;

    /**
     * Adds item to buffer
     */
    var newItem = function( item ) {
        if (!subsite_model.hasSubscribes() || subsite_model.isSubscribedTo(item.subsite_id)) {
            buffer.add( item );
        }
    };

    /**
     * Trigger event with new items
     */
    var flushItems = function( items ) {
        self.trigger( 'New items', items );
    };

    /**
     * Opens socket with/without token
     */
    var openSocket = function( token ) {
        socket = new Socket( {
            name: 'live' + ( token ? (':' + token) : '' ),
            onMessage: newItem
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

    /**
     * Enables/disables data receiving
     */
    self.enable = function( state ) {
        states.set( 'is_enabled', state !== false );
    };

	self.init = function() {
        states = new States();

        buffer = new Buffer( {
            delay: 100,
            onFlush: flushItems
        } );

        auth_data.on( 'Change live token', function( token ) {
			states.set( 'token', token );
		} );

		// auth_data.on( 'Notification received', newItem );

        states.on( 'is_enabled, token', function( is_enabled, token ) {
            closeSocket();

            buffer.open( is_enabled );

            if ( is_enabled ) {
                openSocket( token );
            }
        } );
    };

    /**
     * Refresh
     */
    self.refresh = function() {
    };

    /**
     * Destroy
     */
    self.destroy = function() {
        closeSocket();
        auth_data.off();
        states.destroy();
        buffer.destroy();
    };
} );

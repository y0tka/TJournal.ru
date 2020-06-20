Air.defineClass( 'class.Socket', function() {

    var Socket = function( params ) {
        this.init( params );
    };

    Socket.prototype.init = function( params ) {
        this.url = (params.url || window.__socket_url) + params.name;
        this.is_open = false;
        this.reconnect_count = 0;
        this.reconnect_timeout = null;
        // this.reconnect_count_limit = 2;

        this.handlers = {
            onMessage: params.onMessage,
            onError: params.onError
        };

        this.SocketWrapper = window.WebSocket || window.MozWebSocket;
    };

    Socket.prototype.destroy = function() {
        clearTimeout( this.reconnect_timeout );

        if ( this.socket ) {
            this.socket.onopen = null;
            this.socket.onmessage = null;
            this.socket.onclose = null;

            switch ( this.socket.readyState ) {
                case this.SocketWrapper.CONNECTING:
                case this.SocketWrapper.OPEN:
                    this.socket.close();
                    break;

                case this.SocketWrapper.CLOSING:
                case this.SocketWrapper.CLOSED:
                    // do nothing
                    break;
            }

            this.socket = null;
        }
    };

    Socket.prototype.send = function( data ) {
        var that = this;

        if ( this.socket ) {
            switch ( this.socket.readyState ) {
                case this.SocketWrapper.CONNECTING:
                    this.socket.onopen = function() {
                        that.send( data );
                    };
                    break;

                case this.SocketWrapper.OPEN:
                    this.socket.send( JSON.stringify( data ) );
                    break;

                case this.SocketWrapper.CLOSING:
                case this.SocketWrapper.CLOSED:
                    // do nothing
                    break;
            }
        }
    };

    Socket.prototype.open = function() {
        var that = this;

        if ( !this.socket ) {
            if ( this.SocketWrapper ) {
                this.socket = new this.SocketWrapper( this.url );
            } else {
                if ( this.handlers.onError ) {
                    this.handlers.onError( 'socket is unavailable' );
                }
            }

            if ( this.socket ) {
                this.socket.onmessage = function( event ) {
                    var data = JSON.parse( event.data );

                    if ( that.is_open && that.handlers.onMessage ) {
                        that.handlers.onMessage( data, event );
                    }
                };

                this.socket.onclose = function() {
                    that.reconnect();
                };
            }
        }

        if ( this.socket ) {
            this.is_open = true;
        }

        return this;
    };

    Socket.prototype.reconnect = function() {
        this.destroy();

        this.reconnect_timeout = setTimeout( this.open.bind( this ), 1000 * Math.pow( 3, this.reconnect_count++ ) );
    };

    Socket.prototype.close = function() {
        this.destroy();
    };

    return Socket;
} );

Air.defineClass( 'class.CommentsUpdates', 'class.Buffer, lib.DOM', function( Buffer, $ ) {

    function CommentsUpdates( params ) {
        this.elements = {
            main: params.element,
            counter: $.bem.find( params.element, 'counter' )
        };

        this.handlers = params.handlers || {};

        this.items = [];

        this.items_buffer = new Buffer( {
			delay: 500,
            onFlushEvery: this.add.bind( this )
		} );

        this.is_blocked = false;

        $.on( this.elements.main, 'click', this.onClick.bind( this ) );
    };

    CommentsUpdates.prototype.block = function(state) {
        this.is_blocked = state !== false;
    };

    CommentsUpdates.prototype.isBlocked = function() {
        return this.is_blocked === true;
    };

    CommentsUpdates.prototype.onClick = function() {
        if (!this.isBlocked()) {
            this.remove( this.items[ 0 ] );
        }
    };

    CommentsUpdates.prototype.delayedAdd = function( id ) {
        this.items_buffer.add( id );
    };

    CommentsUpdates.prototype.add = function( id ) {
        if ( this.items.indexOf( id ) < 0 ) {
            this.items.push( id );

            this.updateCount();

            if ( this.handlers.onAdd !== undefined ) {
                this.handlers.onAdd( id );
            }
        }
    };

    CommentsUpdates.prototype.remove = function( id, is_manual = false ) {
        var index = this.items.indexOf( id );

        if ( index >= 0 ) {
            this.items.splice( index, 1 );

            this.updateCount();

            if ( this.handlers.onRemove !== undefined ) {
                this.handlers.onRemove( id, is_manual );
            }
        }
    };

    CommentsUpdates.prototype.show = function( state ) {
        $.bem.toggle( this.elements.main, 'shown', state );
    };

    CommentsUpdates.prototype.zero = function( state ) {
        $.bem.toggle( this.elements.main, 'zero', state );
    };

    CommentsUpdates.prototype.updateCount = function() {
        this.setCount( this.items.length );
    };

    CommentsUpdates.prototype.setCount = function( value ) {
        $.text( this.elements.counter, value );

        this.zero( value === 0 );
    };

    CommentsUpdates.prototype.destroy = function() {
        $.off( this.elements.main );
        this.items_buffer.destroy();
    };

    /*
    CommentsUpdates.prototype. = function() {

    };
    */

    return CommentsUpdates;

} );

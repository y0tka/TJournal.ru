Air.defineClass( 'class.Buffer', 'class.Timer', function( Timer ) {

    var Buffer = function( params ) {
        this.init( params );
    };

    Buffer.prototype.init = function( params ) {
        this.is_open = true;
        this.delay = params.delay || 100;

        this.onFlush = params.onFlush;
        this.onFlushEvery = params.onFlushEvery;

        this.timer_flush = new Timer( this.flush.bind( this ) );

        this.clear();
    };

    Buffer.prototype.destroy = function() {
        this.timer_flush.reset();
        this.clear();
    };

    Buffer.prototype.add = function( item ) {
        if ( this.is_open === true ) {
            this.items[ this.items_length++ ] = item;
            this.timer_flush.debounce( this.delay );
        }
    };

    Buffer.prototype.clear = function( item ) {
        this.items = [];
        this.items_length = 0;
    };

    Buffer.prototype.flush = function() {
        var items_length = this.items_length,
            i,
            sliced_items = this.items.slice();

        this.timer_flush.reset();

        if ( this.onFlush !== undefined ) {
            this.onFlush( sliced_items, items_length );
        }

        if ( this.onFlushEvery !== undefined ) {
            for ( i = 0; i < items_length; i++ ) {
                this.onFlushEvery( sliced_items[ i ], i, items_length );
            }
        }

        this.clear();
    };

    Buffer.prototype.open = function( state ) {
        this.is_open = state !== false;

        if ( this.is_open === false ) {
            this.destroy();
        }
    };

    /*
    Buffer.prototype. = function() {

    };
    */

    return Buffer;

} );

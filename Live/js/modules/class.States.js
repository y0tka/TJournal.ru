Air.defineClass( 'class.States', 'lib.string', function( lib_string ) {

    var States = function( initial_values ) {
        this.init( initial_values || {} );
    };

    States.prototype.init = function( initial_values ) {
        var name;

        this.states = {};
        this.handlers = [];
        this.handlers_length = 0;

        for ( name in initial_values ) {
            this.set( name, initial_values[ name ] );
        }
    };

    States.prototype.destroy = function() {
        this.states = null;
        this.handlers = null;
    };

    States.prototype.on = function( states, fn ) {
        this.handlers[ this.handlers_length++ ] = {
            fn: fn,
            states: lib_string.listToArray( states )
        };

        this.useHandler( this.handlers[ this.handlers_length - 1 ] );
    };

    States.prototype.useHandler = function( handler ) {
        var that = this,
            values,
            is_all_values_defined = true;

        values = handler.states.map( function( name ) {
            var value = that.get( name );

            if ( value === undefined ) {
                is_all_values_defined = false;
            }

            return value;
        } );

        if ( is_all_values_defined === true ) {
            handler.fn.apply( null, values );
        }
    };

    States.prototype.handleStateChange = function( name ) {
        var that = this,
            i;

        for ( i = 0; i < this.handlers_length; i++ ) {
            if ( this.handlers[ i ].states.indexOf( name ) >= 0 ) {
                this.useHandler( this.handlers[ i ] );
            }
        }
    };

    States.prototype.set = function( name, value ) {
        if ( this.get( name ) !== value ) {
            this.states[ name ] = value;
            this.handleStateChange( name );
        }
    };

    States.prototype.get = function( name ) {
        return this.states[ name ];
    };

    /*
    States.prototype. = function() {

    };
    */

    return States;

} );

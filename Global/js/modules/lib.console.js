Air.defineLib( 'lib.console', 'fn.toArray', function(toArray) {

    return {

        defined: {},

        timings: {},

        default_color: '#000',

        define: function( name, label, color ) {
            if ( this.defined[ name ] === undefined ) {
                this.defined[ name ] = {
                    label: label,
                    color: color === undefined ? this.default_color : color
                };
            } else {
                console.warn( `lib.console: "${name}" already defined:`, this.defined[ name ] );
            }
        },

        msg: function(type, args) {
            var args = toArray( args ),
                name = args.shift(),
                log = this.defined[ name ];

            if ( log !== undefined ) {
                args.unshift( `color: ${this.default_color};` );
                args.unshift( log.label );
                args.unshift( `color: ${log.color};` );
                args.unshift( '%c%s%c' );

                console[type].apply( console, args );
            } else {
                console.warn( `lib.console: "${name}" is not defined` );
            }
        },

        log: function() {
            this.msg('log', arguments);
        },

        warn: function() {
            this.msg('warn', arguments);
        },

        error: function() {
            this.msg('error', arguments);
        },

        time: function(name, label) {
            this.timings[name + label] = Date.now();
        },

        timeEnd: function(name, label) {
            var time_start = this.timings[name + label],
                time_end = Date.now(),
                log;

            if (time_start === undefined) {
                console.warn(`lib.console: there's no timer for "${name}" with label "${label}"`);
            } else {
                log = this.defined[ name ];

                if (log == undefined) {
                    console.warn( `lib.console: "${name}" is not defined` );
                } else {
                    this.msg('log', [name, label + ':', time_end - time_start + 'ms']);
                }
            }
        },

        assert: function() {
            console.assert.apply(console, arguments);
        }

    };

} );

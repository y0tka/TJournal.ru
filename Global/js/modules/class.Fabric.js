Air.defineClass( 'class.Fabric', 'class.Collection, class.ScrollManager, module.DOM, class.AnimationFrame, class.Timer', function( Collection, ScrollManager, DOM, AnimationFrame, Timer, util ) {

    var Fabric = function( parameters ) {
        var that = this,
            events = {};

        this.DOM = util.inherit( DOM );
        this.timer = new Timer(this.stopAnimationFrame.bind(this));

        this.selector = parameters.selector || ( '[air-module="' + parameters.module_name + '"]' );

        this.collection = new Collection( {
            create: function( element ) {
                return new parameters.Constructor( {
                    element: element,
                    controlling_module: parameters.controlling_module
                } );
            },
            refresh: function( element, created ) {
                created && created.refresh && created.refresh();
            },
            destroy: function( element, created ) {
                created && created.destroy && created.destroy();
                created = null;
            }
        } );

        parameters.onVisible = parameters.onVisibleMethod || parameters.onVisible;

        if ( parameters.onVisible || parameters.onUniqueVisible ) {

            if ( parameters.onVisible ) {
                events.onEnterOrLeave = function ( objects ) {

                    objects.forEach( function( object ) {
                        that.collection.getByElement( object.element )[ parameters.onVisible ]( object.visible );
                    } );
                };
            }

            this.scroll_manager = new ScrollManager( {
                selector: this.selector,
                offset: parameters.offset || 0,
                throttle: parameters.throttle || 0,
                debounce: parameters.debounce || 0,
                events: events
            } );
        }

        if ( parameters.onScroll ) {
            this.DOM.on( 'Window scroll', function() {
                that.collection.each( function( element, created ) {
                    created[ parameters.onScroll ]();
                } );
            } );
        }

        if ( parameters.onResize ) {
            this.DOM.on( 'Window resize', function() {
                that.collection.each( function( element, created ) {
                    created[ parameters.onResize ]();
                } );
            } );
        }

        if ( parameters.onHighPerformanceScroll ) {

            that.animation_frame = new AnimationFrame(function(){
                that.collection.each( function( element, created ) {
                    created[ parameters.onHighPerformanceScroll ]();
                } );
            });

            this.DOM.on('Window scroll', function() {
                that.animation_frame.start();

                that.timer.throttle(100);
            });

        }

        this.update();
    };

    Fabric.prototype.stopAnimationFrame = function() {
        this.animation_frame.stop();
    };

    Fabric.prototype.update = function() {
        // if (this.selector === '[air-module*="module.date"]') {
        //     _log('before update',this.collection.getElements().slice());
        // }
        this.collection.update( this.selector );
        // if (this.selector === '[air-module*="module.date"]') {
        //     _log('after update',this.collection.getElements().slice());
        // }


        if ( this.scroll_manager ) {
            this.scroll_manager.cacheObjects();
        }
    };

    Fabric.prototype.clear = Fabric.prototype.destroy = function() {
        this.collection.clear();

        if ( this.scroll_manager ) {
            this.scroll_manager.destroy();
        }

        this.DOM.off();
    };

    Fabric.prototype.each = function( iterator ) {
        this.collection.each( iterator );
    };

    Fabric.prototype.getInstances = function() {
        return this.collection.getInstances();
    };

    return Fabric;
} );

/**
 * Сейчас используется только рекламщиками. Остальная аналитика – в GTM
 */
Air.defineModule( 'module.analytics_events', 'class.Fabric, lib.DOM, lib.analytics', function( Fabric, $, lib_analytics ) {
    var self = this,
        fabric;

    var Events = function( params ) {
        this.init( params );
    };

    Events.prototype.init = function( params ) {
        var that = this;

        this.element = params.element;
        this.name = $.data( this.element, 'analytics' );
        this.was_activated = false;

        this.send( 'Load' );

        $.on( this.element, 'click.module_analytics_events', function() {
            that.send( 'Click' );
        } );
    };

    Events.prototype.destroy = function() {
        $.off( this.element, 'click.module_analytics_events' );
    };

    Events.prototype.send = function( action ) {
        lib_analytics.sendDefaultEvent( this.name + ' — ' + action );
    };

    Events.prototype.activate = function() {
        if ( this.was_activated === false ) {
            this.send( 'Show' );
            this.was_activated = true;
        }
    };

    /*
    Events.prototype. = function() {

    };
    */

    self.init = function() {
        fabric = new Fabric( {
            selector: '[data-analytics]',
            Constructor: Events,
            onVisible: 'activate',
            debounce: 1000
        } );
    };

    self.refresh = function() {
        fabric.update();
    };

    self.destroy = function() {
        fabric.destroy();
    };
} );

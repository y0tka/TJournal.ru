Air.defineModule('module.date', 'class.Fabric, class.Timer, lib.date, lib.DOM', function(Fabric, Timer, lib_date, $) {
    var self = this,
        fabric,
        timer_checkTime;

    var Date = function( params ) {
        this.init( params );
    };

    Date.prototype.init = function( params ) {
        this.element = params.element;
        this.timestamp = parseInt( $.attr( this.element, 'air-date-timestamp' ) ) || 0;
        this.is_short = $.attr( this.element, 'air-date-short' ) === 'true';
        this.date = lib_date.timestampToDate( this.timestamp );

        this.checkTime();
    };

    Date.prototype.destroy = function() {
        this.element = null;
        this.date = null;
    };

    Date.prototype.checkTime = function() {
        var new_time = lib_date.getPassedTime( this.date, this.is_short );

        if (this.last_passed_time !== new_time) {
            $.html( this.element, new_time.replace( /\s/g, '&nbsp;' ) );

            this.last_passed_time = new_time;
        }
    };

    var checkTime = function() {
        fabric.each( function( element, instance ) {
            instance.checkTime();
        } );
    };

    /**
     * Init
     */
    this.init = function() {
        fabric = new Fabric({
            module_name: 'module.date',
            Constructor: Date
        });

        timer_checkTime = new Timer( checkTime );
        timer_checkTime.start( 30 * 1000, false );
    };

    /**
     * Refresh
     */
    this.refresh = function() {
        fabric.update();
    };

    /**
     * Destroy
     */
    this.destroy = function() {
        timer_checkTime.destroy();
        fabric.destroy();
    };
});

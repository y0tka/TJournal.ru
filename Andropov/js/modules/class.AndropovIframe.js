Air.define( 'class.AndropovIframe', 'lib.DOM', function( $ ) {

    function AndropovIframe( element ) {
        this.$dom = {
            main: element,
            iframe: null
        };

        this.data = {
            src: $.data( element, 'iframe-src' ),
            service: $.data( element, 'iframe-service' )
        };

        this.all_classes = this.classname + '--status-loading ' + this.classname + '--status-loaded';

        this.setStatus( 'deactivated' );
    };

    AndropovIframe.prototype.setStatus = function( status ) {
        if ( this.current_status !== status ) {
            this.current_status = status;

            $.removeClass( this.$dom.main, this.all_classes );

            if ( this.current_status !== 'deactivated' ) {
                $.bem.add( this.$dom.main, 'status-' + this.current_status );
            }
        }
    };

    AndropovIframe.prototype.getSrc = function() {
        switch (this.data.service) {
            case 'instagram':
                return `${this.data.src}/embed`;

            default:
                return this.data.src;
        }
    };

    AndropovIframe.prototype.loadIframe = function() {
        var that = this;

        if ( this.$dom.iframe === null ) {
            this.setStatus( 'loading' );

            this.$dom.iframe = $.create( 'iframe' );

            $.one( this.$dom.iframe, 'readystatechange', function() {
                if (that.$dom.iframe.readyState === 'interactive') {
                    that.setStatus( 'loaded' );
                }
            } );

            $.attr( this.$dom.iframe, 'allowFullScreen', 'allowFullScreen' );

            $.attr( this.$dom.iframe, 'src', this.getSrc() );

            $.append( this.$dom.main, this.$dom.iframe );
        }
    };

    AndropovIframe.prototype.removeIframe = function() {
        if ( this.$dom.iframe !== null ) {
            $.off( this.$dom.iframe );
            $.remove( this.$dom.iframe );

            this.$dom.iframe = null;

            this.setStatus( 'deactivated' );
        }
    };

    AndropovIframe.prototype.onVisible = function( state ) {
        if ( state === true ) {
            this.loadIframe();
        }
    };

    /**
     * Sets an Iframe height if we know it
     * Uses on Instagram that sends a PostMessage with own height
     * @param {number|string} height
     */
    AndropovIframe.prototype.setHeight = function( height ) {
        this.$dom.iframe.style.height = `${parseInt(height, 10)}px`;
    };

    AndropovIframe.prototype.destroy = function() {
        this.removeIframe();

        this.$dom = null;
        this.data = null;
    };

    return AndropovIframe;

} );

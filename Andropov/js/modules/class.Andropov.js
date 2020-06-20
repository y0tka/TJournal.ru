Air.define( 'class.Andropov', 'class.AndropovIframe, class.AndropovVideo, class.AndropovImage, lib.DOM, lib.console', function( AndropovIframe, AndropovVideo, AndropovImage, $, console ) {

    function Andropov( params ) {
        this.instance = this.createInstance( params.element, $.data( params.element, 'andropov-type' ) );
    };

    Andropov.prototype.createInstance = function( element, type ) {
        var InstanceConstructor = null;

        switch ( type ) {
            case 'video':
                InstanceConstructor = AndropovVideo;
                break;

            case 'image':
                InstanceConstructor = AndropovImage;
                break;

            case 'iframe':
                InstanceConstructor = AndropovIframe;
                break;

            default:
                console.warn( 'andropov', `Unknown Andropov type "${type}"`, element );
        }

        if ( InstanceConstructor === null ) {
            return null;
        } else {
            return new InstanceConstructor( element );
        }
    };

    Andropov.prototype.onVisible = function( state ) {
        if ( this.instance !== null && this.instance.onVisible !== undefined ) {
            this.instance.onVisible( state );
        }
    };

    Andropov.prototype.destroy = function() {
        if ( this.instance !== null ) {
            this.instance.destroy();
        }
    };

    /**
     * Call a method on the instance
     * @param {string} name - method name
     * @param {*} params - method parametres
     */
    Andropov.prototype.callMethod = function(name, params) {
        if ( this.instance !== null && this.instance[name] !== undefined ) {
            this.instance[name].call(this.instance, params);
        }
    };

    return Andropov;

} );

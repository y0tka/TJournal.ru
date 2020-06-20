Air.defineClass( 'class.EntryPage', 'module.location, module.metrics, module.smart_ajax, class.Timer, lib.DOM', function( module_location, metr, smart_ajax, Timer, $ ) {
    var EntryPage = function(params) {
        this.init(params);
    };

    EntryPage.prototype.init = function(params) {
        var that = this;

        this.element = params.element;
        this.id = $.attr( params.element, 'air-entry-id' );
        this.type = $.attr( params.element, 'air-entry-type' );
        this.title = $.attr( params.element, 'air-entry-title' );

        this.element_shares = $.find( this.element, '.entry_footer__shares' );

        if ( this.type === 'full' ) {
            this.searchAndRewriteLinks();
        }
    };

    EntryPage.prototype.destroy = function() {
    };

    EntryPage.prototype.rewriteLink = function( link ) {
        if (module_location.isOnlyHashChanged( link.href )) {
            $.attr( link, 'target', null );
        }
    };

    EntryPage.prototype.searchAndRewriteLinks = function() {
        $.findAll( this.element, '.b-article a' ).forEach( this.rewriteLink );
    };

    EntryPage.prototype.getData = function() {
        var data_element = $.find( this.element, '.entry_data' );

        return JSON.parse( $.html( data_element ) );
    };

    EntryPage.prototype.hideShares = function( state ) {
        if ( this.element_shares ) {
            $.bem.toggle( this.element_shares, 'hidden', state );
        }
    };

    EntryPage.prototype.activate = function( state ) {
        switch ( this.type ) {
            case 'short':
                break;

            case 'full':
                if ( metr.breakpoint === 'mobile' ) {
                    this.hideShares( !state );
                }
        }
    };

    return EntryPage;
} );

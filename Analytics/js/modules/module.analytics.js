Air.defineModule( 'module.analytics', 'module.delegator, module.entry, module.ajaxify, module.location, lib.DOM, lib.analytics, lib.console', function( delegator, entry, ajaxify, module_location, $, lib_analytics, console ) {
    var self = this;

    /**
     * Hit all the events after page changes.
     */
    self.hit = function() {
        var data_to_send = {
                event: 'Page — View',
                url: decodeURIComponent( module_location.getPath() ),
                title: document.title,
                section: delegator.getData( 'navigation_name' )
            },
            entry_data = entry.getData(),
            path_components = module_location.getPathComponents();

        if ( entry_data ) {
            data_to_send.post_details = {
                contentGroup1: 'Материалы',
                author: {
                    name: entry_data.author_name,
                    type: entry_data.author_type
                },
                tags: entry_data.tags,
                comments: entry_data.comments,
                rating: entry_data.likes,
                favorites: entry_data.favorites,
                sponsored: entry_data.is_advertisement,
                section: entry_data.navigation_name
            };

            data_to_send.tags = entry_data.tags;
        } else {
            data_to_send.post_details = {};

            if ( path_components[ 0 ] === 'category' ) {
                data_to_send.tags = [ decodeURIComponent( path_components[ 1 ] ) ];
            } else {
                data_to_send.tags = [];
            }
        }

        console.log( 'ana', 'Hit', data_to_send );

        lib_analytics.pushToDataLayer( data_to_send );
    };

    self.init = function() {
        console.define( 'ana', 'Analytics ʕ•ᴥ•ʔ', '#FF934F' );

        $.delegateEvent(document, '[data-gtm]', 'click.module_analytics', function( event, el ) {
            lib_analytics.sendDefaultEvent( $.data( el, 'gtm' ) );
        } );

        ajaxify.on( 'Build finished', self.hit );

        self.hit();
    };

    self.refresh = function() {
    };

    self.destroy = function() {
        $.off(document, 'click.module_analytics');
        ajaxify.off();
    };
} );

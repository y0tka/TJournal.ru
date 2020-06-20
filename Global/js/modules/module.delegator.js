Air.define( 'module.delegator', 'module.smart_ajax, module.adblock_detector', function(smart_ajax, adblock, util ) {
    var self = this;

    self.getData = function( key ) {
        return self.delegated_data[ key ];
    };

    self.init = function( callback ) {
        smart_ajax.post( {
            url: '/initialData',
            data: {
                adblock_state: adblock.state
            },
            success: function (data) {
                util.delegateData( data, true );

                /* ACHTUNG: "recieved" has typo! (recEIved) */
                self.triggerOnce('Initial data recieved new delegated data');
            }
        } );
    };

});

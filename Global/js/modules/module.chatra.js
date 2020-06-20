Air.defineModule( 'module.chatra', 'lib.DOM, module.auth_data', function($, auth_data, util ) {

    var self = this,
        is_required = false;

    self.use = function( callback ) {
        var user_data;

        if ( is_required === false ) {
            window.ChatraID = 'w5gE7FKwhd74dyM4k';

            user_data = auth_data.get();

            window.ChatraSetup = {
                startHidden: true
            };

            if (user_data) {
                window.ChatraIntegration = {
                    name: user_data.name,
                    clientId: user_data.hash
                };
            }

            util.requireScript( '//call.chatra.io/chatra.js', function( status ) {
                is_required = status;
                self.use( callback );
            } );
        } else {
            callback( window.Chatra !== undefined ? window.Chatra : null );
        }
    };

    self.init = function() {
        self.use( function( chatra ) {

            var group_id = $.find('[data-chatra-group-id]');

            if (group_id) {
                group_id = $.data(group_id, 'chatra-group-id');
            } else {
                group_id = null;
            }

            chatra('setGroupId', group_id);

            chatra('show');
        } );
    };

    self.refresh = function() {

    };

    self.destroy = function() {
        self.use( function( chatra ) {
            chatra('hide');
        } );
    };

} );

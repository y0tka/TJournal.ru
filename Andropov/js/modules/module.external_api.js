Air.defineModule( 'module.external_api', function( util ) {
    var self = this;

    self.status = function( name, value ) {
        if ( !self.apis[ name ] ) {
            self.apis[ name ] = {};
        }

        if ( value !== undefined ) {
            self.apis[ name ].status = value;
        } else {
            return self.apis[ name ].status;
        }
    };

    self.requireApi = function( name, source, alias, callback ) {
        var status = self.status( name );

        switch ( status ) {
            case undefined:
                self.status( name, 'requiring' );

                util.requireScript( source, function( state ) {
                    if ( state === true ) {
                        self.status( name, 'required' );
                    } else {
                        self.status( name, 'failed' );
                    }

                    self.requireApi.call( self, name, source, alias, callback );
                } );
                break;

            case 'requiring':
            case 'initializing':
                setTimeout( self.requireApi, 300, name, source, alias, callback );
                break;

            case 'failed':
                callback( null, name, status );
                break;

            case 'required':
            case 'ready':
                callback( window[ alias ] === undefined ? null : window[ alias ], name, status );
                break;
        }
    };

    self.youtube = function( callback ) {
        self.requireApi( 'youtube', '//youtube.com/iframe_api', 'YT', function( api, name, status ) {
            if ( api ) {
                if ( status === 'required' ) {
                    self.status( name, 'initializing' );

                    window.onYouTubePlayerAPIReady = function() {
                        self.status( name, 'ready' );
                        callback( api );
                    };
                } else if ( status === 'ready' ) {
                    callback( api );
                }
            } else {
                callback( false );
            }
        } );
    };

    self.vimeo = function( callback ) {
        self.requireApi( 'vimeo', '//player.vimeo.com/api/player.js', 'Vimeo', function( api, name ) {
            if ( api ) {
                self.status( name, 'ready' );
                callback( api );
            } else {
                callback( false );
            }
        } );
    };

    self.vkontakte = function( callback ) {
        self.requireApi( 'vkontakte', '//vk.com/js/api/openapi.js?139', 'VK', function( api, name ) {
            if ( api ) {
                self.status( name, 'ready' );
                callback( api );
            } else {
                callback( false );
            }
        } );
    };

    self.facebook = function( callback ) {
        self.requireApi( 'facebook', '//connect.facebook.net/en_US/all.js#xfbml=1&appId=332184693843772&version=v2.0"', 'FB', function( api, name ) {
            if ( api ) {
                self.status( name, 'ready' );
                callback( api );
            } else {
                callback( false );
            }
        } );
    };

    self.twitter = function( callback ) {
        self.requireApi( 'twitter', '//platform.twitter.com/widgets.js', 'twttr', function( api, name, status ) {
            if ( api ) {
                if ( status === 'required' ) {
                    self.status( name, 'initializing' );

                    api.ready( function() {
                        self.status( name, 'ready' );
                        callback( api );
                    } );
                } else if ( status === 'ready' ) {
                    callback( api );
                }
            } else {
                callback( false );
            }
        } );
    };

    self.instagram = function( callback ) {
        self.requireApi( 'instagram', '//platform.instagram.com/en_US/embeds.js', 'instgrm', function( api, name ) {
            if ( api ) {
                self.status( name, 'ready' );
                callback( api );
            } else {
                callback( false );
            }
        } );
    };

    self.init = function() {
        self.apis = {};
    };
} );

Air.defineClass('class.QuizModel', 'module.quiz_model, module.smart_ajax, lib.cookie, module.auth_data, fn.mobileAppSend', function(quiz_model, smart_ajax, cookie, auth_data, mobileAppSend) {

    const platforms = {
        ANDROID : 'android',
        IOS     : 'ios'
    };

    /**
     * @param params
     * @constructor
     */
    let QuizModel = function(params) {

        this.hash = params.hash;
        this.entryId = params.entryId;
        this.uid  = params.uid;
        this.urls = params.urls;
        this.handlers = params.handlers;

        this.init();
    };

    /**
     * Checks quiz to show the user options or answers
     */
    QuizModel.prototype.init = function() {

        let self = this;

        if (!auth_data.isAuthorized()) {
            self.handlers.onLoaded( false, {} );
            return;
        }

        let deviceToken = cookie.get( 'x-device-token' ),
            userAgent = cookie.get( 'User-Agent' ),
            fingerPrint = cookie.get('fingerprint'),
            isWeb = false;

        if ( (!deviceToken || !userAgent) && fingerPrint) {
            isWeb = true;
        }

        /**
         * @todo Выпилить в будущем
         */
        if (fingerPrint && !isWeb) {
            let [deviceInfo, version] = userAgent ? userAgent.split('/') : '',
                needStub = true;

            if (deviceInfo && version) {

                let [site, platform] = deviceInfo.split('-'),
                    [major, minor, patch] = version.split('.');

                switch (platform) {
                    case platforms.ANDROID:

                        if (parseInt(major) >= 4 && parseInt(patch) >= 8) {
                            needStub = false;
                        }

                        break;

                    case platforms.IOS:

                        if (site === 'Tjournal') {

                            if ( parseInt(major) >= 4 && parseInt(patch) >= 10 ) {
                                needStub = false;
                            }

                        }

                        if (site === 'vc') {

                            if ( parseInt(major) >= 3 && parseInt(minor) >= 5 && parseInt(patch) >= 2 ) {
                                needStub = false;
                            }
                        }

                        if (site === 'DTF') {

                            if ( parseInt(major) >= 1 && parseInt(minor) >= 1 && parseInt(patch) >= 8 ) {
                                needStub = false;
                            }
                        }

                        break;
                }

            }

            // show Stub if application is old
            if (needStub) {
                self.handlers.oldVersion();
                return;
            }

        }

        quiz_model.getResult( self.hash, function( result ) {
            if ( result ) {
                if ( result.userVoted ) {
                    self.handlers.onLoaded( true, result);
                } else {
                    self.handlers.onLoaded( false, {} );
                }
            } else {
                self.handlers.onError();
            }
        } );

    };

    /**
     * Handle item click
     */
    QuizModel.prototype.vote = function(itemId = '') {

        let self = this,
            votingUrl = self.urls.vote;

        if (itemId !== '') {
            votingUrl = votingUrl + '/' + itemId;
        }

        let deviceToken = cookie.get( 'x-device-token' );

        self.handlers.onVoting();

        smart_ajax.post( {
            url : votingUrl,
            data : {
                'mode' : 'raw'
            },
            headers : {
                'x-webview-device-token' : deviceToken
            },
            success : function(results) {

                if ( !results.userVoted ) {
                    self.handlers.onLoaded( false, {} );
                } else {
                    self.handlers.onLoaded( true, results);
                }
            },
            error : function(response, code) {

                self.handlers.onError();

                // for mobile devices
                if (code === 401) {
                    mobileAppSend('unauthorized_click', 'quiz');
                }
            }
        });

    };

    QuizModel.prototype.destroy = function() {

        this.hash = null;
        this.entryId = null;
        this.uid  = null;
        this.urls = null;
        this.handlers = null;

    };

    return QuizModel;

} );

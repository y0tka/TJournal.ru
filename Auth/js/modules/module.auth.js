Air.define('module.auth', 'lib.DOM, module.DOM, module.auth_data, module.auth_form, module.smart_ajax, module.ajaxify, lib.analytics, module.notify', function ($, DOM, auth_data, auth_form, smart_ajax, ajaxify, lib_analytics, notify, util) {
    var self = this;

    self.log = util.consoleMessage( '#0000ff', 'AUTH', 'log' );

    self.showAuth = function (options = {}) {
        auth_form.show({
            data: options.data,
            callback: function () {
                auth_data.update(function () {
                    if (options.callback) {
                        options.callback(auth_data.isAuthorized());
                    }
                });
            }
        });
    };

    self.sendUserDataToAnalytics = function () {
        var user_data = auth_data.get(),
            data = {};

        if ( user_data ) {
            data.id = user_data.id;
            data.date = user_data.createdRFC;
            data.banned = user_data.is_banned;

            if ( user_data.is_paid !== undefined ) {
                data.paid_user = user_data.is_paid === true;

                if ( data.paid_user ) {
                    data.paid_till_date = user_data.paid_till_date;
                }
            }
        }

        lib_analytics.pushToDataLayer( {
            event: 'User — Init',
            user_data: data
        } );
    };

    self.isSuperuser = function () {
        console.warn('Oops! Method "isSuperuser" of module "auth" is no longer exist.');
        return false;
    };

    self.getData = function () {
        console.warn('Oops! Method "getData" of module "auth" is no longer exist.');
        return false;
    };

    self.checkAdvanced = function () {
        console.warn('Oops! Method "checkAdvanced" of module "auth" is no longer exist.');
        return false;
    };

    self.init = function () {
        DOM.on('show_auth', function (data) {
            self.showAuth({
                callback: function (is_authorized) {
                    if (is_authorized && data.data.need_reload) {
                        ajaxify.reload();
                    }
                }
            });
        });

        DOM.on('auth_social_buttons:click', function (data) {
            var social = $.data(data.el, 'social');

            auth_form.signinBySocial( social, function (state) {
                if (state) {
                    auth_form.hide();
                } else {
                    notify.error('Ошибка авторизации');
                }
            });
        });

        DOM.on('auth_logout:click', function (data) {
            smart_ajax.post( {
                url: '/auth/logout',
                data: {
                    mode: 'raw'
                },
                success: function () {
                    document.location = '/';
                }
            });
        });

        smart_ajax.addResponseCodeHandler( 401, function ( callback ) {
            self.showAuth( {
                callback: function ( is_authorized ) {
                    if ( is_authorized ) {
                        callback( 'repeat' );
                    } else {
                        callback( 'error' );
                    }
                }
            } );
        } );

        smart_ajax.addResponseCodeHandler( 403, function ( callback ) {
            callback( 'error' );
        } );

        ajaxify.addResponseCodeHandler( 401, function ( callback ) {
            self.showAuth( function ( is_authorized ) {
                if ( is_authorized ) {
                    callback('repeat');
                } else {
                    callback('error');
                }
            } );
        } );

        ajaxify.addResponseCodeHandler( 403, function ( callback ) {
            callback( 'error' );
        } );

        auth_form.on('Logged in with email', function () {
            auth_data.update(function () {
                auth_form.hide();
            }, 'email');
        });

        auth_form.on('New password set', function () {
            auth_data.update(function () {
                auth_form.hide();

                notify.success( resp.rm );
            });
        });

        // Окно авторизации
        auth_form.on( 'Login popup shown', function () {
            lib_analytics.sendDefaultEvent( 'Login Window — Shown' );
        });

        // Авторизация
        auth_data.on( 'Login', function ( data ) {
            lib_analytics.sendDefaultEvent( data.login_method.toUpperCase() + ' Login — Init' );
        });

        // Регистрация
        auth_data.on( 'Join', function ( data ) {
            lib_analytics.pushToDataLayer( {
                event: 'User — Registration',
                user_data: {
                    id: data.id,
                    date: data.createdRFC,
                    method: data.login_method
                }
            } );
        });

        ajaxify.on( 'Build finished', self.sendUserDataToAnalytics );

        auth_data.on('Change', function (user_data) {
            auth_form.changeState(user_data);
        });

        auth_data.set(self.delegated_data);

        self.sendUserDataToAnalytics();
    };
});

Air.define('module.auth_data', 'lib.DOM, module.smart_ajax, class.Socket, module.etc_controls, module.modal_window, module.notify', function($, smart_ajax, Socket, etc_controls, modal_window, notify, util) {
    var self = this,
        user_data = false,
        user_socket,
        timer_updateLiveToken;

    self.unlinkSocial = function(social_id, social_type, callback) {
        smart_ajax.post( {
            url: '/users/settings/unlink',
            data: {
                id: social_id,
                type: social_type,
                mode: 'raw'
            },
            success: function() {
                if ( callback ) {
                    callback( true );
                }
            },
            error: function( error ) {
                if ( callback ) {
                    callback( false, error );
                }
            }
        } );
    };

    /**
     * @param {Object}  data                 — user data
     * @param {string}  data.createdRFC      - registration date in RFC. Example: "Mon, 15 May 2017 17:38:46 +0300"
     * @param {Number}  data.id              - user id. Example: 17005
     * @param {string}  data.login_method    - authentication method. Example: "tw"
     * @param {string}  data.name            - "Peter Savchenko"
     */
    self.set = function(data) {
        if ( !data || ( data.id === undefined ) ) {
            data = false;
        }

        user_data = data;

        if ( user_data && user_data.login_method ) {
            if ( Date.now() / 1000 - user_data.created < 60 ) {
                self.triggerOnce( 'Join', user_data );
            }

            self.triggerOnce( 'Login', user_data );
        }

        self.triggerOnce( 'Change', user_data );

        self.setLiveToken( {
            token: false, // ВНИМАНИЕ! Сейчас мы подписываем всех пользователей на публичный лайв, но нужно что-то с этим делать
            expires: 0
        } );

        if ( user_data && !user_socket ) {
            user_socket = new Socket( {
                name: this.getUserHash(),
                onMessage: function( message ) {
                    switch ( message.type ) {
                        case 'notification': // для колокольчика
                            self.triggerChain( 'User notifications changed', message );
                            break;

                        default: // уведомления, которые отобразятся в лайве
                            self.triggerChain( 'Notification received', message );

                    }
                }
            } );

            user_socket.open();
        }
    };

    self.getUserHash = function() {
        if (user_data) {
            return user_data.hash;
        } else {
            return null;
        }
    };

    self.userHashIs = function(hash) {
        return hash === self.getUserHash();
    };

    self.get = function() {
        return user_data;
    };

    self.check = function(callback) {
        smart_ajax.get( {
            url: '/auth/check',
            data: {
                mode: 'raw'
            },
            ignore_error_notify: true,
            success: function( data ) {
                if ( callback ) {
                    callback( data );
                }
            },
            error: function( error ) {
                if ( callback ) {
                    callback( false, error );
                }
            }
        } );
    };

    self.update = function (callback, login_method) {

        self.check(function (user_data) {

            if (login_method !== undefined) {
                user_data.login_method = login_method;
            }

            self.set(user_data);

            if (callback) {
                callback();
            }

        });
    };

    self.updateLiveToken = function() {
        smart_ajax.get( {
            url: '/live/token/update',
            data: {
                mode: 'raw'
            },
            success: self.setLiveToken
        });
    };

    self.setLiveToken = function( data ) {
        if ( data && data.expires > 0 ) {
            clearTimeout( timer_updateLiveToken );

            timer_updateLiveToken = setTimeout( self.updateLiveToken, ( data.expires * 1000 - Date.now() ) );
            // self.log( 'Token will be updated in %s seconds', Math.round( data.expires - Date.now() / 1000 ) );
        }

        self.triggerOnce( 'Change live token', data.token );
    };

    self.isMe = function( id ) {
        return user_data ? user_data.id == id : false;
    };

    self.isAuthorized = function () {
        return self.get() !== false;
    };

    self.banUser = function( data, callback ) {

        modal_window.show({
            name: 'ban',
            data: {
                remove_comments: data.remove_comments || false
            },
            onClose: function (status, modal_data) {
                if (status) {

                    smart_ajax.post( {
                        url: '/ban/subsite/'+ data.id + (data.subsite_id ? '/' + data.subsite_id : ''),
                        data: {
                            days: modal_data.days || 0,
                            reason_text: modal_data.reason_text,
                            also_remove_comments_and_contents: data.remove_comments || false
                        },
                        success: function() {
                            if ( callback ) {
                                callback( true );
                            }
                            notify.success( 'Пользователь забанен' );
                        },
                        error: function( error ) {
                            if ( callback ) {
                                callback( false, error );
                            }
                            notify.error( 'Не удалось забанить пользователя (' + error + ')' );
                        }
                    });

                }
            }
        });

    };

    self.unbanUser = function( data, callback ) {

        modal_window.show({
            name: 'confirm',
            data: {
                title: 'Разбанить?',
                text: 'Уверены, что хотите разбанить этого пользователя?',
                button_yes: 'Да',
                button_no: 'Нет'
            },
            onClose: function (status, modal_data) {
                if (status) {

                    smart_ajax.post( {
                        url: '/unban/subsite/'+ data.id,
                        success: function() {
                            if ( callback ) {
                                callback( true );
                            }
                            notify.success( 'Пользователь разбанен' );
                        },
                        error: function( error ) {
                            if ( callback ) {
                                callback( false, error );
                            }
                            notify.error( 'Не удалось разбанить пользователя (' + error + ')' );
                        }
                    });

                }
            }
        });

    };

    self.init = function () {
        /** Забанить полностью */
        etc_controls.defineControl({
            name: 'ban',
            use: 'toggle',
            labels: ['Забанить полностью', 'Разбанить'],
            action: function(main_element, current_state, callback) {
                if (current_state === 0) {
                    self.banUser({
                        id: $.data(main_element, 'user-id')
                    });
                } else {
                    self.unbanUser({
                        id: $.data(main_element, 'user-id')
                    });
                }

                callback(true);
            }
        });

        /** Забанить в подсайте */
        etc_controls.defineControl({
            name: 'ban_subsite',
            use: 'button',
            label: 'Забанить в подсайте',
            action: function(main_element, callback) {
                self.banUser({
                    id: $.data(main_element, 'user-id'),
                    subsite_id: $.data(main_element, 'subsite-id')
                });

                callback(true);
            }
        });

        /** Забанить и удалить всё */
        etc_controls.defineControl({
            name: 'ban_and_remove_all',
            use: 'button',
            label: 'Забанить и удалить всё',
            action: function(main_element, callback) {
                self.banUser({
                    id: $.data(main_element, 'user-id'),
                    remove_comments: true
                });

                callback(true);
            }
        });
    };

    self.destroy = function() {
        if ( user_socket ) {
            user_socket.destroy();
        }
    };

});
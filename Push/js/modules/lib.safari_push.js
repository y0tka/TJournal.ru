Air.define('lib.safari_push', 'lib.cookie, lib.ajax, lib.console', function(cookie, ajax, console) {

    return {

        apple_web_push_id: __apple_web_push_id,

        apple_payload_url: `https://push.${__domain}/api/safari`,

        cookie_name: 'safari_push_off',

        cookie_value: '1',

        setCookie: function() {
            console.log('push', 'setCookie');
            cookie.set(this.cookie_name, this.cookie_value, 365 * 10);
        },

        removeCookie: function() {
            console.log('push', 'removeCookie');
            cookie.set(this.cookie_name, this.cookie_value, -1);
        },

        getCookie: function() {
            cookie.get(this.cookie_name);
        },

        isPreviouslyUnsubscribed: function() {
            return this.getCookie() === this.cookie_value;
        },

        isSupported: function() {
            return ('safari' in window) && ('pushNotification' in window.safari);
        },

        getPermission: function() {
            return window.safari.pushNotification.permission(this.apple_web_push_id);
        },

        getDeviceToken: function() {
            let permission = this.getPermission();

            if (permission) {
                return permission.deviceToken;
            } else {
                return null;
            }
        },

        isDeviceTokenAvailable: function() {
            return this.getDeviceToken() !== null;
        },

        permissionIs: function(value) {
            return this.getPermission().permission === value;
        },

        getState: function() {
            if (this.isPreviouslyUnsubscribed()) {
                return false;
            } else {
                return this.permissionIs('granted');
            }
        },

        requestPermission: function(callback) {
            console.log('push', 'requestPermission');

            window.safari.pushNotification.requestPermission(
                this.apple_payload_url,     // The web service URL.
                this.apple_web_push_id,     // The Website Push ID.
                {},                         // Data used to help you identify the user.
                function(result) {
                    if (result.permission === 'granted') {
                        callback(true);
                    } else {
                        callback(false, 'Браузер не дал разрешение');
                    }
                }
            );
        },

        subscribeWithCallback: function(callback) {
            if (this.isPreviouslyUnsubscribed() && this.isDeviceTokenAvailable()) {
                this.resubscribe(this.getDeviceToken(), callback);
            } else {
                this.requestPermission(callback);
            }
        },

        wrapIntoPromise: function(method) {
            return (new Promise(function(resolve, reject) {
                method(function(state, error) {
                    if (state) {
                        resolve(true);
                    } else {
                        reject(error);
                    }
                });
            }));
        },

        subscribe: function() {
            console.log('push', 'subscribe');

            return this.wrapIntoPromise(this.subscribeWithCallback.bind(this));
        },

        formAjaxUrl: function(device_token) {
            return `${this.apple_payload_url}/v1/devices/${device_token}/registrations/${this.apple_web_push_id}`;
        },

        resubscribe: function(device_token, callback) {
            var that = this;

            console.log('push', 'resubscribe');

            ajax.post({
                url: this.formAjaxUrl(device_token),
                success: function(response) {
                    if (response.success) {
                        that.removeCookie();
                        callback(true);
                    } else {
                        callback(false, 'Неправильный ответ от сервера');
                    }
                },
                error: function(error) {
                    callback(false, error);
                }
            });
        },

        unsubscribeWithCallback: function(callback) {
            if (this.isPreviouslyUnsubscribed() || !this.isDeviceTokenAvailable()) {
                return Promise.reject('Вы не подписаны');
            } else {
                ajax.delete({
                    url: this.formAjaxUrl(this.getDeviceToken()),
                    success: function(response) {
                        if (response.success) {
                            this.setCookie();
                            callback(true);
                        } else {
                            callback(false, 'Неправильный ответ от сервера');
                        }
                    },
                    error: function(error) {
                        callback(false, error);
                    }
                });
            }
        },

        ubsubscribe: function() {
            console.log('push', 'unsubscribe');

            return this.wrapIntoPromise(this.unsubscribeWithCallback.bind(this));
        },

        prepare: function() {
            return Promise.resolve(this.getState());
        }

    };

});
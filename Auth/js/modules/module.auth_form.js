Air.define('module.auth_form', 'lib.DOM, module.DOM, module.notify, class.Form, module.popup, module.metrics, lib.storage, lib.andropov, fn.openWindow, fn.extend', function($, DOM, notify, classForm, popup_module, metr, storage, lib_andropov, openWindow, extend) {
    var self = this,
        popup_dom_list,
        auth_dom_list,
        show_auth_callback,
        forms = [];

    var dealWithAuthPopup = function(auth_popup) {
        popup_dom_list = DOM.list(auth_popup);

        if (popup_dom_list.auth_signin_form) {
            forms.push(new classForm({
                form: popup_dom_list.auth_signin_form.get()[0],
                onBeforeSubmit: function(form_values) {
                    // You can modify form_values and return him
                    // return form_values;
                },
                onSuccess: function() {
                    // You can return text message
                    // return 'Success';

                    self.trigger('Logged in with email');
                },
                onError: function(resp) {
                    // You can return text message
                    // return 'Error';

                    return resp.rm;
                }
            }));
        }

        forms.push(new classForm({
            form: popup_dom_list.auth_password_form.get()[0],
            onBeforeSubmit: function(form_values) {

            },
            onSuccess: function(resp) {
                return resp.rm;
            },
            onError: function(resp) {
                return resp.rm;
            }
        }));

        forms.push(classForm({
            form: popup_dom_list.auth_signup_form.get()[0],
            onBeforeSubmit: function(form_values) {

            },
            onSuccess: function(resp) {
                return resp.rm;
            },
            onError: function(resp) {
                return resp.rm;
            }
        }));

        forms.push(new classForm({
            form: popup_dom_list.auth_new_password_form.get()[0],
            onBeforeSubmit: function(form_values) {

            },
            onSuccess: function(resp) {
                self.trigger('New password set');
            },
            onError: function(resp) {
                return resp.rm;
            }
        }));

        self.trigger( 'Login popup shown' );
    };

    self.signinBySocial = function(social, callback, get_param = '') {
        var popup_urls = {
                'tw': '/auth/twitter',
                'fb': '/auth/facebook',
                'vk': '/auth/vk',
                'gg': '/auth/googleplus'
            },
            url;

        $.on(window, 'storage.module_auth', function() {
            if (storage.get( 'logged_in' ) == 1) {
                storage.remove( 'logged_in' );

                $.off(window, 'storage.module_auth');

                callback && callback(true);
            }

            if (storage.get( 'auth_error' )) {
                notify.error(storage.get( 'auth_error' ));

                storage.remove( 'auth_error' );

                $.off(window, 'storage.module_auth');

                callback && callback(false);
            }
        });

        storage.remove( 'logged_in' );

        url = popup_urls[social] + get_param;

        if (metr.is_ios_webview) {
            url += '?redirect=' + encodeURIComponent(document.location.href);
        }

        openWindow(url);
    };

    self.changeState = function (user_data) {
        if (user_data !== false) {
            auth_dom_list.profile.toggleClass('l-hidden', false);

            auth_dom_list.signin.toggleClass('l-hidden', true);

            auth_dom_list.profile.find('.auth_profile')
                .css('background-image', 'url(' + lib_andropov.formImageUrl(user_data.avatar_url, 30) + ')');

        } else {
            auth_dom_list.profile.toggleClass('l-hidden', true);
            auth_dom_list.signin.toggleClass('l-hidden', false);
        }
    };

    self.show = function(options) {
        var template_data = {
            tab: 'signin',
            email_auth: self.config.email_auth
        };

        template_data = extend({}, template_data, options.data);

        popup_module.show({
            template: 'auth',
            data: template_data,
            onReady: dealWithAuthPopup.bind(self),
            onClose: function() {
                forms.forEach(function(form) {
                    form.destroy();
                });

                forms = [];

                options.callback && options.callback();
            }
        });
    };

    self.hide = function () {
        if (popup_dom_list && popup_dom_list.auth_popup) {
            popup_module.hide();
        }
    };

    self.init = function () {
        auth_dom_list = DOM.list(self.elements[0].element);

        DOM.on('auth_goto_signin:click', function(data) {
            popup_dom_list.auth_popup.attr('data-auth-tab', 'signin');
        });

        DOM.on('auth_goto_signup:click', function(data) {
            popup_dom_list.auth_popup.attr('data-auth-tab', 'signup');
        });

        DOM.on('auth_goto_password:click', function(data) {
            popup_dom_list.auth_popup.attr('data-auth-tab', 'password');
        });
    };

    self.destroy = function () {
        DOM.off();
    };

});
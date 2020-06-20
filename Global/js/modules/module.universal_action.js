Air.define('module.universal_action', 'module.notify, module.ajaxify, module.auth_form, module.delegator', function (notify, ajaxify, auth_form, delegator) {
    var self = this;

    var doAction = function(data) {
        var notify_params = {},
            popup_params = {},
            action = data && data.action;

        if (action !== undefined) {

            if (action.notify) {

                notify_params.message = action.notify.text;
                notify_params.type = action.notify.type;

                if (action.notify.button) {
                    notify_params.button_text = action.notify.button.text;
                    notify_params.onButtonClick = function() {
                        ajaxify.goTo(action.notify.button.url);
                    };
                }

                setTimeout(function () {
                    notify.show(notify_params);
                }, 1000);
            }

            if (action.auth) {

                if (action.auth.data) {
                    popup_params = action.auth.data;
                }

                popup_params.tab = action.auth.name;

                auth_form.show({
                    data: popup_params
                });
            }

            if (action.popup) {

                popup_module.show({
                    template: action.popup.name,
                    data: action.popup.data,
                    onReady: function() {},
                    onClose: function() {}
                });

            }

            if (action.data) {
                if (action.data.action === 'reg_email' && user_data) {
                    user_data.login_method = 'email';

                    self.triggerOnce( 'Join', user_data );
                    self.triggerOnce( 'Login', user_data );
                }
            }

        }
    }

    self.init = function () {
        delegator.on('Initial data recieved new delegated data', function () {
            doAction(self.delegated_data);
        });
    };

});

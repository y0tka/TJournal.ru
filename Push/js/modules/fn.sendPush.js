Air.define('fn.sendPush', 'module.popup, lib.DOM, class.Form, module.notify', function(popup_module, $, Form, module_notify) {

    return function sendPush(data, callback) {

        let push_form = null;

        popup_module.show({
            template: 'send_' + data.type + '_push',
            data: data,
            onReady: function(popup_element) {

                push_form = new Form({
                    form: $.find(popup_element, '.ui_form'),
                    onBeforeSubmit: function(formValues) {
                        if ( data.type === 'web' ) {
                            formValues.url += '?from=push';
                        }

                        if (formValues.icon === undefined) {
                            formValues.icon = '';
                        }

                        return formValues;
                    },
                    onSuccess: function() {
                        if (hidePopup) {
                            popup_module.hide();
                        }
                        module_notify.success('Веб-пуш отправлен');
                        callback && callback(true);
                    },
                    onError: function(resp) {
                        if (hidePopup) {
                            popup_module.hide();
                        }
                        module_notify.error('Не удалось отправить пуш (код&nbsp;' + resp.rc + ')');
                        callback && callback(false);
                    }
                });

            },
            onClose: function() {
                push_form.destroy();
                push_form = null;
            }
        });

    };

});
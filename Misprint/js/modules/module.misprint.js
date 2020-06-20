Air.define('module.misprint', 'lib.analytics, lib.DOM, class.Form, module.notify, module.popup, module.DOM, module.location', function(lib_analytics, lib_DOM, ClassForm, module_notify, popup_module, DOM, location) {
    var self = this,
        popup_dom_list;

    var getSelectionText = function() {
        var text = '';

        if (window.getSelection) {
            text = window.getSelection().toString();
        } else if (document.selection && document.selection.type != "Control") {
            text = document.selection.createRange().text;
        }

        return text;
    }

    var keydownHandler = function(event) {
        var target_tag_name = event.target.tagName.toLowerCase();

        if (event.ctrlKey && event.keyCode == 13 && getSelectionText() !== '' && target_tag_name !== 'textarea' && target_tag_name !== 'input') {
            showPopup();
        }
    };

    var showPopup = function() {
        popup_module.show({
            template: 'misprint',
            data: {
                text: getSelectionText(),
                url: location.getPath()
            },
            onReady: dealWithPopup.bind(self),
            onClose: function() {}
        });
    };

    var dealWithPopup = function(popup) {
        popup_dom_list = DOM.list(popup);

        form = new ClassForm({
            form: popup_dom_list.misprint_form.get()[0],
            onBeforeSubmit: function (values) {
                popup_module.hide();

                module_notify.show({
                    type: 'success',
                    message: 'Спасибо. Сообщение об опечатке отправлено нашим редакторам.'
                });

                self.trigger( 'Success' );

                return values;
            },
            onSuccess: function(resp) {

            },
            onError: function(){
                // _log('error', arguments);
                // return 'Внутренняя ошибка, попробуйте позже';
            }
        });

        self.trigger( 'Popup shown' );
    };

    self.init = function() {

        lib_DOM.addEvent(document, 'keydown.module_misprint', keydownHandler);

        // Окно опечаток
        self.on( 'Popup shown', function(){
            lib_analytics.sendDefaultEvent( 'Misprints Popup — Shown' );
        });

        // Опечатка отправлена
        self.on( 'Success', function(){
            lib_analytics.sendDefaultEvent( 'Misprints Popup — Sent' );
        });

    };

    self.destroy = function() {
        self.off();
    };

});

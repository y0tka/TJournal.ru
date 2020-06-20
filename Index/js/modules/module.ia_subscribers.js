Air.define('module.ia_subscribers', 'module.notify, module.smart_ajax, lib.DOM, lib.cookie, module.auth', function(notify, smart_ajax, $, cookie, auth) {

    let self = this;

    self.init = function() {

        self.foundElements = {};

        let formWrapper = self.elements[0].element;

        self.foundElements.textArea = $.find(formWrapper, '[name="js-subscribe-form"]');
        self.foundElements.subscribeButton = $.find(formWrapper, '[name="js-subscribe"]');
        self.foundElements.unsubscribeButton = $.find(formWrapper, '[name="js-unsubscribe"]');
        self.foundElements.failedEmailsBlock = $.find(formWrapper, '.subscribe-form-failed');
        self.foundElements.failedEmailsList = $.find(formWrapper, '.subscribe-form-failed__list');
        self.foundElements.failedEmailsText = $.find(formWrapper, '.subscribe-form-failed__text');

        $.on(self.foundElements.subscribeButton, 'click', self.subscribe);
        $.on(self.foundElements.unsubscribeButton, 'click', self.unsubscribe);
    };

    self.subscribe = function() {

        let emails = self.foundElements.textArea.value;
        self.foundElements.subscribeButton.classList.add('ui_button--loading');

        if (emails.trim()) {
            smart_ajax.post({
                url : '/private/subscribe/iausers',
                data : {
                    'emails': emails
                },
                success : function(response) {
                    self.foundElements.textArea.value = '';
                    self.foundElements.subscribeButton.classList.remove('ui_button--loading');
                    notify.success( 'Email-адреса подписаны на рассылки' );

                    if (response.failed) {
                        if ($.bem.hasMod(self.foundElements.failedEmailsBlock, 'hidden')) {
                            $.bem.toggle(self.foundElements.failedEmailsBlock, 'hidden');
                        }

                        self.foundElements.failedEmailsText.textContent = response.message;

                        for(let i = 0; i < response.failed.length; i++) {
                            let email = response.failed[i];

                            $.append(self.foundElements.failedEmailsList, $.make('LI', [], {
                                innerHTML : email
                            }));
                        }
                    } else {
                        if (!$.bem.hasMod(self.foundElements.failedEmailsBlock, 'hidden')) {
                            $.bem.toggle(self.foundElements.failedEmailsBlock, 'hidden');
                        }
                    }
                }
            });
        } else {
            notify.error( 'Вы пытаетесь отправить пустое поле' );
            self.foundElements.subscribeButton.classList.remove('ui_button--loading');
        }
    };

    self.unsubscribe = function() {

        let emails = self.foundElements.textArea.value;
        self.foundElements.unsubscribeButton.classList.add('ui_button--loading');

        if (emails.trim()) {
            smart_ajax.post({
                url : '/private/unsubscribe/iausers',
                data : {
                    'emails': emails
                },
                success : function(response) {
                    self.foundElements.textArea.value = '';
                    self.foundElements.unsubscribeButton.classList.remove('ui_button--loading');

                    notify.success( 'Email-адреса отписаны от рассылок' );

                    if (response.failed) {
                        if ($.bem.hasMod(self.foundElements.failedEmailsBlock, 'hidden')) {
                            $.bem.toggle(self.foundElements.failedEmailsBlock, 'hidden');
                        }

                        self.foundElements.failedEmailsText.textContent = response.message;

                        for(let i = 0; i < response.failed.length; i++) {
                            let email = response.failed[i];

                            $.append(self.foundElements.failedEmailsList, $.make('LI', [], {
                                innerHTML : email
                            }));
                        }
                    } else {
                        if (!$.bem.hasMod(self.foundElements.failedEmailsBlock, 'hidden')) {
                            $.bem.toggle(self.foundElements.failedEmailsBlock, 'hidden');
                        }
                    }
                }
            });
        } else {
            notify.error( 'Вы пытаетесь отправить пустое поле' );
            self.foundElements.unsubscribeButton.classList.remove('ui_button--loading');
        }


    };

});
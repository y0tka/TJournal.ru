Air.defineModule('module.commerce_question', 'module.auth, module.smart_ajax, module.renderer, module.entry, class.Fabric, class.DOM, lib.DOM', function (module_auth, smart_ajax, renderer, entry, Fabric, DOM, $) {

    let self = this,
        fabric;

    const CSS = {
        main: 'commerce_question',
        message: 'commerce_question__message',
        shake: 'ui--shake',
        hidden: 'l-hidden'
    };

    class CommerceForm {

        constructor(params) {
            this.form = params.element;
            this.entryId = entry.getData().id;
            this.isAuthRequired = $.attr(this.form, 'air-auth') || false;

            this.labels = $.attr(this.form, 'air-labels');

            this.data = {
                title: $.attr(this.form, 'air-title'),
                subtitle: $.attr(this.form, 'air-subtitle'),
                values: $.attr(this.form, 'air-values'),
                labels: this.labels ? this.labels.split(',') : ['Ответ', 'Ответить'],
                email: this.isAuthRequired ? false : true
            };

            this.messages = {
                success: $.attr(this.form, 'air-success') || 'Верно. Мы отправим промокод вам на почту.',
                error: $.attr(this.form, 'air-error') || 'Неверно, попробуйте ещё раз.'
            };

            this.correctValues = this.data.values.split(',');

            this.init();
        }

        init() {
            $.addClass(this.form, CSS.main);

            renderer.render({
                el: this.form,
                template: 'commerce_question',
                data: this.data,
                onReady: () => {
                    this.addListeners();
                    $.attr(this.form, 'air-values', null);
                }
            });
        }

        addListeners() {
            this.submitButton = $.find(this.form, 'button');
            $.addEvent(this.submitButton, 'click', () => this.submitFormData());

            this.messageOverlay = $.find(this.form, `.${CSS.message}`);
            $.addEvent(this.messageOverlay, 'click', () => this.hideMessage());

            $.delegateEvent(this.form, 'input', 'input', (e) => this.watchInput(e.target));
            $.delegateEvent(this.form, 'input', 'keydown', (e) => {
                if (e.keyCode === 13) {
                    this.submitFormData();
                }
            });
        }

        watchInput(input) {
            if (input.value.trim() !== '') {
                $.bem.add(input, 'filled');
            } else {
                $.bem.remove(input, 'filled');
            }
        }

        collectFormData() {
            let fields = this.form.querySelectorAll('input'),
                result = {};

            for (let i = 0, len = fields.length; i < len; i++) {
                let field = fields[i];

                if (!field.validity.valid || field.value.trim() === '') {
                    result = {
                        error: true,
                        field
                    };
                    break;
                }

                result[field.name] = field.value.trim();
            }

            return result;
        }

        submitFormData() {
            let data = this.collectFormData();
            let userData = module_auth.getData();

            if (data.error) {
                this.focusOnInvalidField(data.field);
            } else {
                let isCorrect = this.checkUserValue(data.answer);

                if (this.isAuthRequired) {
                    if (userData) {
                        data.userId = userData.id;
                        this.postFormData(data);
                    } else {
                        module_auth.showAuth(() => {
                            data.userId = module_auth.getData().id;
                            this.postFormData(data);
                        });
                    }
                } else {
                    if (isCorrect) {
                        this.postFormData(data);
                    } else {
                        this.showMessage($.svg('commerce_retry', 19, 19).outerHTML + this.messages.error);
                    }
                }
            }
        }

        postFormData(data) {
            $.bem.add(this.form, 'loading');

            smart_ajax.post({
                url: `/commerceEntry/saveEmail/${this.entryId}`,
                data,
                success: () => {
                    this.showMessage(this.messages.success);
                    $.off(this.messageOverlay);
                }
            });
        }

        focusOnInvalidField(input) {
            input.focus();

            $.toggleClass(input.parentNode, CSS.shake, true);

            setTimeout(() => {
                $.toggleClass(input.parentNode, CSS.shake, false);
            }, 500);
        }

        checkUserValue(value) {
            let result = false;

            value = value.trim();
            value = value.toLowerCase();
            value = value.replace(/[\:\`\.\,\s\'\"\/\|\\]/g, '');

            if (this.correctValues && this.correctValues.indexOf(value) > -1) {
                result = true;
            }

            return result;
        }

        showMessage(html) {
            $.html(this.messageOverlay, html);
            $.toggleClass(this.messageOverlay, CSS.hidden, false);
        }

        hideMessage() {
            let firstField = $.find(this.form, 'input');

            firstField.value = '';
            firstField.focus();

            $.toggleClass(this.messageOverlay, CSS.hidden, true);
        }

        destroy() {
            $.off(this.form);
            $.off(this.submitButton);
            $.off(this.messageOverlay);
        }

    }

    self.init = function () {

        fabric = new Fabric({
            module_name: 'module.commerce_question',
            Constructor: CommerceForm,
        });

    };

    self.refresh = function () {
        fabric.update();
    };

    self.destroy = function () {
        fabric.destroy();
    };

});
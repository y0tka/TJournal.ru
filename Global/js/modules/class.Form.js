Air.defineClass('class.Form', 'lib.DOM, class.DOM, lib.ajax, class.AndropovUploader, module.notify', function(params, $, ClassDOM, ajax, AndropovUploader, notify, util) {
    var self = this,
        form_obj = {};

    var validateEmail = function(email) {
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    };

    self.init = function(params) {
        form_obj.inputs = [];

        form_obj.onBeforeSubmit = params.onBeforeSubmit;
        form_obj.onSuccess = params.onSuccess;
        form_obj.onError = params.onError;

        self.parseForm(params.form);
        self.setIdsForLabels(params.form);

        form_obj.message = new ClassDOM($.parseHTML('<div class="ui_form__message">Some message</div>'));

        $.prepend(params.form, form_obj.message.get()[0]);

        if (form_obj.submit) {
            $.addEvent(form_obj.submit, 'click', function(event) {
                event.stopPropagation();
                event.preventDefault();

                self.tryToSubmit();
            });
        }
    };

    self.parseForm = function(form_element) {
        var inputs;

        inputs = $.findAll(form_element, 'input, textarea, select, .ui_form__image_uploader');

        form_obj.ajax_url = $.attr(form_element, 'action');

        $.each(inputs, function(input) {
            var type = $.attr(input, 'type'),
                tag = input.tagName.toLowerCase(),
                default_value = $.attr(input, 'default');

            if (type === 'submit') {
                form_obj.submit = input;
            } else {
                form_obj.inputs.push({
                    el: input,
                    type: type,
                    tag: tag,
                    default_value: default_value,
                    name: $.attr(input, 'name'),
                    message: '',
                    valid: false
                });
            }

            if (type === 'image') {
                (function (el) {
                    new AndropovUploader({
                        file: {
                            button: $.find(el, '.ui_form__image_uploader__button'),
                            accept: 'image/*'
                        },
                        handlers: {
                            waiting: function(state) {
                                $.toggleClass($.find(el, '.ui_form__image_uploader__button'), 'ui--bg_loading', state);
                            },
                            change: function(items) {
                                $.attr($.find(el, '.ui_form__image_uploader__preview img'), 'src', items[0].getImageUrl());

                                $.attr(el, 'value', items[0].toString());
                            }
                        }
                    });
                })(input);
            }

            $.on(input, 'keydown', function (event) {
                if (event.keyCode === 13) {
                    event.preventDefault();
                    event.stopPropagation();

                    if (form_obj.submit) {
                        self.tryToSubmit();
                    }
                }
            });

        });
    };

    self.checkValidation = function(callback) {
        var validation = {
            status: true,
            message: ''
        };

        form_obj.inputs.forEach(function(input) {
            var valid = true,
                message = '',
                value = $.val(input.el);

            switch (input.type) {
                case 'name':
                    if (value.length < 2) {
                        valid = false;
                        message = 'Вы не указали имя';
                    }
                break;

                case 'password':
                    if (value.length < 6) {
                        valid = false;
                        message = 'Пароль должен быть не менее 6 символов';
                    }
                break;

                case 'email':
                    if (validateEmail(value) === false) {
                        valid = false;
                        message = 'Вы указали неверную электронную почту';
                    }
                break;
            }

            input.valid = valid;
            input.message = message;
        });

        form_obj.inputs.some(function(input) {
            if (input.valid === false) {
                validation.status = false;
                validation.message = input.message;
                return true;
            }
        });

        callback && callback(validation.status, validation.message);
    };

    self.showMessage = function(message, type) {
        if (message === false) {
            form_obj.message.removeClass('ui_form__message--shown');
            form_obj.message.text('');
        }else{
            form_obj.message.removeClass('ui_form__message--success').removeClass('ui_form__message--error');
            form_obj.message.addClass('ui_form__message--' + type).text(message);
            form_obj.message.addClass('ui_form__message--shown');
        }
    };

    self.send = function(callback) {
        var values = self.getValues(),
            callback_values = form_obj.onBeforeSubmit && form_obj.onBeforeSubmit(values),
            callback_messsage;

        values = callback_values || values;

        self.showMessage(false);

        ajax.post({
            url: form_obj.ajax_url,
            dataType: 'json',
            data: {
                values: values,
                mode: 'raw'
            },
            success: function(resp) {
                callback && callback(resp);

                if (resp.rc === 200 || resp.rc === 204) {
                    callback_messsage = form_obj.onSuccess && form_obj.onSuccess(resp);
                    callback_messsage && self.showMessage(callback_messsage, 'success');
                }else{
                    callback_messsage = form_obj.onError && form_obj.onError(resp);
                    callback_messsage && self.showMessage(callback_messsage, 'error');
                }
            },
            error: function(resp) {
                callback && callback(resp);
                callback_messsage = form_obj.onError && form_obj.onError(resp);
                callback_messsage && self.showMessage(callback_messsage, 'error');
            }
        });
    };

    self.tryToSubmit = function() {

        self.checkValidation(function(is_valid, message) {
            if (is_valid) {
                $.toggleClass(form_obj.submit, 'ui--bg_loading', true);

                self.send(function(resp) {
                    if (resp.rc === 200) {

                    } else {
                        notify.error('Произошла ошибка');
                    }

                    $.toggleClass(form_obj.submit, 'ui--bg_loading', false);
                });
            } else {
                self.showMessage(message, 'error');
            }
        });
    };

    self.getValues = function() {
        var values = {},
            value;

        form_obj.inputs.forEach(function(input) {

            /**
             * @deprecated since 18.29.10 - value getter moved to the $.val() {@link module:libDom#val}
             */
            // if (input.tag === 'select') {
            //     value = input.el.options[input.el.selectedIndex].value;
            // } else if (input.type === 'checkbox') {
            //     value = input.el.checked ? ( input.el.getAttribute('value') || true ) : false;
            // } else if (input.type === 'image') {
            //     value = $.attr(input.el, 'value');
            // } else if (input.type === 'radio') {
            //
            //     let sameRadios = document.getElementsByName(input.name);
            //
            //     for (let i = sameRadios.length - 1; i >= 0; i--) {
            //         if (sameRadios[i].checked){
            //             value = sameRadios[i].value;
            //         }
            //     }
            //
            // } else {
            //     value = $.val(input.el);
            // }
            value = $.val(input.el);

            if ((value === '' || value === undefined) && input.default_value) {
                value = input.default_value;
            }

            values[input.name] = value;
        });

        return values;
    };

    /**
     * @deprecated - use $.val(el, value); {@link module:libDom#val}
     *
     * @param {Object}  input               - current iteration input
     * @param {*}       input.default_value - undefined
     * @param {Element} input.el            - input
     * @param {string}  input.message       - ""
     * @param {string}  input.name          - input name
     * @param {string}  input.tag           - tagName: "input|select|checkbox"
     * @param {string}  input.type          - input type
     * @param {Boolean} input.valid         - false
     *
     * @param {*} value                     - value to set
     */
    self.setInputValue = function( input, value ) {

        /**
         * @since 18.29.01 — All stuff moved to the $.val() {@link module:libDom#val}
         * @author @neSpecc
         */
        console.warning('Method Form#setInputValue is deprecated. Use lib.DOM#val instead');

        var option_el;

        if (input.tag === 'select') {
            option_el = $.find(input.el, 'option[value="' + value + '"]');

            if ( option_el ) {
                input.el.selectedIndex = option_el.index;
            }

            // input.el.selectedIndex = option_el ? option_el.index : -1;
        } else if (input.type === 'checkbox') {
            input.el.checked = value;
        } else if (input.type === 'radio'){

            let sameRadios = document.getElementsByName(input.name);

            for (let i = sameRadios.length - 1; i >= 0; i--) {
                input.el.checked = input.el.value == value;
            }

        } else {
            $.val(input.el, value);
        }
    };

    self.setValues = function(values) {
        var input_name;

        if ( typeof values === 'function' ) {
            form_obj.inputs.forEach(function(input) {
                $.val(input.el, values( input.name ));
                // self.setInputValue( input, values( input.name ) );
            });
        } else {
            for (input_name in values) {
                form_obj.inputs.forEach(function(input) {
                    if (input.name === input_name) {
                        $.val(input.el, values[input_name]);
                        // self.setInputValue( input, values[input_name] );
                    }
                });
            }
        }
    };

    self.setIdsForLabels = function(form_element) {
        $.findAll(form_element, 'fieldset').forEach(function(fieldset){
            var label = $.find(fieldset, 'label'),
                input = $.find(fieldset, 'input, select, textarea'),
                id;

            if (label && input) {
                id = 'form_input_' + util.uid();
                $.attr(label, 'for', id);
                $.attr(input, 'id', id);
            }
        });
    };

    self.destroy = function() {
        $.removeEvent(form_obj.submit);
        form_obj = null;
    };

    self.init(params);
}, {
    immediately_invoked: false
});

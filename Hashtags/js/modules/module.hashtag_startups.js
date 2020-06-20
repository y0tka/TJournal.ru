Air.define('module.hashtag_startups', 'lib.DOM, class.Form, module.notify, module.popup, module.DOM, module.smart_ajax', function($, ClassForm, module_notify, popup_module, DOM, smart_ajax) {
    var self = this,
        popup_dom_list,
        popup_form,
        form_data,
        shake_timeout;

    var showPopup = function() {
        popup_module.show({
            template: 'startups',
            data: {
                attach_icon: $.svg('attach-image', 14, 15).outerHTML
            },
            onReady: dealWithPopup.bind(self),
            onClose: function() {}
        });
    };

    var dealWithPopup = function(popup) {
        popup_dom_list = DOM.list(popup);
        popup_form = popup_dom_list.hashtag_startups_form.get()[0];

        $.delegateEvent(popup_form, '[air-dom="hashtag_startups_attach"]', 'change', previewAttachment);
        $.delegateEvent(popup_form, '[air-dom="hashtag_startups_detach"]', 'click', removeAttachment);
        $.delegateEvent(popup_form, '[air-dom="hashtag_startups_submit"]', 'click', sendForm);
    };

    var sendForm = function(e){

        var button = e.target;

        form_data = collectedFormData(popup_form);

        validateForm(form_data, function(invalid_field){

            if (!invalid_field){

                $.toggleClass(button, 'ui--bg_loading', true);

                smart_ajax.post({
                    url: popup_form.action,
                    data: form_data,
                    dataType: '',
                    format: 'mfd',
                    success: function(){
                        popup_module.hide();

                        module_notify.show({
                            type: 'success',
                            message: 'История отправлена! Мы ее почитаем, и, если она интересная, то, может быть, даже опубликуем.'
                        });

                        $.toggleClass(button, 'ui--bg_loading', false);
                    },
                    error: function(error){
                        $.toggleClass(button, 'ui--bg_loading', false);
                    }
                });

            } else {
                $.toggleClass(invalid_field, 'ui--shake');

                scrollToElement(invalid_field);
                invalid_field.focus();

                shake_timeout = setTimeout(function(){
                    $.toggleClass(invalid_field, 'ui--shake', false);
                }, 1000);
            }

        });

    };

    var collectedFormData = function(form){

        var fields = form.elements,
            obj = {};

        $.each(fields, function(field){
            if (field.name && field.name !== ''){
                if (field.type == 'file'){
                    obj[field.name] = field.files;
                } else {
                    obj[field.name] = field.value;
                }
            }
        });

        return obj;

    };

    var validateForm = function(fields, callback){

        var invalid_field;

        for (field in fields){
            var element = $.find(popup_form, '[name="' + field + '"]');

            if (element.required && element.value.trim() == ''){
                invalid_field = (element.type == 'file') ? $.parents(element, '[air-dom="hashtag_startups_attach"]') : element;
                break;
            }
        }

        callback(invalid_field);

    };

    var scrollToElement = function(element){

        var scrollable_element = $.find(document, '.popup__container--shown'),
            position = element.getBoundingClientRect().top + scrollable_element.scrollTop - 10;

        scrollable_element.scrollTop = position;

    };

    var previewAttachment = function(e){

        var input = e.target,
            parent = $.parents(input, '[air-dom="hashtag_startups_attach"]'),
            preview_container = $.find(parent, '[data-attach-preview]'),
            file = input.files[0],
            reader = new FileReader();

        $.addEvent(reader, 'load', function(){
            $.css(preview_container, {
                'background-image': 'url('+ reader.result +')'
            });

            $.toggleClass(preview_container, 'l-hidden', false);
        });

        reader.readAsDataURL(file);

    };

    var removeAttachment = function(e){

        var button = e.target,
            parent = $.parents(button, '[air-dom="hashtag_startups_attach"]'),
            preview_container = $.find(parent, '[data-attach-preview]'),
            input = $.find(parent, 'input[type="file"]');

        $.toggleClass(preview_container, 'l-hidden', true);

        input.value = '';

    };

    self.init = function() {

        DOM.on('hashtag_startups_popup:click', showPopup);

    };

    self.refresh = function() {

    };

    self.destroy = function() {
        DOM.off();
        $.off(popup_form);
    };

});

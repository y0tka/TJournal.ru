Air.defineModule('module.subsite', 'module.smart_ajax, module.subsite_admin, module.notify, lib.DOM, class.AndropovUploader, module.auth_data, module.auth_form, module.DOM, class.Form, module.modal_window, module.ajaxify', function(smart_ajax, subsite_admin, notify, $, AndropovUploader, auth_data, auth_form, DOM, ClassForm, modal_window, ajaxify) {
    var self = this,
        dom,
        andropov_uploader_instance = [],
        form_instances = {};

    self.init = function() {
        dom = {};

        dom.avatar_uploader = $.find('.subsite__user__upload');
        dom.avatar_img = $.find('.subsite__user__avatar img');

        dom.main_form = $.find('.ui_form--main_info');
        dom.private_form = $.find('.ui_form--private');
        dom.notifications_form = $.find('.ui_form--notifications');

        if ( dom.avatar_uploader ) {
            andropov_uploader_instance.push(new AndropovUploader({
                file: {
                    button: dom.avatar_uploader,
                    accept: 'image/*'
                },
                handlers: {
                    wait: function(state) {
                        $.bem.toggle(dom.avatar_uploader, 'loading', true);
                    },
                    change: function(items) {
                        if (items.length > 0) {
                            smart_ajax.post({
                                url: '/subsite/save_settings/' + $.data($.find('.page--subsite'), 'id'),
                                data: {
                                    avatar: JSON.stringify(items[0].getData())
                                },
                                success: function( response ) {
                                    let img = new Image();

                                    img.onload = function () {
                                        $.attr(dom.avatar_img, 'src', items[0].getImageUrl(80, 80));
                                        $.bem.toggle(dom.avatar_uploader, 'loading', false);
                                        auth_data.update();
                                    };

                                    img.onerror = function () {
                                        $.bem.toggle(dom.avatar_uploader, 'loading', false);
                                    };

                                    img.src = items[0].getImageUrl(80, 80);
                                },
                                error: function( error ) {
                                    notify.success( 'Не удалось изменить фотографию: ' + error.toLowerCase() );
                                    $.bem.toggle(dom.avatar_uploader, 'loading', false);
                                }
                            });
                        }else{
                            notify.success('Не удалось загрузить фотографию');
                            $.bem.toggle(dom.avatar_uploader, 'loading', false);
                        }
                    }
                }
            }));
        }

        if (dom.main_form) {

            form_instances.main = new ClassForm({
                form: dom.main_form
            });

        }

        if (dom.private_form) {

            form_instances.private = new ClassForm({
                form: dom.private_form
            });

        }

        if (dom.notifications_form) {

            form_instances.notifications = new ClassForm({
                form: dom.notifications_form
            });

        }

        DOM.on('link_social:click', function(data) {
            var social = $.data(data.el, 'social'),
                is_active = $.hasClass(data.el, 'island__social_links__item--active');

            if (is_active === false) {
                auth_form.signinBySocial( social, function(state) {
                    if (state) {
                        ajaxify.reload();
                    }
                }, '?link=1');
            }
        });

        DOM.on('unlink_social:click', function(data) {
            var parent = $.parents(data.el, '.island__social_links__item'),
                social_id = $.data(data.el, 'social-id'),
                social_type = $.data(data.el, 'social-type');

            auth_data.unlinkSocial(social_id, social_type, function(state) {
                if (state) {
                    ajaxify.reload();
                }
            });
        });

        DOM.on('subsite_settings_save:click', function(data) {
            var form_name,
                result = {};

            for (form_name in form_instances) {
                result[form_name] = form_instances[form_name].getValues();
            }

            form_instances.main.checkValidation(function(status, message) {
                if (status) {
                    form_instances.main.showMessage(false);

                    smart_ajax.post({
                        url: '/subsite/save_settings/' + $.data($.find('.page--subsite'), 'id'),
                        data: result.main,
                        success: function( response, response_message ) {
                            notify.success( response_message );
                        },
                        error: function( error ) {
                            notify.error( error );
                        }
                    });

                }else{
                    form_instances.main.showMessage(message, 'error');
                }
            });

        });

        DOM.on('Auth by qr:click', function (data) {
            modal_window.show({
				name: 'qr',
                data: {
                    qr_src: $.data(data.el, 'qr'),
                    ios: $.data(data.el, 'ios'),
                    android: $.data(data.el, 'android')
                },
				onClose: function (status, data) {

				}
			})
        });

        DOM.on('Admin gift:click', function ( data ) {
            smart_ajax.post({
                url: '/admin/users/advanced/access',
                data: {
                    id: $.data( data.el, 'id' ),
                    period: $.data( data.el, 'period' ),
                    mode: 'raw'
                },
                success: function( response ) {
                    notify.success( 'Готово' );
                },
                error: function( error ) {
                    notify.error( 'Не получилось (' + error + ')' );
                }
            });
        });

        DOM.on('expand_comment:click', function ( data ) {
            let parent = $.parents(data.el, '.profile_comment_favorite__text--collapsed');

            if (parent) {
                $.bem.toggle(parent, 'collapsed', false);
            }

            parent = null;
        });

    };

    self.refresh = function() {
        self.destroy();
        self.init();
    };

    self.destroy = function() {
        var form_name;

        if ( andropov_uploader_instance ) {
            andropov_uploader_instance.forEach(function(instance){
                instance.destructor();
                instance = null;
            });

            andropov_uploader_instance = [];
        }

        for (form_name in form_instances) {
            form_instances[form_name].destroy();
        }

        DOM.off();

        dom = null;
    };

});

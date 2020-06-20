Air.defineModule( 'module.subsite_settings', 'module.modal_window, module.notify, module.ajaxify, module.auth, module.DOM, module.popup, class.Form2, lib.DOM, module.smart_ajax', function( modal_window, notify, ajaxify, auth, DOM, popup_module, Form, $, smart_ajax ) {

    var self = this,
        form_instance = null;

    var initForm = function() {
        var form_element = $.find( '.subsite_settings__form .form2' ),
            id = $.data(form_element, 'id');

        form_instance = new Form( {
            element: form_element,
            actions: {
                save: {
                    url: '/subsite/save_settings/' + id,
                    success: function( result, remote_message ) {
                        notify.success(remote_message);
                    },
                    error: function (remote_message) {
                        notify.error(remote_message);
                    }
                },
                new: {
                    url: '/magic/create',
                    success: function( result ) {
                        if (result.redirect_url) {
                            notify.success('Сабсайт создан');
                            ajaxify.goTo(result.redirect_url);
                        }
                    }
                }
            },
            events: {
                change: function () {
                    
                },

                advancedListAddItem: function (value, loading, addItem) {
                    // TODO: remove regexp for user id
                    let user_id = /(\d+)/.exec(value);

                    loading(true);

                    if (user_id && user_id[1]) {
                        smart_ajax.get( {
                            url: '/writing/search/users',
                            data: {
                                ids: user_id[1],
                            },
                            success: function( response ) {
                                if (response && response[0]) {
                                    addItem({
                                        id: response[0].id,
                                        url: value,
                                        name: response[0].name
                                    });
                                }
                            },
                            complete: function () {
                                loading(false);
                            }
                        });
                    }else{
                        loading(false);
                        notify.error('Не правильно указана ссылка на пользователя')
                    }

                },

                advancedListRemoveItem: function (item_data, loading, removeItem) {
                    removeItem(true);
                },

                advancedListRenderItem: function (item_data) {
                    var template = `
                        <div class="adv_list_item">
                            <a href="${item_data.url}">${item_data.name}</a>
                            <div class="adv_list_item__remove" data-remove></div>
                        </div>`;

                    return template;
                }

            }
        } );

    };

    var destroyForm = function() {
        if ( form_instance !== null ) {
            form_instance.destroy();
            form_instance = null;
        }
    };

    self.init = function() {
        initForm();
    };

    self.refresh = function() {
        self.destroy();
        self.init();
    };

    self.destroy = function() {
        destroyForm();
        DOM.off();
    };

} );

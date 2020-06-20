Air.defineModule( 'module.vacancy_edit', 'module.modal_window, module.notify, module.ajaxify, module.auth, module.DOM, module.popup, class.Form2, lib.DOM, module.smart_ajax', function ( modal_window, notify, ajaxify, auth, DOM, popup_module, Form, $, smart_ajax ) {
    var self = this,
        form_instance = null,
        mode;
        // last_saved_data = null;

    var showHideFormItems = function ( name, value, item ) {
        var last_search_value;

        switch ( name ) {
            case 'area':
                form_instance.show( 'city_id', value[ 0 ] != 2 );
                break;

            case 'company_id':
                if ( value[ 0 ] == 0 && item !== undefined ) {
                    last_search_value = item.handle.instance.getLastSearchValue();

                    if ( last_search_value !== null ) {
                        form_instance.value( 'name', last_search_value );
                    }
                }

                form_instance.showBySelector( '.vacancy_edit__form__company_data', value[ 0 ] == 0 );
                break;
        }
    };

    var dealWithFormConnections = function () {
        form_instance.getValues().then(values => {
            let name;

            for ( name in values ) {
                showHideFormItems( name, values[ name ] );
            }
        });
    };

    var onItemsChanged = function (name, items) {
        if (mode === 'new' && form_instance) {
            switch (name) {
                case 'company_id':
                    let item = items[0];

                    if (item && item.last_benefits) {
                        form_instance.value( 'benefits', item.last_benefits );
                    }
                    break;
            }
        }
    };

    var initForm = function () {
        form_instance = new Form( {
            element: $.find( '.vacancy_edit__form .form2' ),
            actions: {
                publish_without_payment: {
                    getUrl: function () {
                        return '/job/publish_without_payment/' + form_instance.value('vacancy_id');
                    },
                    success: function (result) {
                        console.log('publish_without_payment success', result);
                        ajaxify.goTo( result.result.redirect_uri );
                    },
                    error: function (error) {
                        console.log('publish_without_payment error', error);
                    }
                },
                publish: {
                    getUrl: function () {
                        return '/job/publish/' + form_instance.value('vacancy_id');
                    },
                    success: function (result) {
                        console.log('publish success', result);
                    },
                    error: function (error) {
                        console.log('publish error', error);
                    }
                },
                approve: {
                    getUrl: function () {
                        return '/job/approve/' + form_instance.value('vacancy_id');
                    },
                    success: function (result) {
                        console.log('approve success', result);
                        ajaxify.goTo( result.redirect_uri );
                    },
                    error: function (error) {
                        console.log('approve error', error);
                    }
                },
                reject: {
                    getUrl: function () {
                        return '/job/reject/' + form_instance.value('vacancy_id');
                    },
                    success: function (result) {
                        console.log('reject success', result);
                        ajaxify.goTo( result.redirect_uri );
                    },
                    error: function (error) {
                        console.log('reject error', error);
                    }
                },
                save: {
                    getUrl: function () {
                        return '/job/save';
                    },
                    success: function (result) {
                        console.log('save success', result);
                        ajaxify.goTo( result.vacancy.redirect_uri );
                    },
                    error: function (error) {
                        console.log('save error', error);
                    }
                },
                archive: {
                    getUrl: function () {
                        return '/job/archive/' + form_instance.value('vacancy_id');
                    },
                    success: function (result) {
                        console.log('archive success', result);
                        ajaxify.goTo( result.redirect_uri );
                    },
                    error: function (error) {
                        console.log('archive error', error);
                    }
                },
                delete: {
                    getUrl: function () {
                        modal_window.show({
                            name: 'confirm',
                            data: {
                                title: 'Удалить вакансию?',
                                text: 'Вы не сможете восстановить её.',
                                button_yes: 'Да',
                                button_no: 'Нет'
                            },
                            onClose: function (status) {
                                if (status) {
                                    smart_ajax.post( {
                                        url: '/job/delete/' + form_instance.value('vacancy_id'),
                                        data: {},
                                        success: function () {
                                            notify.success('Вакансия удалена');
                                            ajaxify.goTo('/job');
                                        },
                                        error: function ( error ) {
                                            notify.error('Что-то пошло ��е так');
                                        }
                                    });
                                }
                            }
                        });

                        return null;
                    },
                    success: function (result) {
                        console.log('delete success', result);
                    },
                    error: function (error) {
                        console.log('delete error', error);
                    }
                },
                pay: {
                    getUrl: function () {
                        return '/job/pay/' + form_instance.value('vacancy_id');
                    },
                    success: function (result) {
                        console.log('pay success', result);
                    },
                    error: function (error) {
                        console.log('pay error', error);
                    }
                }

            },
            events: {
                change: showHideFormItems,
                changeItems: onItemsChanged
            },
            focus: 'title'
        } );

        dealWithFormConnections();
    };

    var destroyForm = function () {
        // last_saved_data = null;

        if ( form_instance !== null ) {
            form_instance.destroy();
            form_instance = null;
        }
    };


    self.init = function () {
        mode = $.data($.find('.page--vacancy_edit'), 'mode');

        initForm();

        // DOM.on( 'vacancy_pay', function() {
        //     popup_dom_list.pay_form.get()[0].submit();
        // } );
    };

    self.refresh = function () {
        self.destroy();
        self.init();
    };

    self.destroy = function () {
        destroyForm();
        DOM.off();
    };
} );

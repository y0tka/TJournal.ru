Air.define('module.payments', 'lib.analytics, module.ajaxify, module.smart_ajax, module.DOM, lib.DOM, module.popup, class.Form, module.notify, module.auth_data, lib.andropov', function(lib_analytics, ajaxify, smart_ajax, DOM, $, popup_module, classForm, notify, auth_data, lib_andropov) {
    var self = this,
        popup_dom_list,
        email_form;

    var dealWithPopup = function(popup_el) {
        popup_dom_list = DOM.list(popup_el);

        var setUserData = function (data) {
            popup_dom_list.user_avatar.attr('src', lib_andropov.formImageUrl(data.avatar_url, 24));
            popup_dom_list.user_name.html(data.name);

            if (!data.is_known_email) {
                setState('email', false);

                email_form = new classForm({
                    form: popup_dom_list.email_form.get()[0]
                });
            }
        };

        var setState = function (state, remove = true) {
            if (remove) {
                popup_dom_list.parent.removeClass('payments_popup--state_auth payments_popup--state_pay payments_popup--state_email');
            }
            _log('setState', state);
            popup_dom_list.parent.addClass('payments_popup--state_' + state);
        };

        auth_data.on('Change', function (user_data) {
            if (user_data) {
                // if ( user_data.is_paid ) {
                //     popup_module.hide();
                // } else {
                    setState('pay');
                    setUserData(user_data);
                // }
            }else{
                setState('auth');
            }
        });
    };

    var getPaymentData = function (callback) {
        smart_ajax.post( {
            url: '/payments/accounts/orders/create',
            data: {
                stuff_id: popup_dom_list.tariff.val(),
                email: popup_dom_list.email.val(),
                redirect_url: document.location.href,
                mode: 'raw'
            },
            success: function(resp) {
                callback && callback(resp);
            },
            error: function( error ) {
                notify.error( 'Не удалось создать заявку на оплату: ' + error.toLowerCase() );
                callback && callback(false);
            }
        });
    };

    var submitForm = function (form_data) {

        self.trigger( 'Form submited', {
            stuff_id: popup_dom_list.tariff.val()
        });

        popup_dom_list.shop_id.val(form_data.shopId);
        popup_dom_list.scid.val(form_data.scid);
        popup_dom_list.sum.val(form_data.sum);
        popup_dom_list.custom_number.val(form_data.customerNumber);
        popup_dom_list.merchant_receipt.val(form_data.ym_merchant_receipt)
        popup_dom_list.order_number.val(form_data.orderNumber);

        popup_dom_list.pay_form.get()[0].submit();
    };

    var checkPaymentStatus = function () {
        if (self.delegated_data.action) {
            if (self.delegated_data.action.payment.status === 'true') {
                self.triggerOnce('Payment success', self.delegated_data.action.payment);
            }

            if (self.delegated_data.action.payment.status === 'false') {
                self.triggerOnce('Payment failed');
            }
        }
    };

    self.show = function(callback, popup_data) {
        var user_data = auth_data.get(),
            popup_data = {};

        self.trigger( 'Form shown', {} );

        popup_module.show({
            template: 'payments',
            data: popup_data,
            onReady: dealWithPopup.bind(self),
            onClose: function() {

                auth_data.off('Change');

                if ( callback ) {
                    callback( false );
                }

                if (email_form) {
                    email_form.destroy();
                    email_form = null;
                }

                popup_dom_list = null;
            }
        });

    };

    self.getDataById = function (id) {
        var data = {};

        // StuffList
        if (parseInt(id)) {
            data.id = id;
            data.brand = 'TJournal';
            data.category = 'subscription';

            switch (id) {
                case 1:
                    data.name = 'Подписка 1 месяц';
                    data.price = '75';
                    data.variant = '1 month'
                break;

                case 2:
                    data.name = 'Подписка 3 месяц';
                    data.price = '229';
                    data.variant = '3 month'
                break;

                case 3:
                    data.name = 'Подписка 1 год';
                    data.price = '749';
                    data.variant = '1 year'
                break;
            }

            return data;
        }
    };

    self.init = function () {

        smart_ajax.addResponseCodeHandler( 402, function( callback ) {
            self.show( function( is_paid ) {
                if ( is_paid ) {
                    callback( 'repeat' );
                } else {
                    callback( 'error' );
                }
            } );
        } );

        ajaxify.addResponseCodeHandler( 402, function( callback ) {
            self.show( function( is_paid ) {
                if ( is_paid ) {
                    callback( 'repeat' );
                } else {
                    callback( 'error' );
                }
            } );
        } );

        DOM.on('show_payment:click', function () {
            self.show(function () {

			});
		});

        DOM.on('Pay:click', function(data){

            if (popup_dom_list) {

                $.toggleClass(data.el, 'ui--bg_loading', true);

                if (email_form) {

                    email_form.checkValidation(function(status, message) {
                        if (status) {
                            email_form.showMessage(false);

                            getPaymentData(function (data) {
                                if (data !== false) {
                                    submitForm(data);

                                    email_form.destroy();
                                    email_form = null;
                                }else{
                                    $.toggleClass(data.el, 'ui--bg_loading', false);
                                }
                            });

                        }else{
                            email_form.showMessage(message, 'error');
                            $.toggleClass(data.el, 'ui--bg_loading', false);
                        }
                    });

                } else {

                    getPaymentData(function (data) {
                        if (data !== false) {
                            submitForm(data);
                        }else{
                            $.toggleClass(data.el, 'ui--bg_loading', false);
                        }
                    });

                }

            }

        });

        /**
         * Аналитика по оплате
         * https://developers.google.com/tag-manager/enhanced-ecommerce
         * 1) Кнопка “купить” показалась на экране – https://developers.google.com/tag-manager/enhanced-ecommerce#product-impressions
         * 2) Кнопка “купить” нажата (показалась наша кастомная форма с выбором опций) – https://developers.google.com/tag-manager/enhanced-ecommerce#product-clicks
         * 3) В этой форме нажата кнопка “оплатить” (то есть, переходим в магазин) – https://developers.google.com/tag-manager/enhanced-ecommerce#add
         * 4) Дальше – манипуляции с кошенльком – https://developers.google.com/tag-manager/enhanced-ecommerce#checkout
         * 5) После успешной оплаты – https://developers.google.com/tag-manager/enhanced-ecommerce#purchases
         */

         self.on( 'Form shown', function() {
             lib_analytics.pushToDataLayer( {
                 'event': 'productClick',
                 'ecommerce': {
                     'click': {
                         'actionField': {
                             'list': 'Article'
                         },
                         'products': [
                             {
                                 'name': 'Подписка 1 месяц',
                                 'id': '1',
                                 'price': '75',
                                 'brand': 'TJournal',
                                 'category': 'subscription',
                                 'variant': '1 month',
                                 'position': 1
                             }
                         ]
                     }
                 }
             } );
         } );

         // До того, как отправить форма
         self.on( 'Form submited', function( data ) {
             var data = self.getDataById(data.stuff_id);

             if (data) {
                 lib_analytics.pushToDataLayer( {
                     'event': 'addToCart',
                     'ecommerce': {
                         'currencyCode': 'RUB',
                         'add': {
                             'products': [
                                 {
                                     'name': data.name, // или на 3 или 12
                                     'id': data.id, // 1,2,3 для 1,3 и 12 месяцев
                                     'price': data.price, // сумма в рублях
                                     'brand': data.brand,
                                     'category': data.category,
                                     'variant': data.variant, // или на 3 или 12
                                     'quantity': 1
                                 }
                             ]
                         }
                     }
                 } );
             }

         } );

         self.on( 'Payment success', function( p_data ) {
             var data = self.getDataById(p_data.stuff_id);

             if ( data ) {
                 lib_analytics.pushToDataLayer( {
                     'event':  'purchase',
                     'ecommerce': {
                         'purchase': {
                             'actionField': {
                                 'id': p_data.order_number,
                                 'affiliation': 'Online Store',
                                 'revenue': data.price,
                                 'tax':'0',
                                 'shipping': '0'
                             },
                             'products': [
                                 {
                                     'name': data.name, // или на 3 или 12
                                     'id': data.id, // 1,2,3 для 1,3 и 12 месяцев
                                     'price': data.price, // сумма в рублях
                                     'brand': data.brand,
                                     'category': data.category,
                                     'variant': data.variant, // или на 3 или 12
                                     'quantity': 1
                                 }
                             ]
                         }
                     }
                 } );
             }
         } );

         checkPaymentStatus();
    };

    self.refresh = function() {};

    self.destroy = function() {
        DOM.off();
    };
});

Air.defineModule( 'module.vacancy_pay', 'lib.DOM, module.DOM, module.popup, module.smart_ajax, module.checkboxes, lib.string, class.Form2, lib.date, lib.ajax, module.ajaxify, module.notify, fn.openWindow, lib.storage, lib.color', function( $, DOM, popup_module, smart_ajax, checkboxes, string, Form, lib_date, ajax, ajaxify, notify, openWindow, storage, color_lib, util ) {

    var self = this,
        vacancy_data,
        pay_dom_list,
        bill_dom_list,
        card_dom_list,
        bill_form_instance,
        bill_data,
        cleave_instances,
        last_card_number;
        Cleave = require('cleave.js');

    /** Pay form handlers */
    var popupPayReadyHandler = function (popup) {
        var is_announcement;

        pay_dom_list = DOM.list(popup);

        checkboxes.processVisibleIn(popup);

        var updateTemplate = function() {
            var checked_length = 0,
                price_and_discount;

            is_announcement = getAnnouncement();

            pay_dom_list.checkbox.each(function (checkbox) {
                if (checkbox.checked) {
                    checked_length++;
                }
            });

            price_and_discount = calcPriceAndDiscount(checked_length, is_announcement);

            pay_dom_list.without_discount.html(string.numberFormat(price_and_discount.without_discount) + ' ₽');

            pay_dom_list.discount.html('–' + string.numberFormat(price_and_discount.discount) + ' ₽');

            pay_dom_list.total.html(string.numberFormat(price_and_discount.total) + ' ₽');

            pay_dom_list.controls.toggleClass('vacancies_pay--disabled', checked_length === 0);

            pay_dom_list.controls.toggleClass('vacancies_pay--discount', price_and_discount.discount > 0);

            pay_dom_list.controls.toggleClass('vacancies_pay--announcement', is_announcement);

            bill_data = {
                ids: getCheckedVacancies(),
                announcement: is_announcement,
                total: price_and_discount.total,
                total_str: string.numberFormat(price_and_discount.total) + ' ₽'
            };
        };

        $.delegateEvent($.find(popup, '.vacancies_pay__list'), '.vacancies_pay__list__item', 'click', function () {
            window.setTimeout(function () {
                updateTemplate();
            }, 0);
        });

        pay_dom_list.announcement_checkbox_click.on('click', function () {
            window.setTimeout(function () {
                updateTemplate();
            }, 0);
        });

        pay_dom_list.pay.on('click', function () {
            dealWithCashier();
        });

        pay_dom_list.announcement_toggler.on('click', function () {

            pay_dom_list.announcement_toggler.shown = !pay_dom_list.announcement_toggler.shown;

            if (pay_dom_list.announcement_toggler.shown) {
                pay_dom_list.announcement_toggler.text('Скрыть');
            }else{
                pay_dom_list.announcement_toggler.text('Как это будет выглядеть?');
            }

            pay_dom_list.announcement_preview.toggleClass('l-hidden', !pay_dom_list.announcement_toggler.shown);
        });

        pay_dom_list.bill.on('click', function () {
            showBillForm();
        });

        pay_dom_list.announcement_company.html(vacancy_data.list[0].company);

        updateTemplate();

    };

    var popupPayCloseHandler = function () {
        pay_dom_list.checkbox.off();
        pay_dom_list.pay.off();
        pay_dom_list.announcement_checkbox_click.off();
        pay_dom_list.announcement_toggler.off();
        pay_dom_list.bill.off();
        pay_dom_list.checkbox.off();

        pay_dom_list = null;
    };


    /** Bill form handlers */
    var popupBillReadyHandler = function (popup) {
        bill_dom_list = DOM.list(popup);

        /* init form */
        bill_form_instance = new Form( {
            element: $.find(popup, '.form2' ),
            actions: {
                save: {
                    url: '/job/order/create/invoice',
                    getData: function(data) {
                        return {
                            vacancies_ids: bill_data.ids,
                            announcement: bill_data.announcement
                        };
                    },
                    success: function( result ) {
                        ajaxify.reload();

                        showBillSuccessForm({
                            redirect_url: '/u/me/vacancies',
                            //download_link: result.invoice_url,
                            email: result.email
                        });
                    }
                },
            },
            events: {
                change: function(name, value) {

                },
                autocompleteSearch: function (name, query, callback) {
                    /** Autocomplete organization */
                    if (name === 'organization') {

                        if (query.length > 0) {

                            getOrganizationSuggestions(query, function (data) {
                                var suggestions = [];

                                /** Normalize API data */
                                data.suggestions.forEach(function (suggestion) {

                                    suggestions.push({
                                        text: '<p>' + suggestion.value + '</p><span>ИНН: ' + suggestion.data.inn + ' Адрес: ' + suggestion.data.address.value + '</span>',
                                        value: {
                                            name: suggestion.value,
                                            address: suggestion.data.address.value,
                                            inn: suggestion.data.inn,
                                            kpp: suggestion.data.kpp
                                        }
                                    });

                                });

                                /** Call autocomplete callback with data for suggestions */
                                callback(suggestions);

                            });

                        } else {

                            callback(false);

                        }

                    }

                },
                autocompleteSelected: function (name, item_data) {
                    /** Autocomplete organization */
                    if (name === 'organization') {
                        bill_form_instance.value('organization', item_data.value.name);
                        bill_form_instance.value('inn', item_data.value.inn);
                        bill_form_instance.value('kpp', item_data.value.kpp);
                        bill_form_instance.value('address', item_data.value.address);
                    }
                }
            }
        } );

        bill_dom_list.go_back.on('click', function () {
            popup_module.historyBack();
        });

    };

    var popupBillCloseHandler = function (popup) {
        bill_form_instance.destroy();

        bill_dom_list.go_back.off();

        bill_dom_list = null;
    };


    /** Card form handlers */
    var popupCardReadyHandler = function (popup) {
        var checkout;

        card_dom_list = DOM.list(popup);

        cleave_instances = [];

        cleave_instances.push(new Cleave(card_dom_list.card_number.get()[0], {
            blocks: [4, 4, 4, 4, 3],
            delimiter: ' ',
            numericOnly: true,
            onValueChanged: dealWithDifferentCardNumbers
        }));

        cleave_instances.push(new Cleave(card_dom_list.exp_month.get()[0], {
            numericOnly: true
        }));

        cleave_instances.push(new Cleave(card_dom_list.exp_year.get()[0], {
            numericOnly: true
        }));

        cleave_instances.push(new Cleave(card_dom_list.cvv.get()[0], {
            numericOnly: true
        }));

        // Require Cloudpayments script
        util.requireScript('https://widget.cloudpayments.ru/bundles/checkout', function () {
            checkout = new cp.Checkout(vacancy_data.cp_public, popup);

            card_dom_list.pay_by_card.on('click', function () {

                var result = checkout.createCryptogramPacket(),
                    msg_name,
                    error_mesage = '';

                if (result.success) {

                    cloudpayments3DS.showPreloader();

                    createPayOrderForCloudPayments({
                        ids: bill_data.ids,
                        announcement: bill_data.announcement,
                        cryptogram: result.packet
                    }, function (data, error_message) {

                        if (data) {

                            if (data.AcsUrl) {
                                // with 3DS
                                cloudpayments3DS.show3DS(data, function (status, error_message) {

                                    if (status) {

                                        showCardSuccessForm({
                                            status: true
                                        });

                                    } else if (error_message) {

                                        showCardSuccessForm({
                                            status: false,
                                            title: 'Ошибка оплаты',
                                            text: error_message,
                                            email: data.site_email
                                        });

                                    } else {

                                        showCardSuccessForm({
                                            status: false,
                                            email: data.site_email
                                        });

                                    }

                                });
                            } else {
                                // no 3DS
                                cloudpayments3DS.close();

                                showCardSuccessForm({
                                    status: true
                                });
                            }

                        } else {
                            // Error
                            cloudpayments3DS.close();

                            showCardSuccessForm({
                                status: false,
                                title: 'Ошибка оплаты',
                                text: error_message,
                                email: data.site_email,

                            });
                        }

                    });

                } else {
                    for (msg_name in result.messages) {
                        error_mesage += result.messages[msg_name] + '<br>';
                    }
                    notify.error(error_mesage);
                }

            });
        });

        card_dom_list.go_back.on('click', function () {
            popup_module.historyBack();
        });

        DOM.on('test_card', function (data) {
            card_dom_list.card_number.val(data.data.a);
            card_dom_list.exp_month.val(data.data.b);
            card_dom_list.exp_year.val(data.data.c);
            card_dom_list.cvv.val(data.data.d);
        });

    };

    var popupCardCloseHandler = function (popup) {
        card_dom_list.go_back.off();
        card_dom_list.pay_by_card.off();

        cleave_instances.forEach(function (cleave_instance) {
            cleave_instance.destroy();
        });

        card_dom_list = cleave_instances = last_card_number = null;
    };


    /** Show pay form */
    var showPayForm = function( vacancy_id, callback ) {

        getVacanciesList(function (data) {

            vacancy_data = data;

            vacancy_data.is_one = vacancy_data.list.length === 1;

            if (vacancy_data.is_one) {
                setCheckedVacancy(vacancy_data.list, vacancy_data.list[0].id);
            } else {
                setCheckedVacancy(vacancy_data.list, vacancy_id || 1);
            }

            if (vacancy_data.costs) {
                vacancy_data.announcement_price_str = string.numberFormat(vacancy_data.costs.announcement_price / 100) + ' ₽';
            }

            popup_module.show({
                template: 'vacancy_pay',
                data: vacancy_data,
                onReady: popupPayReadyHandler.bind(self),
                onClose: popupPayCloseHandler.bind(self)
            });

            callback && callback();
        });

    };

    /** Show bill form */
    var showBillForm = function () {

        popup_module.replace({
            template: 'vacancy_bill',
            data: {
                name: '{{name}}',
                email: vacancy_data.user_email
            },
            history: true,
            onReady: popupBillReadyHandler.bind(self),
            onClose: popupBillCloseHandler.bind(self),
        });

    };

    /** Show card form */
    var showCardForm = function () {

        popup_module.replace({
            template: 'vacancy_card',
            data: {
                total: bill_data.total_str
            },
            history: true,
            onReady: popupCardReadyHandler.bind(self),
            onClose: popupCardCloseHandler.bind(self),
        });

    };

    /** Show bill success form */
    var showBillSuccessForm = function (data) {

        popup_module.replace({
            template: 'vacancy_bill_success',
            data: {
                download_link: data.download_link,
                redirect_url: data.redirect_url,
                email: data.email
            },
            onReady: function () {
                ajaxify.reload();
            }
        });

    };

    /** Show card success form */
    var showCardSuccessForm = function (data) {

        popup_module.replace({
            template: 'vacancy_paid',
            data: data,
            history: !data.status,
            onReady: function () {
                if (data.status) {
                    ajaxify.reload();
                }
            }
        });

    };

    /** Check's vacancy by id in vacancies list */
    var setCheckedVacancy = function (vacancy_list, vacancy_id) {

        vacancy_list.forEach(function (vacancy) {

            if (vacancy.is_checked) {
                vacancy.checked = true;
            } else if (vacancy_id === 'all') {
                vacancy.checked = true;
            }else{
                vacancy.checked = vacancy.id == vacancy_id;

            }

        });

    };

    /** Calculate price and discount by items length */
    var calcPriceAndDiscount = function (n, is_announcement) {
        var price = vacancy_data.costs.one_vacancy_price / 100,
            price_announcement = vacancy_data.costs.announcement_price / 100,
            price_with_discount,
            price_without_discount,
            price_total,
            discount;

        price_without_discount = n * price;

        price_with_discount = (n - Math.floor(n / 5)) * price;

        discount = price_without_discount - price_with_discount;

        price_total = price_without_discount - discount;

        if (is_announcement) {
            price_total += price_announcement;
        }

        return {
            without_discount: price_without_discount,
            total: price_total,
            discount: discount
        };
    };

    /** Get vacancies list */
    var getVacanciesList = function (callback) {

        smart_ajax.get( {
            url: '/job/needtopay',
            data: {
                mode: 'raw'
            },
            success: function (data) {
                /** Convert date to string */
                data.list.forEach(function (list_item) {
                    list_item.date = lib_date.getPassedTime(new Date(list_item.date_created * 1000)).toLowerCase();
                });

                callback && callback(data);
            }
        });

    };

    /** Get checked vacancies and ids */
    var getCheckedVacancies = function () {
        var data = [];

        pay_dom_list.checkbox.each(function (checkbox) {
            if (checkbox.checked) {
                data.push($.data(checkbox, 'vacancy-id'))
            }
        });

        return data;
    };

    /** Get announcement checbox value */
    var getAnnouncement = function () {
        return pay_dom_list.announcement_checkbox.get()[0].checked;
    };

    /** Search in organization by API dadata.ru */
    var getOrganizationSuggestions = function (query, callback) {
        var xhr = new XMLHttpRequest();

        xhr.open('POST', 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/party');

        xhr.setRequestHeader('Authorization', 'Token 21225cbf754e1af28d07913fdbde859057a20088');
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Accept', 'application/json');

        xhr.onload = function() {

			if ( xhr.status === 200 ) {

				callback && callback(JSON.parse(xhr.responseText || '{}'));

			}else{

                callback && callback(false);

            }

		};

        xhr.send(JSON.stringify({query: query}));

    };

    /** Create order for Yandex */
    var createPayOrderForYandex = function (data, callback) {
        smart_ajax.post( {
            url: '/job/order/create/yandex',
            data: {
                vacancies_ids: data.ids,
                announcement: data.announcement,
                mode: 'raw'
            },
            success: function(resp) {
                callback && callback(resp);
            },
            error: function( error ) {
                callback && callback(false);
            }
        });
    };

    /** Submit Yandex form for pay form */
    var submitYandexForm = function (form_data) {
        pay_dom_list.pay_form.attr('action', form_data.url);
        pay_dom_list.shop_id.val(form_data.shopId);
        pay_dom_list.scid.val(form_data.scid);
        pay_dom_list.sum.val(form_data.sum);
        pay_dom_list.custom_number.val(form_data.customerNumber);
        pay_dom_list.merchant_receipt.val(form_data.ym_merchant_receipt)
        pay_dom_list.order_number.val(form_data.orderNumber);

        pay_dom_list.pay_form.get()[0].submit();
    };

    /** Create order for CloudPayments */
    var createPayOrderForCloudPayments = function (data, callback) {
        smart_ajax.post( {
            url: '/job/order/create/cloudpayments',
            data: {
                vacancies_ids: data.ids,
                announcement: data.announcement,
                cryptogram: data.cryptogram,
                mode: 'raw'
            },
            ignore_error_notify: true,
            success: function(resp) {
                callback && callback(resp);
            },
            error: function( error ) {
                callback && callback(false, error);
            }
        });
    };

    /** Deal with different cashier */
    var dealWithCashier = function () {
        switch (vacancy_data.cashier) {

            case 1:
                /** Yandex */
                pay_dom_list.pay.toggleClass('ui--bg_loading', true);

                createPayOrderForYandex({
                    ids: getCheckedVacancies(),
                    announcement: getAnnouncement()
                }, function (data) {

                    if (data) {
                        submitYandexForm(data);
                    }
                });

                break;

            case 5:
                /** CloudPayments */
                showCardForm();

                break;
        }
    };

    var dealWithDifferentCardNumbers = function (e) {

        var n1 = parseInt(e.target.rawValue.substring(0, 1)),
            n2 = parseInt(e.target.rawValue.substring(0, 2)),
            master_card = [51, 52, 53, 54, 55],
            maestro = [50, 56, 57, 58],
            visa = [4],
            mir = [2],
            payment_system;

        if (master_card.indexOf(n2) > -1) {

            payment_system = 1;

        } else if (maestro.indexOf(n2) > -1) {

            payment_system = 2;

        } else if (visa.indexOf(n1) > -1) {

            payment_system = 3;

        } else if (mir.indexOf(n1) > -1) {

            payment_system = 4;

        } else {

            payment_system = 0;

        }

        card_dom_list.payment_system.attr('data-payment-system', payment_system);

        dealWithDifferentBanks(e.target.rawValue);
    };

    var dealWithDifferentBanks = function (card_number) {

        card_number = card_number.toString().substr(0,6);

        if (card_number.length >= 6) {

            if (card_number !== last_card_number) {

                last_card_number = card_number;

                smart_ajax.post( {
                    url: '/payments/bank/info',
                    data: {
                        card_prefix: card_number,
                        mode: 'raw'
                    },
                    success: function (data) {
                        if (!data.is_unknown) {
                            fillCardLayout(data.color, data.name);
                        }
                    },
                    error: function () {
                        last_card_number = null;
                        fillCardLayout('', '');
                    }
                });

            }

        } else {
            last_card_number = null;
            fillCardLayout('', '');
        }
    };

    var fillCardLayout = function (bg_color, bank_name) {
        card_dom_list.card_layout_bg.css('background-color', bg_color);
        card_dom_list.card_layout_text.css('color', color_lib.getContrastColor(bg_color));
        card_dom_list.card_layout_text.text(bank_name);
    };

    var cloudpayments3DS = new function() {
        var win;

        this.showPreloader = function () {
            var preloader_html = '<div class="spinner"><div class="bounce1"></div><div class="bounce2"></div><div class="bounce3"></div></div><style>body{display:flex;height:100%;align-items:center;width:100%;margin:0;padding:0;justify-content:center;}.spinner{width:78px;text-align:center}.spinner>div{margin:0 4px;width:18px;height:18px;background-color:#696969;border-radius:100%;display:inline-block;-webkit-animation:sk-bouncedelay 1.4s infinite ease-in-out both;animation:sk-bouncedelay 1.4s infinite ease-in-out both}.spinner .bounce1{-webkit-animation-delay:-0.32s;animation-delay:-0.32s}.spinner .bounce2{-webkit-animation-delay:-0.16s;animation-delay:-0.16s}@-webkit-keyframes sk-bouncedelay{0%,80%,100%{-webkit-transform:scale(0)}40%{-webkit-transform:scale(1.0)}}@keyframes sk-bouncedelay{0%,80%,100%{-webkit-transform:scale(0);transform:scale(0)}40%{-webkit-transform:scale(1.0);transform:scale(1.0)}}</style>';

            win = openWindow('');

            win.document.body.innerHTML = preloader_html;
        };

        this.show3DS = function (data, callback) {
            var form_html = `<form name="downloadForm" action="${data.AcsUrl}" method="POST"><input type="hidden" name="PaReq" value="${data.PaReq}"><input type="hidden" name="MD" value="${data.TransactionId}"><input type="hidden" name="TermUrl" value="${data.term_url}"></form>`;

            win.document.body.innerHTML = form_html;

            win.focus();

            setTimeout(function () {
                win.downloadForm.submit();
            }, 100);

            storage.remove('3ds_error');
            storage.remove('3ds_success');

            $.on(window, 'storage.module_vacancy_pay', function() {

                if (storage.get('3ds_success')) {

                    callback(true);

                } else if (storage.get('3ds_error')) {

                    callback(false, storage.get('3ds_error'));

                } else {

                    callback(false, 'Окно 3DS было закрыто');

                }

                $.off(window, 'storage.module_vacancy_pay');

                callback = null;

            });
        };

        this.close = function () {
            win.close();
        };
    };

    self.init = function() {
        DOM.on('vacancy_pay:click', function(data) {

            $.toggleClass(data.el, 'ui--bg_loading', true);

            showPayForm($.data(data.el, 'vacancy-id'), function () {
                $.toggleClass(data.el, 'ui--bg_loading', false);
            });
        });
    };

    self.refresh = function() {
        self.destroy();
        self.init();
    };

    self.destroy = function() {
        DOM.off();
    };

} );

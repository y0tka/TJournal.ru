Air.define('lib.normal_push', 'lib.browser_push_api, lib.sw_api, lib.storage, lib.console, lib.DOM', function(browser_push_api, sw_api, storage, console) {

    return {

        stored_enpoint_key: 'sPush:endpoint',

        sw_url: (__debug ? __static_path : '') + '/pushWorker.js',

        current_sw_registration: null,

        current_push_subscription: null,

        /**
         * If normal pushes supported
         * @returns boolean
         */
        isSupported: function() {
            return browser_push_api.isSupported() && sw_api.isSupported();
        },

        storeEndpoint: function(endpoint) {
            storage.set(this.stored_enpoint_key, endpoint);
            console.log('push', 'storeEndpoint', endpoint);
            return endpoint;
        },

        getStoredEndpoint: function() {
            return storage.get(this.stored_enpoint_key);
        },

        removeStoredEndpoint: function() {
            storage.remove(this.stored_enpoint_key);
        },

        responseToJSON: function(response) {
            return response.json();
        },

        formFetchParams: function(endpoint) {
            return {
                method : 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    endpoint: endpoint
                })
            };
        },

        /**
         * Returns same value (https://en.wikipedia.org/wiki/Identity_function)
         *
         * @param value
         * @returns {function(): *}
         */
        identical: function(value) {
            return function() {
                return value;
            };
        },

        sendEndpointToServer: function(url, endpoint) {
            if (__debug) {
                return Promise.resolve(endpoint);
            } else {
                return fetch(url, this.formFetchParams(endpoint))
                    .then(this.responseToJSON.bind(this))
                    .then(this.identical(endpoint));
            }
        },

        saveEndpointAtServer: function(endpoint) {
            console.log('push', 'saveEndpointAtServer', endpoint);
            return this.sendEndpointToServer(`https://push.${__domain}/api/endpoint/put/`, endpoint);
        },

        removeEndpointAtServer: function(endpoint) {
            console.log('push', 'removeEndpointAtServer', endpoint);
            return this.sendEndpointToServer(`https://push.${__domain}/api/endpoint/delete/`, endpoint);
        },

        storeSWRegistration: function(sw_registration) {
            this.current_sw_registration = sw_registration;
            console.log('push', 'storeSWRegistration', sw_registration);
            return this.current_sw_registration;
        },

        getStoredSWRegistration: function() {
            return this.current_sw_registration;
        },

        storePushSubscription: function(push_subscription) {
            this.current_push_subscription = push_subscription;
            console.log('push', 'storePushSubscription', push_subscription);
            return this.current_push_subscription;
        },

        getStoredPushSubscription: function() {
            return this.current_push_subscription;
        },

        returnNull: function() {
            return null;
        },

        processEndpointAfterSubscription: function(endpoint) {
            if (endpoint === null) { // если во время подпи��ки произошла ошибка, то грохаем только что созданную подписку
                console.warn('push', 'processEndpointAfterSubscription: invalid endpoint, unsubscribing back', endpoint);
                browser_push_api.unsubscribe(this.getStoredPushSubscription());
                return Promise.reject('Произошла ошибка при подписке');
            } else { // если после подписки все ок, то сохраняем эндпоинт
                console.log('push', 'processEndpointAfterSubscription: endpoint is ok', endpoint);
                return this.storeEndpoint(endpoint);
            }
        },

        processEndpointAfterUnsubscription: function(endpoint) {
            if (endpoint === null) { // если во время отписки произошла ошибка, то оживляем только что отписаную подписку
                console.warn('push', 'processEndpointAfterUnsubscription: invalid endpoint, subscribing back', endpoint);
                browser_push_api.subscribe(sw_api.getPushManager(this.getStoredSWRegistration()));
                return Promise.reject('Произошла ошибка при отписке');
            } else { // если после отписки все ок, то удаляем эндпоинт
                console.log('push', 'processEndpointAfterUnsubscription: endpoint is ok', endpoint);
                return this.removeStoredEndpoint(endpoint);
            }
        },

        subscribeWithPushManager: function(push_manager) {
            return browser_push_api.subscribe(push_manager)                 // подписываемся с помощью pushManager
                .then(this.storePushSubscription.bind(this))                // сохраняем подписку
                .then(browser_push_api.getSubscriptionEndpoint)             // берем эндпоинт подписки
                .then(this.saveEndpointAtServer.bind(this))                 // сохраняем эндпоинт на сервер
                .catch(this.returnNull.bind(this))                          // ловим ошибки на предыдущих шагах
                .then(this.processEndpointAfterSubscription.bind(this));    // проверяем, не случилось ли на предыдущих шагах ошибки
        },

        unsubscribeWithPushSubscription: function(push_subscription) {
            return browser_push_api.unsubscribe(push_subscription)          // отписываем подписку
                .then(this.identical(push_subscription))                    // снова берем эту подписку
                .then(browser_push_api.getSubscriptionEndpoint)             // берем эндпоинт отписки
                .then(this.removeEndpointAtServer.bind(this))               // удаляем эндпоинт с сервера
                .catch(this.returnNull.bind(this))                          // ловим ошибки на предыдущих шагах
                .then(this.processEndpointAfterUnsubscription.bind(this));  // проверяем, не случилось ли на предыдущих шагах ошибки
        },

        processPushSubscription: function(pushSubscription) {
            console.log('push', 'processPushSubscription', pushSubscription);
            return pushSubscription !== null;

            // let last_endpoint = this.getStoredEndpoint();
            // console.log('push', 'processPushSubscription', pushSubscription, last_endpoint);
            // if (pushSubscription) { /* Already subscribed */
            //     if (!last_endpoint) {
            //         this.storeEndpoint(browser_push_api.getSubscriptionEndpoint(pushSubscription))
            //     }
            //
            //     return true;
            // } else if (last_endpoint) { /* Not subscribed, but user granted access */
            //     return this.subscribe();
            // } else { /* Not subscribed */
            //     return false;
            // }
        },

        /**
         * Подписываемся с помощью сохраненного воркера
         * @returns {*}
         */
        subscribe: function() {
            let registration = this.getStoredSWRegistration();

            if (registration === null) {
                console.warn('push', 'subscribe: registration is null');
                return Promise.reject('Нет регистрации');
            } else {
                return this.subscribeWithPushManager(sw_api.getPushManager(registration));
            }
        },

        /**
         * Отписываемся с помощью сохраненной подписки
         * @returns {*}
         */
        unsubscribe: function() {
            let subscription = this.getStoredPushSubscription();

            if (subscription === null) {
                console.warn('push', 'unsubscribe: subscription is null');
                return Promise.reject('Нет подписки');
            } else {
                return this.unsubscribeWithPushSubscription(subscription);
            }
        },

        /**
         * Делает все на начальном этапе (описано ниже)
         * @returns {*}
         */
        doAllTheStuff: function() {
            return sw_api.register(this.sw_url)                 // регистрируем воркер
                .then(this.storeSWRegistration.bind(this))      // сохраняем зарегистрированный воркер
                .then(sw_api.getPushManager)                    // берем pushManager воркера
                .then(browser_push_api.getSubscription)         // берем подписку у pushManager
                .then(this.storePushSubscription.bind(this))    // сохраняем подписку
                .then(this.processPushSubscription.bind(this)); // обрабатываем ее
        },

        prepare: function() {
            return this.removeDuplicatedWorkers()               // проверяем не дублируются ли воркеры
                .then(this.doAllTheStuff.bind(this));           // делаем остальное
        },

        isSameSW: function(sw_url) {
            let last_octet = this.sw_url.split('/').pop();

            return sw_url.indexOf(last_octet) >= 0;
        },

        removeDuplicatedWorkers: function() {
            let that = this;

            console.log('push', 'removeDuplicatedWorkers: start');

            return sw_api.getRegistrations().then(function(registrations) {
                let endpoint = that.getStoredEndpoint();

                let active_registrations = registrations.reverse().filter(sw_api.hasActive);

                if (!endpoint) {
                    console.log('push', 'removeDuplicatedWorkers: there\'s no saved endpoint');
                    active_registrations.forEach(function(registration) {
                        browser_push_api.getSubscription(sw_api.getPushManager(registration)).then(function(push_subscription) {
                            if (push_subscription) {
                                that.storeEndpoint(browser_push_api.getSubscriptionEndpoint(push_subscription));
                            }
                        });
                    });
                } else if (active_registrations.length > 1) {
                    console.log('push', 'removeDuplicatedWorkers: there\'s saved endpoint and more then one active registrations');
                    active_registrations.forEach(function(registration) {
                        if (sw_api.hasActive(registration) && that.isSameSW(sw_api.getRegistrationUrl(registration))) {
                            console.log('push', 'removeDuplicatedWorkers: unregister some');
                            sw_api.unregister(registration);
                        }
                    });
                }

                console.log('push', 'removeDuplicatedWorkers: done');
            });
        }

    };

});
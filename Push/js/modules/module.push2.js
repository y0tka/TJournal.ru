Air.define('module.push2', 'module.notify, lib.normal_push, lib.safari_push, lib.console, lib.analytics', function(notify, normal_push, safari_push, console, lib_analytics) {

    var self = this,
        current_state = false;

    self.setState = function(state) {
        console.log('push', 'setState', state);

        self.triggerOnce('State changed', state);

        if (state) {
            self.triggerOnce('Enabled');
        } else {
            self.triggerOnce('Disabled');
        }

        current_state = state;

        return state;
    };

    self.getState = function() {
        return current_state;
    };

    self.isSupported = function() {
        return normal_push.isSupported() || safari_push.isSupported();
    };

    self.callMethod = function(method_name) {
        console.log('push', method_name);

        if (normal_push.isSupported()) {
            return normal_push[method_name]();
        } else if (safari_push.isSupported()) {
            return safari_push[method_name]();
        } else {
            return Promise.reject('Браузер не поддерживает push-уведомления');
        }
    };

    self.subscribe = function() {
        return self.callMethod('subscribe')
            .then(self.handleSubscriptionSuccess)
            .catch(self.handleSubscriptionFail);
    };

    self.handleSubscriptionSuccess = function() {
        self.setState(true);
        lib_analytics.sendDefaultEvent('Push Notifications — Subscribe')
    };

    self.handleSubscriptionFail = function(error) {
        self.trigger('Subscription failed');
        notify.error(`Не удалось подписаться на push-уведомления (${error})`);
    };

    self.unsubscribe = function() {
        return self.callMethod('unsubscribe')
            .then(self.handleUnsubscriptionSuccess)
            .catch(self.handleUnsubscriptionFail);
    };

    self.handleUnsubscriptionSuccess = function() {
        self.setState(false);
        lib_analytics.sendDefaultEvent('Push Notifications — Unsubscribe')
    };

    self.handleUnsubscriptionFail = function(error) {
        self.trigger('Unsubscription failed');
        notify.error(`Не удалось отписаться от push-уведомлений (${error})`);
    };

    self.toggle = function(state) {
        if (state) {
            return self.subscribe();
        } else {
            return self.unsubscribe();
        }
    };

    self.handlePrepareError = function(error) {
        console.warn('push', `error on preparing: "${error}"`);
    };

    self.init = function(callback) {
        console.define('push', 'Push (-。-)', '#ff5900');

        return self.callMethod('prepare')
            .then(self.setState)
            .catch(self.handlePrepareError)
            .then(callback);
    };

}, {
    async: true
});
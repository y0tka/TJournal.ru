Air.define('lib.browser_push_api', '', function() {

    return {

        isPromiseSupported : function () {
            return ('Promise' in window) && (Promise.toString().indexOf('[native code]') >= 0);
        },

        isPushManagerSupported: function() {
            return 'PushManager' in window;
        },

        isSupported: function() {
            return this.isPushManagerSupported() && this.isPromiseSupported();
        },

        getSubscription: function(pushManager) {
            return pushManager.getSubscription();
        },

        subscribe: function(pushManager) {
            return pushManager.subscribe({
                userVisibleOnly: true
            });
        },

        unsubscribe: function(push_subscription) {
            return push_subscription.unsubscribe();
        },

        getSubscriptionEndpoint: function(pushSubscription) {
            return pushSubscription.endpoint;
        }

    }

});
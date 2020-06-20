Air.define('lib.sw_api', '', function() {

    return {

        isSupported: function() {
            return 'serviceWorker' in navigator;
        },

        register: function(sw_url) {
            return navigator.serviceWorker.register(sw_url);
        },

        unregister: function(registration) {
            registration.unregister();
        },

        getRegistrations: function() {
            return navigator.serviceWorker.getRegistrations();
        },

        getPushManager: function(registration) {
            return registration.pushManager;
        },

        hasActive: function(registration) {
            return registration.active;
        },

        getRegistrationUrl: function(registration) {
            if (this.hasActive(registration)) {
                return registration.active.scriptURL;
            } else {
                return null;
            }

        }

    };

});
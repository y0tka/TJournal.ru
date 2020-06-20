Air.define('module.online', 'lib.DOM', function($) {

    this.init = function() {
        this.updateStatus(this.is());

        $.on(window, 'online.module_online', this.updateStatus.bind(this, true));
        $.on(window, 'offline.module_online', this.updateStatus.bind(this, false));
    };

    this.destroy = function() {
        $.off(window, 'online.module_online');
        $.off(window, 'offline.module_online');
    };

    this.updateStatus = function(state) {
        this.triggerOnce('Change', state);
    };

    this.is = function() {
        return window.navigator === undefined ? true : (window.navigator.onLine === true);
    };

});

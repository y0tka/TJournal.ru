Air.define('module.tab', 'lib.DOM', function($) {

    var self = this;

    self.isHidden = function() {
        return document.hidden;
    };

    self.isActive = function() {
        return !self.isHidden();
    };

    function check(callback) {
        if (self.isActive()) {
            callback();
        } else {
            $.one(document, 'visibilitychange.module_tab', check.bind(self, callback));
        }
    }

    self.init = function(callback) {
        check(callback);
    };

    self.destroy = function(callback) {
        $.off(document, 'visibilitychange.module_tab');
        callback();
    };

}, {
    async: true
});
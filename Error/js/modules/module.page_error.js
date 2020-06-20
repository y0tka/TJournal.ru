Air.defineModule('module.page_error', 'lib.DOM, module.auth, module.location', function($, auth, location) {
    var self = this;

    self.init = function () {
        var error_code = parseInt($.data(self.elements[0].element, 'error-code'));

        switch (error_code) {

            case 401:

                auth.showAuth({
                    callback: function (state) {
                        if (state) {
                            location.reload();
                        }
                    }
                });

            break;

        }
    };

    self.refresh = function () {
        self.destroy();
        self.init();
    };

    self.destroy = function () {

    };

});

Air.define('module.utility_tags', 'lib.DOM', function($) {
    var self = this;

    self.init = function () {

        /**
         * <nojob>
         * removes vacancy widget from page
         */
        let nojob = $.find('nojob');

        if (nojob) {

            let widget = $.find('.l-wide_container--vacancies');

            if (widget) {
                $.remove(widget);
            }

            widget = null;

        }

        nojob = null;

    };

    self.refresh = self.init;

});

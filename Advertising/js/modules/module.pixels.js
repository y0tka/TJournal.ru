Air.define('module.pixels', 'lib.DOM, module.delegator', function($, delegator) {
    var self = this;

    var updatePixel = function() {
        var AdFoxDL = encodeURIComponent(document.location),
            pr = Math.floor(Math.random() * 4294967295) + 1,
            pixel_url = '//ads.adfox.ru/228129/tracePoint?p7=mzog&amp;p8=h&amp;dl=' + AdFoxDL + '&amp;pr=' + pr,
            img;

        if (delegator.getData('navigation_name') === 'mainpage') {
            img = new Image();
            img.src = pixel_url;

            img = null;
        }
    };

    self.init = function(callback) {
        updatePixel();
    };

    self.refresh = function(callback) {
        updatePixel();
    };

});

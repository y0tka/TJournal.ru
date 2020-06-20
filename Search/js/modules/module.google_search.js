Air.define('module.google_search', 'module.DOM, lib.DOM, module.location', function(DOM, $, location) {
    var self = this,
        api_inited = false,
        gcse_id = 'google_search',
        search_query,
        firefox_timeout;

    var initApi = function(callback) {
        if (api_inited === false) {
            var gsceCallback = function() {

                google.setOnLoadCallback(function() {
                    api_inited = true;
                    clearTimeout(firefox_timeout);
                    callback && callback();
                }, true);

                firefox_timeout = setTimeout(function(){
                    callback && callback();
                }, 1000);
            };

            window.__gcse = {
                parsetags: 'explicit',
                callback: gsceCallback
            };

            var cx = self.delegated_data.cx; // Insert your own Custom Search engine ID here
            var gcse = document.createElement('script');
            gcse.type = 'text/javascript';
            gcse.async = true;
            gcse.src = 'https://cse.google.com/cse.js?cx=' + cx;
            var s = document.getElementsByTagName('script')[0];
            s.parentNode.insertBefore(gcse, s);
        }else{
            callback && callback();
        }
    };

    var renderGoogleSearch = function(){
        if ($.children(self.elements[0].element).length === 0) {
            google.search.cse.element.render({
                div: gcse_id,
                tag: 'search',
                gname: gcse_id,
                attributes: {
                    autoSearchOnLoad: false
                }
            });
        }

        changeQuery(self.delegated_data.query);
    };

    var changeQuery = function (query) {
        google.search.cse.element.getElement(gcse_id).execute(query);
    };

    self.init = function() {
        initApi(function(){
            renderGoogleSearch();
        });
    };

    self.refresh = function() {
        self.destroy();
        self.init();
    };

    self.destroy = function() {

    };
});

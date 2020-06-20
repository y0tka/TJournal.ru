Air.define('fn.parseUrl', function() {

    var link_element = document.createElement('a');

    return function(url) {
        link_element.href = url;

        var search = link_element.search.substring(1);

        return {
            path: link_element.pathname,
            search: search,
            hash: link_element.hash.substring(1),
            full_path: link_element.pathname + (search === '' ? '' : `?${search}`),
            hostname: link_element.hostname
        };
    };

});

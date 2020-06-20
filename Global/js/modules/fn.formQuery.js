Air.define('fn.formQuery', function() {

    return function( query_obj ) {
        var result = [],
            item;

        for (item in query_obj) {
            result.push(encodeURIComponent(item) + '=' +  encodeURIComponent(query_obj[item]));
        }

        return result.join('&');
    };

});

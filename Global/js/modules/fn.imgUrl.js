Air.defineFn('fn.imgUrl', function() {
    return function(img_url, filters) {
        var arr = ['jpg', 'jpeg', 'png', 'gif'],
            extension = img_url.substr(img_url.lastIndexOf('.') + 1);

        if (arr.indexOf(extension) > -1 || !img_url || img_url.indexOf('service/preview') > -1) {
            return img_url;
        }else{
            return img_url + filters;
        }
    };
});

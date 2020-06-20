Air.defineFn('fn.extend', function() {
    return function(out) {
        var out = out || {},
            i,
            length;

        for (i = 1, length = arguments.length; i < length; i++) {
            var obj = arguments[i],
                key;

            if (!obj) {
                continue;
            }

            for (key in obj) {
                if (obj.hasOwnProperty(key)) {
                    // It's not deep!!!!
                    out[key] = obj[key];
                }
            }
        }

        return out;
    };
});

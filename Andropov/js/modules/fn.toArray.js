Air.define('fn.toArray', function() {
    return function toArray(list) {
        return Array.prototype.slice.call(list);
    };
});

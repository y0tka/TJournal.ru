Air.define('module.lazy_load', function() {

    // var buffer;

    this.init = function() {
       //  buffer = new ChunkedBuffer({
       //     size: 50, // сколько картинок в чанке
       //     delay: 20, // сколько выжидает времени (мс) прежде чем начать грузить первый чанк
       //     period: 1000, // время между чанками (мс)
       //     onFlushEvery: ({src, callback}) => this.load(src, callback)
       // });
    };

    this.refresh = function() {
        // buffer.reset();
    };

    this.destroy = function() {
        // buffer.destructor();
    };

    this.add = function(src, callback) {
        this.load(src, callback);
        // buffer.add({src, callback});
    };

    this.load = function(src, callback) {
        var image = new Image();
        image.onload = callback.bind(null, src);
        image.src = src;
    };

});

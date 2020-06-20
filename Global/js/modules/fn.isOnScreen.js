Air.define('fn.isOnScreen', 'module.metrics, lib.DOM', function(metr, $) {

    /**
     * Checks if element visible on screen at the moment
     * @param {Element} - HTML NodeElement
     * @return {Boolean}
     */
    return function isOnScreen(el) {
        var el_rect = $.rect(el);

        // Верх объекта выше дна экрана, а низ объекта ниже верха экрана.
        return (el_rect.top < metr.window_height) && (el_rect.bottom > 0);
    };

});

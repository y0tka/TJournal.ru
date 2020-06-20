/**
 * @module libKeys
 * Readable keys dictionary.
 * Returns keyCode for requested key
 */
Air.defineLib( 'lib.keys', {

    BACKSPACE: 8,
    TAB: 9,
    ENTER: 13,
    SHIFT: 16,
    CTRL: 17,
    ALT: 18,
    ESC: 27,
    SPACE: 32,
    DELETE: 46,

    /**
     * Arrows
     */
    LEFT: 37,
    UP: 38,
    DOWN: 40,
    RIGHT: 39,

    /**
     * Command
     */
    META: 91,

    /**
     * Chars
     */
    V: 86

    /**
     * Returns "true" if key is non-command character.
     * [Пока не нужно, но вдруг пригодится]
     */
    // isPrintable: function( keycode ) {
    //     return (keycode > 47 && keycode < 58)   || // number keys
    //             keycode == 32 || keycode == 13   || // spacebar & return key(s) (if you want to allow carriage returns)
    //             (keycode > 64 && keycode < 91)   || // letter keys
    //             (keycode > 95 && keycode < 112)  || // numpad keys
    //             (keycode > 185 && keycode < 193) || // ;=,-./` (in order)
    //             (keycode > 218 && keycode < 223);   // [\]' (in order)
    // }

});

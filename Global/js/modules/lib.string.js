/**
  * @module libString
  * @description Library for working with strings (and numbers format ¯\_(ಸ ‿ ಸ)_/¯)
  */
Air.defineLib( 'lib.string', {
    /**
     * Cut string by words
     * @typedef {Function} module:libString.cut
     * @param {string} str   - original string
     * @param {number} limit - symbols limit
     * @param {string|null} [ending] - cut string ending. For example «...»
     * @return {string}
     */
    cut: function( str, limit, ending ) {
        var str_length = str.length,
            ending = ending || '…',
            ending_length = ending.length,
            substring,
            result;

        if ( str_length <= limit ) {
            result = str;
        } else {
            substring = str.substring( 0, limit - ending_length ).split( ' ' );

            if ( substring.length > 1 ) {
                substring.pop();
                result = substring.join( ' ' );
            } else {
                result = substring[ 0 ];
            }

            result += ending;
        }

        return result;
    },

    /**
     * @typedef {Function} module:libString.capFirstLetter
     * @return {string}
     */
    capFirstLetter: function( str ) {
        return str.charAt( 0 ).toUpperCase() + str.slice( 1 );
    },

    /**
     * @typedef {Function} module:libString.removeSpaces
     * @return {string}
     */
    removeSpaces: function( str ) {
        return str.replace( /\s/g, '' );
    },

    /**
     * @typedef {Function} module:libString.removeLineBreaks
     * @return {string}
     */
    removeLineBreaks: function( str ) {
        return this.replaceLineBreaks(str, '')
    },

    /**
     * @typedef {Function} module:libString.replaceLineBreaks
     * @return {string}
     */
    replaceLineBreaks: function( str, replace_with ) {
        return str.replace( /\r?\n|\r/g, replace_with );
    },

    /**
     * @typedef {Function} module:libString.normalizeSpaces
     * @return {string}
     */
    normalizeSpaces: function( str ) {
        return str.replace( /\s\s+/g, ' ' ).trim();
    },

    isNotEmpty: function(str) {
        return str !== '';
    },

    /**
     * @typedef {Function} module:libString.listToArray
     * @param {string} list
     * @return {Array}
     */
    listToArray: function( list ) {
        return this.removeSpaces( list || '' ).split( ',' ).filter( this.isNotEmpty );
    },

    /**
     * @typedef {Function} module:libString.arrToListWithAnd
     * @param {array} arr
     * @return {string}
     */
    arrToListWithAnd: function( arr ) {
        var last = arr.pop(),
            other;

        if ( last === undefined ) {
            return '';
        } else {
            other = arr.join( ', ' );

            return other + ( other === '' ? '' : ' и ' ) + last;
        }
    },

    /**
     * @typedef {Function} module:libString.numberFormat
     * @param {number} x
     * @return {string}
     */
    numberFormat: function( x ) {
        return x.toString().replace( /\B(?=(\d{3})+(?!\d))/g, '&nbsp;' );
    },

    /**
     * Replace &nbsp; symbols with usual spaces
     * @typedef {Function} module:libString.removeUnbreakableSpaces
     * @param  {string} str
     * @return {string}
     */
    removeUnbreakableSpaces: function (str){
        return str ? str.replace('&nbsp;', ' ').replace(/\s+/g, ' ') : '';
    },

    /**
     * Escapes HTML chars
     * @typedef {Function} module:libString.escapeHTML
     * @param  {string} string
     * @return {string}
     */
    escapeHTML( string ) {

        'use strict';

        let map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            '\'': '&#39;'
        };

        return String(string).replace(new RegExp(`[${Object.keys(map).join('')}]`, 'g'), symbol => {

            return map[symbol];

        });

    },

    /**
     * Unescapes string with HTML encoded chars
     * @typedef {Function} module:libString.unescapeHTML
     * @param  {string} string
     * @return {string}
     */
    unescapeHTML( string ) {

        'use strict';

        let map = {
            '&amp;'  : '&',
            '&lt;'   : '<',
            '&gt;'   : '>',
            '&quot;' : '"',
            '&#39;'  : '\''
        };

        for (let symbol in map ){

            string = string.replace(new RegExp(symbol, 'g'), map[symbol]);

        }

        return string;

    },

    /**
     * Performs rus -> lat transliteration
     * @typedef {Function} module:libString.translitToEn
     * @param  {string} string
     * @return {string}
     */
    translitToEn (string) {

        'use strict';

        let dict = {
                'а': 'a',
                'б': 'b',
                'в': 'v',
                'г': 'g',
                'д': 'd',
                'е': 'e',
                'ё': 'e',
                'ж': 'zh',
                'з': 'z',
                'и': 'i',
                'й': 'y',
                'к': 'k',
                'л': 'l',
                'м': 'm',
                'н': 'n',
                'о': 'o',
                'п': 'p',
                'р': 'r',
                'с': 's',
                'т': 't',
                'у': 'u',
                'ф': 'f',
                'х': 'h',
                'ц': 'c',
                'ч': 'ch',
                'ш': 'sh',
                'щ': 'sch',
                'ь': '',
                'ы': 'y',
                'э': 'e',
                'ю': 'yu',
                'я': 'ya'
            };

        return string.split('').map( char => dict[char] || char ).join('');
    },

     /**
     * Performs lat -> rus transliteration
     * @typedef {Function} module:libString.translitToRus
     * @param  {string} string
     * @return {string}
     */
    translitToRus (string) {

        'use strict';

        let dict = {
                 'a': 'а',
                 'b': 'б',
                 'c': 'к',
                 'd': 'д',
                 'e': 'е',
                 'f': 'ф',
                 'g': 'г',
                 'h': 'х',
                 'i': 'и',
                 'j': 'й',
                 'k': 'к',
                 'l': 'л',
                 'm': 'м',
                 'n': 'н',
                 'o': 'о',
                 'p': 'п',
                 'r': 'р',
                 's': 'с',
                 't': 'т',
                 'u': 'у',
                 'v': 'в',
                 'w': 'у',
                 'x': 'кс',
                 'y': 'и',
                 'z': 'з',
            };

        return string.split('').map( char => dict[char] || char ).join('');
    },

    /**
     * @private
     */
    regex: {
        url: /^(http(s?):\/\/)?\S{2,}\.\S{2,}$/,
        image_or_video_url: /^(http(s?):\/\/)?\S{2,}\.\S{2,}\.(jpeg|jpg|gif|png|mp4)$/,
        email: /\S+@\S+\.\S+/,
        phone: /^\+[\d]{11}$/,
        clear_phone: /[^\d\+]/g,
        base64: /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/
    },

    /**
     * @typedef {Function} module:libString.is
     * @param {string} name - url|email|phone|clear_phone
     * @param {string} str
     * @return {boolean|*}
     */
    is: function(name, str) {
        return this.regex[name].test(str);
    },

    /**
     * Detects if passed string is URL
     * @typedef {Function} module:libString.isURL
     * @param  {string}  str
     * @return {Boolean}
     */
    isURL: function(str) {

        return this.is('url', str);

    },

    /**
     * Detects if passed string is URL of image
     * @typedef {Function} module:libString.isImageOrVideoUrl
     * @param  {string}  str
     * @return {Boolean}
     */
    isImageOrVideoUrl: function(str) {

        return this.is('image_or_video_url', str);

    },

    /**
     * Detects if passed string is e-mail
     * @typedef {Function} module:libString.isEmail
     * @param  {string}  str
     * @return {Boolean}
     */
    isEmail: function(str) {

        return this.is('email', str);

    },

    /**
     * Detects if passed string is phone number
     * @typedef {Function} module:libString.isPhone
     * @param  {string}  str
     * @return {Boolean}
     */
    isPhone: function(str) {

        return this.is('phone', this.stripPhone(str));

    },

    /**
     * Detects if passed string is base64
     * @typedef {Function} module:libString.isBase64
     * @param  {string}  str
     * @return {Boolean}
     */
    isBase64: function(str) {

        return this.is('base64', str);

    },

    /**
     * Strips all not "+" or digit symbols.
     * @typedef {Function} module:libString.stripPhone
     * @param  {string}  str
     * @return {string}
     */
    stripPhone: function(str) {
        var stripped = str.replace( this.regex.clear_phone, '' ).split( '' );

        if (stripped[0] === '8') {
            stripped[0] = '+7';
        }

        return stripped.join( '' );
    },

    /**
     * Formates phone number as "+7 (926) 078-71-15".
     * @typedef {Function} module:libString.formatPhone
     * @param  {string}  str
     * @return {string}
     */
    formatPhone: function(str) {
        var s = this.stripPhone(str);

        return `${s[0]}${s[1]} (${s[2]}${s[3]}${s[4]}) ${s[5]}${s[6]}${s[7]}-${s[8]}${s[9]}-${s[10]}${s[11]}`;
    },

    /**
     * Adds protocol if it's absent.
     * @typedef {Function} module:libString.formatURL
     * @param  {string}  str
     * @return {string}
     */
    formatURL: function(str) {
        if ( str.indexOf( 'http' ) !== 0 ) {
            str = 'http://' + str;
        }

        return str;
    },

    /**
     * Trims.
     * @typedef {Function} module:libString.formatEmail
     * @param  {string}  str
     * @return {string}
     */
    formatEmail: function(str) {
        return str.trim();
    },

    /**
     * Extracts hostname name from URL
     * @typedef {Function} module:libString.extractHostname
     * @param  {string} url
     * @return {string}
     */
    extractHostname: function(url){
        var a = document.createElement('a');

        a.href = url;

        return a.hostname;
    },

    /**
     * Returns filename extension.
     */
    getFileExtension: function(str) {
        return str.split('.').pop();
    }


} );

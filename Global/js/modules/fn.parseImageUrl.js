/**
 * @module parseImageUrl
 * @description Detects when passed URL is image source and parses data
 *
 * @typedef {array|boolean|undefined} module:parseImageUrl.urls
 * @description Array of image URL's in the passed string.
 * Undefined when no URLs matched.
 * False when String is too big.
 */
/**
 * @param  {string}  string with image URL
 * @return {module:parseImageUrl.urls}
 */
Air.defineFn( 'fn.parseImageUrl', function() {
    return function( string ) {

        'use strict';

        /**
         * Result links list
         * @type {Array}
         */
        let urls = [];

        /**
         * String with greater length value will not parsed and analized
         * Improved speed of pasting big texts
         */
        const MAX_LENGTH_TO_PARSE = 350;

        if (string.length > MAX_LENGTH_TO_PARSE) {

            _log('Pattern analize skipped because of string length: %o', 'log', string.length);
            return false;

        }

        /**
         * Image services patterns
         * @type {Array}
         */
        let patterns = [
            {
                type: 'image',
                regex: /\b(https?:\/\/\S+\.(?:png|jpe?g|gif)\S*)\b/igm,
            },
            {
                type: 'uploadCare',
                regex: /^https:\/\/(uploadcare\.cmtt\.ru|ucarecdn\.com|static[0-9]+\.siliconrus\.cmtt\.ru|static[0-9]+\.cmtt\.ru)/igm,
            },
            {
                type : 'server-leonardo',
                regex: /^https:\/\/(server)[0-9]+.leonardo.osnova.io\/.+\/$/igm
            },
            {
                type : 'giphy',
                regex: /^https?:\/\/(?:media)?.?giphy\.com\/(?:embed|gifs|media)\/(?:(?:[^\/]+)-([\w+]+)|([\w+]+))/igm
            },
            {
                type : 'leonardo-osnova',
                regex: /^https:\/\/leonardo.osnova.io\/.+\/$/igm
            }
        ];

        patterns.forEach( pattern => {

            var match = false;

            while ( !!(match = pattern.regex.exec(string)) ) {
                urls.push(match[0]);
            }

        });

        return urls.length ? urls : undefined;

    };
});

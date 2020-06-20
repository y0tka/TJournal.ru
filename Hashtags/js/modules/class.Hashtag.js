/**
 * Hashtag class
 *
 */
Air.defineClass(
    'class.Hashtag',
    `lib.DOM, class.Dropdown, class.InlineSearch, lib.ajax`,
    function( $ , Dropdown, InlineSearch, ajax) {

        'use strict';

        /**
        * Hashtag search route
        * @type {String}
        */
        let searchURL = '/search-hashtag';

        /**
         * Hashtag base class
         * @extends InlineSearch
         */
        return class Hashtag extends InlineSearch {

            /**
             * Hashtag item class
             *
             * @constructor
             */
            constructor() {

                super({
                    initialChar: '#',
                    searchURL: searchURL,
                    bemModifier: 'hashtag',
                });

                ajax.get({
                    url: searchURL,
                    dataType: 'json',
                    success: response  => {

                        if (response.data && response.data.items) {
                            super.predefinedItems = response.data.items;
                        }

                    }
                });

            }

            /**
             * Keydowns handler that detects # input
             * @this {Hashtag}
             * @return {*} InlineSearch test-callback return value
             */
            keydownHandler( block, event ){

                return super.test(event);

            }

            /**
             * Process selection founded item and substitution its value
             *
             * @param  {Element} selectedItem
             */
            substitution( selectedItem ){

                this.inlineWrapper.textContent = '#' + selectedItem.textContent;

            }

            /**
             * Replace <em class="inline-search-item">Hashtag</em> with #Hashtag
             * Using on editor saving
             * @param  {String}
             * @return {String}
             */
            parsedToOrigin(text){

                if (!text) {
                    return text;
                }

                /** Clear from anchors inside hashtag */
                text = text.replace(/\B#(?:<a[^>]*\>)([a-zA-Z\u0400-\u04ff][-_a-zA-Z\d\u0400-\u04ff]*)<\/a>/g, '#$1');

                /**
                 * Add spaces in case: #kino#photo#video (when sanitizer removes hashtag-wrappers)
                 */
                text = text.replace(/(\w)#/g, '$1 #');

                return text.replace(/<em class="inline-search-item inline-search-item--hashtag" contenteditable="true">([^<>]+)<\/em>/gi, (str, p1) => {
                    // return '#' + p1.replace(/\s+/, '') + ' ';
                    return p1.replace(/\s+/, '') + ' ';
                });

            }

            /**
             * Replace #hashtag with <em class="inline-search-item">hashtag</em>
             * Using on editor rendering
             * @param  {Element} block with hashtags
             * @return {String}
             */
            originToParsed(block){

                let hashtagRx = /\B#([a-zA-Z\u0400-\u04ff][-_a-zA-Z\d\u0400-\u04ff]*)/gi;

                /** Clear from anchors inside hashtag */
                block.innerHTML = block.innerHTML.replace(/\B#(?:<a[^>]*\>)([a-zA-Z\u0400-\u04ff][-_a-zA-Z\d\u0400-\u04ff]*)<\/a>/g, '#$1');

                /**
                 * Find hashtags inside <a> tags and temporary change # to [_#_] to dismiss parsing
                 */
                const tmpHashtagSybmol = '[_#_]';
                let links = block.querySelectorAll('a');

                for (let i = links.length - 1; i >= 0; i--) {

                    /**
                     * Replace in the link text
                     */
                    links[i].innerHTML = links[i].innerHTML.replace(hashtagRx, str => {
                        return str.replace('#', tmpHashtagSybmol);
                    });

                    /**
                     * Replace in the href-attibute to skip links with anchors
                     */
                    links[i].href = links[i].getAttribute('href').replace(hashtagRx, str => {
                        return str.replace('#', tmpHashtagSybmol);
                    });
                }

                /**
                 * Parse hashtags
                 */
                block.innerHTML = block.innerHTML.replace(hashtagRx, str => {
                    return ` <em class="inline-search-item inline-search-item--hashtag">${str}</em>`;
                });

                /**
                 * Now rollback skipped hashtag inside links
                 * replace [_#_] to normal #
                 */
                block.innerHTML = block.innerHTML.split(tmpHashtagSybmol).join('#');

            }

        };

    }
);

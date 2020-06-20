/**
 * Module to show animated photos that shoots out from the Comments Icon
 */
/**
 * @typedef {object} LiveAnswerSettings
 * @property {CommentData[]} lastComments  - list of comments to show live answers from them
 */

/**
 * @typedef {object} CommentData
 * @property {string} photo — author's avatar
 */

Air.defineModule(
    'module.liveAnswers',
    'lib.DOM, lib.string',
    /**
     * @param {module:libDom} $
     */
    function( $, string ) {
        const self = this;

        const CSS = {
            flyer: 'flying-photo',
            movedRight: 'flying-photo--moved-right',
            movedTop: 'flying-photo--moved-top',
            movedTopRight: 'flying-photo--moved-top-right',
            movedTopLeft: 'flying-photo--moved-top-left',
            flipRight: 'flying-photo--flip-right',
            flipLeft: 'flying-photo--flip-left',
            flipTop: 'flying-photo--flip-top',
            squeezed: 'squeezed'

        };

        /**
         * List of elements with live answers
         * @type {{element: HTMLElement, settings: LiveAnswerSettings}[]}
         */
        var items;

        /**
         * Elements with live answers (island footers)
         * @type {Array}
         */
        var elements = [];

        /**
         * IntersectionObserver
         * @type {IntersectionObserver|null}
         */
        var observer = null;

        /**
         * Return random number between 1 and max
         * @param {number} max
         * @return {number}
         */
        function randomNumber(max = 10) {
            return Math.floor(Math.random() * max) + 1;
        }

        /**
         * Return random index of the array
         * @param {array} arr
         * @return {number}
         */
        function getRandomArrayIndex(arr){
            return Math.floor(Math.random() * arr.length);
        }

        /**
         * Return random element from the array
         * @param {array} arr
         * @return {*}
         */
        function getRandom(arr) {
            return arr[ getRandomArrayIndex(arr) ];
        }

        /**
         * Make element that will be fly
         * @param {CommentData} comment
         * @return {Promise.<Element>}
         */
        function makeFlyer(comment) {
            return new Promise((resolve => {
                let flyer = $.make('div', CSS.flyer),
                    photo = $.make('img');

                if (comment.photo.substr(0, 26) === "https://leonardo.osnova.io"){
                    comment.photo += '-/resize/48';
                }

                photo.src = comment.photo;
                $.append(flyer, photo);

                photo.onload = function () {
                    resolve(flyer)
                };
            }));
        }

        /**
         *
         * @param {HTMLElement} islandFooter - element where placed comments icon
         * @param {CommentData} comment
         */
        function generateInParent(islandFooter, comment){
            makeFlyer(comment).then( flyer => {

                let commentCounter = $.find(islandFooter, '.comments_counter__count__ico'),
                    icon = commentCounter.querySelector('.icon');
                    // value = commentCounter.parentNode.querySelector('.comments_counter__count__value');

                $.prepend(commentCounter, flyer);

                // flip
                // let animations = [
                //     CSS.flipRight,
                //     CSS.flipLeft,
                //     CSS.flipTop,
                // ];

                let animations = [
                    CSS.movedTop,
                    // CSS.movedTopLeft,
                    // CSS.movedTopRight,
                ];

                setTimeout(()=>{
                    flyer.classList.add(getRandom(animations));
                    icon.classList.add(CSS.squeezed);

                    // if (value) {
                    //     let oldValue = parseInt(value.textContent.replace(/\s+/, ''));
                    //     value.textContent = string.numberFormat(oldValue + 1).replace('&nbsp;', ' ');
                    // }
                }, 50);

                setTimeout(()=>{
                    flyer.remove();
                    icon.classList.remove(CSS.squeezed);
                }, 950)

            }).catch(console.log);
        }

        /**
         * Callback fired when island goes visible
         * @param {IntersectionObserverEntry[]} entries
         */
        var elementsGoesVisible = function (entries) {

            /**
             * Skip moved-out intersections
             * @type {IntersectionObserverEntry[]}
             */
            let visible = entries.filter(e => e.intersectionRatio >= 1);

            if (!visible.length){
                return;
            }

            // 20% chance
            if ( randomNumber() < 8 ){
                return;
            }

            /**
             * From several on-screen islands, select one by random
             * @type {IntersectionObserverEntry}
             */
            let oneOfVisible = getRandom(visible);

            /**
             * Disable multiple firing when timeout is not finished
             */
            if (oneOfVisible.target.dataset.queued === "true"){
                return;
            }

            /**
             * Get index of selected island from all modules
             * @type {*|number}
             */
            let islandIndex = elements.indexOf(oneOfVisible.target);

            /**
             * Get random not-showed answer for this item
             */
            let answer = getAnswer(islandIndex);

            if (answer) {
                oneOfVisible.target.dataset.queued = "true";
                setTimeout(() => {
                    generateInParent(oneOfVisible.target, answer);
                    oneOfVisible.target.dataset.queued = "false";
                }, randomNumber() * 200);
            }
        };

        /**
         * Get random answer and remove it from the queue
         * @param {number} islandIndex - index of island
         * @return {CommentData}
         */
        function getAnswer(islandIndex) {
            let index = getRandomArrayIndex(items[islandIndex].settings.lastComments),
                answer = items[islandIndex].settings.lastComments[index];

            // remove selected answer
            items[islandIndex].settings.lastComments.splice(index, 1);

            return answer;
        }

        self.init = function() {

            // all modules on page
            items = self.elements.filter( item => item.settings.lastComments.length > 0 );

            // list of island footer elements
            elements = items.map( item => item.element );

            var options = {
                rootMargin: '-25% 0px', // horizontal 50%-center of the screen
                threshold: 1.0
            };

            observer = new IntersectionObserver(elementsGoesVisible, options);

            items.forEach( module => {
                observer.observe(module.element);
            });
        };

        /**
         * Refresh
         */
        self.refresh = function() {
            self.destroy();
            self.init();
        };

        /**
         * Destroy
         */
        self.destroy = function() {
            observer.disconnect();
            items = [];
            elements = [];
        };
    }
);

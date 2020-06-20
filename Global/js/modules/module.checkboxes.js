Air.define( 'module.checkboxes', 'lib.DOM', function( $ ) {

    'use strict';

    var self = this;

    /**
     * CSS dictionary
     * @type {Object}
     */
    var CSS = {
        wrapper : 'ui-checkbox',
        checked : 'ui-checkbox--checked'
    };

    /**
     * Custom checkbox wrapper click listener delegated from document
     * @param  {ClickEvent} event  - click event
     * @param  {Element} target    - clicked element event
     */
    function checkboxClicked(event, target) {

        let input = target.firstChild;
        
        if (target.classList.contains(CSS.checked)){

            target.classList.remove(CSS.checked);
            input.checked = false;

        } else {

            target.classList.add(CSS.checked);
            input.checked = true;

        }

    }

    /**
     * Process single input[type="checkbox"]
     * @param  {Element} input
     */
    function prepare(input) {

        let wrapper;

        /**
         * Skip already processed inputs
         */
        if (input.dataset.processed !== 'true' ) {

            wrapper = $.make('span', [CSS.wrapper]);

            $.after(input, wrapper);
            $.append(wrapper, input);

        } else {

            /**
             * On repeated prepare calls, find wrapper to set/remove 'checked' flag
             * @type {[type]}
             */
            wrapper = $.parents(input, `.${CSS.wrapper}`);

            if (!wrapper) {
                return;
            }

        }

        if ( input.checked ) {
            wrapper.classList.add(CSS.checked);
        } else {
            wrapper.classList.remove(CSS.checked);
        }

        input.dataset.processed = true;

    }

    /**
     * Process passes checkboxes
     * @param {Array} checkboxes  - collection of input[type="checkbox"]
     * @fires prepare
     */
    function prepareCheckboxes(checkboxes) {

        checkboxes.forEach(prepare);

    }

    /**
     * Process visible checkboxes in Element
     * @param {Element} element - parent element
     */
    self.processVisibleIn = function ( element ) {

        let checkboxes = $.findAll(element, 'input[type="checkbox"]');
        prepareCheckboxes(checkboxes);

    };

    self.init = function() {

        self.processVisibleIn(document);

        window.setTimeout(function() {
            $.delegateEvent(document, `.${CSS.wrapper}`, 'click.checkboxes', checkboxClicked);
        }, 10);

    };

    self.refresh = function() {

        self.destroy();
        self.init();

    };

    /**
     * Destryes checkbox
     * @param  {Element} checkbox - custom checkbox wrapper
     */
    function destroyItem(checkbox) {

        let input = checkbox.firstChild;

        $.before(checkbox, input);
        checkbox.remove();

        input.dataset.processed = null;

    }

    /**
     * Destroyes checkboxes in Element
     * @param {Element} element - parent element
     * @fires destroyItem
     */
    self.destroyIn = function ( element ) {

        let checkboxes = $.findAll(element, `.${CSS.wrapper}`);

       checkboxes.forEach(destroyItem);

    };

    self.destroy = function() {

        $.off(document, 'click.checkboxes');

        self.destroyIn(document);

    };

});

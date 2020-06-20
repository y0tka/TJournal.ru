/**
 */

Air.define( 'module.radioButtons', 'lib.DOM', function($) {

    'use strict';

    let self = this;

    let CSS = {
        wrapper : 'ui-radio-button',
        checked : 'ui-radio-button--checked'
    };

    // grouped radiobuttons by name
    let groupedRadioButtons = {};

    /**
     * Prepares custom radio button: Wrappes input into span and appends to group
     * @param input
     */
    function prepare ( input ) {

        let wrapper;

        if ( input.dataset && input.dataset.processed !== 'true' ) {

            wrapper = $.make('SPAN', [CSS.wrapper]);
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

        // group radiobuttons by name
        groupRadioButtons(input);

    }

    /**
     * Group by name
     * @param {Element} input - radio button
     */
    function groupRadioButtons ( input ) {

        if (!groupedRadioButtons[input.name]) {
            groupedRadioButtons[input.name] = [];
        }

        groupedRadioButtons[input.name].push(input);
    }

    /**
     * Clears all radio buttons from group
     * @param groupName - the name of group that we uncheck
     * @param except - ignore radio button that clicked
     */
    function uncheckRadioGroup ( groupName, except ) {

        let wrapper,
            group = groupedRadioButtons[ groupName ];

        for ( let i = 0; i < group.length; i++) {

            if ( except && except == group[i] ) continue;

            group[i].checked = false;
            wrapper = $.parents(group[i], `.${CSS.wrapper}`);

            if (wrapper && wrapper.classList) {
                wrapper.classList.remove(CSS.checked);
            }

        }
    }

    /**
     * click handler
     * @param {Event} event - called event
     * @param {Element} target - clicked radio button
     */
    function radioButtonsClicked(event, target) {

        let input = target.firstChild,
            inputName = input.name;
        if (!target.classList.contains(CSS.checked)){

            // first uncheck all
            uncheckRadioGroup( inputName , input );

            // then check current clicked
            target.classList.add(CSS.checked);
            input.checked = true;

        }
    }

    /**
     * @param element
     */
    self.processVisibleIn = function ( element ) {

        let radioButtons = $.findAll( element, 'input[type="radio"]');
        radioButtons.forEach(prepare);

    };

    self.init = function() {
        self.processVisibleIn(document);

        window.setTimeout(function() {
            $.delegateEvent(document, `.${CSS.wrapper}`, 'click.radiobuttons', radioButtonsClicked);
        }, 10);

    };

    self.destroy = function() {

        groupedRadioButtons = {};

        $.off(document, 'click.radiobuttons');
        self.destroyIn(document);

    };

    /**
     * Destroyes checkboxes in Element
     * @param {Element} element - parent element
     */
    self.destroyIn = function ( element ) {

        let checkboxes = $.findAll(element, `.${CSS.wrapper}`);

        checkboxes.forEach(destroyItem);

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

    self.refresh = function() {

        self.destroy();
        self.init();

    };

});

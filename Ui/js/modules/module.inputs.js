/**
 * Module for working with inputs
 *
 *
 * Limitation
 * -------------------
 * How to use:
 * 1) add <air module="module.inputs"></air>
 * 2) add maxlength="" attribute to the input or [contenteditable] element
 *
 *
 * ....
 */
Air.define( 'module.inputs', 'lib.DOM, class.LimitedInput', function( $, LimitedInput ) {

    'use strict';

    var self = this;

    /**
     * List of activated LimitedInput instances
     * @type {LimitedInput[]}
     */
    let limitedInputs = [];

    /**
     * Process single input with 'maxlength' attr
     * @param  {Element} input
     */
    function prepare(input) {

        limitedInputs.push(new LimitedInput({input}));

    }

    /**
     * Process passed inputs
     * @param {Element[]} inputs  - collection of inputs with 'maxlength' attribute
     * @fires prepare
     */
    function prepareSome(inputs) {

        inputs.forEach(prepare);

    }

    /**
     * Process visible checkboxes in Element
     * @param {Element} element - parent element
     */
    self.processVisibleIn = function ( element ) {
        let inputs = $.findAll(element, 'input[maxlength], textarea[maxlength], [contenteditable="true"][maxlength]');
        
        prepareSome(inputs);
    };

    self.init = function() {

        self.processVisibleIn(document);

    };

    self.refresh = function() {

        self.destroy();
        self.init();

    };

    self.destroy = function() {

        limitedInputs.forEach( instance => instance.destroy());

        limitedInputs = [];

    };

});

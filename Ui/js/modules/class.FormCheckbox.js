/**
 * TODO: check destroy
 */
Air.defineClass( 'class.FormCheckbox', 'lib.DOM', function ($, util ) {
    var Checkbox = function ( params, handlers ) {
        this.init( params, handlers );
    };

    Checkbox.prototype.init = function ( params, handlers ) {
        this.uid = util.uid();
        this.elements = {};

        this.elements.original_input = params.element;

        this.validate = params.validate || {};
        this.initial_value = $.val( this.elements.original_input ) || '';
        this.tab_index = params.tab_index;
        this.handlers = handlers || {};
        this.placeholder = params.placeholder || '';

        this.createStructure();
    };

    Checkbox.prototype.createStructure = function () {
        this.classname = 'checkbox';

        this.elements.input = $.parseHTML( `<input type="checkbox" class="${this.classname}__input" id="${this.uid}" tabindex="${this.tab_index}">` );
        this.elements.label = $.parseHTML( `<label for="${this.uid}">${this.placeholder}</label>` );

        if (this.initial_value) {
            this.elements.input.checked = true;
        }else{
            this.elements.input.checked = false;
        }

        $.after( this.elements.original_input, this.elements.label );
        $.before( this.elements.label, this.elements.input );

        $.on( this.elements.input, 'change', this.onChange.bind( this ) );
    };

    Checkbox.prototype.isValid = function () {
        return true;
    };

    Checkbox.prototype.destroy = function () {
        $.off( this.elements.input );
    };

    Checkbox.prototype.onChange = function () {
        var value = this.elements.input.checked;

        $.val( this.elements.original_input, value );

        if ( this.handlers.onChange ) {
            this.handlers.onChange( value );
        }
    };

    Checkbox.prototype.setValue = function ( value ) {
        this.elements.input.checked = value;
        this.onChange();
    };

    return Checkbox;
} );

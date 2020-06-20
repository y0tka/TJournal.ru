/**
 * TODO: check destroy
 */
Air.defineClass( 'class.FormText', 'class.LimitedInput, lib.DOM, lib.string', function( LimitedInput, $, lib_string, util ) {

    var Text = function( params, handlers ) {
        this.init( params, handlers );
    };

    Text.prototype.init = function( params, handlers ) {
        this.uid = util.uid();
        this.elements = {};

        this.elements.original_input = params.element;

        this.validate = params.validate || {};
        this.initial_value = $.val( this.elements.original_input ) || '';
        this.is_private = params.is_private !== undefined ? params.is_private : null;
        this.placeholder = params.placeholder || '';
        this.tab_index = params.tab_index;
        this.input_type = params.input_type;
        this.handlers = handlers || {};
        this.limited_instance_input = null;

        if ( params.multistring === true ) {
            this.input_tag_type = 'textarea';
        } else if ( this.input_type === 'number' ) {
            this.input_tag_type = 'number';
        } else {
            this.input_tag_type = 'text';
        }

        this.createStructure();
    };

    Text.prototype.createStructure = function() {
        var marker_html,
            icon_name,
            icon_width,
            icon_height,
            bubble_text,
            additional_classes = '';

        this.classname = 'text';

        if ( this.input_tag_type === 'textarea' ) {
            this.elements.input = $.parseHTML( `<textarea class="${this.classname}__input" placeholder="${this.placeholder}">${this.initial_value}</textarea>` );
        } else {
            this.elements.input = $.parseHTML( `<input class="${this.classname}__input" type="${this.input_tag_type}" value="${this.initial_value}" placeholder="${this.placeholder}"/>` );
        }

        if ( this.is_private !== null ) {
            icon_name = this.is_private ? 'ui_lock' : 'ui_globe';
            icon_width = this.is_private ? 9 : 12;
            icon_height = this.is_private ? 11 : 12;
            bubble_text = this.is_private ? 'Видна только модераторам' : 'Виден всем';

            marker_html = `<div class="${this.classname}__marker">
                    <div class="${this.classname}__marker__bubble">${bubble_text}</div>
                    ${$.svgHtml(icon_name, icon_width, icon_height)}
                </div>`;

            additional_classes += ` ${this.classname}--with-marker`;
        } else {
            marker_html = '';
        }

        this.elements.main = $.parseHTML( `<div class="${this.classname} ${additional_classes} l-clear">${marker_html}</div>` );

        $.attr( this.elements.input, 'tabindex', this.tab_index );

        $.prepend( this.elements.main, this.elements.input );

        $.on( this.elements.input, 'input', this.onChange.bind( this ) );
        $.on( this.elements.input, 'change', this.onChange.bind( this ) );

        $.after( this.elements.original_input, this.elements.main );

        if ( this.input_tag_type === 'textarea' ) {
            $.bindTextareaAutoResize( this.elements.input, true );
        }

        if ( this.validate.max_length !== undefined ) {
            $.attr( this.elements.input, 'maxlength', this.validate.max_length );
            this.limited_instance_input = new LimitedInput({input: this.elements.input});
        }
    };

    Text.prototype.focus = function( state ) {
        $.focus( this.elements.input, state );
    };

    Text.prototype.isValid = function() {
        var value = $.val( this.elements.original_input ),
            value_length = value.length,
            result = true;

        switch ( this.input_type ) {
            // Валидируем по регулярке
            case 'text':
                if ( this.validate.min_length !== undefined ) {
                    result = result && (value_length >= this.validate.min_length);
                }

                if ( this.validate.max_length !== undefined ) {
                    result = result && (value_length <= this.validate.max_length);
                }

                break;

            // Валидируем по минимаксному значению
            case 'number':
                if (this.validate.min !== undefined) {
                    result = value_length >= this.validate.min;
                }

                if (this.validate.max !== undefined) {
                    result = result && (value_length <= this.validate.max);
                }
                break;

            // Валидируем по маске имейла
            case 'email':
                result = lib_string.isEmail( value );
                break;

            // Валидируем по маске URL
            case 'url':
                result = lib_string.isURL( value );
                break;

            // Валидируем по маске номера телефона
            case 'phone':
                result = lib_string.isPhone( value );
                break;
        }

        return result;
    };

    Text.prototype.destroy = function() {

        if ( this.limited_instance_input !== null ) {
            this.limited_instance_input.destroy();
        }

        $.off( this.elements.input );
        $.bindTextareaAutoResize( this.elements.input, false );
    };

    Text.prototype.onChange = function() {
        var value = $.val( this.elements.input );

        switch ( this.input_type ) {
            case 'phone':
                if ( lib_string.isPhone(value) ) {
                    value = lib_string.formatPhone(value);
                }
                break;

            case 'url':
                if ( lib_string.isURL(value) ) {
                    value = lib_string.formatURL(value);
                }
                break;

            case 'email':
                if ( lib_string.isEmail(value) ) {
                    value = lib_string.formatEmail(value);
                }
                break;
        }

        $.val( this.elements.original_input, value );

        if ( this.handlers.onChange ) {
            this.handlers.onChange( value );
        }
    };

    Text.prototype.setValue = function( value ) {
        $.val( this.elements.input, value );
        this.onChange();
    };

    Text.prototype.getValue = function() {
        return $.val( this.elements.original_input );
    };

    /*
    Text.prototype. = function() {

    };
     */

    return Text;

} );

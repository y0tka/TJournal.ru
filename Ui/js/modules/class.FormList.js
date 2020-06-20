/**
 * TODO: check destroy
 */
Air.defineClass( 'class.FormList', 'module.renderer, class.LimitedInput, lib.DOM, lib.keys, lib.string', function( renderer, LimitedInput, $, keys, lib_string, util ) {

    var ListView = function( params, handlers ) {
        this.init( params, handlers );
    };

    ListView.prototype.init = function( params, handlers ) {
        this.validate = params.validate || {};

        this.uid = util.uid();
        this.elements = {};

        this.elements.original_input = params.element;

        this.empty_item = params.empty_item || '';
        this.min_length = params.min_length || 0;
        this.max_length = params.max_length || 100;

        this.tab_index = params.tab_index;

        this.handlers = handlers || {};

        this.createStructure();
    };

    ListView.prototype.destroy = function() {
        var that = this;

        $.off( this.elements.list );

        this.elements.items.forEach( function( el ) {
            that.removeItem( that.getItemTextarea( el ) );
        } );

        this.elements = null;
    };

    ListView.prototype.getOriginalValue = function() {
        return $.val( this.elements.original_input );
    };

    ListView.prototype.setOriginalValue = function( value ) {
        $.val( this.elements.original_input, value );
    };

    ListView.prototype.getItemTextarea = function( item ) {
        return $.find( item, 'textarea' );
    };

    ListView.prototype.getTextareaItem = function( textarea ) {
        return $.parents( textarea, `.${this.classname}__item` );
    };

    ListView.prototype.createStructure = function() {
        this.classname = 'list';

        this.elements.list = $.parseHTML( `<div class="${this.classname}"></div>` );
        this.elements.items = [];
        this.limited_inputs = [];

        $.after( this.elements.original_input, this.elements.list );

        $.delegateEvent( this.elements.list, 'textarea', 'keydown', this.onKeyDown.bind( this ) );
        $.delegateEvent( this.elements.list, 'textarea', 'change', this.onKeyDown.bind( this ) );
        $.delegateEvent( this.elements.list, 'textarea', 'click', this.onClick.bind( this ) );
    };

    ListView.prototype.selectItemByIndex = function( index ) {
        var index = Math.max( Math.min( index, this.max_length - 1 ), 0 );

        if ( this.elements.items[ index ] !== undefined ) {
            this.getItemTextarea( this.elements.items[ index ] ).select();
        }
    };

    ListView.prototype.getItemIndexByElement = function( el ) {
        return this.elements.items.indexOf( el );
    };

    ListView.prototype.onClick = function( event, textarea ) {
        var current_index = this.getItemIndexByElement( this.getTextareaItem( textarea ) );

        if ( current_index === this.elements.items.length - 1 ) {
            if ( !this.isListFull() ) {
                this.addItem( this.empty_item );
            }
        }
    };

    ListView.prototype.isListFull = function() {
        return this.elements.items.length >= this.max_length;
    };

    ListView.prototype.isListEmpty = function() {
        return this.elements.items.length < this.min_length;
    };

    ListView.prototype.onKeyDown = function( event, textarea ) {
        var that = this,
            item = this.getTextareaItem( textarea ),
            current_index = this.getItemIndexByElement( item );

        switch ( event.keyCode ) {
            case keys.ENTER:
                event.preventDefault();

                if ( !this.isListFull() ) {
                    this.addItem( this.empty_item, current_index + 1 );
                }

                this.selectItemByIndex( current_index + 1 );
                break;

            case keys.BACKSPACE:
                if ( $.val( textarea ).length === 0 ) {
                    event.preventDefault();

                    this.removeItem( item );

                    if ( this.isListEmpty() ) {
                        this.addItem( this.empty_item );
                    }

                    this.selectItemByIndex( current_index - 1 );
                }
                break;

            case keys.TAB:
                if ( current_index < this.elements.items.length - 1 ) {
                    event.preventDefault();
                    this.selectItemByIndex( current_index + 1 );
                }
        }

        setTimeout( function() {
            that.handlers.valueChanged( that.getValue() );
        }, 10 );
    };

    ListView.prototype.getItemValue = function( item ) {
        return lib_string.normalizeSpaces( $.val( this.getItemTextarea( item ) ) );
    };

    ListView.prototype.isValueValid = function( value ) {
        return value.length > 0;
    };

    ListView.prototype.getValue = function() {
        return this.elements.items.map( this.getItemValue.bind( this ) ).filter( this.isValueValid );
    };

    ListView.prototype.addItem = function( item, index ) {
        var el = $.parseHTML( `<div class="${this.classname}__item"><textarea>${item}</textarea></div>` ),
            el_textarea = this.getItemTextarea( el ),
            limited_instance_input = null;

        $.attr( el_textarea, 'tabindex', this.tab_index );

        if ( this.validate.max_length !== undefined ) {
            $.attr( el_textarea, 'maxlength', this.validate.max_length );

            limited_instance_input = new LimitedInput({input: el_textarea});
        }

        if ( index !== undefined ) {
            if ( index > 0 ) {
                if ( this.elements.items[ index - 1 ] ) {
                    $.after( this.elements.items[ index - 1 ], el );
                    this.elements.items.splice( index, 0, el );
                    this.limited_inputs.splice( index, 0, limited_instance_input );
                } else {
                    $.append( this.elements.list, el );
                    this.elements.items.push( el );
                    this.limited_inputs.push( limited_instance_input );
                }
            } else {
                $.prepend( this.elements.list, el );

                this.elements.items.unshift( el );
                this.limited_inputs.unshift( limited_instance_input );
            }
        } else {
            $.append( this.elements.list, el );
            this.elements.items.push( el );
            this.limited_inputs.push( limited_instance_input );
        }

        $.bindTextareaAutoResize( el_textarea, true );
    };

    ListView.prototype.removeItem = function( el ) {
        var el_index = this.getItemIndexByElement( el );

        if ( this.limited_inputs[ el_index ] ) {
            this.limited_inputs[ el_index ].destroy();
        }

        this.limited_inputs.splice( el_index, 1 );
        this.elements.items.splice( el_index, 1 );
        $.bindTextareaAutoResize( this.getItemTextarea( el ), false );
        $.remove( el );
    };

    ListView.prototype.removeAllItems = function() {
        for (let i = this.elements.items.length - 1; i >= 0; i--) {
            this.removeItem(this.elements.items[i]);
        }
    };

    ListView.prototype.renderItems = function( items ) {
        var that = this,
            items_length = items.length,
            i;

        if ( items_length < this.min_length ) {
            for ( i = items_length; i < this.min_length; i++ ) {
                items[ i ] = this.empty_item;
            }

            items_length = this.min_length;

        } else if ( items_length > this.max_length ) {
            items.splice( this.max_length );
        }

        items.forEach( this.addItem.bind( this ) );
    };

    /*
    ListView.prototype. = function() {

    };
    */

    var List = function( params, handlers ) {
       this.init( params, handlers );
    };

    List.prototype.init = function( params, handlers ) {
       var that = this;

       this.validate = params.validate || {};
       this.handlers = handlers || {};

       this.view = new ListView( params, {
           valueChanged: function( value ) {
               that.view.setOriginalValue( JSON.stringify( value ) );

                if (  that.handlers.onChange ) {
                    that.handlers.onChange( value );
                }
           }
       } );

       this.view.renderItems( this.getParsedOriginalValue() );
    };

    List.prototype.destroy = function() {
       this.view.destroy();
    };

    List.prototype.getParsedOriginalValue = function() {
        return JSON.parse( this.view.getOriginalValue() || '[]' );
    };

    // Если определено минимальное количество строк (N) и регулярка,
    // то смотрим что хотя бы N строк удовлетворяют регулярке.
    List.prototype.isValid = function() {
        var that = this,
            values,
            result = true;

        if ( this.validate.min !== undefined && ( this.validate.min_length !== undefined || this.validate.max_length !== undefined ) ) {
            values = this.view.getValue();

            result = values.filter( function( value ) {
                var length = value.length,
                    is_ok = true;

                if ( that.validate.min_length !== undefined ) {
                    is_ok = length >= that.validate.min_length;
                }

                if ( that.validate.max_length !== undefined ) {
                    is_ok = length <= that.validate.max_length;
                }

                return is_ok;
            } ).length >= this.validate.min;
        }

        return result;
    };

    List.prototype.setValue = function(items) {
        this.view.removeAllItems();
        this.view.setOriginalValue(JSON.stringify(items));
        this.view.renderItems(items);
    };

    return List;

} );

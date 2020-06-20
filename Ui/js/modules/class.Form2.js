/**
 * TODO:
 * – check destroy
 */
Air.defineClass( 'class.Form2', 'module.notify, module.smart_ajax, module.renderer, class.FormDropdown, class.FormList, class.FormText, class.FormImage, class.InlineEditor, class.FormAutocomplete, class.FormCheckbox, class.FormAdvancedList, lib.DOM, lib.string, fn.extend', function( notify, smart_ajax, renderer, Dropdown, List, Text, FormImage, InlineEditor, Autocomplete, Checkbox, AdvancedList, $, lib_string, extend, util ) {

    /**
     * Inline Editor
     */
    var HandleInlineEditor = function( element, params ) {
        this.elements = {
            fieldset: element,
            original_input: $.find( element, 'textarea' ) // hidden textarea stored initial content (for editing)
        };

        this.instance = new InlineEditor( this.elements.fieldset, this.elements.original_input, params );
    };

    HandleInlineEditor.prototype.getValue = function() {
        return this.instance.save();
    };

    HandleInlineEditor.prototype.destroy = function() {
        this.instance.destroy();
    };

    /**
     * Handle raw
     */
    var HandleRaw = function( element ) {
        this.elements = {
            fieldset: element,
            original_input: $.find( element, 'input' )
        };
    };

    HandleRaw.prototype.getValue = function() {
        return $.val( this.elements.original_input );
    };

    HandleRaw.prototype.destroy = function() {
    };

    /**
     * Handle panel
     */
    var HandlePanel = function( element, params ) {
        this.elements = {
            fieldset: element
        };

        this.requestDataHandler = null;
        this.actions = params.actions || {};
        this.required = params.required || null;

        $.delegateEvent( this.elements.fieldset, '[data-action]', 'click', this.onClick.bind( this ) );
    };

    HandlePanel.prototype.lock = function( state ) {
        $.bem.toggle( this.elements.fieldset, 'locked', state );
    };

    HandlePanel.prototype.onRequestDataForAction = function( fn ) {
        this.requestDataHandler = fn;
    };

    HandlePanel.prototype.onClick = function( event, el ) {
        this.makeDataRequest( $.data( el, 'action' ) );
    };

    HandlePanel.prototype.makeDataRequest = function( action_name ) {
        var that = this;

        if ( this.requestDataHandler !== null ) {

            this.lock( true );

            this.requestDataHandler( function( data ) {

                if ( data !== null ) {

                    that.callAction( action_name, data, function() {
                        that.lock( false );
                    } );

                } else {
                    that.lock( false );
                }


            }, this.required );

        }
    };

    HandlePanel.prototype.makeActionRequest = function( action, data, callback ) {
        let action_url;

        if (!data) {
            data = {};
        }

        data.mode = 'raw';

        action_url = action.url || action.getUrl();

        if (action_url) {
            smart_ajax.post( {
                url: action.url || action.getUrl(),
                data: data,
                success: action.success,
                error: action.error,
                complete: function() {
                    callback();
                }
            } );
        }else{
            callback();
        }
    };

    HandlePanel.prototype.callAction = function( action_name, data, callback ) {
        var that = this,
            action = this.actions[ action_name ];

        if ( action !== undefined ) {
            if ( action.getData !== undefined ) {
                extend( data, action.getData() );
            }

            if ( action.before !== undefined ) {
                action.before( data, function( data ) {
                    if ( data !== null ) {
                        that.makeActionRequest( action, data, callback );
                    } else {
                        callback();
                    }
                } );
            } else {
                this.makeActionRequest( action, data, callback );
            }
        } else {
            console.warn( 'Unknown action "%s"', action_name );
        }
    };

    HandlePanel.prototype.destroy = function() {
        $.off( this.elements.fieldset );
    };

    /**
     * Handle image
     */
    var HandleImage = function( element, params, handlers ) {
        this.elements = {
            fieldset: element,
            original_input: $.find( element, 'input' )
        };

        this.instance = new FormImage( {
			element: this.elements.original_input
		}, handlers );
    };

    HandleImage.prototype.getValue = function() {
        return $.val( this.elements.original_input );
    };

    HandleImage.prototype.destroy = function() {
        this.instance.destroy();
    };

    /**
     * Handle for text
     */
    var HandleText = function( element, params, handlers ) {
        this.elements = {
            fieldset: element,
            original_input: $.find( element, 'input' )
        };

        params.element = this.elements.original_input;

        this.instance = new Text( params, handlers );

        /** Handle autocomplete */
        if ($.attr(params.element, 'form-autocomplete')) {

            this.autocomplete = new Autocomplete({
                element: this.instance.elements.input,
                append_after: this.elements.original_input,
                top: 72,
                left: 0
            }, handlers);

        }

    };

    HandleText.prototype.getValue = function() {
        return $.val( this.elements.original_input );
    };

    HandleText.prototype.setValue = function(value) {
        this.instance.setValue(value);
    };

    HandleText.prototype.destroy = function() {
        this.instance.destroy();
    };

    /**
     * Handle for dropdown
     */
    var HandleDropdown = function( element, params, handlers ) {
        this.elements = {
            fieldset: element,
            original_input: $.find( element, 'input' )
        };

        params.element = this.elements.original_input;

        this.instance = new Dropdown( params, handlers );
    };

    HandleDropdown.prototype.getValue = function() {
        return $.val( this.elements.original_input );
    };

    HandleDropdown.prototype.destroy = function() {
        this.instance.destroy();
    };

    /**
     * Handle for list
     */
    var HandleList = function( element, params, handlers ) {
        this.elements = {
            fieldset: element,
            original_input: $.find( element, 'input' )
        };

        params.element = this.elements.original_input;

        this.instance = new List( params, handlers );
    };

    HandleList.prototype.getValue = function() {
        return $.val( this.elements.original_input );
    };

    HandleList.prototype.setValue = function(items) {
        this.instance.setValue(items);
    };

    HandleList.prototype.destroy = function() {
        this.instance.destroy();
    };

    /**
     * Handle for advanced list
     */
    var HandleAdvancedList = function( element, params, handlers ) {
        this.elements = {
            fieldset: element,
            original_input: $.find( element, 'input' )
        };

        params.element = this.elements.original_input;

        this.instance = new AdvancedList( params, handlers );
    };

    HandleAdvancedList.prototype.getValue = function() {
        return this.instance.getValue();
    };

    HandleAdvancedList.prototype.destroy = function() {
        this.instance.destroy();
    };

    /**
     * Handle for checkbox
     */
    var HandleCheckbox = function( element, params, handlers ) {
        this.elements = {
            fieldset: element,
            original_input: $.find( element, 'input' )
        };

        params.element = this.elements.original_input;

        this.instance = new Checkbox( params, handlers );
    };

    HandleCheckbox.prototype.getValue = function() {
        var value = $.val( this.elements.original_input );
        
        return (value == 'true' || value == '1');
    };

    HandleCheckbox.prototype.destroy = function() {
        this.instance.destroy();
    };

    /**
     * Form
     */
    var Form = function( params ) {
        this.elements = {};
        this.items = [];

        this.init( params );
    };

    Form.prototype.init = function( params ) {

        var that = this;

        this.name = $.data( params.element, 'name' );

        this.actions = params.actions || {};
        this.events = params.events || {};
        this.is_ready = false;

        this.elements.form = params.element;
        this.elements.fieldsets = $.findAll( params.element, '.form2__field' );

        this.items = this.elements.fieldsets.map( this.createItem.bind( this ) ).filter( this.isItemValid );

        this.panel = this.items.filter( this.isItemPanel.bind( this ) )[ 0 ];
        this.items = this.items.filter( this.isItemNotPanel.bind( this ) );

        if ( this.panel ) {
            this.panel.handle.onRequestDataForAction( function( callback, required_fields ) {
                var validation = that.validate( required_fields );

                if ( validation.is_all_required ) {
                    that.getValues()
                        .then( values => {
                            callback( values );
                        });
                } else {
                    callback( null );
                    that.highlightInvalidFields( validation.invalid_required );
                }
            } );
        } else {
            console.warn( 'Form "%s" has no panel', this.name );
        }

        if ( params.focus !== undefined ) {
            this.focus( params.focus, true );
        }

        this.is_ready = true;

        $.bem.toggle( this.elements.form, 'ready', true );
    };

    Form.prototype.focus = function( name, state ) {
        this.items.forEach( function( item ) {
            if ( item.name === name && item.handle.instance.focus !== undefined ) {
                item.handle.instance.focus( state );
            }
        } );
    };

    Form.prototype.destroy = function() {

        this.items.forEach( function( item ) {
            if ( item.handle ) {
                item.handle.destroy();
            }
        } );

        this.elements = null;
        this.items = null;
    };

    Form.prototype.hideElement = function( element, state ) {
        $.attr( element, 'hidden', state ? 'hidden' : null );
    };

    Form.prototype.show = function( name, state ) {
        var that = this;

        this.items.forEach( function( item ) {
            if ( item.name === name ) {
                that.hideElement( item.element, !state );
            }
        } );
    };

    Form.prototype.showBySelector = function( selector, state ) {
        this.hideElement( $.find( selector ), !state );
    };

    Form.prototype.isItemPanel = function( item ) {
        return item.type === 'panel';
    };

    Form.prototype.isItemNotPanel = function( item ) {
        return !this.isItemPanel( item );
    };

    Form.prototype.isItemValid = function( item ) {
        if ( item.name && item.type && item.handle ) {
            return true;
        } else {
            console.warn( 'Invalid form item', item );
            return false;
        }
    };

    Form.prototype.createItem = function( element, index ) {
        var that = this,
            item = {
                element: element,
                type: $.data( element, 'type' ),
                name: $.data( element, 'name' ),
                title: $.data( element, 'title' ) || '',
                handle: null
            },
            handle_class = null,
            settings;

        switch ( item.type ) {
            case 'panel':
                handle_class = HandlePanel;
                break;

            case 'text':
            case 'number':
            case 'email':
            case 'url':
            case 'phone':
                handle_class = HandleText;
                break;

            case 'dropdown':
                handle_class = HandleDropdown;
                break;

            case 'list':
                handle_class = HandleList;
                break;

            case 'image':
                handle_class = HandleImage;
                break;

            case 'raw':
                handle_class = HandleRaw;
                break;

            case 'inline-editor':
                handle_class = HandleInlineEditor;
                break;

            case 'checkbox':
                handle_class = HandleCheckbox;
                break;

            case 'advanced_list':
                handle_class = HandleAdvancedList;
                break;
        }

        if ( handle_class !== null ) {

            settings = this.formatSettings( this.getItemSettings( item.element ) );

            if ( item.type === 'panel' ) {
                settings.actions = this.actions;
            } else {
                settings.value = '';
                settings.tab_index = ++index; // tabindex 0 occurs incorrect tab behaviour, so start with 1

                switch ( item.type ) {
                    case 'text':
                    case 'number':
                    case 'email':
                    case 'url':
                    case 'phone':
                        settings.input_type = item.type;
                        break;
                }
            }

            item.handle = new handle_class( item.element, settings, {
                onChange: function( value ) {

                    $.bem.toggle( item.element, 'invalid', false );

                    if ( that.events.change ) {
                        if ( that.is_ready === true ) {
                            that.events.change( item.name, value, item );
                        }
                    }
                },
                onChangeItems: function(items) {
                    if ( that.events.changeItems ) {
                        that.events.changeItems( item.name, items );
                    }
                },
                onAutocompleteSearch: function (query, callback) {
                    that.events.autocompleteSearch( item.name, query, callback );
                },
                onAutocompleteSelected: function (item_data) {
                    that.events.autocompleteSelected( item.name, item_data);
                },
                onAdvancedListAddItem: function (value, loading, callback) {
                    if ( that.events.advancedListAddItem ) {
                        that.events.advancedListAddItem(value, loading, callback);
                    }
                },
                onAdvancedListRemoveItem: function (item_data, loading, callback) {
                    if ( that.events.advancedListRemoveItem ) {
                        that.events.advancedListRemoveItem(item_data, loading, callback);
                    }
                },
                onAdvancedListRenderItem: function (item_data) {
                    if ( that.events.advancedListRenderItem ) {
                        return that.events.advancedListRenderItem(item_data);
                    }
                }

            } );
        }

        return item;
    };

    Form.prototype.getItemSettings = function( element ) {
        var settings = {};

        $.findAll( element, 'xmp' ).forEach( function( xmp ) {
            var name = $.data( xmp, 'name' ),
                type = $.data( xmp, 'type' );

            settings[ name ] = $.html( xmp );

            if ( type === 'json' ) {
                settings[ name ] = JSON.parse( settings[ name ] );
            }
        } );

        return settings;
    };

    Form.prototype.formatSettings = function( settings ) {
        var new_settings = settings.settings || {},
            name;

        new_settings.templates = {};

        for ( name in settings ) {
            if ( name !== 'settings' ) {
                new_settings.templates[ name ] = settings[ name ];
            }
        }

        return new_settings;
    };

    Form.prototype.validate = function( required_fields ) {
        var result = {
                is_all: true,
                is_all_required: true,
                valid: [],
                invalid: [],
                invalid_required: [],
                values: {}
            },
            required_fields_bool = required_fields;

        this.items.forEach( function( item ) {
            var is_valid = true;

            // Если поле не скрыто и для него описан валидатор, то валидируем.
            // В противном случае, считаем поле валидным.
            if ( !$.isHidden(item.element) && item.handle.instance !== undefined && item.handle.instance.isValid !== undefined ) {
                is_valid = item.handle.instance.isValid();
            }

            if ( required_fields_bool !== null ) {
                required_fields_bool = required_fields_bool.replace( RegExp( item.name, 'g' ), is_valid + '' );
            }

            result.is_all = result.is_all && is_valid;
            result[ is_valid ? 'valid' : 'invalid' ].push( item.name, is_valid );
            result.values[ item.name ] = is_valid;
        } );

        if ( required_fields_bool !== null ) {
            result.is_all_required = eval( required_fields_bool );
        }

        if ( !result.is_all_required ) {
            required_fields = lib_string.normalizeSpaces( required_fields.replace( /\&\&|\|\||\(|\)/g, ' ' ) ).split( ' ' );

            result.invalid_required = this.items.filter( function( item ) {
                return required_fields.indexOf( item.name ) >= 0 && !result.values[ item.name ];
            } ).map( function( item ) {
                return {
                    title: item.title,
                    name: item.name
                };
            } );
        }

        return result;
    };

    Form.prototype.makeItemInvalid = function( item, state ) {
        $.bem.toggle( item.element, 'invalid' );
    };

    Form.prototype.highlightInvalidFields = function( invalid_fields ) {
        var that = this,
            length = invalid_fields.length;

        this.items.forEach( function( item ) {
            $.bem.toggle( item.element, 'invalid', false );
        } );

        invalid_fields.forEach( function( field ) {
            that.items.forEach( function( item ) {
                if ( item.name === field.name ) {
                    $.bem.toggle( item.element, 'invalid', true );
                }
            } );
        } );

        if ( length > 0 ) {
            if ( length === 1 ) {
                notify.error( 'Пожалуйста, укажите ' + invalid_fields[ 0 ].title );
            } else {
                notify.error( 'Пожалуйста, заполните обязательные поля' );
            }
        }

        // _log(invalid_fields);
        // notify.error( 'Пожалуйста, укажите ' + lib_string.arrToListWithAnd( invalid_fields ) );
    };

    /**
     * @return {Promise<Object>} - Promise that returns object with all fields
     */
    Form.prototype.getValues = function() {

        let fieldsToSave = this.items.filter( function( item ) {
            return ( item.type === 'raw' ) || !$.isHidden( item.element );
        });

        /**
         * Async calling field.getValue();
         */
        return Promise.all(fieldsToSave.map( field => {
            return Promise.resolve()
                    .then(() => {
                        return field.handle.getValue();
                    })
                    .then(value => {
                        return {
                            name: field.name,
                            value: value
                        };
                    });

        }))
        /**
         * Then compose response object {name: value, ... }
         */
        .then( savedFields => {
            let response = {};

            savedFields.forEach( field => {
                response[field.name] = field.value;
            });

            return response;
        });
    };

    Form.prototype.value = function( name, value ) {
        if ( value === undefined ) {
            this.items.forEach( function( item ) {
                if ( item.name === name ) {
                    if ( item.handle.getValue === undefined ) {
                        console.warn('No "getValue" method', name, item.handle);
                    } else {
                        value = item.handle.getValue();
                    }
                }
            } );

            return value;
        } else {
            this.items.forEach( function( item ) {
                if ( item.name === name ) {
                    item.handle.setValue( value );
                }
            } );
        }
    };

    /*
    Form.prototype. = function() {

    };
    */

    return Form;

} );

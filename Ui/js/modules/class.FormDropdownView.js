/**
 * TODO: check destroy
 */
Air.defineClass( 'class.FormDropdownView', 'module.renderer, class.Timer, lib.DOM, lib.keys, fn.cyclicMove', function( renderer, Timer, $, lib_keys, cyclicMove, util ) {

    var DropdownView = function( params, handlers ) {
        this.init( params, handlers );
    };

    DropdownView.prototype.init = function( params, handlers ) {
        this.uid = util.uid();
        this.elements = {};

        this.elements.original_input = params.element;

        this.primary_key = params.primary_key || 'id';
        this.placeholder = params.placeholder || '';
        this.templates = params.templates || {};
        this.fill_search = params.fill_search;
        this.tab_index = params.tab_index;
        this.selected_outer_parent = params.selected_outer_parent || null;
        this.unlimited = params.unlimited === true;

        this.handlers = handlers || {};

        this.is_focused = false;
        this.highlight_index = null;

        this.timer_processSearchText = new Timer( this.processSearchText.bind( this ) );

        this.createStructure();
    };

    DropdownView.prototype.destroy = function() {
        this.destroyStructure();
        this.elements = null;
    };

    DropdownView.prototype.createStructure = function() {
        this.classname = 'dropdown2';

        /* create DOM */
        this.elements.dropdown = $.parseHTML( `<div class="${this.classname} ${this.classname}--uid-${this.uid}">
                <input class="${this.classname}__search" type="text" placeholder="${this.placeholder}">
                <div class="${this.classname}__selected"></div>
                <div class="${this.classname}__focus_button">${$.svgHtml('ui_form_add_down', 9, 5)}</div>
                <div class="${this.classname}__found">
                    <div class="${this.classname}__found__list"></div>
                </div>
            </div>` );

        this.elements.dropdown_search = $.bem.find( this.elements.dropdown, 'search' );
        this.elements.dropdown_selected = $.bem.find( this.elements.dropdown, 'selected' );
        this.elements.dropdown_found = $.bem.find( this.elements.dropdown, 'found' );
        this.elements.dropdown_focus_button = $.bem.find( this.elements.dropdown, 'focus_button' );
        this.elements.dropdown_found_list = $.bem.find( this.elements.dropdown, 'found__list' );
        this.elements.found_items = null;

        this.list_height = 0;

        $.attr( this.elements.dropdown_search, 'tabindex', this.tab_index );

        $.after( this.elements.original_input, this.elements.dropdown );

        /* bind events */
        $.on( this.elements.dropdown_focus_button, 'click', this.toggleFocus.bind( this ) );

        $.on( this.elements.dropdown_search, 'click', this.setFocus.bind( this, true ) );

        $.on( this.elements.dropdown_search, 'keydown', this.onSearchKeyDown.bind( this ) );

        $.delegateEvent( this.elements.dropdown_found_list, `.${this.classname}__found__item`, 'click', this.handleFoundItemClick.bind( this ) );
    };

    DropdownView.prototype.destroyStructure = function() {
        this.timer_processSearchText.destroy();

        $.off( this.elements.dropdown_found_list );
        $.off( this.elements.dropdown_search );
        $.off( this.elements.dropdown_focus_button );
    };

    DropdownView.prototype.toggleFocus = function() {
        this.setFocus( !this.is_focused );
    };

    DropdownView.prototype.setFocus = function( state ) {
        if ( this.is_focused !== state ) {
            this.is_focused = state;

            $.bem.toggle( this.elements.dropdown, 'focused', this.is_focused );

            if ( this.is_focused ) {
                this.elements.dropdown_search.select();
            } else {
                this.elements.dropdown_search.blur();
            }

            this.bindOutclick( this.is_focused );
            this.bindControlsNavigation( this.is_focused );

            this.handlers.focused( this.is_focused );
        }
    };

    DropdownView.prototype.bindOutclick = function( state ) {
        var that = this,
            event_name = `click.dropdown_outclick_${this.uid}`;

        if ( state ) {
            $.on( document, event_name, function( event ) {
                //TODO: check this.elements.dropdown, not selector!
                if ( !$.belong( event.target, `.${that.classname}--uid-${that.uid}` ) ) {
                    that.setFocus( false );
                }
            } );
        } else {
            $.off( document, event_name );
        }
    };

    DropdownView.prototype.bindControlsNavigation = function( state ) {
        var event_name = `keydown.dropdown_navigation_${this.uid}`;

        if ( state ) {
            $.on( document, event_name, this.onControlKeydown.bind( this ) );
        } else {
            $.off( document, event_name );
        }
    };

    DropdownView.prototype.onControlKeydown = function( event ) {
        switch ( event.keyCode ){
            case lib_keys.ENTER:
                $.cancelEvent( event );
                this.selectHighlighted();
                break;

            case lib_keys.DOWN:
                $.cancelEvent( event );
                this.moveHighlight( 1 );
                break;

            case lib_keys.UP:
                $.cancelEvent( event );
                this.moveHighlight( -1 );
                break;

            case lib_keys.ESC:
                $.cancelEvent( event );
                this.setFocus( false );
                break;
        }
    };

    DropdownView.prototype.onSearchKeyDown = function( event ) {
        switch ( event.keyCode ){
            case lib_keys.ENTER:
            case lib_keys.DOWN:
            case lib_keys.UP:
                break;

            default:
                this.timer_processSearchText.debounce( 300 );
                break;
        }
    };

    DropdownView.prototype.moveHighlight = function( direction ) {
        if ( this.elements.found_items === null ) {
            this.elements.found_items = $.findAll( this.elements.dropdown_found_list, `.${this.classname}__found__item` );
            this.list_height = $.height( this.elements.dropdown_found_list );
        }

        if ( this.highlight_index !== null && this.elements.found_items[ this.highlight_index ] !== undefined ) {
            $.bem.remove( this.elements.found_items[ this.highlight_index ], 'highlighted' );
        }

        this.highlight_index = cyclicMove( this.elements.found_items.length, this.highlight_index, direction );

        if ( this.highlight_index !== null ) {
            $.bem.add( this.elements.found_items[ this.highlight_index ], 'highlighted' );

            this.elements.dropdown_found.scrollTop = $.offset( this.elements.found_items[ this.highlight_index ] ).top - $.offset( this.elements.dropdown_found_list ).top;
        }
    };

    DropdownView.prototype.selectHighlighted = function() {
        if ( this.highlight_index !== null && this.elements.found_items[ this.highlight_index ] !== undefined ) {
            this.selectFoundItem( this.elements.found_items[ this.highlight_index ] );
        }
    };

    DropdownView.prototype.renderFoundItems = function( items, search_text ) {
        var that = this,
            html = '';

        if ( items.length > 0 ) {
            html = items.filter( function( item, i ) {
                return ( that.unlimited === true ) || ( i < 4 ) || ( item.is_permanent === true );
            } ).map( function( item ) {
                var classes = '',
                    rendered,
                    default_name;

                if ( item.is_permanent === true ) {
                    classes += ` ${that.classname}__found__item--permanent`;

                    if ( search_text ) {
                        default_name = item.name;

                        item.name = renderer.replaceVars( item.search_name, {
                            search_text: search_text
                        } );
                    }
                }

                rendered = renderer.replaceVars( `<div class="${that.classname}__found__item ${classes}" data-${that.primary_key}="${item[that.primary_key]}">${that.templates.found_item}</div>`, item );

                if ( default_name !== undefined ) {
                    item.name = default_name;
                }

                return rendered;
            } ).join( '' );
        } else if ( that.templates.not_found_item ) {
            html = `<div class="${that.classname}__found__item ${that.classname}__found__item--unselectable">${that.templates.not_found_item}</div>`;
        }

        $.bem.toggle( this.elements.dropdown_found, 'empty', html === '' );

        this.elements.found_items = null;

        $.html( this.elements.dropdown_found_list, html );
    };

    DropdownView.prototype.renderSelectedItems = function( items ) {
        var that = this;

        $.html( this.elements.dropdown_selected, items.map( function( item ) {
            return renderer.replaceVars( `<div class="${that.classname}__selected__item" data-${that.primary_key}="${item[that.primary_key]}">${that.templates.selected_item}</div>`, item );
        } ).join( '' ) );
    };

    DropdownView.prototype.renderSelectedOuterItems = function( items ) {
        var template = this.templates.selected_outer_item || this.templates.selected_item;

        if ( this.selected_outer_parent !== null ) {
            $.html( $.find( this.selected_outer_parent ), items.map( function( item ) {
                return renderer.replaceVars( template, item );
            } ).join( '' ) );
        }
    };

    DropdownView.prototype.fillSearch = function( items ) {
        var that = this;

        if ( this.fill_search !== undefined ) {
            this.setSearchText( items.map( function( item ) {
                return renderer.replaceVars( that.fill_search, item );
            } ).join( ', ' ) );
        }
    };

    DropdownView.prototype.setSearchText = function( value ) {
        $.val( this.elements.dropdown_search, value );
    };

    DropdownView.prototype.getSearchText = function() {
        return $.val( this.elements.dropdown_search );
    };

    DropdownView.prototype.processSearchText = function() {
        this.handlers.searchTextChanged( this.getSearchText() );
    };

    DropdownView.prototype.handleFoundItemClick = function( event, el ) {
        this.selectFoundItem( el );
    };

    DropdownView.prototype.selectFoundItem = function( el ) {
        this.handlers.foundPkChosen( $.data( el, `${this.primary_key}` ) );
    };

    DropdownView.prototype.getOriginalValue = function() {
        return $.val( this.elements.original_input );
    };

    DropdownView.prototype.setOriginalValue = function( value ) {
        $.val( this.elements.original_input, value );
    };

    return DropdownView;

} );

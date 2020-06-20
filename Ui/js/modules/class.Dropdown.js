/**
 * Dropdown module
 *
 * It work like <select> but provides some extra features:
 *     - Dropdown works with input wich have 'name' attribute that will submitted with form
 *     - Input stores comma-separeted IDs in 'value' attribute
 *     - Initial input hidden by default. But other input[type="text"] will be placed after that. It used for search.
 *     - Items can be selected by server-side or client-side search
 *     - There 2 working modes: select-one or select-many. @see limit property
 */
Air.defineClass( 'class.Dropdown', 'class.Timer, lib.DOM, lib.ajax, lib.string, lib.keys', function( Timer, $, ajax, string, keys ) {

    'use strict';

    var Dropdown = function( params ) {
        this.init( params );
    };

    /**
     * Initialization
     *
     * @param {Object} params
     *
     * @param {Element}     params.element               - initial hidden input that stores comma-separated IDs
     * @param {Object}      params.urls                   - URL used for server-side search
     * @param {string}      params.urls.search            - route for serach by query-string
     * @param {string}      params.urls.select            - route for serach items by IDs.
     *                                                         Uses to fill selected items in dropdown
     * @param {Object}      params.handlers
     * @param {function}    params.handlers.onProcess
     * @param {string}      params.primary_key           - string represeted key of item-object
     *                                                         that will be used as item ID
     * @param {function}    params.renderFoundItem       - method for render found items in dropdown list
     * @param {function}    params.renderSelectedItem    - method for render selected item
     *
     * @param {Number|null} params.limit                 - selected items limit.
     * @param {array}       params.items                 - items list. Used by client-side search in passed array
     * @param {array}       params.search_by             - array of keys in passed 'items' to search for them.
     *                                              Example: ['title', 'description']
     *
     * @param {string}      params.placeholder           - search input placeholder
     */
    Dropdown.prototype.init = function( params ) {
        var that = this;

        this.input = params.element;

        this.dropdown = $.parseHTML( `<div class="dropdown">
                <div class="dropdown__selected"></div>
                <input class="dropdown__input" type="text" placeholder="${params.placeholder || ''}">
                <div class="dropdown__found">
                    <div class="dropdown__found__list"></div>
                </div>
            </div>` );

        this.dropdown_input = $.find( this.dropdown, '.dropdown__input' );
        this.dropdown_found = $.find( this.dropdown, '.dropdown__found__list' );
        this.dropdown_selected = $.find( this.dropdown, '.dropdown__selected' );

        /**
         * Stores current up-down-selected array index
         * @type {Number|null}
         */
        this.currentSelectedItemIndex = null;

        $.after( this.input, this.dropdown );

        this.handlers = params.handlers || {};
        this.primary_key = params.primary_key || 'id';
        this.renderFoundItem = params.renderFoundItem;
        this.renderSelectedItem = params.renderSelectedItem;
        this.urls = params.urls;

        /**
         * @property {Number|null} - allows to control maximum selected items count.
         *                          When limit is reached, last item will be replaced with new selected.
         */
        this.limit = params.limit;

        /**
         * Array of found items
         * @type {Array}
         */
        this.found_items = [];
        this.selected_items = [];

        this.process_text_timer = new Timer( this.processText.bind( this ) );

        /**
         * Dont activate search by pre-filled ids list if there is no params.urls.select passed;
         */
        // if (params.urls && params.urls.select) {
            this.process_selected_timer = new Timer( this.processSelected.bind( this ) );
        // }

        this.search_by = null;

        /**
         * Client-side search scheme
         * @property {array} items      - List of items for client-side search scheme
         * @property {array} search_by  - by this keys search will proceeded
         */
        if (params.items) {
            this.items = params.items;
            this.search_by = params.search_by;

            /** render predefined items */
            this.renderFoundItems(params.items);
        }

        $.on( this.dropdown_input, 'keydown', this.inputKeydown.bind( this ) );

        $.on( this.dropdown_input, 'focus', function() {
            $.addClass( that.dropdown, 'dropdown--focused' );
        } );

        $.on( this.dropdown_input, 'blur', function() {
            $.removeClass( that.dropdown, 'dropdown--focused' );
        } );

        $.delegateEvent( this.dropdown, '[data-dropdown-primary-key]', 'mousedown', itemClicked.bind(this));

        /**
         * Show items passed in input with the initialization moment
         */
        that.showSelected();

    };

    /**
     * Item click listener delegated form dropdown
     * @param  {MouseEvent} event  - mousedown
     * @param  {Element} target    - clicked el
     */
    function itemClicked( event, target ) {

        var key = $.attr( target, 'data-dropdown-primary-key' ),
            action = $.attr( target, 'data-dropdown-action' );

        if (!key) {
            return;
        }

        switch ( action ) {
            case 'select':
                this.addItem(key, true);
                this.clear();
                break;

            case 'remove':
                this.removeItem(key, true);
                break;

            case 'goto':
                let url = $.attr( target, 'data-dropdown-url' );
                this.goto(url);
                break;

            default:
                _log('Unsupported dropdown action: ', action);
                break;
        }
    }

    /**
     * Shows selected items by this.input
     * @uses  after input filling with values
     */
    Dropdown.prototype.showSelected = function () {

        var that = this;

        string.listToArray( $.val( that.input ) ).forEach( function( id ) {
            that.addItem( id, false );
        } );

    };

    Dropdown.prototype.destroy = function() {
        $.off( this.dropdown, 'mousedown' );
        $.off( this.dropdown_input );

        this.dropdown = null;
        this.dropdown_input = null;
        this.dropdown_found = null;
        this.dropdown_selected = null;
        this.currentSelectedItemIndex = null;
        this.found_items = [];

        this.process_text_timer.destroy();
        this.process_selected_timer.destroy();
    };

    Dropdown.prototype.handle = function( name, data ) {
        if ( this.handlers[ name ] ) {
            this.handlers[ name ]( data );
        }
    };

    /**
     * UP / DOWN keys handler. Performs navigtion on list
     * @param {Boolean} isUp  - TRUE for up-navigation, FALSE for down
     */
    Dropdown.prototype.performUpAndDownKey = function ( isUp ) {

        if (!this.found_items || !this.found_items.length) {
            return;
        }

        if (isNaN(parseInt(this.currentSelectedItemIndex, 10))) {

            this.currentSelectedItemIndex = 0;

        } else {

            /** Clear highlighting from current selected element */
            let currentSelected = this.found_items[this.currentSelectedItemIndex].el;
            $.bem.toggle(currentSelected, 'selected', false);


            if ( !isUp ) {
                this.currentSelectedItemIndex++; // next;
            } else {
                this.currentSelectedItemIndex--; // previous;
            }

            /**
             * Stop at the first and last item
             */
            if (this.currentSelectedItemIndex === this.found_items.length) {
                this.currentSelectedItemIndex = this.found_items.length - 1;
            } else if (this.currentSelectedItemIndex < 0){
                this.currentSelectedItemIndex = 0;
            }

        }

        let el = this.found_items[this.currentSelectedItemIndex].el;

        /**
         * scroll list if selected item out of view
         * @fires scrollIntoViewIfNeeded that does not supported in Firefox
         */
        if (el.scrollIntoViewIfNeeded) {
            el.scrollIntoViewIfNeeded();
        }

        $.bem.toggle(el, 'selected', true);
    };

    /**
     * By ENTER, perform 'select' action for current selected item
     */
    Dropdown.prototype.performEnterKey = function() {

        /** do nothing if there are no items selected */
        if (isNaN(parseInt(this.currentSelectedItemIndex, 10))) {
            return;
        }

        /** do nothing if dropdown list is not opened */
        if ( !this.dropdown.classList.contains('dropdown--focused') ) {
            return;
        }

        let item = this.found_items[this.currentSelectedItemIndex].el;

        itemClicked.call(this, null, item);

        this.clear();

    };

    /**
     * Clears input, hide and clear found items
     */
    Dropdown.prototype.clear = function () {
        this.dropdown_input.value = '';
        this.found_items = [];
        this.dropdown_found.innerHTML = '';
        this.currentSelectedItemIndex = null;
        $.removeClass( this.dropdown, 'dropdown--focused' );
    };

    /**
     * Input keydown handler
     */
    Dropdown.prototype.inputKeydown = function( event ) {

        $.addClass( this.dropdown, 'dropdown--focused' );

        switch ( event.keyCode ){
            case keys.UP:
                this.performUpAndDownKey( true );
                break;

            case keys.DOWN:
                this.performUpAndDownKey( false );
                break;

            case keys.ENTER:
                this.performEnterKey();
                break;

            default:
                this.process_text_timer.debounce( 500 );
                break;
        }

    };

    Dropdown.prototype.validateText = function( text ) {
        var is_valid = true;

        if ( text.length < 3 ) {
            is_valid = false;
        }

        if ( is_valid ) {
            return text;
        }
    };

    Dropdown.prototype.processText = function() {
        var that = this,
            text = this.validateText( $.val( this.dropdown_input ) );

        that.handle( 'onProcess', true );

        this.current_search_text = text;

        if ( text ) {


            /**
             * Find first digital ID from pasted URL and send request to get more information
             */
            let idFound = /(\d+)/.exec(text);

            if (idFound && idFound[1]) {

                /**
                 * search by ID
                 * idFound[1] - is items ID
                 * */
                this.searchByUrl( idFound[1], function( item ) {
                    that.renderFoundItems( item );
                    that.handle( 'onProcess', false );
                });

            } else {

                this.searchByText( text, function( items ) {
                    that.renderFoundItems( items );
                    that.handle( 'onProcess', false );
                });
            }

        } else {
            if (that.items) {
                that.renderFoundItems( that.items );
            } else {
                that.renderFoundItems( [] );
            }
            that.handle( 'onProcess', false );
        }
    };

    /**
     * Makes found item node
     *
     * @this {Dropdown} - current class exemplar link
     *
     * @param  {Object} item
     * @param  {string} item.date  - "26.03.2017"
     * @param  {Number} item.id    - 5437
     * @param  {Object} item.title - Entry title
     * @param  {string} item.url   - Entry URL: "http://v.dtf.osnova.io/5437"
     *
     * @return {Element}
     */
    Dropdown.prototype.foundItemToHTML = function( item ) {

        let el = $.make('div', ['dropdown__found__item']);

        el.dataset.dropdownPrimaryKey = item[ this.primary_key ];
        el.dataset.dropdownAction = 'select';

        el.innerHTML = this.renderFoundItem( item, this.current_search_text );

        return el;
    };

    /**
     * Compose HTML for selected item
     * @param  {object} item  - item data
     *
     * @fires this.renderSelectedItem - for getting selected item content, that will be wrapped
     *                                  in class-owned item structure.
     *
     * @return {string}       - HTML represented item
     */
    Dropdown.prototype.selectedItemToHTML = function( item ) {

        let renderedItem = this.renderSelectedItem( item );

        if (!renderedItem) {
            return '';
        }

        return `<div class="dropdown__selected__item"
                     data-dropdown-primary-key="${item[ this.primary_key ]}"
                     data-dropdown-action="goto"
                     data-dropdown-url="${item.url}"
                     >
                        ${this.renderSelectedItem( item )}
                        <span class="dropdown__remove"
                              data-dropdown-primary-key="${item[ this.primary_key ]}"
                              data-dropdown-action="remove">
                        </span>
                </div>`;
    };

    Dropdown.prototype.renderFoundItems = function( items ) {
        var that = this;

        /** Clear previous list */
        this.found_items = [];
        this.dropdown_found.innerHTML = '';
        this.currentSelectedItemIndex = null;

        items.forEach( function( item ) {

            let el = that.foundItemToHTML.call( that, item );

            item.el = el;
            that.found_items.push(item);

            that.dropdown_found.appendChild(el);

        } );

        $.toggleClass( this.dropdown, 'dropdown--has-found', items.length > 0 );
    };

    Dropdown.prototype.renderSelectedItems = function( items ) {
        $.toggleClass( this.dropdown, 'dropdown--has-selected', items.length > 0 );

        $.html( this.dropdown_selected, items.map( this.selectedItemToHTML.bind( this ) ).join( '' ) || '' );
    };

    /**
     * Search item by URL
     * @param {String} itemId - pasted item's ID
     * @param {Function} callback - Callback that handles found item
     */
    Dropdown.prototype.searchByUrl = function( itemId, callback ) {

        console.assert(this.urls.select, 'Search-by-ids endpont is missed');

        /**
         * Server-side search
         */
        ajax.get( {
            url: this.urls.select,
            dataType: 'json',
            data: {
                ids: itemId,
            },
            success: function( response ) {
                callback( response.data || [] );
            },
            error: function() {
                callback( [] );
            }
        } );

    };

    /**
     * Provides search items by 2 schemes:
     *     - for server-side uses AJAX request
     *     - for client-side uses 'items' and 'search_by' class properties
     *
     * @param  {string}   text     Search query
     * @param  {Function} callback Callback that accepts found items
     */
    Dropdown.prototype.searchByText = function( text, callback ) {

        /**
         * Client-side search
         */
        if (this.items && this.search_by){

            let keys = this.search_by,
                found = [];

            found = this.items.filter( item => {
                return keys.some( key => {
                    if (!item[key]) {
                        return false;
                    }

                    let searchBy = item[key].toLowerCase(),
                        searchFor = text.toLowerCase(),
                        searchForEn = string.translitToEn(searchFor),
                        searchForRus = string.translitToRus(searchFor),
                        returnValue = searchBy.includes(searchFor) || searchBy.includes(searchForEn) || searchBy.includes(searchForRus);

                    return returnValue;
                });
            });

            callback( found );

            return;

        }

        console.assert(this.urls.search, 'Search endpont is missed');

        /**
         * Server-side search
         */
        ajax.get( {
            url: this.urls.search,
            dataType: 'json',
            data: {
                text: text,
                exclude: ''
            },
            success: function( response ) {
                callback( response.data || [] );
            },
            error: function() {
                callback( [] );
            }
        } );

    };

    /**
     * Search item by IDs
     * @param  {string}   selected  - comma-separated IDs
     * @param  {Function} callback  - callback that handles found items
     */
    Dropdown.prototype.searchBySelected = function( selected, callback ) {

         /**
         * Client-side search
         *
         * Find items in this.items by comma-separated IDs stored in input
         * ID will compares with this.primary_key field of item
         */
        if (this.items && this.search_by){

            let key = this.primary_key,
                found = [];

            let ids = selected.split(',');

            found = this.items.filter( item => {
                return ids.some( id => item[key] && item[key] == id );
            });

            callback( found );

            return;

        }

        console.assert(this.urls.select, 'Search-by-ids endpont is missed');

        /**
         * Server side search
         */
        ajax.get( {
            url: this.urls.select,
            dataType: 'json',
            data: {
                ids: selected
            },
            success: function( response ) {
                callback( response.data || [] );
            },
            error: function() {
                callback( [] );
            }
        } );
    };

    /**
     * Add selected item value
     * @param {Number}  value  - item primary key value
     * @param {Boolean} isFast    - by default, added item will debounde process_selected_timer.
     *                               Pass TRUE to skip waiting to debounce;
     */
    Dropdown.prototype.addItem = function( value, isFast ) {

        /**
         * Dont add empty ids (may happen because of default input values)
         */
        if (!value || value === "0"){
            return;
        }

        if ( this.selected_items.includes(value) ) {
            return;
        }

        /**
         * If limit specified, replace last item by new
         */
        if (this.limit && this.selected_items.length >= this.limit) {
            this.selected_items.pop();
        }

        this.selected_items.push(value);
        this.process_selected_timer.debounce( isFast === true ? 0 : 500 );

    };

    /**
     * Removes item value
     * @param {Number}  value  - item primary key value
     * @param {Boolean} isFast - by default, added item will debounde process_selected_timer.
     *                               Pass TRUE to skip waiting to debounce;
     */
    Dropdown.prototype.removeItem = function( value, isFast ) {

        var index = this.selected_items.indexOf( value );

        if ( index === -1 ) {
            return;
        }

        this.selected_items.splice( index, 1 );
        this.process_selected_timer.debounce( isFast === true ? 0 : 500 );

    };

    /**
     * Opens item URL in new tab
     * @param {Number}  url  - item URL
     */
    Dropdown.prototype.goto = function( url ) {

        let window_ = window.open(url, '_blank');
        window_.focus();

    };

    /**
     * Save selected items IDs in input and fires render
     */
    Dropdown.prototype.processSelected = function() {
        var that = this,
            selected_text = this.selected_items.join( ',' );

        that.handle( 'onProcess', true );

        $.val( this.input, selected_text );

        this.searchBySelected( selected_text, function( data ) {
            that.renderSelectedItems( data );
            that.handle( 'onProcess', false );
        } );
    };

    /**
     * Set focus on the input
     */
    Dropdown.prototype.focus = function() {
        this.dropdown_input.focus();
    };

    return Dropdown;
} );

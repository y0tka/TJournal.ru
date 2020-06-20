/**
 * TODO: check destroy
 */
Air.defineClass( 'class.FormAdvancedList', 'lib.DOM', function($, util ) {

    var AdvancedList = function( params, handlers ) {
        this.init( params, handlers );
    };

    AdvancedList.prototype.init = function( params, handlers ) {
        this.uid = util.uid();
        this.elements = {};

        this.elements.original_input = params.element;

        this.validate = params.validate || {};
        this.initial_value = $.val( this.elements.original_input ) || '';
        this.tab_index = params.tab_index;
        this.handlers = handlers || {};
        this.placeholder = params.placeholder || '';
        this.initial_list_data = params.templates.list_data;

        this.createStructure();
    };

    AdvancedList.prototype.createStructure = function() {
        this.classname = 'advanced_list';

        this.elements.input = $.parseHTML( `<input type="text" class="text__input" placeholder="${this.placeholder}" tabindex="${this.tab_index}">` );
        this.elements.list = $.parseHTML( `<div class="${this.classname}__list"></div>` );

        if (this.initial_list_data) {
            this.initial_list_data.forEach(this.addListItem.bind(this));
        }

        $.after( this.elements.original_input, this.elements.input );
        $.after( this.elements.input, this.elements.list );

        $.on( this.elements.input, 'keydown', this.onAddItem.bind( this ) );

        $.delegateEvent( this.elements.list, '[data-remove]', 'click', this.onRemoveItem.bind(this))
    };

    AdvancedList.prototype.isValid = function() {
        return true;
    };

    AdvancedList.prototype.destroy = function() {
        $.off( this.elements.input );
    };

    AdvancedList.prototype.loading = function( state ) {
        $.toggleClass(this.elements.input, 'disabled', state);
        $.toggleClass(this.elements.list, 'disabled', state);
    };

    AdvancedList.prototype.onAddItem = function(event) {
        var input_val = $.val(this.elements.input);

        if (event.keyCode === 13 && input_val.length > 0) {
            if (this.handlers.onAdvancedListAddItem) {
                this.handlers.onAdvancedListAddItem(input_val, this.loading.bind(this), this.addListItem.bind(this));
                $.val(this.elements.input, '');
            }
        }
    };

    AdvancedList.prototype.onRemoveItem = function(event) {
        var item_element = $.parents(event.target, '.' + this.item_class_name);

        if (item_element && this.handlers.onAdvancedListRemoveItem) {

            this.element_to_remove = item_element;

            this.handlers.onAdvancedListRemoveItem(item_element.advanced_list_item_data, this.loading.bind(this), this.removeListItem.bind(this));

            item_element = null;
        }
    };

    AdvancedList.prototype.addListItem = function( item_data ) {
        var template = this.handlers.onAdvancedListRenderItem(item_data),
            element = $.parseHTML(template);

        element.advanced_list_item_data = item_data;

        this.item_class_name = element.classList[0];

        $.append(this.elements.list, element);

        element = template = null;
    };

    AdvancedList.prototype.removeListItem = function( state ) {
        if (state && this.element_to_remove) {
            $.remove(this.element_to_remove);
        }

        this.element_to_remove = null;
    };

    AdvancedList.prototype.getValue = function() {
        var items = $.findAll(this.elements.list, '.' + this.item_class_name),
            value = [];

        if (items) {
            $.each(items, function(item) {
                if (item.advanced_list_item_data) {
                    value.push(item.advanced_list_item_data.id);
                }
            });
        }

        return value;
    };

    return AdvancedList;

} );

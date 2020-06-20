Air.defineClass( 'class.FormAutocomplete', 'lib.DOM, class.Timer, lib.string, module.metrics', function( $, Timer, lib_string, metr, util ) {

    var Autocomplete = function( params, handlers ) {
        this.init( params, handlers );
    };

    Autocomplete.prototype.init = function( params, handlers ) {
        var self = this;

        this.uid = util.uid();
        this.elements = {};

        this.params = params;

        this.elements.input = params.element;
        this.elements.append_after = params.append_after;

        this.handlers = handlers || {};

        this.process_text_timer = new Timer( this.keyupHandler.bind( this ) );

        $.on(this.elements.input, 'keyup.autocomplete', function (event) {
            var prevent = false;

            switch (event.keyCode) {
                case 13:
                    /** Enter */
                    self.handlers.onAutocompleteSelected(self.selectFromList());
                    self.showAutocomplete(false);

                    prevent = true;
                break;

                case 27:
                    /** Escape */
                    self.showAutocomplete(false);
                break;

                case 38:
                    /** Arrow up */
                    self.selectNextItem(-1);

                    prevent = true;
                break;

                case 40:
                    /** Arrow down */
                    self.selectNextItem(1);

                    prevent = true;
                break;

                case 37:
                case 39:
                    /** Ignore */
                break;

                default:
                    self.process_text_timer.debounce( 300 );
            }

            if (prevent) {
                event.preventDefault();
                event.stopPropagation();
            }

        });

        $.on(this.elements.input, 'blur.autocomplete', this.blurHandler.bind(this));

        this.appendStructure();
    };

    /** Structure methods */
    Autocomplete.prototype.appendStructure = function() {
        var template = $.parseHTML(`
            <div class="form_autocomplete" id="autocomplete_`+ this.uid +`" style="top:`+ (this.params.top || 0) +`px; left:`+ (this.params.left || 0) +`px;">
                <div class="form_autocomplete__list"></div>
            </div>
        `);

        $.after(this.elements.append_after, template);

        this.elements.autocomplete = $.find('#autocomplete_' + this.uid);

        this.elements.list = $.find(this.elements.autocomplete, '.form_autocomplete__list');

        $.delegateEvent(this.elements.autocomplete, '.form_autocomplete__item', 'mousedown', this.itemClickHandler.bind(this));
    };

    Autocomplete.prototype.appendToList = function(data) {
        var items = '';

        this.suggestions = data;

        data.forEach(function (item, i) {
            items += '<div class="form_autocomplete__item" data-list-id="'+ i +'">'+ item.text +'</div>';
        });

        this.clearList();

        $.appendHTML(this.elements.list, items);

    };

    Autocomplete.prototype.selectFromList = function(selected) {
        var list_id;

        if (!selected) {

            selected = $.find(this.elements.list, '.form_autocomplete__item--selected');

            if (!selected) {

                selected = $.find(this.elements.list, '.form_autocomplete__item');

            }

        }

        list_id = parseInt($.data(selected, 'list-id'));

        return this.suggestions[list_id];
    };

    Autocomplete.prototype.itemClickHandler = function (event, element) {

        this.handlers.onAutocompleteSelected(this.selectFromList(element));

    };

    Autocomplete.prototype.clearList = function() {
        $.html(this.elements.list, '');
    };

    Autocomplete.prototype.showAutocomplete = function(state) {
        var autocomplete_rect,
            new_height;

        $.bem.toggle(this.elements.autocomplete, 'shown', state);

        if (state) {
            /** Normalize autocomplte height by window height */
            autocomplete_rect = $.rect(this.elements.autocomplete);

            new_height = metr.window_height - autocomplete_rect.top - 20;

            if (new_height < autocomplete_rect.height) {
                $.height(this.elements.autocomplete, new_height);
            }

        }
    };

    Autocomplete.prototype.selectNextItem = function(direction) {
        var selected = $.find(this.elements.list, '.form_autocomplete__item--selected'),
            next;

        if (selected) {

            if (direction > 0) {
                next = $.next(selected);
            }else{
                next = $.prev(selected);
            }

        }

        if (!next || !selected) {

            if (direction > 0) {
                next = $.find(this.elements.list, '.form_autocomplete__item');
            }else{
                next = $.findAll(this.elements.list, '.form_autocomplete__item').pop();
            }

        }

        if (selected) {
            $.bem.toggle(selected, 'selected', false);
        }

        if (next) {
            $.bem.toggle(next, 'selected', true);
        }

    };

    /** Input handlers */
    Autocomplete.prototype.keyupHandler = function(event) {
        this.handlers.onAutocompleteSearch($.val(this.elements.input), this.setItemsCallback.bind(this));
    };

    Autocomplete.prototype.blurHandler = function() {
        var self = this;

        /** Таймер нужен, чтобы успело сработать событие click */
        // setTimeout(function () {
            self.showAutocomplete(false);
        // }, 60);
    };

    Autocomplete.prototype.setItemsCallback = function(data) {
        if (data) {

            this.showAutocomplete(true);
            this.appendToList(data);

        }else{

            this.showAutocomplete(false);

        }
    };

    /** Destroy */
    Autocomplete.prototype.destroy = function() {
        $.off(this.elements.input, '.autocomplete');
        $.off(this.elements.autocomplete);
        this.process_text_timer.destroy();
    };

    return Autocomplete;

} );

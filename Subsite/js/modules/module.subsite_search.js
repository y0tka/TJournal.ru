Air.define('class.Chercher', 'lib.DOM', function($) {

    function Chercher(params) {
        this.$dom = {
            input: params.input,
            items: params.items,
            dummy: params.dummy
        };

        this.data = {
            items_search_content: this.$dom.items.map(this.getItemSearchContent)
        };

        $.on(this.$dom.input, 'input', this.onInput.bind(this));
    }

    Chercher.prototype.getItemSearchContent = function(item) {
        return $.data(item, 'search-content').toLowerCase();
    };

    Chercher.prototype.onInput = function() {
        this.search(this.getSearchedValue());
    };

    Chercher.prototype.getSearchedValue = function() {
        return $.val(this.$dom.input).toLowerCase();
    };

    Chercher.prototype.foundItemByIndex = function(index, state) {
        $.bem.toggle(this.$dom.items[index], 'hidden', !state);
    };

    Chercher.prototype.search = function(value) {
        let that = this,
            something_found = false;

        this.data.items_search_content.forEach(function(search_content, index) {
            let is_found = search_content.indexOf(value) >= 0;

            something_found = something_found || is_found;

            that.foundItemByIndex(index, is_found);
        });

        this.showDummy(!something_found);
    };

    Chercher.prototype.showDummy = function(state) {

        $.bem.toggle(this.$dom.dummy, 'shown', state);

    };

    Chercher.prototype.destroy = function() {

        $.off(this.$dom.input);

    };

    return Chercher;

});

Air.define('module.subsite_search', 'class.Chercher, lib.DOM', function(Chercher, $) {

    var self = this,
        Chercher_instance = null;

    self.init = function() {

        Chercher_instance = new Chercher({
            input: $.find('.subsites_catalog__search__bar'),
            items: $.findAll('.subsites_catalog_item'),
            dummy: $.find('.subsites_catalog__dummy')
        });

    };

    self.refresh = function() {
        self.destroy();
        self.init();
    };

    self.destroy = function() {

        Chercher_instance.destroy();

        Chercher_instance = null;

    };

});
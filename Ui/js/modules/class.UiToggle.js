Air.define('class.UiToggle', 'lib.DOM', function($) {

    function UiToggle(params) {
        this.$dom = {
            toggle: params.element
        };

        this.data = {
            name: $.data(params.element, 'name'),
            state: this.getState()
        };

        this.handlers = params.handlers;

        $.on(this.$dom.toggle, 'click', this.onClick.bind(this));
    }

    UiToggle.prototype.getState = function() {
        return $.bem.hasMod(this.$dom.toggle, 'on');
    };

    UiToggle.prototype.setState = function(state) {
        return $.bem.toggle(this.$dom.toggle, 'on', state);
    };

    UiToggle.prototype.getName = function() {
        return this.data.name;
    };

    UiToggle.prototype.onClick = function() {
        this.handlers.click();
    };

    UiToggle.prototype.hide = function() {
        $.bem.add(this.$dom.toggle, 'hidden');
    };

    UiToggle.prototype.destroy = function() {
        $.off(this.$dom.toggle);

        this.$dom = null;
        this.data = null;
        this.handlers = null;
    };

    return UiToggle;

});
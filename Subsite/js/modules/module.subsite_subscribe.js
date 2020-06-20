Air.define('class.SubsiteSubscribeButton', 'module.subsite_model, class.MVStore, lib.DOM', function (subsite_model, MVStore, $, util) {
    function SubsiteSubscribeButton(params) {
        let that = this;

        this.subsite_model = util.inherit(subsite_model);

        this.$dom = {
            button: params.element
        };

        this.data = {
            subsite_id: $.data(this.$dom.button, 'subsite-id')
        };

        this.store = new MVStore({
            props: {
                state: this.getState()
            },
            handlers: {
                viewChange: function (name, value) {
                    switch (name) {
                        case 'state':
                            that.setState(value);
                            break;
                    }
                },
                viewRequestModelChange: function (name, value) {
                    switch (name) {
                        case 'state':
                            that.subsite_model.subscribe(that.data.subsite_id, value);
                            break;
                    }
                }
            },
            name: `subsite_subscribe #${this.data.subsite_id}`
        });

        this.subsite_model.on(`Subscription updated ${this.data.subsite_id}`, function (data) {
            that.store.commit({
                state: data.state
            });
        });

        this.subsite_model.on(`Subscription update failed ${this.data.subsite_id}`, function () {
            that.store.revert();
        });

        $.on(this.$dom.button, 'click', this.onClick.bind(this));
        $.on(this.$dom.button, 'mouseout', this.onMouseout.bind(this));
    }

    SubsiteSubscribeButton.prototype.onClick = function () {
        $.bem.add(this.$dom.button, 'just_clicked');

        this.store.set({
            state: !this.getState()
        });
    };

    SubsiteSubscribeButton.prototype.onMouseout = function () {
        $.bem.remove(this.$dom.button, 'just_clicked');
    };

    SubsiteSubscribeButton.prototype.getState = function () {
        return $.bem.hasMod(this.$dom.button, 'state-active');
    };

    SubsiteSubscribeButton.prototype.setState = function (state) {
        $.bem.toggle(this.$dom.button, 'state-active', state);
        $.bem.toggle(this.$dom.button, 'state-inactive', !state);
    };

    SubsiteSubscribeButton.prototype.destroy = function () {
        this.subsite_model.off();
        $.off(this.$dom.button);
    };

    return SubsiteSubscribeButton;
});

Air.define('module.subsite_subscribe', 'class.Fabric, class.SubsiteSubscribeButton', function (Fabric, SubsiteSubscribeButton) {
    var self = this,
        fabric;

    this.init = function () {
        fabric = new Fabric({
            module_name: 'module.subsite_subscribe',
            Constructor: SubsiteSubscribeButton
        });
    };

    this.refresh = function () {
        fabric.update();
    };

    this.destroy = function () {
        fabric.destroy();
    };
});

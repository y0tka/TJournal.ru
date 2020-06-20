Air.define('class.PushButton', 'module.notify, module.push2, class.UiToggle, class.MVStore', function(notify, push, UiToggle, MVStore, util) {

    function PushButton(params) {
        var that = this;

        this.push = util.inherit(push);

        this.view = new UiToggle({
            element: params.element,
            handlers: {
                click: function() {
                    that.store.set({
                        state: !that.store.get('state')
                    });
                }
            }
        });

        this.store = new MVStore({
            props: {
                state: this.view.getState()
            },
            handlers: {
                viewChange: function(name, value) {
                    switch (name) {
                        case 'state':
                            that.view.setState(value);
                            break;
                    }
                },
                viewRequestModelChange: function(name, value) {
                    switch (name) {
                        case 'state':
                            that.push.toggle(value);
                            break;
                    }
                }
            },
            name: `push_button`
        });

        this.push.on(`State changed`, function(state) {
            that.store.commit({
                state: state
            });
        });

        this.push.on(`Subscription failed`, function() {
            that.store.commit({
                state: false
            });
        });

        this.push.on(`Unsubscription failed`, function() {
            that.store.commit({
                state: true
            });
        });

        if (!this.push.isSupported()) {
            this.view.hide();
        }

        // this.push.on(`Update failed ${this.FavoriteView_instance.getId()}`, function(data) {
        //     that.store.revert();
        // });
    }

    PushButton.prototype.destroy = function() {
        this.view.destroy();
        this.store.destroy();
        this.push.off();
    };

    return PushButton;

});

Air.define('module.push_buttons', 'class.Fabric, class.PushButton', function(Fabric, PushButton) {

    var self = this,
        fabric;

    self.init = function() {

        fabric = new Fabric({
            selector: '[data-toggle-name="push_button"]',
            Constructor: PushButton
        });

    };

    self.refresh = function() {
        fabric.update();
    };

    self.destroy = function() {
        fabric.destroy();
    };

});
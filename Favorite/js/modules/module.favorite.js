Air.define('module.favorite_model', 'module.smart_ajax', function(smart_ajax) {

    var self = this;

    self.setState = function(data) {
        self.changeState(data, function(result, is_error) {
            if (is_error) {
                self.trigger(`Update failed ${result.id}`, result);
            } else {
                self.trigger(`Updated ${result.id}`, result);
            }
        });
    };

    self.changeState = function(data, callback) {
        smart_ajax.post( {
            url: '/favorite/change',
            data: {
                id: data.id,
                type: data.type,
                state: data.state !== false
            },
            success: function(response) {
                callback( {
                    id: response.id,
                    state: response.state,
                    count: response.count
                }, false );
            },
            error: function() {
                callback( {
                    id: data.id
                }, true );
            }
        } );
    };

});

Air.define('class.FavoriteView', 'lib.DOM', function($) {

    function FavoriteView(params) {
        this.$dom = {
            main: params.element,
            count: $.bem.find(params.element, 'count'),
            title: $.bem.find(params.element, 'title'),
            icon: $.find(params.element, '.icon'),
            ghost: null
        };

        this.data = {
            titles: $.data(params.element, 'titles').split('|'),
            icons: $.data(params.element, 'icons').split('|'),
            id: $.data(params.element, 'id')
        };

        this.handlers = params.handlers;

        this.controlling_module = params.controlling_module;

        this.animate_timer = null;

        $.on(this.$dom.main, 'click', this.onClick.bind(this));

        $.on( this.$dom.main, 'mouseleave', this.onMouseLeave.bind(this) );
    };

    FavoriteView.prototype.getId = function() {
        return this.data.id;
    };

    FavoriteView.prototype.getType = function() {
        return parseInt($.data(this.$dom.main, 'type'));
    };

    FavoriteView.prototype.getTypeStr = function() {
        return $.data(this.$dom.main, 'type-str');
    };

    FavoriteView.prototype.setIcon = function(state) {
        $.find(this.$dom.icon, 'use').setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#' + this.data.icons[state ? 1 : 0]);
    };

    FavoriteView.prototype.setState = function(state) {
        state = state !== false;

        $.bem.toggle(this.$dom.main, 'active', state);

        if (this.$dom.title) {
            $.html(this.$dom.title, this.data.titles[state ? 1 : 0]);
        }

        this.setIcon(state);

        this.animate(state);
    };

    FavoriteView.prototype.getState = function() {
        return $.bem.hasMod(this.$dom.main, 'active');
    };

    FavoriteView.prototype.setCount = function(count) {
        // _log('View -> setCount', count);
        $.bem.toggle(this.$dom.main, 'non_zero', count > 0);
        $.bem.toggle(this.$dom.main, 'zero', count === 0);

        if (this.$dom.count) {
            $.text(this.$dom.count, count);
        }
    };

    FavoriteView.prototype.getCount = function() {
        return parseInt($.data(this.$dom.main, 'count'));
    };

    FavoriteView.prototype.onClick = function() {
        $.bem.add(this.$dom.main, 'just_clicked');

        if (this.handlers.click !== undefined) {
            this.handlers.click();
        }
    };

    FavoriteView.prototype.onMouseLeave = function() {
        $.bem.remove(this.$dom.main, 'just_clicked');

        if (this.handlers.mouseLeave !== undefined) {
            this.handlers.mouseLeave();
        }
    };

    FavoriteView.prototype.animate = function(state) {
        var that = this;

        clearTimeout(this.animate_timer);
        $.bem.remove(this.$dom.main, 'animated');

        if (state) {
            if (this.$dom.ghost === null) {
                this.$dom.ghost = $.clone(this.$dom.icon, true);

                $.addClass(this.$dom.ghost, `${$.bem.getMainClass(this.$dom.main)}__ghost`);

                $.prepend(this.$dom.main, this.$dom.ghost);
            }

            $.bem.add(this.$dom.main, 'animated' );

            this.animate_timer = setTimeout( $.bem.remove.bind($.bem, this.$dom.main, 'animated'), 700);
        }
    };

    FavoriteView.prototype.destroy = function() {
        clearTimeout(this.animate_timer);

        $.off(this.$dom.main);

        this.$dom = null;
        this.data = null;
        this.handlers = null;
        this.controlling_module = null;
        this.animate_timer = null;
    };

    /*
    FavoriteView.prototype. = function() {

    };
     */

    return FavoriteView;

});

Air.define('class.Favorite', 'module.favorite_model, class.FavoriteView, class.MVStore, lib.DOM, lib.analytics, lib.string', function(favorite_model, FavoriteView, MVStore, $, analytics, lib_string, util) {

    function Favorite(params) {

        var that = this;

        this.controlling_module = params.controlling_module;
        this.favorite_model = util.inherit(favorite_model);

        this.FavoriteView_instance = new FavoriteView({
            element: params.element,
            handlers: {
                click: function() {
                    that.sendAnalytics(that.FavoriteView_instance.getTypeStr(), !that.store.get('state'));

                    // _log('Controller -> View.onClick');
                    that.store.set({
                        state: !that.store.get('state'),
                        count: that.store.get('count') + (that.store.get('state') ? -1 : 1)
                    });
                }
            }
        });

        this.favorite_model.on(`Updated ${this.FavoriteView_instance.getId()}`, function(data) {
            that.store.commit({
                state: data.state,
                count: data.count
            });
        });

        this.favorite_model.on(`Update failed ${this.FavoriteView_instance.getId()}`, function(data) {
            that.store.revert();
        });

        this.store = new MVStore({
            props: {
                state: this.FavoriteView_instance.getState(),
                count: this.FavoriteView_instance.getCount()
            },
            handlers: {
                viewChange: function(name, value) {
                    // _log('Controller -> Store.viewChange', name, value);
                    switch (name) {
                        case 'state':
                            that.FavoriteView_instance.setState(value);
                            break;

                        case 'count':
                            that.FavoriteView_instance.setCount(value);
                            break;
                    }
                },
                viewRequestModelChange: function(name, value) {
                    // _log('Controller -> Store.viewRequestModelChange', name, value);
                    switch (name) {
                        case 'state':
                            that.favorite_model.setState({
                                id: that.FavoriteView_instance.getId(),
                                type: that.FavoriteView_instance.getType(),
                                state: value
                            });
                            break;
                    }
                }
            },
            name: `favorite #${$.data(params.element, 'id')}`
        });
    };

    Favorite.prototype.sendAnalytics = function(type_str, state) {
        analytics.send([lib_string.capFirstLetter(type_str), 'Favorite ' + (state ? 'Add' : 'Remove')]);
    };

    /*
    Favorite.prototype. = function() {

    };
    */

    Favorite.prototype.destroy = function() {
        this.FavoriteView_instance.destroy();
        this.favorite_model.off();
        this.store.destroy();
    };

    return Favorite;

});

Air.defineModule( 'module.favorite', 'class.Fabric, class.Favorite', function( Fabric, Favorite ) {
    var self = this,
        fabric;

    /**
     * Init
     */
    self.init = function() {
        fabric = new Fabric({
            module_name: 'module.favorite',
            Constructor: Favorite,
            controlling_module: self
        });
    };

    /**
     * Refresh
     */
    self.refresh = function() {
        fabric.update();
    };

    /**
     * Destroy
     */
    self.destroy = function() {
        self.off();
        fabric.destroy();
    };
} );

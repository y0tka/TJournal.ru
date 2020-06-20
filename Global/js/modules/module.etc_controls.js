Air.define('module.etc_controls', 'class.Fabric, lib.DOM, module.smart_ajax, fn.parseQuery, module.notify', function(Fabric, $, smart_ajax, parseQuery, notify, util) {
    var self = this,
        fabric,
        defined_abstract_controls = {},
        defined_controls = {};

    self.defineAbstractControl = function(options) {
        if (defined_abstract_controls[options.name] !== undefined) {
            console.warn(`module.etc_controls: abstract control "${options.name}" redefined`);
        }

        defined_abstract_controls[options.name] = options.Constructor;
    };

    self.defineControl = function(options) {
        if (defined_controls[options.name] !== undefined) {
            console.warn(`module.etc_controls: control "${options.name}" redefined`);
        }

        defined_controls[options.name] = options;
    };

    self.getControl = function(main_element, name) {
        var control = defined_controls[name];

        if (control === undefined) {
            console.warn(`module.etc_controls: control "${name}" is not defined`);
            return null;
        }

        if (defined_abstract_controls[control.use] === undefined) {
            console.warn(`module.etc_controls: abstract control "${control.use}" is not defined`);
            return null;
        }

        return new defined_abstract_controls[control.use](main_element, control);
    };

    self.init = function() {
        self.defineAbstractControl({
            name: 'ajax_button',
            Constructor: AjaxButton
        });

        self.defineAbstractControl({
            name: 'ajax_toggle',
            Constructor: AjaxToggle
        });

        self.defineAbstractControl({
            name: 'link',
            Constructor: Link
        });

        self.defineAbstractControl({
            name: 'button',
            Constructor: Button
        });

        self.defineAbstractControl({
            name: 'toggle',
            Constructor: Toggle
        });

        fabric = new Fabric({
            module_name: 'module.etc_controls',
            Constructor: EtcControl
        });
    };

    self.refresh = function () {
        fabric.update();
    };

    self.destroy = function () {
        fabric.destroy();
    };

    /**
     * @class EtcControl
     */

    function EtcControl(params) {
        this.uid = 'etc_control_' + util.uid();

        this.dom = {
            main: params.element,
            list: null
        };

        this.permissions = parseQuery($.data(this.dom.main, 'permissions') || '');

        this.controls_list = {};

        this.is_list_shown = false;

        this.parent_selector = $.data(this.dom.main, 'parent-selector');

        $.on(this.dom.main, 'click', this.toggleList.bind(this));
    };

    EtcControl.prototype.toggleList = function() {
        this.showList(!this.is_list_shown);
    };

    EtcControl.prototype.showList = function(state) {
        var that = this;

        this.is_list_shown = state !== false;

        if (this.is_list_shown === true && this.dom.list === null) {
            this.dom.list = this.renderList(this.permissions);
        }

        if (this.dom.list !== null) {
            $.bem.toggle(this.dom.main, 'open', this.is_list_shown);

            if (this.is_list_shown) {
                $.append(this.dom.main, this.dom.list);

                /** Handle simple outside click */
                /** Need some timeout after click event */
                setTimeout(function () {
                    $.outclick(that.dom.main, that.showList.bind(that, false), that.uid);
                }, 50);
            } else {
                $.off(document, 'click.' + that.uid);
                $.remove(this.dom.list);
            }

            /** Bring to front parent element */
            if (this.parent_selector) {
                let parent = $.parents(this.dom.main, this.parent_selector);

                if (parent) {

                    if (this.is_list_shown) {
                        $.css(parent, {
                            'position': 'relative',
                            'z-index': 10000
                        });
                    }else{
                        $.css(parent, {
                            'position': '',
                            'z-index': ''
                        });
                    }
                }

                parent = null;
            }
        }
    };

    EtcControl.prototype.renderList = function() {
        var list = $.parseHTML('<div class="etc_control__list"></div>'),
            controls = {},
            name,
            element;

        for (name in this.permissions) {

            if (this.permissions[name] === '1') {
                this.controls_list[name] = self.getControl(this.dom.main, name);

                element = this.controls_list[name].getElement();

                $.addClass(element, 'etc_control__item');

                $.append(list, element);
            }
        }

        element = null;

        return list;
    };

    EtcControl.prototype.destroy = function() {
        var name;

        for (name in this.controls_list) {
            this.controls_list[name].destroy();
        }

        this.showList(false);

        $.off(this.dom.main);

        this.dom = null;
    };

    /**
     * @class AjaxButton
     */
    function AjaxButton(main_element, params) {
        this.dom = {
            main: main_element,
            button: $.parseHTML(`<div>${params.label}</div>`)
        };

        this.params = params;

        if (this.params.msg === undefined) {
            this.params.msg = {};
        }

        $.on(this.dom.button, 'click', this.sendAjax.bind(this));
    };

    AjaxButton.prototype.getElement = function() {
        return this.dom.button;
    };

    AjaxButton.prototype.sendAjax = function() {
        var that = this;

        if (this.params.msg.confirm !== undefined) {
            if (!confirm(this.params.msg.confirm)) {
                return;
            }
        }

        $.bem.add(this.dom.button, 'waiting');

        smart_ajax.post({
            url: this.params.url,
            data: this.params.getData !== undefined ? this.params.getData(this.dom.main) : {},
            complete: function (data, is_error) {
                $.bem.remove(that.dom.button, 'waiting');

                if (is_error !== true && that.params.msg.success !== undefined) {
                    notify.success(that.params.msg.success);
                } else if (is_error === true && that.params.msg.error !== undefined) {
                    notify.error(that.params.msg.error);
                }

                if (that.params.callback !== undefined) {
                    that.params.callback(data, is_error);
                }
            }
        })
    };

    AjaxButton.prototype.destroy = function() {
        $.off(this.dom.button);
        this.dom = null;
        this.params = null;
    };

    /**
     * @class AjaxToggle
     */

    function AjaxToggle(main_element, params) {
        this.dom = {
            main: main_element,
            button: $.parseHTML(`<div></div>`)
        };

        this.params = params;

        if (this.params.msg === undefined) {
            this.params.msg = {};
        }

        $.on(this.dom.button, 'click', this.sendAjax.bind(this));

        this.setState(this.getState());
    };

    AjaxToggle.prototype.getState = function() {
        return $.data(this.dom.main, `${this.params.name}-state`) === '1' ? 1 : 0;
    };

    AjaxToggle.prototype.setState = function(state) {
        this.current_state = state;

        $.data(this.dom.main, `${this.params.name}-state`, this.current_state);

        $.text(this.dom.button, this.params.labels[state]);
    };

    AjaxToggle.prototype.sendAjax = function() {
        var that = this;

        if (this.params.msg.confirm !== undefined) {
            if (!confirm(this.params.msg.confirm[this.current_state])) {
                return;
            }
        }

        $.bem.add(this.dom.button, 'waiting');

        smart_ajax.post({
            url: this.params.urls !== undefined ? this.params.urls[this.current_state] : this.params.url,
            data: this.params.getData !== undefined ? this.params.getData(this.dom.main, this.current_state) : {},
            complete: function (data, is_error) {
                $.bem.remove(that.dom.button, 'waiting');

                if (is_error !== true && that.params.msg.success !== undefined) {
                    notify.success(that.params.msg.success[that.current_state]);
                } else if (is_error === true && that.params.msg.error !== undefined) {
                    notify.error(that.params.msg.error[that.current_state]);
                }

                if (is_error !== true) {
                    that.setState(1 - that.current_state);
                }

                if (that.params.callback !== undefined) {
                    that.params.callback(data, is_error);
                }
            }
        });
    };

    AjaxToggle.prototype.getElement = function() {
        return this.dom.button;
    };

    AjaxToggle.prototype.destroy = function() {
        $.off(this.dom.button);
        this.dom = null;
        this.params = null;
    };

    /**
     * @class Link
     */
    function Link(main_element, params) {
        this.dom = {
            main: main_element,
            button: $.parseHTML(`<a href="${params.href || params.getHref(main_element)}" target="${params.target || '_self'}">${params.label}</a>`)
        };

        this.params = params;

        if (this.params.msg === undefined) {
            this.params.msg = {};
        }
    };

    Link.prototype.getElement = function() {
        return this.dom.button;
    };

    Link.prototype.destroy = function() {
        this.dom = null;
        this.params = null;
    };

    /**
     * @class Button
     */
    function Button(main_element, params) {
        var attrs = '';

        if (params.getClickData !== undefined) {
            attrs += `air-click="${params.getClickData(main_element)}"`;
        }

        this.dom = {
            main: main_element,
            button: $.parseHTML(`<div ${attrs}>${params.label}</div>`)
        };

        this.params = params;

        if (this.params.msg === undefined) {
            this.params.msg = {};
        }

        if (this.params.action !== undefined) {
            $.on(this.dom.button, 'click', this.makeAction.bind(this));
        }
    };

    Button.prototype.getElement = function() {
        return this.dom.button;
    };

    Button.prototype.makeAction = function() {
        var that = this;

        if (this.params.msg.confirm !== undefined) {
            if (!confirm(this.params.msg.confirm)) {
                return;
            }
        }

        $.bem.add(this.dom.button, 'waiting');

        this.params.action(this.dom.main, function(is_success) {
            $.bem.remove(that.dom.button, 'waiting');

            if (is_success !== false && that.params.msg.success !== undefined) {
                notify.success(that.params.msg.success);
            } else if (is_success === false && that.params.msg.error !== undefined) {
                notify.error(that.params.msg.error);
            }

            if (that.params.callback !== undefined) {
                that.params.callback(is_success);
            }
        });
    };

    Button.prototype.destroy = function() {
        $.off(this.dom.button);
        this.dom = null;
        this.params = null;
    };

    /**
     * @class Toggle
     */

    function Toggle(main_element, params) {
        this.dom = {
            main: main_element,
            button: $.parseHTML(`<div></div>`)
        };

        this.params = params;

        if (this.params.msg === undefined) {
            this.params.msg = {};
        }

        $.on(this.dom.button, 'click', this.makeAction.bind(this));

        this.setState(this.getState());
    };

    Toggle.prototype.getState = function() {
        return $.data(this.dom.main, `${this.params.name}-state`) === '1' ? 1 : 0;
    };

    Toggle.prototype.setState = function(state) {
        this.current_state = state;

        $.data(this.dom.main, `${this.params.name}-state`, this.current_state);

        $.text(this.dom.button, this.params.labels[state]);
    };

    Toggle.prototype.makeAction = function() {
        var that = this;

        if (this.params.msg.confirm !== undefined) {
            if (!confirm(this.params.msg.confirm[this.current_state])) {
                return;
            }
        }

        $.bem.add(this.dom.button, 'waiting');

        this.params.action(this.dom.main, this.current_state, function(is_success) {
            $.bem.remove(that.dom.button, 'waiting');

            if (is_success !== false && that.params.msg.success !== undefined) {
                notify.success(that.params.msg.success[that.current_state]);
            } else if (is_success === false && that.params.msg.error !== undefined) {
                notify.error(that.params.msg.error[that.current_state]);
            }

            if (is_success !== false) {
                that.setState(1 - that.current_state);
            }

            if (that.params.callback !== undefined) {
                that.params.callback(data, is_error);
            }
        });
    };

    Toggle.prototype.getElement = function() {
        return this.dom.button;
    };

    Toggle.prototype.destroy = function() {
        $.off(this.dom.button);
        this.dom = null;
        this.params = null;
    };
});

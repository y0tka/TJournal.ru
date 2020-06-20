/**
 * Принцип работы MVStore в связке с MVC:
 *
 * (1->2) Controller подписан на события View, по которым меняет MVStore-View (через MVStore.set)
 * (2->3) Изменения в MVStore-View генерит события viewChange и viewRequestModelChange
 * (3a) Controller подписан на событие viewChange, по которому он меняет View
 * (3b->4) Controller подписан на события viewRequestModelChange, по которому делает запрос на изменение Model
 * (4->5) Controller подписан на события Model, по которым меняет MVStore-Model (через MVStor.commit или MVStore.revert)
 * (5) Изменения в MVStore-Model влекут изменения в MVStore-View (2)
 *
 * В итоге, View мгновенно реагирует на действия пользователя и, при этом, синхронизируется с данными на сервере.
 */

Air.define('class.MVStore', 'lib.console', function(console, util) {

    console.define('MVStore', 'MVStore', '#a9a9a9\n');

    /**
     * Конструктор
     */
    function MVStore(params) {
        if (params.props === undefined) {
            params.props = {};
        }

        if (params.handlers === undefined) {
            params.handlers = {};
        }

        this.model = this.copyProps(params.props); // "master"
        this.view = this.copyProps(params.props); // "current"

        this.handlers = params.handlers;
        this.name = `${params.name}~${util.uid()}` || `store #${util.uid()}`;
    };

    /**
     * Копирует свойства
     */
    MVStore.prototype.copyProps = function(props) {
        var prop_name,
            new_props = {};

        for (prop_name in props) {
            new_props[prop_name] = props[prop_name];
        }

        return new_props;
    };

    /**
     * Вызывает внешние обработчики
     */
    MVStore.prototype.handle = function(name, args) {
        if (this.handlers[name] !== undefined) {
            this.handlers[name].apply(this, args);
        }
    };

    /**
     * Возвращает view-значения свойств
     */
    MVStore.prototype.get = function(property_name) {
        if (property_name === undefined) {
            return this.view;
        } else {
            return this.view[property_name];
        }
    };

    /**
     * Выставляет view-значения и генерирует события,
     * сигнализирующие о том, что:
     * – view изменилось по сравнению со своим предыдущим состоянием;
     * – view изменилось по сравнению с model;
     */
    MVStore.prototype.set = function(props) {
        var prop_name,
            prev_view = this.copyProps(this.view);

        console.log('MVStore', `${this.name} set`, props);

        for (prop_name in props) {
            this.view[prop_name] = props[prop_name];
        }

        for (prop_name in props) {
            if (props[prop_name] !== prev_view[prop_name]) {
                this.handle('viewChange', [prop_name, props[prop_name], prev_view[prop_name]]);
            }

            if (props[prop_name] !== this.model[prop_name]) {
                this.handle('viewRequestModelChange', [prop_name, props[prop_name]]);
            }
        }
    };

    /**
     * Применяет изменения к model, которые, в свою очередь, применятся ко view
     */
    MVStore.prototype.commit = function(props) {
        var prop_name;

        if (props === undefined) {
            props = this.view;
        }

        console.log('MVStore', `${this.name} commit`, props);

        for (prop_name in props) {
            if (props[prop_name] !== undefined) {
                this.model[prop_name] = props[prop_name];
            }
        }

        this.set(this.model);
    };

    /**
     * Приводит view к состоянию model
     */
    MVStore.prototype.revert = function() {
        console.log('MVStore', `${this.name} revert`);
        this.set(this.model);
    };

    /**
     * Деструктор
     */
    MVStore.prototype.destroy = function() {
        this.model = null;
        this.view = null;
        this.handlers = null;
    };

    return MVStore;

});

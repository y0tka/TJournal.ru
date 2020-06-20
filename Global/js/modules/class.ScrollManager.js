Air.defineClass('class.ScrollManager', 'lib.DOM, class.Collection, class.Timer', function(options, $, Collection, Timer, util) {
    var scroll_manager = this,
        collection,
        timer,
        uid = 0,
        sid = util.uid(),
        default_options = {
            selector: '',
            offset: 0,
            debounce: 0,
            throttle: 0,
            events: {}
        },
        observer,
        observer_config = {
            rootMargin: '0px',
            threshold: 0
        },
        element_storage;

    var deepExtend = function(out) {
        out = out || {};

        for (var i = 1; i < arguments.length; i++) {
            var obj = arguments[i];

            if (!obj)
                continue;

            for (var key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (typeof obj[key] === 'object')
                        out[key] = deepExtend(out[key], obj[key]);
                    else
                        out[key] = obj[key];
                }
            }
        }

        return out;
    };

    /** Хранилище элеме��тов, которое специально фильтрует их на входе */
    var ElementStorage = function () {
        var store = this,
            storage = {};

        store.add = function (elements) {

            elements.forEach(function (element) {
                let current_obj = element.__scroll_manager_data[sid],
                    storage_obj = storage[current_obj.id];

                /** Если объект уже есть в базе */
                if (storage_obj) {

                    /** Если объект был виден, а теперь нет или наоборот,
                        то удаляем информацию о нем */
                    if (storage_obj.visible !== current_obj.visible) {

                        delete storage[current_obj.id];
                        storage_obj = current_obj = null;

                    } else {
                        /** Такой ситуации не должно быть */
                    }

                } else{

                    /** Если объект нет, то добавляем его */
                    storage[current_obj.id] = {
                        visible: current_obj.visible
                    };

                }

            });

        };

        store.get = function () {
            return storage;
        };

        store.clear = function () {
            storage = {};
        };
    };

    var triggerEvents = function (elements) {
        var enter_objects = [],
            leave_objects = [],
            objects = [];

        elements.forEach(function (element) {

            if (element.__scroll_manager_data[sid].visible === true) {

                enter_objects.push({
                    visible: true,
                    element: element
                });

            }else{

                leave_objects.push({
                    visible: false,
                    element: element
                });

            }
        });

        objects = enter_objects.concat(leave_objects);

        if (enter_objects.length) {
            triggerEvent('onEnter', enter_objects);
        }

        if (leave_objects.length) {
            triggerEvent('onLeave', leave_objects);
        }

        if (objects.length) {
            triggerEvent('onEnterOrLeave', objects);
        }

        enter_objects = null;
        leave_objects = null;
        objects = null;
        elements = null;
    };

    var triggerEvent = function(event_name, elements) {

        if (scroll_manager.options.events[event_name]) {
            scroll_manager.options.events[event_name](elements)
        }

    };

    var observerHandler = function (entries) {
        var elements = [],
            elements_length;

        entries.forEach(function (entry) {

            /** Бывает такое, что объект уже удален со страницы, но тригирится при этом обзервером */
            if (entry.target.__scroll_manager_data[sid] !== null) {

                // Fix browsers not supporting "isIntersecting" (Samsung Internet Browser)
                if (entry.isIntersecting === undefined) {
                    entry.isIntersecting = entry.intersectionRatio > 0;
                }

                if (entry.target.__scroll_manager_data[sid].visible === false && entry.isIntersecting === true) {

                    /** Элементы, которые появились в видимой области */
                    entry.target.__scroll_manager_data[sid].visible = true;
                    elements_length = elements.push(entry.target);

                } else if (entry.target.__scroll_manager_data[sid].visible === true && entry.isIntersecting === false) {

                    /** Элементы, которые ушли из видимой области */
                    entry.target.__scroll_manager_data[sid].visible = false;
                    elements_length = elements.push(entry.target);

                }

            }

        });

        if (elements_length) {

            if (scroll_manager.options.debounce > 0) {

                element_storage.add(elements);

                timer.debounce();

            }

            if (scroll_manager.options.throttle > 0) {

                element_storage.add(elements);

                timer.throttle();

            }

            if (scroll_manager.options.debounce === 0 && scroll_manager.options.throttle === 0) {

                triggerEvents(elements);

            }

        }

        elements = null;
    };

    var timerHandler = function () {
        var storage_elements = element_storage.get(),
            real_elements = [],
            element_id;

        /** Сопоставляем список объектов из стораджа с реальными DOM элементами */
        for (element_id in storage_elements) {

            collection.getElements().forEach(function (element) {

                if (element.__scroll_manager_data[sid].id == element_id) {

                    real_elements.push(element);

                }

            });

        }

        element_storage.clear();

        if (real_elements.length) {
            triggerEvents(real_elements);
        }

        real_elements = null;
        storage_elements = null;

    };

    var init = function() {
        scroll_manager.options = deepExtend({}, default_options, options);

        observer_config.rootMargin = scroll_manager.options.offset + 'px';

        observer = new IntersectionObserver(observerHandler, observer_config);

        if (scroll_manager.options.debounce || scroll_manager.options.throttle) {

            timer = new Timer(timerHandler, scroll_manager.options.throttle || scroll_manager.options.debounce);

            element_storage = new ElementStorage();

        }

        collection = new Collection({
            create: function(element) {
                /** Все ради перформанса */

                if (element.__scroll_manager_data === undefined) {
                    element.__scroll_manager_data = {};
                }

                element.__scroll_manager_data[sid] = {
                    visible: false,
                    id: ++uid
                };

                observer.observe(element);
            },
            destroy: function (element) {
                observer.unobserve(element);

                element.__scroll_manager_data[sid] = null;
            }
        });

        scroll_manager.cacheObjects();

    };

    scroll_manager.destroy = function() {
        collection.clear();

        observer && observer.disconnect();

        element_storage && element_storage.clear();

        timer && timer.reset();

        observer = element_storage = timer = null;
    };

    scroll_manager.cacheObjects = function() {
        collection.update(options.selector);
    };

    scroll_manager.update = function () {_log('Method "update" of class ScrollManager does not exist')};

    /* auto init */
    init();
}, {
    immediately_invoked: false
});

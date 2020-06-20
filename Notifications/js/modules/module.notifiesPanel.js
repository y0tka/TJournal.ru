Air.define( 'module.notifiesPanel', 'lib.analytics, lib.DOM, module.auth_data, module.notifiesBroker, module.scroll_locker, class.ScrollHandler, module.notifiesList, module.location, lib.cookie, module.ajaxify, module.metrics', function (lib_analytics, $, auth_data, notifyBroker, scrollLocker, ScrollHandler, notifiesList, moduleLocation, cookie, ajaxify, metrics) {
    'use strict';

    const Tinycon = require('vendor/tinycon');

    var self = this;

    /**
     * Last notification ID
     * @type {null}
     */
    var lastId = null;

    /**
     * Scroll constructor
     * @type {null}
     */
    var scrollHandler = null;

    /**
     * Prevent new request we waiting old one
     * @type {boolean}
     */
    var pendingResponse = false;

    /**
     * Notifications pane elements cache
     * @type {Object}
     */
    var elements = {
        holder          : null,
        toggler         : null,
        notifications   : null,
        items           : null,
        badge           : null,
        updatesLink     : null,
        footer          : null
    };

    /**
     * CSS classnames dictionary
     * @type {Object}
     */
    var CSS = {
        panelShowed : 'head-notifies--showed',
        panelLoading: 'head-notifies--loading',
        emptyNotificationHolder : 'head-notifies--empty',
    };

    /**
     * Header panel opening state
     * @type {Boolean}
     */
    var panelOpened = false;

    /**
     * toggle pane clicked first time
     * @type {boolean}
     */
    var initialized = false;

    /**
     * Predefined hidden elements classname
     * @type {String}
     */
    const hiddenClassName = 'l-hidden';

    /**
     * Header bage counter
     * @type {Number}
     */
    var badgeCount = 0;

    /**
     * @private
     *
     * Append items requested
     * @param  {Object} notifiesData   - data returned from the server
     */
    function appendItems( notifiesData ) {
        console.assert(notifiesData && notifiesData.items_html !== undefined, 'module.notifies: wrong server response format');

        let itemsElements = $.parseHTML(notifiesData.items_html),
            fragment      = document.createDocumentFragment(),
            unreadNotifications,
            markReadAllButton,
            itemsCount;

        /**
         * Workaround case with single notification element parsed
         */
        if (!$.isArray(itemsElements)) {
            itemsElements = [ itemsElements ];
        }

        itemsCount = itemsElements.length;

        for (var i = 0; i < itemsCount; i++) {
            let id = itemsElements[i].dataset.id,
                type = itemsElements[i].dataset.type,
                alreadyAdded = $.find(elements.items, `[name="js-notify"][data-type="${type}"][data-id="${id}"]`);

            /** Workaround sutiation when notify already appended by sockets */
            if (alreadyAdded) {
                continue;
            }

            $.append(fragment, itemsElements[i]);
        }

        /**
         * If there aren't notifications
         */
        if (elements.items.childNodes.length === 0 && itemsElements.length === 0) {
            elements.notifications.classList.add(CSS.emptyNotificationHolder);
            elements.footer.classList.add(hiddenClassName);
        } else {
            elements.notifications.classList.remove(CSS.emptyNotificationHolder);
            elements.footer.classList.remove(hiddenClassName);
            $.append(elements.items, fragment);
        }

        /** Remember last id */
        lastId = notifiesData.last_id;

        elements.holder.classList.remove(CSS.panelLoading);

        /** show mark-read-all if unread notifications exist */
        markReadAllButton = notifiesList.markReadAll.button.findIn(elements.holder);
        notifiesList.markReadAll.showButtonIfNeed(elements.items, markReadAllButton);

        /** Allow sending another request */
        pendingResponse = false;
    }

    /**
     * @private
     *
     * Show loader when we're waiting for new notifications
     */
    function beforeScrollHandling() {
        elements.holder.classList.add(CSS.panelLoading);
    }

    /**
     * @private
     *
     * Actions fired after unsuccess AJAX request
     * Removes loader
     */
    function notifcationsRequestError() {
        elements.holder.classList.remove(CSS.panelLoading);
    }

    /**
     * @private
     *
     * Sends AJAX Request and appends it on holder
     */
    function loadAndAppendNotifications() {
        /** Wait previous request */
        if (!pendingResponse) {
            /** we've got all notifications from server */
            if (initialized && !lastId) {
                elements.holder.classList.remove(CSS.panelLoading);
                scrollHandler.destroy();

                return;
            }

            notifyBroker.get(lastId, appendItems, notifcationsRequestError);
            pendingResponse = true;
        }
    }

    /**
     * @private
     *
     * Header notifies panel opener
     * @param {Boolean} forceHide   - pass TRUE to toggle-off panel
     */
    function togglePane(forceHide = false) {
        console.assert(elements && elements.holder, 'Notifications holder is missed');

        if (!panelOpened && !forceHide) {
            /** open panel */
            self.show();

            /**
             * If we have new notifications,
             * clear panel and request full content from the server
             */
            if (badgeCount) {
                initialized = false;
                elements.items.innerHTML = '';
                lastId = null;
            }

            /**
             * If notifications were not loaded before
             */
            if (!initialized) {
                elements.holder.classList.add(CSS.panelLoading);

                /** get notification when panel was opened */
                loadAndAppendNotifications();

                /** panel opened */
                initialized = true;
            }
        } else {
            /** hide panel */
            self.hide();
        }

        /** clear badge count */
        setBadge(0);
    }

    /**
     * @private
     *
     * Bell-icon click handler
     */
    function togglerClicked() {
        togglePane();
    }

    /**
     * @private
     *
     * Sets header-badge counter
     * @param {Number} count - new badge value
     */
    var setBadge = function (count) {
        if (count === 0) {
            $.bem.toggle(elements.badge, 'hidden', true);
        } else {
            $.bem.toggle(elements.badge, 'hidden', false);

            let animationModifer = badgeCount < 2 ? 'showed' : 'changed';

            $.bem.toggle(elements.badge, animationModifer, true);

            /** Remove animation modifier to unlock animation repeating */
            setTimeout(function () {
                $.bem.toggle(elements.badge, animationModifer, false);
            }, 1000);
        }

        /** refresh bage */
        badgeCount = count;

        $.text(elements.badge, count < 100 ? count : '99+');

        /**
         * Update badge over the favicon
         */
        Tinycon.setBubble(count);
    };

    /**
     * @private
     *
     * Socket handler fired when user's notifcations counter is changed
     *
     * @param  {Object} message
     * @param  {String} message.action  - 'added', 'cleared' messages
     * @param  {Number} message.counter - counter unread messages
     * @fires setBadge()
     */
    function notificationsChanged(message) {
        if (message.counter !== undefined) {
            badgeCount = message.counter;
        } else {
            switch (message.action) {
                case 'added'  : ++badgeCount;   break;
                case 'cleared': badgeCount = 0; break;
            }
        }

        setBadge(badgeCount);
    }

    /**
     * Notification added by sockets
     * Hides empty-list message
     */
    function notificationAdded(notify) {
        elements.notifications.classList.remove(CSS.emptyNotificationHolder);
        elements.footer.classList.remove(hiddenClassName);

        /** show mark-read-all if unread notifications exist */
        var markReadAllButton = notifiesList.markReadAll.button.findIn(elements.holder);

        notifiesList.markReadAll.showButtonIfNeed(elements.items, markReadAllButton);
    }
    /**
     * Some notifications was removed
     * Show empty-list message if it was last
     */
    function notificationsRemoved() {
        /**
         * There are other notifications
         */
        if (elements.items.childNodes.length) {
            return;
        }

        elements.notifications.classList.add(CSS.emptyNotificationHolder);
        elements.footer.classList.add(hiddenClassName);
    }


    /**
     * @private
     *
     * After success authentication
     * @fires showModule() panel method
     * @param {Object|false} userData  - if user logged-in, accepts user data. Otherwise, accepts 'false'
     */
    function userLoggedIn(userData) {
        if (!userData) {
            return;
        }

        showModule();

        if (userData.notifications) {
            let badgeCount = parseInt(userData.notifications.count, 10);

            setBadge( !isNaN(badgeCount) ? badgeCount : 0 );
        }
    }

    /**
     * Blocks page scroll when user scrolls notifies panel
     * @param  {MouseEvent} e
     */
    function wheelHandler(e) {
        var delta = e.deltaY || e.detail || e.wheelDelta,
            prevent = false;

        if (delta < 0 && elements.notifications.scrollTop === 0) {
            prevent = true;
        } else if (delta > 0 && elements.notifications.scrollTop >= elements.notifications.scrollHeight - $.height(elements.notifications)) {
            prevent = true;
        } else {
            prevent = false;
        }

        if (prevent) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }

    /**
     * @private
     *
     * Shows notifcation module
     */
    function showModule() {
        elements.holder.classList.remove(hiddenClassName);

        /** Clear before initialization */
        $.html(elements.items, '');

        /** Basic handlers */
        $.on(elements.toggler, 'click', togglerClicked);

        /** Handle changes */
        auth_data.on('User notifications changed', notificationsChanged);

        /**
         * disable body scroll when cursor is over the panel
         */
        $.on(elements.notifications, 'wheel', wheelHandler);
        $.on(elements.notifications, 'DOMMouseScroll', wheelHandler);

        /** Hide panel by click on go-to-all button */
        $.on(elements.updatesLink, 'click', self.hide);

        /**
         * Hide panel when notify is clicked
         */
        notifiesList.on('Notify clicked', notificationClicked);

        /**
         * Hide/show empty message if notification added/removed by sockets
         */
        notifiesList.on('Notify added', notificationAdded);
        notifiesList.on('Notifies removed', notificationsRemoved);

        /**
         * Handle panel scroll
         * When scroll is close to the bottom then load new notifications
         */
        scrollHandler = new ScrollHandler({
            selector: '[name="js-notifications"]',
            beforeHandling : beforeScrollHandling,
            bottomReached : loadAndAppendNotifications
        });

        /**
         * Configure module for the Favicon badge
         * @see {@link https://github.com/tommoor/tinycon}
         */
        Tinycon.setOptions({
            background: '#e21d1d',
            fallback: true
        });
    }

    /**
     * All clicks on document
     * Uses to hide panel
     */
    function documentClicked(event) {
        let clickedElement = event.target,
            clickInsidePanel = $.belong(clickedElement, '[name="js-notifications-panel"]');

        if (panelOpened && !clickInsidePanel) {
            self.hide();

            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
        }
    }

    /**
     * Method can be called outside of this module.
     * For example, in AJAX transitions
     * @protected
     *
     * @description Opens notification panel
     */
    self.show = function () {
        /**
         * @since 2018, may 27
         * Can not remember why it should be here
         */
        // if (metrics.is_mobile) {
        //     ajaxify.lock(true);
        // }

        elements.holder.classList.add(CSS.panelShowed);
        panelOpened = true;

        $.on(document, 'click.notifiesPanel', documentClicked);

        self.trigger('Notifications panel opened');
    };

    /**
     * Method can be called outside of this module.
     * For example, in AJAX transitions
     * @protected
     *
     * @description Closes notification panel
     */
    self.hide = function () {
        elements.holder.classList.remove(CSS.panelShowed);
        panelOpened = false;

        $.off(document, 'click.notifiesPanel');
        allowScroll();

        /**
         * @since 2018, may 27
         * Can not remember why it should be here
         */
        // if (metrics.is_mobile) {
        //     ajaxify.lock(false);
        // }

        notifiesList.subjectToggler.hideAllInList(elements.items);
    };

    /**
     * Notification item click handler
     * Uses to close panel
     */
    function notificationClicked() {
        if (!panelOpened) {
            return;
        }

        self.hide();
    }

    /**
     * @private
     * Lock's body scroll
     */
    function lockScroll() {
        scrollLocker.lock(true);
    }

    /**
     * @private
     * Allow body scroll
     */
    function allowScroll() {
        scrollLocker.lock(false);
    }

    /**
     * Module entry point
     */
    self.init = function () {
        console.assert(self.elements && self.elements.length, 'module.notifiesPanel: main element is missed' );

        elements.holder = self.elements[0].element;

        /** find buttons that will be handled */
        elements.notifications = $.find(elements.holder, '[name="js-notifications"]');
        elements.toggler       = $.find(elements.holder, '[name="js-notifications-toggler"]');
        elements.items         = $.find(elements.holder, '[name="js-notifications-items"]');
        elements.badge         = $.find(elements.holder, '[name="js-notifications-badge"]');
        elements.updatesLink   = $.find(elements.holder, '[name="js-notifications-url"]');
        elements.footer        = $.find(elements.holder, '[name="js-notifications-footer"]');

        auth_data.on( 'Change', userLoggedIn );

        self.on( 'Notifications panel opened', function () {
            lib_analytics.sendDefaultEvent( 'Notifications — Panel Opened' );
        });
    };

    /**
     * destroy all handlers
     */
    self.destroy = function () {
        if (scrollHandler) {
            scrollHandler.destroy();
            scrollHandler = null;
        }

        lastId = null;

        $.off(elements.toggler);
        $.off(document, '.notifiesPanel');
        $.off(elements.notifications);
        $.off(elements.updatesLink);

        elements = {
            holder          : null,
            notifications   : null,
            toggler         : null,
            items           : null,
            badge           : null,
            updatesLink     : null,
            footer          : null
        };

        auth_data.off();
        moduleLocation.off();
        notifiesList.off();
        self.off();
    };
});
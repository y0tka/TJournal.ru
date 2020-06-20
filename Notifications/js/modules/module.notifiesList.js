Air.define( 'module.notifiesList', 'lib.analytics, lib.ajax, lib.DOM, module.auth_data, module.notifiesBroker, module.DOM, module.ajaxify, fn.declineWord, module.metrics', function(lib_analytics, ajax, $, auth_data, notifyBroker, module_DOM, ajaxify, declineWord, metrics) {

    'use strict';

    var self = this;

    /**
     * Predefined elements classname
     * @type {Object}
     */
    var CSS = {
        unreadNotify : 'notification--unread',
        read : 'notification--read',
        hidden : 'notify--hidden-el',
        newItemsLabel: 'notify-new-items-label',
        newItemsLabelLoading: 'notify-new-items-label--loading'
    };

    /**
     * Array of notifications lists on page
     * @type {Array}
     */
    var listWrappers = [];

    /**
     * Remembers if we already subscribed on notifications
     * @type {Boolean}
     */
    var subscribed = false;

    /**
     * Notification audio
     * @type {Audio|null}
     */
    var sound = null;

    /**
     * Notify sound filename.
     * @type {String}
     */
    var notifySoundFile = 'notify.mp3';

    /**
     * Label showed at the top of the list when new notifies comming
     * @type {Element|null}
     */
    var newItemsLabel = null;

    /**
     * Notify subject toggling method
     * @type {Object}
     */
    let subjectToggler = {

        /**
         * Switch text and state of Show/Hide button
         * @param  {Element} toggler
         */
        switchState( toggler, forceHide ){

            let expanded = toggler.dataset.expanded === 'true',
                texts = toggler.dataset.texts,
                expand,
                collapse;

            texts = texts.split('|');
            expand = texts[0];
            collapse = texts[1];

            if (!forceHide){

                toggler.textContent = !expanded ? collapse : expand;
                toggler.dataset.expanded = !expanded;

            } else {

                toggler.textContent = expand;
                toggler.dataset.expanded = false;

            }

        },

        /**
         * Toggler click handler
         * @this {Element} toggler
         */
        clicked() {

            let toggler = this,
                notifyItem = $.parents(toggler, '[name="js-notify"]'),
                subject;

            console.assert(notifyItem, 'Notify-toggler\'s holder was not found');

            subject = notifyItem.querySelector('[name="js-notify-subject"]');

            if (!subject) {

                return;

            }

            subject.classList.toggle(CSS.hidden);
            subjectToggler.switchState(toggler);

        },

        /**
         * Hides subjects of all notifies in passed list
         * @param {Element} list    - notifies-list
         */
        hideAllInList(list){

            let togglers = list.querySelectorAll('[name="js-notify-subject-toggler"]'),
                subjects = list.querySelectorAll('[name="js-notify-subject"]');

            for (var i = togglers.length - 1; i >= 0; i--) {

                subjectToggler.switchState(togglers[i], true);

            }

            for (var j = subjects.length - 1; j >= 0; j--) {

                subjects[j].classList.add(CSS.hidden);

            }

        }

    };

    /**
     * Mark all notifications as read handler
     * @type {Object}
     */
    let markReadAll = {

        button : {

             /**
             * show's "mark-read-all" button
             */
            show(button) {

                button.classList.remove(CSS.hidden);

            },

            /**
             * hide's "mark-read-all" button
             */
            hide(button) {

                button.classList.add(CSS.hidden);

            },

            /**
             * Finds mark-read-all button in passed holder
             * @param {Element} parent  - where we need to search
             * @return {Element|null}
             */
            findIn(parent){

                return $.find(parent, '[name="js-notify-mark-all-as-read"]');

            },

            /**
             * click event handler
             */
            clicked() {

                let button = this;

                /** Send to the server to mark all notifications */
                notifyBroker.readAll();

                /** unmark on client side */
                markReadAll.doAll();

                markReadAll.button.hide(button);

            },
        },

        /**
         * clear notifications background and remove marker buttons
         */
        doAll() {

            for(var i = 0; i < listWrappers.length; i++) {

                var items = $.findAll(listWrappers[i], `.${CSS.unreadNotify}`);

                items.forEach(markRead);

            }

        },

         /**
         * If we have unread notifications in list, show mark-read button
         */
        showButtonIfNeed(list, button){

            let unreadNotifies = $.findAll(list, `.${CSS.unreadNotify}`);

            if (unreadNotifies.length) {

                markReadAll.button.show(button);

            }

        }

    };

     /**
     * Clears background and removes marker
     * @private
     * @param item
     */
    function markRead(item) {

        item.classList.remove(CSS.unreadNotify);
        item.classList.add(CSS.read);

    }

      /**
     * Adds unread background
     * @private
     * @param item
     */
    function markUnread(item) {

        item.classList.add(CSS.unreadNotify);
        item.classList.remove(CSS.read);

    }

    /**
     * make notification read
     * Remove marker
     */
    function markerClicked() {

        let toggler = this,
            notifyItem = $.parents(toggler, '[name="js-notify"]'),
            itemIds = notifyItem.dataset.ids;

        /** send to the server */
        notifyBroker.read(
            itemIds,
            /** success handler */
            null,
            /** error handler - mark unread again */
            function(){
                markUnread(notifyItem);
            }
        );

        /** clear background and remove marker */
        markRead(notifyItem);

    }

    /**
     * Add new notify into the present
     * @param  {Element} presentBlock - where grouping should be
     * @param  {Element} newBlock     - new notification block
     * @return {Element} new grouped notify block
     */
    function makeGroupNotification(presentBlock, newBlock, notifyData) {

        let text = $.find(newBlock, '[name="js-notification-text"]'),
            oldText = text.innerHTML,
            peopleList = [],
            peopleCounter,
            peopleText;

        if (presentBlock.dataset.uids) {

            peopleList = presentBlock.dataset.uids.split('|');
            peopleCounter = peopleList.length;

        } else {

            peopleCounter = 1;

        }

        peopleCounter = parseInt(peopleCounter, 10);
        peopleCounter++;

        /**
         * Save new user's id
         */
        peopleList.push(notifyData.user_id);

        /**
         * Save new uids list in new block's dataset
         */
        newBlock.dataset.uids = peopleList.join('|');

        peopleText = declineWord(peopleCounter - 1, ['человек', 'человек', 'человека']);

        switch (notifyData.type){
            case 'comment_voted': oldText = oldText.replace(/(оценили?)/, 'оценили'); break;
            case 'comment_replied': oldText = oldText.replace(/(ответили?)/, 'ответили'); break;
        }

        text.innerHTML = `и еще ${peopleCounter - 1} ${peopleText}` + oldText;

        return newBlock;

    }

    /**
     * Removes notify from gruop by user id
     * @param  {Element} group
     * @param  {Object} notifyData
     * @param  {Number} notifyData.user_id  - user to remove
     * @return {Element} modified group
     */
    function removeFromGroup( group, notifyData ) {

        let text = $.find(group, '[name="js-notification-text"]'),
            name = $.find(group, '[name="js-notification-user"]'),
            peopleList = [],
            peopleCounter = 1,
            peopleText;

        if (group.dataset.uids) {

            peopleList = group.dataset.uids.split('|');
            peopleCounter = peopleList.length;

        }

        /**
         * Remove user's id from storage
         */
        let uidIndex = peopleList.indexOf(notifyData.user_id.toString());

        console.assert(uidIndex != -1, `module.notifiesList@makeGroupNotification:
            can't reduce people count because there is not passed uid in list`);

        if (uidIndex != -1) {

            peopleCounter--;
            peopleList.splice(uidIndex, 1);

        }

        /**
         * Save new uids list in new block's dataset
         */
        group.dataset.uids = peopleList.join('|');

        /** Remove user name */
        name.remove();

        /** Remove « и еще 1 человек» */
        peopleText = declineWord(peopleCounter, ['человек', 'человек', 'человека']);
        text.innerHTML = `${peopleCounter} ${peopleText}` + text.innerHTML.replace(/(и еще \d+ человека?)/, '');

        switch (notifyData.type){
            case 'comment_voted':
                text.innerHTML = text.innerHTML.replace(/(оценили?)/, declineWord(peopleCounter, ['оценили', 'оценил', 'оценили']));
                break;
            case 'comment_replied':
                text.innerHTML = text.innerHTML.replace(/(ответили?)/, declineWord(peopleCounter, ['ответили', 'ответил', 'ответили']));
                break;
        }

        return group;
    }

    /**
     * Checks if user already present in notification block
     * @param  {Element} notification
     * @param {Number} userId
     * @return {Boolean}
     */
    function checkUserInNotification(notification, userId) {

        let uids = notification.dataset.uids,
            uidsArray = uids.split('|'),
            returnValue = uidsArray.includes(userId.toString());

        return returnValue;

    }

    /**
     * Check if notification was groupped
     * @param  {Element}  notification
     * @return {Boolean} true if it is group
     */
    function isGrouping(notification) {

        return notification.dataset.uids && notification.dataset.uids.split('|').length > 1;

    }

    /**
     * Adds 'comment_replied' notify to the list
     * @description Provides replacing/grouping logic
     * @param {Element} list      – where to put
     * @param {Object} notifyData – notification object
     */
    function addReply( list, notifyData ) {

        let newNotify = $.parseHTML(notifyData.notify_html),
            userId = notifyData.user_id,
            type = newNotify.dataset.type,
            target = notifyData.comment_id,
            toCommentId = notifyData.to_comment_id;

        let similar = $.find(list, `[name="js-notify"][data-type="${type}"][data-to-comment-id="${toCommentId}"]`);

        /**
         * Situation 0: No similar notifies. Simple add.
         */
        if (!similar) {

            $.prepend(list, newNotify);
            return;

        }

        /**
         * Situation 1 — Found other answers for this comment
         */
        let sameDude = checkUserInNotification(similar, userId),
            isGroup  = isGrouping(similar);

        /**
         * Situation 1.1 — One dude left several replies to the one comment
         */
        if (sameDude) {

            /**
             * Situation 1.1.1 — We have only one single reply for the comment from this dude
             * Just replace with new.
             */
            if (!isGroup) {

                $.replace(similar, newNotify);
                return;

            /**
             * Situation 1.1.2 — We have someothers replies for this comment. Includes our dude's line.
             * Do nothing, because its already in group.
             */
            } else {

                return;

            }

        /**
         * Situation 2 — Found replies to this comment from someothers. And now, our dude left another one.
         * Add new reply to the group.
         */
        } else {

            let grouping = makeGroupNotification( similar, newNotify, notifyData );
            $.replace(similar, grouping);
            return;

        }

    }

    /**
     * Adds 'comment_voted' notify to the list
     * @description Provides replacing/grouping logic
     * @param {Element} list      – where to put
     * @param {Object} notifyData – notification object
     */
    function addVote( list, notifyData ) {

        let newNotify = $.parseHTML(notifyData.notify_html),
            userId = notifyData.user_id,
            sign = notifyData.sign,  // 1 as like , -1 as dislike;
            type = newNotify.dataset.type,
            target = notifyData.comment_id;

        let similarNotifies = $.findAll(list, `[name="js-notify"][data-type="${type}"][data-target="${target}"]`);

        /**
         * Situation 0: No similar notifies. Simple add.
         */
        if (!similarNotifies.length) {

            $.prepend(list, newNotify);
            return;

        }

        let similar,
            similarWithOtherVote;

        for (let i = similarNotifies.length - 1; i >= 0; i--) {

            if (parseInt(similarNotifies[i].dataset.sign, 10) == sign) {
                similar = similarNotifies[i];
            } else {
                similarWithOtherVote = similarNotifies[i];
            }

        }

        /**
         * Situation 1 — No one passed same vote for this comment. But we found different vote for this.
         * Need to check for previous vote from this user and replace it.
         */
        if ( !similar ) {

            let sameDude = checkUserInNotification(similarWithOtherVote, userId),
                isGroup  = isGrouping(similarWithOtherVote);

            /**
             * Situation 1.1 — User vote DISLIKE, all others votes LIKE. And vice versa.
             * We need to add new item.
             */
            if ( !sameDude ) {

                $.prepend(list, newNotify);
                return;

            /**
             * Situation 1.2 — Like/dislike revote from same dude
             */
            } else {

                /**
                 * Situation 1.2.1 — Standalone vote from same dude. Need to simply replace.
                 */
                if ( !isGroup ) {

                    $.replace(similarWithOtherVote, newNotify);

                    return;

                /**
                 * Situation 1.2.2 — Found user's previous vote in grouping.
                 * Need to remove previous vote from group and append new vote.
                 */
                } else {

                    /** Remove from prevoius group */
                    /** Disabled */
                    // let groupRemoved = removeFromGroup( similarWithOtherVote, notifyData);
                    // $.replace(similarWithOtherVote, groupRemoved);

                    /** Add new */
                    $.prepend(list, newNotify);

                    return;

                }

            }

        /**
         * Situation 2 — We found same vote for this comment.
         * Need to check for grouping ability
         */
        } else  {

            let sameDude = checkUserInNotification(similar, userId),
                isGroup  = isGrouping(similar);

            /**
             * Situation 2.1 — Found same Vote from same Dude for same Comment. Its dublicate, do nothing.
             */
            if (sameDude) {

                return;

            }

            /**
             * Situation 2.2 — Found similar vote from other people
             * Need make grouping
             */
            let grouping = makeGroupNotification( similar, newNotify, notifyData );
            $.replace(similar, grouping);
            return;

        }

    }

    /**
     * Fallback for unrecognized type of notifies
     * @param {Element} list      – where to put
     * @param {Object} notifyData – notification object
     */
    function addDefaultNotify(list, notifyData) {

        let newNotify = $.parseHTML(notifyData.notify_html);

        $.prepend(list, newNotify);

    }


    /**
     * Add new notify to the beginning of the list
     * @param {Element} list       - notifications list Element
     * @param {Object} notifyData  - notification object
     * @param {String} notifyData.notify_html   - tpl
     * @param {Number} notifyData.comment_id    - comment id that liked or replied
     * @param {Number} notifyData.user_id       - who creates notification
     * @param {String} notifyData.type          - notification action: comment_replied, comment_liked
     * @param {Number} notifyData.to_comment_id - for 'comment_replied' type, means id of parent (original) comment
     * @param {Number} notifyData.sign          - 1 is like , -1 is dislike;
     */
    function add(list, notifyData) {

        switch(notifyData.type) {
            case 'comment_voted':
                addVote(list, notifyData);
                break;

            case 'comment_replied':
                addReply(list, notifyData);
                break;

            default: // Fallback for unrecognized type of notifies
                addDefaultNotify(list, notifyData);
                break;
        }

        /** show mark-read-all if unread notifications exists */
        let listContainer = $.parents(list, '[name="js-notifies-list-container"]'),
            markReadAllButton = markReadAll.button.findIn(listContainer);

        markReadAll.showButtonIfNeed(listContainer, markReadAllButton);

    }

    /**
     * Removes notifies by target id
     * @param  {Number} targetId  - id of notify target: comment_id, entry_id
     */
    function remove(list, targetId) {

        let notifies = $.findAll(list, `[name="js-notify"][data-target="${targetId}"]`);

        for (var i = notifies.length - 1; i >= 0; i--) {

            notifies[i].remove();

        }

        self.trigger('Notifies removed');

    }

     /**
     * @private
     *
     * Replace list items with new HTML
     * @param  {Object} notifiesData             - data returned from the server
     * @param  {string} notifiesData.items_html  - HTML with notifies items
     */
    function appendItems( notifiesData ) {

        console.assert(notifiesData && notifiesData.items_html !== undefined, 'module.notifiesList: wrong server response format');

        listWrappers.forEach( wrapper => {

            wrapper.innerHTML = '';
            wrapper.insertAdjacentHTML('beforeend', notifiesData.items_html);

            return;

        });

    }

    /**
     * Clear and update notifies list by server data
     */
    function update() {

        _log("Updating notifies list...");

        newItemsLabel.classList.add(CSS.newItemsLabelLoading);

        notifyBroker.get(
            null,
            notifiesData => {
                appendItems(notifiesData);
                newItemsLabel.classList.remove(CSS.newItemsLabelLoading);
            },
            () => _log('Error while loading notifications')
        );
    }

    /**
     * Adds button "Show new notifications"
     */
    function addNewItemsLabel() {

        listWrappers.forEach( wrapper => {

            newItemsLabel = wrapper.querySelector(`.${CSS.newItemsLabel}`);

            if (!newItemsLabel) {

                newItemsLabel = $.make('div', [CSS.newItemsLabel], {
                    textContent : 'Показать новые уведомления'
                });

                newItemsLabel.appendChild($.preloader());

                wrapper.insertAdjacentElement('afterbegin', newItemsLabel);

                $.on(newItemsLabel, 'click', update);

            }

        });

    }

    /**
     * New notification handler
     *
     * @param  {Object} notifyData
     * @param  {Number} notifyData.date
     * @param  {String} notifyData.type
     * @param  {String} notifyData.notify_html
     */
    function notificationReceived(notifyData) {

        _log('Received notification', notifyData);

        if ( notifyData.type == "comment_removed") {

            /** Remove notify from each lists on page */
            for (var i = 0; i < listWrappers.length; i++) {

                remove(listWrappers[i], notifyData.comment_id);

            }

            return;

        }

        /**
         * Enable audio alert
         */
        if ( !metrics.is_mobile ) {

            if ( !sound ) {

                sound = new Audio(window.__static_path + '/audio/' + notifySoundFile);

            }

            sound.play();

        }


        /**
         * @since  07 sep 2017
         *
         * Client appending and grouping disabled. New scheme:
         * when notification is received, add 'show new' label,
         * that provides request for all new grouped list from the server
         */

        addNewItemsLabel();
        return;

        /** Add notify to each lists on page */
        // for (var i = 0; i < listWrappers.length; i++) {

        //     add(listWrappers[i], notifyData);

        // }

    }


    /**
     * Check if user click on active-element inside notify-block
     * @param  {string}  selector  - inner Button selector for checking
     * @this   {Element}           - clicked element
     * @return {Boolean}           - true if clicked element matches passed selector
     */
    function isClickedOnInnerButton(selector){

        return this.matches(selector);

    }

    /**
     * Notification click handler
     * @param  {MouseEvent} event fired on parent element by $.delegeEvent
     * @this {Element} - clicked notify element
     * @fires ajaxify.goTo
     */
    function notifyClicked(event){

        var notify = this,
            clickedElement = event.target,
            innerButtons = [
                '[name="js-notify-subject-toggler"]',
                '[name="js-notify-mark-as-read"]',
                // 'a'
            ],
            itemIds = notify.dataset.ids,
            url;

        /**
         * Do nothing when clicked-element is an inner active-button. For example: subject-toggler, mark-read button
         */
        if ( innerButtons.some(isClickedOnInnerButton, clickedElement) ){

            return;

        }

        /** Mark read */
        if ( notify.classList.contains(CSS.unreadNotify) ) {

            notifyBroker.read(itemIds);
            markRead(notify);

        }

        url = notify.dataset.url;

        /**
        * Allow opening page in new tab
        */
        let isMouseWheelClicked = event.which && ( event.which === 2 || event.button === 4 ),
            isCmdPressed = event.ctrlKey || event.metaKey,
            isNewTab = notify.dataset.new_tab;

        if (isCmdPressed || isMouseWheelClicked || isNewTab) {

            let newTab = window.open(url, '_blank');
            newTab.focus();
            event.preventDefault();

        } else {

            ajaxify.goTo(url);

        }

        self.trigger('Notify clicked', {
            notify: notify,
            type: notify.dataset.type,
            sign: notify.dataset.sign
        });

    }

    /**
     * Notify list initialization
     *
     * @param  {Object}     moduleExemplar          - inited module exemplar
     * @param  {Element}    moduleExemplar.element
     * @param  {Object}     moduleExemplar.settings
     */
    function initList( moduleExemplar ) {

        let moduleHolder = moduleExemplar.element,
            listWrapper,
            unreadNotifications,
            markReadAllButton;

        listWrapper = $.find(moduleHolder, '[name="js-notifications-items"]');
        markReadAllButton = markReadAll.button.findIn(moduleHolder);

        if (!listWrapper) {
            return;
        }

        $.delegateEvent(listWrapper, '[name="js-notify-subject-toggler"]', 'click', subjectToggler.clicked);
        $.delegateEvent(listWrapper, '[name="js-notify-mark-as-read"]', 'click', markerClicked);
        $.delegateEvent(listWrapper, '[name="js-notify"]', 'click', notifyClicked);

        /** show mark-read-all if unread notifications exist */
        markReadAll.showButtonIfNeed(listWrapper, markReadAllButton);

        $.on(markReadAllButton, 'click', markReadAll.button.clicked);

        /**
         * Supports several notify-lists on same page
         */
        listWrappers.push(listWrapper);

    }

    /**
     * Destroyes passed notifies list
     * @param {Element} wrapper - list wrapper
     */
    function destroyList( wrapper ) {

        let markReadAllButtons = $.findAll('[name="js-notify-mark-all-as-read"]');

        if (markReadAllButtons.length) {

            for (var i = markReadAllButtons.length - 1; i >= 0; i--) {
                $.off(markReadAllButtons[i]);
            }

        }

        $.off(wrapper);

    }

    /**
     * Make methods public
     * @type {Object}
     */
    self.markReadAll = markReadAll;
    self.subjectToggler = subjectToggler;

    /**
     * Module entry point
     */
    self.init = function() {

        console.assert(self.elements && self.elements.length, 'module.notifiesList: no one notify-list holders found' );

        // Notification clicked
        self.on( 'Notify clicked', function( data ) {
            switch ( data.type ) {
                case '2':
                    if ( data.sign == 1 ) {
                        lib_analytics.sendDefaultEvent( 'Notifications — Comment-Liked notification clicked' );
                    } else {
                        lib_analytics.sendDefaultEvent( 'Notifications — Comment-Disliked notification clicked' );
                    }
                    break;

                case '4':
                    lib_analytics.sendDefaultEvent( 'Notifications — Comment-Reply notification clicked' );
                    break;
            }
        });

        /**
         * Can handle several lists
         * for example, in site-header and profile
         */
        self.elements.forEach(initList);

        /**
         * Bind socket listener
         */
        if (!subscribed){

            auth_data.on( 'Notification received', notificationReceived );
            subscribed = true;

        }

    };

    self.refresh = function () {

        self.destroy(false);
        self.init();

    };

    self.destroy = function(needUnsubscribe = true) {

        listWrappers.forEach(destroyList);

        listWrappers = [];

        if (needUnsubscribe) {
            auth_data.off();
        }

        if (newItemsLabel) {
            $.off(newItemsLabel);
        }

        self.off();

        sound = null;

    };

});

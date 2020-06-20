Air.defineModule( 'module.entry', 'module.telegram, lib.analytics, module.comments_counter, module.renderer, module.smart_ajax, \
                   module.notify, class.Entry, module.auth, module.auth_data, module.DOM, \
                   module.etc_controls, module.favorite, module.votes, module.date, class.Fabric, class.EntryPage, \
                   lib.DOM, fn.extend, module.evaluate_script, module.location, module.delegator, lib.console, fn.sendPush',
                   function( module_telegram, lib_analytics, comments_counter, renderer, smart_ajax, notify, Entry, auth, auth_data,
                             DOM, etc_controls, module_favorite, module_votes, module_date, Fabric,
                             EntryPage, $, extend, evaluate_script, location, delegator, console, sendPush ) {

    var self = this,
        fabric;

    /**
     * Returns first full entry
     */
    self.getFirstFullInstance = function() {
        var first_instance = fabric.getInstances()[ 0 ];

        if ( first_instance !== undefined && first_instance.type !== 'full' ) {
            first_instance = undefined;
        }

        return first_instance;
    };

    /**
     * Returns data of first full entry
     */

    var checkEditingClosed = function () {
        var label = $.find('[data-editing-closed-maker-id]'),
            maker_id,
            user = auth_data.get();

        if (user && label) {

            maker_id = $.data(label, 'editing-closed-maker-id');

            $.bem.toggle(label, 'hidden', !(maker_id == user.id));

        }

    };

    self.getData = function() {
        var first_instance = self.getFirstFullInstance();

        if ( first_instance !== undefined ) {
            return first_instance.getData();
        } else {
            return false;
        }
    };

    /**
     * Центрировать статью
     */
    var dealWithEntryCenter = function () {
		var user_data = auth_data.get(),
            entry_data = self.getData(),
            is_entry_center = entry_data.is_wide === true,
            page_entry;

        if (is_entry_center === false) {

            page_entry = $.find('.page--entry');

            if (user_data) {
    			if (user_data.is_paid) {
                    /** Для членов клуба */
                    is_entry_center = true;
    			}else{
                    is_entry_center = false;
                }
    		}else{
                is_entry_center = false;
            }

            if (page_entry) {
                $.toggleClass(page_entry, 'with--entry_center', is_entry_center);
            }

        }

        page_entry = user_data = entry_data = null;
	};

    /**
     * Init
     */
    self.init = function() {

        console.define( 'entry', 'Entry (＾-＾)', '#EF798A' );
        console.define( 'codex', '[CodeX Editor]', '#4da0da' );

        fabric = new Fabric({
            module_name: 'module.entry',
            Constructor: EntryPage,
            controlling_module: self,
            onVisible: 'activate',
            debounce: 500
        });

        dealWithEntryCenter();

        /** Пожаловаться */
        etc_controls.defineControl({
            name: 'complain_content',
            use: 'ajax_button',
            label: 'Пожаловаться',
            url: '/contents/complain',
            getData: function(main_element) {
                return {
                    content_id: $.data(main_element, 'content-id'),
                    user_id: $.data(main_element, 'user-id'),
                    mode: 'raw'
                };
            },
            msg: {
                success: 'Ваша жалоба отправлена модератору',
                error: 'Не удалось отправить жалобу'
            }
        });

        /** Редактировать */
        etc_controls.defineControl({
            name: 'edit_entry',
            use: 'link',
            label: 'Редактировать',
            getHref: function(main_element) {
                return '/writing/' + $.data(main_element, 'content-id');
            }
        });

        /** Распубликовать */
        etc_controls.defineControl({
            name: 'unpublish_entry',
            use: 'toggle',
            labels: ['Распубликовать', ''],
            action: function(main_element, current_state, callback) {
                var entry = new Entry();

                entry.id = $.data(main_element, 'content-id');

                if (current_state === 0) {
                    entry.unpublish().then(() => {
                        callback(true);

                        location.reload();
                    }).catch(err => {
                        callback(false);

                        console.log( 'entry', 'Entry unpublishing failed:', err );
                    });
                } else {
                    alert('Хаха, лох! Нет такого метода');
                }
            }
        });

        /** Удалить */
        etc_controls.defineControl({
            name: 'remove_entry',
            use: 'button',
            label: 'Удалить',
            action: function(main_element, callback) {
                var entry = new Entry();

                entry.id = $.data(main_element, 'content-id');

                entry.remove().then(() => {
                    callback(true);

                    if (!delegator.getData('is_content')){
                        location.reload();
                    }

                }).catch(err => {
                    callback(false);

                    console.log( 'entry', 'Entry removing cancelled:', err );
                });
            }
        });

        /** Не выводить */
        etc_controls.defineControl({
            name: 'unforce_entry',
            use: 'toggle',
            labels: ['Не выводить', ''],
            action: function(main_element, current_state, callback) {
                var entry = new Entry();

                entry.id = $.data(main_element, 'content-id');

                if (current_state === 0) {
                    entry.hideFromMain().then(() => {
                        callback(true);

                        location.reload();
                    }).catch(err => {
                        callback(false);

                        console.log( 'entry', 'Entry unforce failed:', err );
                    });
                } else {
                    alert('Хаха, лох! Нет такого метода');
                }
            }
        });

        DOM.on( 'send_web_push', function( data ) {
            sendPush( {
                type: 'web',
                id: $.data( data.el, 'id' ),
                title: 'Важная новость',
                text: $.data( data.el, 'title' ),
                url: $.data( data.el, 'url' )
            }, function( state ) {
            } );
        } );

        DOM.on( 'send_mobile_push', function( data ) {
            sendPush( {
                type: 'mobile',
                id: $.data( data.el, 'id' ),
                title: '',
                text: $.data( data.el, 'title' ),
            }, function( state ) {
            } );
        } );

        if ( self.elements && self.elements[0] ) {
            let main_element        = self.elements[0].element,
                applyVersionButton  = $.find(main_element, '.entry_header__apply-version');

            if (applyVersionButton) {
                $.on(applyVersionButton, 'click', applySelectedVersion);
            }
        }

        checkEditingClosed();
    };

    let applySelectedVersion = function() {

        let button = this,
            content_id = button.dataset.contentId,
            history_id = button.dataset.historyId;

        let confirm = window.confirm("Текущая версия статьи будет перезаписана. Уверены?");

        if (confirm) {

            smart_ajax.post( {
                url: '/writing/' + content_id + '/history/' + history_id + '/apply',
                success: function( response ) {

                    notify.success('Версия успешно применена!');

                    window.setTimeout(function() {
                        window.opener.location.reload();
                        window.close();
                    }, 1000);


                },
                error: function( error ) {

                    notify.error('Не получилось применить версию, что-то пошло не так');

                }

            });

        }

    };

    /**
     * Refresh
     */
    self.refresh = function() {
        module_favorite.refresh();
        module_votes.refresh();
        module_date.refresh();
        comments_counter.refresh();
        etc_controls.refresh();

        fabric.update();

        checkEditingClosed();
    };

    /**
     * Destroy
     */
    self.destroy = function() {
        auth_data.off();
        DOM.off();

        fabric.destroy();
    };
} );

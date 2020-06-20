Air.define( 'module.section_manager', 'module.location, lib.DOM, module.delegator, lib.cookie, module.system_messages', function(module_location, $, delegator, cookie, system_messages) {
	var self = this,
		elements = {},
		badge_limit = 99;

	var setActiveMenuItems = function(navigation_name, sorting_name)  {
        $.each(elements.main_menu_items, function( el ) {
			let toggle_state = false;

        	if ($.data( el, 'navigation-name' ) === navigation_name) {

                /** Hardcode :'( */
                if ($.find(el, '.main_menu__item__link[href="/"]')) {
                    let sorting_submenu = $.find(`.main_menu__item__sub_menu a[href="${sorting_name}"]`);

					if (sorting_submenu) {
                        toggle_state = true;
					} else if (sorting_name === '') {
                        toggle_state = true;
					}

                    sorting_submenu = null;
            	} else {
                	let link = $.find(el, `.main_menu__item__link[href="${sorting_name}"]`);

					if (link) {
                        toggle_state = true;
					}

					link = null;
				}
            }

            $.bem.toggle( el, 'active',  toggle_state);

        });

    };

	var setBadge = function(count) {
		$.toggleClass(elements.badge, 'main_menu__item__badge--hidden', !parseInt(count));

		if (count > badge_limit) {
			count = badge_limit + '+';
		}else if (!parseInt(count)) {
			count = '';
		}

		$.html(elements.badge, count);
	};

	var getItemTimestamp = function( selector ) {
		return parseInt( $.attr( $.find( selector + ' [air-date-timestamp]'), 'air-date-timestamp' ) ) || 0;
	};

	var resetBadgeCount = function() {
		cookie.set('last-recent-seen', getItemTimestamp( '.feed__item' ), 365);

		self.delegated_data.unread_count = 0;
	};

	var update = function() {
		var url_component = module_location.getPathComponents()[0];

		if ($.find('.main_menu__item__link[href*="'+ url_component +'"] .main_menu__item__badge')) {
			resetBadgeCount();
		}

        setActiveMenuItems(delegator.getData('navigation_name'), delegator.getData('sorting_name'))

		setBadge( self.delegated_data.unread_count );

	};

	var onNewEntryReceived = function () {

		setBadge( ++self.delegated_data.unread_count );

	};

	self.resetBadgeCount = resetBadgeCount;

	self.setBadge = setBadge;

	self.init = function() {
		elements.badge = $.find( '.main_menu__item__badge' );

		elements.main_menu_items = $.findAll( '.main_menu__item' );

		update();

		system_messages.on('New entry received', onNewEntryReceived);

        delegator.on('Initial data recieved new delegated data', function () {
            setBadge(self.delegated_data.unread_count);
        });
	};

	self.refresh = function() {
		update();
	};

	self.destroy = function() {

	};
});

Air.define( 'module.new_entries', 'module.andropov_audio, module.andropov, module.telegram, module.system_messages, lib.ajax, module.DOM, lib.DOM, fn.declineWord, module.entry, module.sticky, module.gallery, module.section_manager, module.iframe_lazy_load', function(andropov_audio, andropov, module_telegram, system_messages, ajax, DOM, $, declineWord, module_entry, sticky_module, module_gallery, section_manager, iframe_lazy_load) {
	var self = this,
		new_entries,
		new_entries_counter,
		new_entries_text,
		counter = 0;

	var onNewEntryReceived = function () {

		updateValue(++counter);

	};

	var updateValue = function (val) {
		var text_arr = ['новых записей', 'новую запись', 'новых записи'];

		show(true);

		$.html(new_entries_counter, val);

		$.html(new_entries_text, declineWord(val, text_arr));
	};

	var show = function (state) {
		$.bem.toggle(new_entries, 'hidden', !state);

		if (state === false) {
			counter = 0;
		}
	};

	self.init = function() {
		new_entries = self.elements[0].element;

		new_entries_counter = $.find(new_entries, '.new_entries__counter');

		new_entries_text = $.find(new_entries, '.new_entries__text');

		system_messages.on('New entry received', onNewEntryReceived);

		DOM.on('Show new entries', function (data) {
			$.bem.toggle(data.el, 'loading', true);

			/** Hardcode */
			ajax.get( {
				url: '/recent',
				data: {
					'mode': 'ajax'
				},
				dataType: 'JSON',
				success: function (resp) {
					var recent_html = resp['module.ajaxify'].html,
						html_element = $.parseHTML(recent_html)[0],
						first_entry = $.find('[air-entry-id]'),
						first_entry_id = $.attr($.find('[air-entry-id]'), 'air-entry-id'),
						feed_items,
						entries,
						first_item_index,
						i,
						feed_container;

					feed_container = $.find('.feed__container');

					feed_items = $.findAll(html_element, '.feed__item');

					entries = $.findAll(html_element, '[air-entry-id]');

					$.each(entries, function (entry, i) {

						if ($.attr(entry, 'air-entry-id') == first_entry_id) {

							first_item_index = i;

						}

					});

					if (first_item_index) {

						feed_items = feed_items.splice(0, first_item_index).reverse();

						$.each(feed_items, function (item) {
							$.prepend(feed_container, item);
						});

						sticky_module.refresh();
						module_telegram.refresh();
			            module_entry.refresh();
			            module_gallery.refresh();
						andropov.refresh();
                        andropov_audio.refresh();
						iframe_lazy_load.refresh();

					}

					show(false);

					$.bem.toggle(data.el, 'loading', false);

					section_manager.resetBadgeCount();

					section_manager.setBadge(0);

					recent_html = html_element = first_entry = feed_items = entries = feed_container = null;

				},
				async: true
			} );

		});

	};

	self.refresh = function() {
		self.destroy();
		self.init();
	};

	self.destroy = function() {
		new_entries = new_entries_counter = new_entries_text = null;

		counter = 0;

		system_messages.off();
	};

});

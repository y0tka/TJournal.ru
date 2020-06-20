Air.define( 'module.search', 'module.DOM, lib.DOM, module.ajaxify, module.popup', function(DOM, $, ajaxify, popup_module) {
	var self = this,
		dom_list;

	var showSearchBar = function (state) {
		$.toggleClass(document.body, 'with--search_bar', state);

		if (state === true) {
			setTimeout(function () {
				$.on(document, 'click.module_search', function(event) {
					var outside_click = !$.belong(event.target, '.search_bar');

					if (outside_click) {
						$.toggleClass(document.body, 'with--search_bar', false);
						$.off(document, 'click.module_search');
					}
				});
            }, 100);

			dom_list.search_input.focus(true);
		}else{
			$.off(document, 'click.module_search');
		}

	};

	self.init = function() {
		dom_list = DOM.list('.main_menu__item--search');

		DOM.on('search_show:click', function(){
			showSearchBar(true);
		});

		DOM.on('search_hide:click', function(data){
			showSearchBar(false);

			if (data && data.event) {
				data.event.stopPropagation();
			}
		});

		DOM.on('search_input:key', function(data){
			if (data.is_enter) {
				ajaxify.goTo('/search/' + encodeURIComponent(dom_list.search_input.val()));
			}

			if (data.is_enter || data.is_esc) {
				showSearchBar(false);
				dom_list.search_input.val('');
			}
		});
	};

	self.refresh = function() {
		showSearchBar(false);
	};

	self.destroy = function() {
		DOM.off();

		dom_list = null;
	};
});

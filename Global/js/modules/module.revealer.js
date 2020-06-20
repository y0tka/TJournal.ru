Air.define( 'module.revealer', 'module.DOM, lib.DOM', function(DOM, $) {
	var self = this;

	var revealerClickHandler = function (revealer_element) {
		var revealer_show = $.attr(revealer_element, 'air-revealer-show'),
			revealer_toggle_class = $.attr(revealer_element, 'air-revealer-toggle-class'),
			revealer_parent_selector = $.attr(revealer_element, 'air-revealer-parent-selector'),
			revealer_elements = $.findAll('[air-revealer-name="'+ revealer_show +'"]'),
			revealer_parent_element;

		if (revealer_parent_selector) {
			revealer_parent_element = $.parents(revealer_element, revealer_parent_selector);
		}

		$.each(revealer_elements, function (element) {
			var bem_class = $.attr(element, 'air-revealer-class'),
				has_class = $.bem.hasMod(element, bem_class);

			if (has_class == false) {

				/** Show revealer elements and toogle different classes */
				if (bem_class) {
					$.bem.toggle(element, bem_class, true);
				}

				if (revealer_toggle_class) {
					$.bem.toggle(revealer_element, revealer_toggle_class, true);
				}

				if (revealer_parent_element) {
					$.css(revealer_parent_element, {
						'z-index': 10000,
						'position': 'relative'
					});
				}

				/** Need some timeout after click */
				setTimeout(function(){

					$.on(document, 'click.module_revealer', function(event) {

						/** Hide revealer elements and toogle different classes */
						if (bem_class) {
							$.bem.toggle(element, bem_class, false);
						}

						if (revealer_toggle_class) {
							$.bem.toggle(revealer_element, revealer_toggle_class, false);
						}

						if (revealer_parent_element) {
							$.css(revealer_parent_element, {
								'z-index': '',
								'position': ''
							});
						}

						$.off(document, 'click.module_revealer');

					});

				}, 50);

			}

		});
	};

	self.init = function() {

		DOM.on('revealer:click', function (data) {
			revealerClickHandler(data.el);
		});

	};

	self.refresh = function() {

	};

	self.destroy = function() {

		DOM.off();

		$.off(document, 'click.module_revealer');

	};
});

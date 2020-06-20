/**
 * @module modalWindow
 */
Air.define( 'module.modal_window', 'module.DOM, lib.DOM, module.popup', function(DOM, $, popup_module) {
	var self = this;

	var modalController = new function () {
		var controller = this,
			controllers = {},
			new_controller;

		controller.add = function (name, func) {
			controllers[name] = func;
		};

		controller.run = function (name, element) {
			if (controllers[name] !== undefined) {
				new_controller = new controllers[name](element, DOM.list(element));
			}else{
				new_controller = {};
			}

			new_controller.status = false;

			new_controller.init && new_controller.init();
		};

		controller.getData = function () {
			return new_controller.getData && new_controller.getData();
		};

		controller.setStatus = function (status) {
			new_controller.status = status;
		};

		controller.getStatus = function (status) {
			return new_controller.status;
		};

		controller.stop = function () {
			new_controller.destroy && new_controller.destroy();

			new_controller = null;
		};

	};

	modalController.add('vacancy_reject', function(element, dom_list) {

		this.init = function () {
			setTimeout(function () {
				dom_list.reason_text.focus(true);
			}, 100);
		};

		this.getData = function () {
			return {
				reason_text: dom_list.reason_text.val()
			}
		};

	});

	modalController.add('unpublish', function(element, dom_list) {

		this.init = function () {
			setTimeout(function () {
				dom_list.reason_text.focus(true);
			}, 100);
		};

		this.getData = function () {
			return {
				reason_text: dom_list.reason_text.val()
			}
		};

	});

	modalController.add('ban', function(element, dom_list) {

		this.init = function () {
			setTimeout(function () {
				dom_list.reason_text.focus(true);
			}, 100);
		};

		this.getData = function () {
			var days = parseInt(dom_list.days.val());

			if (days > 1095) {
				days = 1095
			}

			return {
				reason_text: dom_list.reason_text.val(),
				days: days
			}
		};

	});

	var showModalWindow = function (options) {
		popup_module.show({
			template: 'modal_window_' + options.name,
			data: options.data || {},
			style: false,
			onReady: function (popup_element) {
				modalController.run(options.name, popup_element);
			},
			onClose: function() {
				options.onClose && options.onClose(modalController.getStatus(), modalController.getData());

				modalController.stop();
			}
		});
	};

	/**
	 * Show modal window
	 * @param  {Object} options
	 *         				– name: [string]
	 *         				– data: [Object]
	 *         				– onClose: [function](status, data)
	 */
	self.show = function (options) {
		showModalWindow(options);
	};

	self.addController =  modalController.add;

	self.init = function() {
		DOM.on('modal_window_cancel:click', function () {
			modalController.setStatus(false);
			popup_module.hide();
		});

		DOM.on('modal_window_close:click', function () {
			modalController.setStatus(false);
			popup_module.hide();
		});

		DOM.on('modal_window_apply:click', function () {
			modalController.setStatus(true);
			popup_module.hide();
		});

		DOM.on('modal_window_apply:key', function (data) {
			if ( data.is_enter && ( data.is_meta || data.is_ctrl ) ) {
				modalController.setStatus(true);
				popup_module.hide();
 			}
		});
	};

	self.refresh = function() {

	};

	self.destroy = function() {
		DOM.off();
	};

});

Air.define( 'module.waterfall', 'lib.DOM, class.Fabric', function($, Fabric) {
	var self = this,
		is_inited,
		fabric;

	var Waterfall = function(parameters) {
        this.element = parameters.element;
		this.id = $.attr($.find(this.element, '[data-broadcast]'), 'data-broadcast');
	};

	Waterfall.prototype.init = function(state) {
		if (!this.inited) {
			embedWaterfall(this.id);
			this.inited = true;
		}
	};

	Waterfall.prototype.destroy = function () {
		this.element = parameters = null;
	};

	var initApi = function (callback) {
		var js,
            fjs = document.getElementsByTagName('script')[0],
			wait;

        js = document.createElement('script');
        js.id = 'wtf-embed';
        js.src = '//wtrfall.com/widget.js?id=' + self.config.space_id;
        fjs.parentNode.insertBefore(js, fjs);

		wait = function() {
			if (window.WTF && window.WTF.bootstrap) {
				callback && callback();
			}else{
	            setTimeout(wait, 100);
	        }
		};

		js.onload = function() {
			wait();
		};
	};

	var checkApi = function(callback) {
		if (is_inited === true) {
			callback && callback();
		}else{
			initApi(function () {
				is_inited = true;

				callback && callback();
			});
		}
	};

	var embedWaterfall = function (id) {
		window.WTF.bootstrap('wtf-broadcast-' + id);
	};

	var embedAll = function () {
		checkApi(function () {
			fabric.each(function (element, object) {
				object.init();
			});
		});
	};

	self.init = function() {
		fabric = new Fabric({
            module_name: 'module.waterfall',
            Constructor: Waterfall
        });

		embedAll();
	};

	self.refresh = function() {
		fabric.update();
		embedAll();
	};

	self.destroy = function() {
		fabric.clear();
	};

});

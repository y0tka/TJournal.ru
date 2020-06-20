/**
 **/

Air.defineClass( 'class.DOM', 'lib.DOM, class.Collection', function( LibDOM, Collection ) {
	/**
	 * Constructor
	 */
	var Constructor = function(subject) {
		this.collection = new Collection();

		if (subject !== undefined) {
			this.select(subject);
		}
	};

	Constructor.prototype.select = function (subject) {
		LibDOM.each(subject, this.collection.addElement.bind(this.collection));
	};

	Constructor.prototype.deselect = function (subject) {
		if (subject === undefined) {
			this.collection.clear();
		}else if (typeof subject === 'string') {
			this.collection.removeByRule(function(el){
				return el.matches(subject);
			});
		}else{
			LibDOM.each(subject, this.collection.removeElement);
		}
	};

	Constructor.prototype.remove = function (subject) {
		var that = this;

		if (subject === undefined) {
			that.each(function(el){
				LibDOM.remove(el);
			});
		}else{
			LibDOM.each(subject, LibDOM.remove(el));
		}
	};

	Constructor.prototype.each = function(callback) {
		this.collection.each(callback);

		return this;
	};

	Constructor.prototype.addClass = function (class_name) {
		this.each(function (el) {
			LibDOM.toggleClass(el, class_name, true);
		});

		return this;
	};

	Constructor.prototype.removeClass = function (class_name) {
		this.each(function (el) {
			LibDOM.toggleClass(el, class_name, false);
		});

		return this;
	};

	Constructor.prototype.toggleClass = function (class_name, state) {
		this.each(function (el) {
			LibDOM.toggleClass(el, class_name, state);
		});

		return this;
	};

	Constructor.prototype.hasClass = function(class_name) {
		return this.collection.eq(0, function(element) {
			return LibDOM.hasClass(element, class_name);
		});
	};

	Constructor.prototype.hasClassEvery = function(class_name) {
		return this.collection.every(function(element) {
			return LibDOM.hasClass(element, class_name);
		});
	};

	Constructor.prototype.attr = function (attr_name, value) {
		if (value === undefined || value === null) {
			return this.collection.eq(0, function(element) {
				return LibDOM.attr(element, attr_name, value);
			});
		} else{
			this.each(function (el) {
				LibDOM.attr(el, attr_name, value);
			});

			return this;
		}
	};

	Constructor.prototype.append = function (subject) {
		this.each(function(parent){
			LibDOM.each(subject, function (el) {
				LibDOM.append(parent, el);
			});

		});

		return this;
	};

	Constructor.prototype.prepend = function (subject) {
		this.each(function(parent){
			LibDOM.each(subject, function (el) {
				LibDOM.prepend(parent, el);
			});

		});

		return this;
	};

	Constructor.prototype.before = function (subject) {
		this.each(function(parent){
			LibDOM.each(subject, function (el) {
				LibDOM.before(parent, el);
			});

		});

		return this;
	};

	Constructor.prototype.after = function (subject) {
		this.each(function(parent){
			LibDOM.each(subject, function (el) {
				LibDOM.after(parent, el);
			});

		});

		return this;
	};

	Constructor.prototype.find = function (selector) {
		var new_collection = new Constructor();

		this.each(function(el){
			new_collection.select(LibDOM.findAll(el, selector));
		});

		return new_collection;
	};

	Constructor.prototype.children = function () {
		var new_collection = new Constructor();

		this.each(function(el){
			new_collection.select(LibDOM.children(el));
		});

		return new_collection;
	};

	Constructor.prototype.parent = function () {
		var new_collection = new Constructor();

		this.each(function(el){
			new_collection.select(LibDOM.parent(el));
		});

		return new_collection;
	};

	Constructor.prototype.parents = function (selector) {
		var new_collection = new Constructor();

		this.each(function(el){
			var parents = LibDOM.parents(el, selector);

			if (parents) {
				new_collection.select(parents);
			}
		});

		return new_collection;
	};

	Constructor.prototype.html = function (html) {
		if (html === undefined) {
			return this.collection.eq(0, function(element) {
				return LibDOM.html(element);
			});
		} else{
			this.each(function (el) {
				LibDOM.html(el, html);
			});

			return this;
		}
	};

	Constructor.prototype.val = function (value) {
		if (value === undefined) {
			return this.collection.eq(0, function(element) {
				return LibDOM.val(element);
			});
		} else{
			this.each(function (el) {
				LibDOM.val(el, value);
			});

			return this;
		}
	};

	Constructor.prototype.outerHtml = function (html) {
		if (html === undefined) {
			return this.collection.eq(0, function(element) {
				return LibDOM.outerHtml(element);
			});
		} else{
			this.each(function (el) {
				LibDOM.outerHtml(el, html);
			});

			return this;
		}
	};

	Constructor.prototype.text = function (str) {
		if (str === undefined) {
			return this.collection.eq(0, function(element) {
				return LibDOM.text(element);
			});
		} else{
			this.each(function (el) {
				LibDOM.text(el, str);
			});

			return this;
		}
	};

	Constructor.prototype.next = function() {
		var new_collection = new Constructor();

		this.each(function(el){
			var next = LibDOM.next(el);

			if (next) {
				new_collection.select(next);
			}
		});

		return new_collection;
	};

	Constructor.prototype.prev = function() {
		var new_collection = new Constructor();

		this.each(function(el){
			var next = LibDOM.prev(el);

			if (next) {
				new_collection.select(next);
			}
		});

		return new_collection;
	};

	Constructor.prototype.css = function (name, value) {
		if (value === undefined && typeof name === 'string') {
			return this.collection.eq(0, function(element) {
				return LibDOM.css(element, name);
			});
		} else {
			this.each(function (el) {
				LibDOM.css(el, name, value);
			});

			return this;
		}
	};

	Constructor.prototype.width = function (value) {
		if (value === undefined) {
			return this.collection.eq(0, function(element) {
				return LibDOM.width(element);
			});
		} else {
			this.each(function (el) {
				LibDOM.width(el,value);
			});

			return this;
		}
	};

	Constructor.prototype.height = function (value) {
		if (value === undefined) {
			return this.collection.eq(0, function(element) {
				return LibDOM.height(element);
			});
		} else {
			this.each(function (el) {
				LibDOM.height(el,value);
			});

			return this;
		}
	};

	Constructor.prototype.position = function (value) {
		if (value === undefined) {
			return this.collection.eq(0, function(element) {
				return LibDOM.position(element);
			});
		} else {
			this.each(function (el) {
				LibDOM.position(el,value);
			});

			return this;
		}
	};

	Constructor.prototype.offset = function (value) {
		if (value === undefined) {
			return this.collection.eq(0, function(element) {
				return LibDOM.offset(element);
			});
		} else {
			this.each(function (el) {
				LibDOM.offset(el,value);
			});

			return this;
		}
	};

	Constructor.prototype.focus = function (value) {
		this.each(function (el) {
			LibDOM.focus(el, value);
		});

		return this;
	};

	Constructor.prototype.length = function() {
		return this.collection.getLength();
	};

	Constructor.prototype.get = function() {
		return this.collection.getElements();
	};

	Constructor.prototype.on = function(name, handler) {
		this.each(function (el) {
			LibDOM.addEvent(el, name, handler);
		});

		return this;
	};

	Constructor.prototype.delegate = function(selector, name, handler) {
		this.each(function (el) {
			LibDOM.deleagteEvent(el, selector, name, handler);
		});

		return this;
	};

	Constructor.prototype.off = function(name, handler) {
		this.each(function (el) {
			LibDOM.removeEvent(el, name, true);
		});

		return this;
	};

	return Constructor;
} );

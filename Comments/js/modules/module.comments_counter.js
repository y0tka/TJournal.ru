Air.defineModule( 'module.comments_counter', 'module.comments_last_visit, module.smart_ajax, module.date, module.metrics, module.notify, class.Fabric, lib.DOM, fn.declineWord', function( comments_last_visit, smart_ajax, module_date, metr, module_notify, Fabric, $, declineWord, util ) {
	var self = this,
		fabric;

	var CommentsCounter = function( params ) {
		this.init( params );
	};

	CommentsCounter.prototype.init = function( params ) {
		this.uid = util.uid();

		this.element = params.element;
		this.element_count = $.bem.find( this.element, 'count' );
		this.element_value_new = null;
		this.element_value = $.bem.find( this.element, 'count__value' );
		this.element_unit = $.bem.find( this.element, 'count__unit' );

		this.id = $.data( this.element, 'comments_counter-id' );
		this.type = $.data( this.element, 'comments_counter-type' );

		this.current_value = parseInt($.text(this.element_value)) || 0;

		this.updateNewValue();
	};

	CommentsCounter.prototype.destroy = function() {
	};

	CommentsCounter.prototype.setNewValue = function(value) {
		var has_new = value > 0,
			value_str;

		if ( has_new ) {
			value_str = '+' + value;

			if (this.element_value_new === null) {
				this.element_value_new = $.parseHTML('<span class="comments_counter__count__value_new l-inline-block l-va-middle">' + value_str + '</span>');
				$.prepend(this.element_count, this.element_value_new);
			} else {
				$.text( this.element_value_new, value_str );
			}
		} else {
			if (this.element_value_new !== null) {
				$.remove(this.element_value_new);
			}
		}

		$.bem.toggle( this.element, 'has_new', has_new );
	};

	CommentsCounter.prototype.updateNewValue = function() {
		if ( comments_last_visit.isThereCount( this.id ) ) {
			this.setNewValue(this.getValue() - comments_last_visit.getCount( this.id ));
		}
	};

	CommentsCounter.prototype.getValue = function() {
		return this.current_value;
	};

	CommentsCounter.prototype.setValue = function( value ) {
		this.current_value = value;

		$.text( this.element_value, value );

		$.text( this.element_unit, value > 0 ? declineWord( value, [ 'комментариев', 'комментарий', 'комментария' ] ) : 'Обсудить' );

		$.bem.toggle( this.element, 'nonzero', value > 0 );
		$.bem.toggle( this.element, 'zero', value === 0 );
	};

	CommentsCounter.prototype.setWait = function( state ) {
		$.bem.toggle( this.element, 'wait', state !== false );
	};

	CommentsCounter.prototype.appendComment = function( html ) {
		$.append( $.parents( this.element, '.entry_wrapper' ), $.parseHTML( html ) );

		module_date.refresh();
	};

	CommentsCounter.prototype.activate = function( state ) {
	};

	self.init = function() {
		fabric = new Fabric( {
			selector: '[air-module="module.comments_counter"]',
			Constructor: CommentsCounter,
			onVisible: 'activate', // onVisible
			debounce: 500
 		} );
	};

	self.refresh = function() {
		fabric.update();
	};

	self.destroy = function() {
		fabric.destroy();
	};
} );

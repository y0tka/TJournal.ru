Air.define( 'module.news_widget', 'lib.analytics, module.smart_ajax, module.DOM, lib.DOM, lib.cookie, module.auth_data', function( lib_analytics, smart_ajax, DOM, $, cookie, auth_data ) {
	var self = this,
		is_open,
		elements,
		last_id,
		is_toggle_blocked = false,
		block_timer;

	var rememberState = function( state ) {
		var name = 'is_news_widget_open',
			cookie_value;

		if ( state !== undefined ) {

			cookie.set( name, state + '');

		} else {
			cookie_value = cookie.get( name );

			switch (cookie_value) {
				case 'true':
					return true;
				break;

				case 'false':
					return false;
				break;

				default:
					return null;
			}
		}
	};

	var resizeForContent = function( state ) {
		$.height( elements.content, ( state ? $.height( elements.content_inner ) : 0 ) + 'px' );
	};

	var appendContent = function( html ) {
		$.appendHTML( elements.content_inner, html );
	};

	var openWidget = function( state ) {
		is_open = state !== false;

		$.bem.toggle( elements.widget, 'open', is_open );

		resizeForContent( is_open );

		rememberState( is_open );
	};

	var toggleWidget = function() {
		if ( is_toggle_blocked === false ) {
			is_toggle_blocked = true;

			lib_analytics.sendDefaultEvent( 'New widget – ' + ( is_open ? 'Close' : 'Open' ) + ' – Click' );

			openWidget( !is_open );

			block_timer = setTimeout( function() {
				is_toggle_blocked = false;
			}, 500 );
		}
	};

	var setLoading = function( state ) {
		$.bem.toggle( elements.widget, 'loading', state !== false );
	};

	var requestNews = function( last_id, callback ) {
		smart_ajax.get( {
			url: '/news/more/' + last_id,
			data: {
				mode: 'raw'
			},
			success: function( data ) {
				callback( data );
			},
			error: function( data ) {
				callback( false );
			}
		} );
	};

	var loadMore = function() {
		setLoading( true );

		requestNews( last_id, function( data ) {
			setLoading( false );

			if ( data ) {
				if ( data.last_id ) {
					last_id = data.last_id;
				}

				appendContent( data.html );
				resizeForContent( true );
			}
		} );
	};

	self.init = function() {
		var remember_state,
			is_anon = auth_data.get() === false;

		is_open = false;

		elements = {};

		elements.widget = $.find( '.news_widget' );
		elements.content = $.bem.find( elements.widget, 'content' );
		elements.content_inner = $.bem.find( elements.content, 'inner' );

		DOM.on( 'news_widget_toggle', toggleWidget );

		DOM.on( 'news_widget_load_more', loadMore );

		remember_state = rememberState();

		if (remember_state === null) {

			if (is_anon) {

				openWidget( true );

			}

		} else {

			openWidget( remember_state );

		}

		last_id = $.data( elements.widget, 'last_id' );
	};

	self.refresh = function() {
		self.destroy();
		self.init();
	};

	self.destroy = function() {
		DOM.off();
		clearTimeout( block_timer );
	};
} );
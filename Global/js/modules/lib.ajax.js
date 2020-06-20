/**
 * TODO:
 * – последним аргументом в request добавить id, по которому можно его отменить
 *   (кажется, этим должен заниматься модуль выше, а не эта либа)
 *
 * @lib for working with AJAX-requests.
 */
Air.defineLib( 'lib.ajax', 'module.online', function(online) {

	return {

		local_cache: {},

		addToCache: function( key, data ) {
			this.local_cache[ key ] = data;
		},

		getFromCache: function( key ) {
			return this.local_cache[ key ];
		},

		dataToFormData: function( object ) {
			var form_data = new FormData(),
				key,
				i,
				length,
				item;

			for ( key in object ) {
				item = object[ key ];
				if ( item !== undefined ) {
					if ( item instanceof FileList || item instanceof Array ) {
						length = item.length;

						for ( i = 0; i < length; i++ ) {
							form_data.append( key + '_' + i, item[i] );
						}
					} else {
						form_data.append( key, item );
					}
				}
			}

			return form_data;
		},

		dataToGet: function( data, stack, parent_keys ) {
			var stack = stack || [],
				parent_keys = parent_keys || [],
				current_key,
				formed_key;

			for ( current_key in data ) {
				parent_keys.push( current_key );

                formed_key = parent_keys.map( function( k, i ) {
                    if ( i === 0 ) {
                        return k;
                    } else {
                        return '[' + k + ']';
                    }
                } ).join( '' );

				if ( typeof data[ current_key ] === 'object' ) {
					if (data[ current_key ] instanceof Array && data[ current_key ].length === 0) {
                        stack.push( encodeURIComponent( formed_key ) + '=' + encodeURIComponent( data[ current_key ] ) );
					} else {
                        this.dataToGet( data[ current_key ], stack, parent_keys );
					}
				} else {
					stack.push( encodeURIComponent( formed_key ) + '=' + encodeURIComponent( data[ current_key ] ) );
				}

				parent_keys.pop();
			}

			return stack.join( '&' );
		},

		request: function( parameters ) {
			if ( online.is() ) {
				return this.xhr( parameters );
			} else {
				parameters.error && parameters.error( 'Что-то не так с интернетом', -1 );
				parameters.complete && parameters.complete( 'Что-то не так с интернетом', -1, true );
				return null;
			}
		},

		/**
		 * Makes request.
		 * @param  {Object} parameters - Request parameters.
		 * @return {Object} Request object.
		 */
		xhr: function( parameters ) {
			var that = this,
				request = new XMLHttpRequest(),
				response_text;

			parameters.type = ( parameters.type || '' ).toLowerCase();
			parameters.format = ( parameters.format || '' ).toLowerCase();
			parameters.dataType = ( parameters.dataType || '' ).toLowerCase();

			switch ( parameters.format ) {
				case 'mfd':
					parameters.form_data = this.dataToFormData( parameters.data );
					break;

				default:
					parameters.get = this.dataToGet( parameters.data );
			}

			switch ( parameters.type ) {
				case 'post':
                case 'delete':
					break;

				case 'get':
					if ( parameters.url.indexOf( '?' ) < 0 ) {
						parameters.url += '?' + parameters.get;
					} else {
						parameters.url += '&' + parameters.get;
					}
					break;
			}

			if ( parameters.cache === true && this.getFromCache( parameters.url ) !== undefined ) {

				parameters.success && parameters.success( this.getFromCache( parameters.url ), 200 );
				parameters.complete && parameters.complete( this.getFromCache( parameters.url ), 200 );

				return;
			}

			request.method = parameters.type;
			request.open( parameters.type, parameters.url, true );

			request.onload = function() {
				var is_error = false;

				response_text = request.responseText || '';

				if ( parameters.dataType === 'json' ) {
					try {
						response_text = JSON.parse( response_text );
					} catch ( error ) {
						is_error = true;
						response_text = {};
					}
				}

				if ( request.status !== 200 ) {
					is_error = true;
				}

				if ( is_error === false ) {
					if ( parameters.cache === true ) {
						that.addToCache( parameters.url, response_text );
					}

					parameters.success && parameters.success( response_text, request.status );
				} else {
					parameters.error && parameters.error( response_text, request.status );
				}

				parameters.complete && parameters.complete( response_text, request.status, is_error );
			};

			request.error = function() {
				response_text = '';

				if ( parameters.dataType === 'json' ) {
					response_text = {};
				}

				parameters.error && parameters.error( response_text, request.status );
				parameters.complete && parameters.complete( response_text, request.status, true );
			};

	        for(var header in parameters.headers) {

	            if (parameters.headers.hasOwnProperty(header) && parameters.headers[header]) {
	                request.setRequestHeader(header, parameters.headers[header]);
	            }

	        }

			switch ( parameters.type ) {
				case 'post':
                case 'delete':
					this.setCSRF( request );

					if ( parameters.format === 'mfd' ) {
						request.send( parameters.form_data );
					} else {
						// request.setRequestHeader( 'Accept', 'application/json, text/javascript, */*; q=0.01' );
						request.setRequestHeader( 'Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8' );
						request.send( parameters.get );
					}
					break;

				case 'get':
					request.send();
					break;

				default:
					console.warn(`lib.ajax: unknown request type "${parameters.type}"`);
			}

			return request;
		},

		/**
		 * Makes POST-request.
		 * @param  {Object} parameters - Request parameters.
		 * @return {Object} Request-object.
		 */
		post: function( parameters ) {
			parameters.type = 'post';
			parameters.dataType = parameters.dataType || 'json';
			parameters.data = parameters.data || {};

			return this.request( parameters );
		},

		/**
		 * Makes GET-request.
		 * @param  {Object} parameters - Request parameters.
		 * @return {Object} jQuery AJAX-object.
		 */
		get: function( parameters ) {
			parameters.type = 'get';

			return this.request( parameters );
		},

        /**
         * Makes DELETE-request.
         * @param  {Object} parameters - Request parameters.
         * @return {Object} Request-object.
         */
        delete: function( parameters ) {
            parameters.type = 'delete';
            parameters.dataType = parameters.dataType || 'json';
            parameters.data = parameters.data || {};

            return this.request( parameters );
        },

		/**
		 * Aborts request.
		 * @param  {Object} request - Request object.
		 */
		cancel: function( request ) {
			if (request !== null) {
				request.abort();
			}
		},

		/**
		 * Sets header with CSRF-token to request
		 * @param  {Object} request - Request object.
		 */
		setCSRF: function( request ) {
			request.setRequestHeader( 'X-This-Is-CSRF', 'THIS IS SPARTA!' );

			if ( window.__static_version ) {
				request.setRequestHeader( 'X-JS-Version', window.__static_version );
			}
		}
	};

} );

/**
 * Detects all the XHR-requests and calls asynchronous method XMLHttpRequest.before.
 */
( function() {
    var origMethod = XMLHttpRequest.prototype.send;

	// monkey patching ( ͝° ͜ʖ͡°)
    XMLHttpRequest.prototype.send = function() {
		var that = this,
			args = arguments;

		if ( XMLHttpRequest.before ) {
			XMLHttpRequest.before( function() {
				origMethod.apply( that, args );
			}, that.method );
		} else {
			origMethod.apply( that, args );
		}
    };
} )();

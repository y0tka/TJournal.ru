/**
 * TODO:
 * – Если комменты не цепляются к сокету, то обновлять аяксом раз в какое-то время (~1 мин).
 */

Air.defineClass( 'class.CommentsModel', 'module.auth_data, module.smart_ajax, class.Socket, class.Buffer, lib.cloakroom, lib.console, fn.extend', function( auth_data, smart_ajax, Socket, Buffer, cloakroom, console, extend, util ) {

	var CommentsModel = function( params ) {
		this.init( params );
	};

	CommentsModel.prototype.init = function( params ) {
		var that = this;

		this.id = params.id;

		this.author_id = params.author_id;

		this.diff_limit = params.diff_limit;

		this.handlers = params.handlers || {};

		this.urls = params.urls || {};

		this.is_thinking = false;
		this.is_updating = false;
		this.updating_timer = null;

		this.items_ids = (params.items_ids || []).map(this.numToString);
        this.last_date = params.last_date || 0;

		this.orphan_items = {};

		this.socket = null;
		this.last_socket_id = null;

		this.missed_buffer = new Buffer( {
			delay: 100,
            onFlush: this.updateMissed.bind( this )
		} );
	};

	CommentsModel.prototype.numToString = function(num) {
		return num + '';
	};

	CommentsModel.prototype.handle = function(name, args) {
		if ( this.handlers[name] !== undefined ) {
			this.handlers[name].apply(this, args);
		}
	};

	CommentsModel.prototype.destroy = function() {
		clearTimeout( this.updating_timer );

		this.listenSocket( false );
        this.missed_buffer.destroy();

		this.items_ids = null;
		this.handlers = null;
		this.urls = null;
        this.orphan_items = null;
	};

	/**
	 * Converts comment server data item to local data item.
	 * @param  {Object} data  - Data from server.
	 * @return {Object} Local data.
	 */
    CommentsModel.prototype.dataToItem = function( data ) {

        // data.is_mine = auth_data.isMe(data.user_id);

		data.id = data.id + '';

        return data;
    };

	/**
	 * Calls 'processOne' method for list of comments.
	 * @param  {Array} data_list  - List of comments.
	 */
    CommentsModel.prototype.process = function( data_list ) {
		if ( data_list.length > 0 ) {
			data_list.sort( function( item_a, item_b ) {
				return item_a.id - item_b.id;
	        } ).filter( this.processOne.bind( this ) );
		} else {
			this.handle('onEmptyButReady');
		}
    };

	/**
	 * Decides add or modify comment.
	 * @param  {Object} data  - Comment data.
	 */
    CommentsModel.prototype.processOne = function( data ) {
        data = this.dataToItem( data );

        if ( this.isParentExists( data.reply_to ) ) { /* Если родительский коммент есть */
			if ( this.isExists( data.id ) ) { /* Если такой коммент уже есть, то модифицируем */
				this.modifyOne( data );
	        } else {
				this.addOne( data ); /* Если новый – добавляем */
	        }
		} else {
			this.storeOrphan( data ); /* Если родительского коммента нет, то храним до поры до времени как "осиротевший" */
		}

        // this.handle('onProcessed', [data]);
    };

	CommentsModel.prototype.isExists = function( id ) {
		return this.items_ids.indexOf( id + '' ) >= 0;
    };

	CommentsModel.prototype.isParentExists = function( id ) {
		return id > 0 ? this.isExists( id ) : true;
    };

	/**
	 * Adds comment and calls handler.
	 * @param {Object} data  - Comment data.
	 */
    CommentsModel.prototype.addOne = function( data ) {
		this.items_ids.push( data.id + '' );

		this.handle('onAdd', [data]);

		this.adoptOrphans( data.id ).forEach( this.addOne.bind( this ) );
    };

	/**
	 * Modifies comment and calls handler.
	 * @param {Object} data  - Comment data.
	 */
    CommentsModel.prototype.modifyOne = function( data ) {
		this.handle('onModify', [data]);
    };

	/**
	 * Stores orphan comment (as raw server data, not items!).
	 * @param {Object} data  - Comment data.
	 */
    CommentsModel.prototype.storeOrphan = function( data ) {
        console.log( 'comm', `Add orphan ID=${data.id} (parent ID=${data.reply_to})` );
		this.orphan_items[ data.id ] = data;
    };

	/**
	 * Removes and returns orphans from store.
	 * @param {number} id  - Parent comment id.
	 */
    CommentsModel.prototype.adoptOrphans = function( reply_to ) {
		var result = [],
			id;

		for ( id in this.orphan_items ) {
			if ( this.orphan_items[ id ] !== null && this.orphan_items[ id ].reply_to === reply_to ) {
                console.log( 'comm', `Parent ID=${reply_to} adopts orphan ID=${id}` );
				result.push( this.orphan_items[ id ] );
				this.orphan_items[ id ] = null;
			}
		}

		return result;
    };

	/**
	 * Requests to server for comments, calls handlers and runs callback with data.
	 * @param  {Function} callback.
	 */
    CommentsModel.prototype.request = function( callback, prev_items ) {
		var that = this;

		smart_ajax.get( {
			url: that.urls.diff,
			data: {
				last_date: that.last_date
			},
			success: function( response ) {
				var response_data_length = response.length,
					i;

				for ( i = 0; i < response_data_length; i++ ) {
					that.last_date = Math.max( that.last_date, response[ i ].date_created || 0, response[ i ].date_updated || 0 );
				}

				if ( !prev_items ) {
					prev_items = response;
				} else {
					prev_items = prev_items.concat( response );
				}

				if ( response_data_length >= that.diff_limit ) {
					that.request( callback, prev_items );
				} else {
					callback( prev_items );
				}
			},
			error: function( error ) {
				callback( false, error );
			}
		} );
    };

	/**
	 * Send item to server.
	 * @param  {Function} callback.
	 */
	CommentsModel.prototype.sendItem = function( data, callback ) {
		var that = this;

		this.setThinkingState( true );

		smart_ajax.post( {
			url: this.urls.add,
			data: {
				rid: cloakroom.put({
					is_just_answered: true,
					inversion: data.inversion
				}),
				text: data.text,
				media: JSON.stringify( data.media ),
				reply_to: data.reply_to
			},
			success: function( response ) {

				that.useCloakroom(response.rid, response);

				that.processOne( response );

				that.handle('onSend');

				callback( true );
			},
			error: function( error ) {
				callback( false, error );
			},
			complete: function() {
				that.setThinkingState( false );
			}
		} );
	};

	/**
	 * Edit item.
	 * @param  {Function} callback.
	 */
	CommentsModel.prototype.editItem = function( data, callback ) {
		var that = this;

		this.setThinkingState( true );

		smart_ajax.post( {
			url: this.urls.edit,
			data: {
				text: data.text,
				comment_id: data.edited_id
			},
			success: function( response ) {
				that.processOne( response );

				that.handle('onSend');

				callback( true );
			},
			error: function( error ) {
				callback( false, error );
			},
			complete: function() {
				that.setThinkingState( false );
			}
		} );
	};

	CommentsModel.prototype.setThinkingState = function( state ) {
		this.is_thinking = state !== false;

		this.handle('onThinking', [this.is_thinking]);
	};

	CommentsModel.prototype.setUpdatingState = function( state ) {
		this.is_updating = state !== false;

		this.handle('onUpdating', [this.is_updating]);
	};

	/**
	 * Updates comments and runs callback.
	 * @param  {Function} callback.
	 */
    CommentsModel.prototype.update = function( callback ) {
		var that = this;

		clearTimeout( this.updating_timer );

		if ( this.is_updating === false ) {
			this.setUpdatingState( true );

			this.request( function( data ) {
				that.setUpdatingState( false );

				if (callback !== undefined) {
					if ( data ) {
						callback( true );
					} else {
						callback( false );
					}
				}
			} );
		} else {
			this.updating_timer = setTimeout( this.update.bind( this ), 1000, callback );
		}
    };

	/**
	 * Loads more comments.
	 * @param  {Function} callback.
	 */
    CommentsModel.prototype.loadMore = function( params, callback ) {
		var that = this;
		console.log('comm', 'Loading more...', params);
		smart_ajax.get( {
			url: this.urls.load_more,
			data: {
				ids: params.ids,
				with_subtree: params.with_subtree
			},
			success: function(data) {
				console.log('comm', 'More loaded', data);
				that.process(data.items);
				callback( data );
			},
			error: function( error ) {
				callback( null, error );
			}
		} );
    };

	CommentsModel.prototype.updateMissed = function( sockets_ids ) {
		var that = this;

		if ( sockets_ids.length <= 3 ) {
			sockets_ids.forEach( function( socket_id ) {
				smart_ajax.get( {
					url: '/live/missed/socket',
					data: {
						id: socket_id,
						chan: 'comments-' + that.id
					},
					success: function( data ) {
						that.processOne( data.data );
					},
					error: function() {
						// that.missed_buffer.add( socket_id );
					}
				} );
			} );
		} else {
			this.last_date = 0;
			this.update();
		}
	};

	/**
	 * Listens socket.
	 * @param  {Boolean} state.
	 */
    CommentsModel.prototype.listenSocket = function( state ) {
		if ( state !== false ) {
			if ( this.socket === null ) {
				this.socket = new Socket( {
		            name: 'comments-' + this.id,
		            onMessage: this.processSocketMessage.bind( this )
		        } );

		        this.socket.open();
			}
		} else {
			if ( this.socket !== null ) {
				this.socket.close();
				this.socket = null;
			}
		}
    };

	CommentsModel.prototype.processSocketMessage = function( data ) {
		var id;

		console.log( 'comm', `Last socket #${this.last_socket_id}, receive socket #${data._id}` );

		if ( this.last_socket_id === null ) {
			this.last_socket_id = data._id;
		}

        if ( data._id < this.last_socket_id ) {
            console.log( 'comm', '...from past (WEIRD!)' );
		} else if ( data._id - this.last_socket_id > 1 ) {
            console.log( 'comm', '...missed' );
			for ( id = this.last_socket_id + 1; id < data._id; id++ ) {
				this.missed_buffer.add( id );
			}
		}

		if ( this.last_socket_id < data._id ) {
			this.last_socket_id = data._id;
		}

		/* Твой коммент анонимизирован в сокете, поэтому получишь его в ответе на аякс */
		if (!auth_data.isMe(data.data.user_id)) {
            this.useCloakroom(data.rid, data.data);
            this.processOne( data.data );
		}
	};

    CommentsModel.prototype.useCloakroom = function(rid, extended_data) {
        cloakroom.use(rid, function(rid_data) {
            extend(extended_data, rid_data);
        });
	};

	CommentsModel.prototype.getOriginalItem = function( id, callback ) {
		var that = this;

		this.setThinkingState( true );

		smart_ajax.get( {
			url: this.urls.get4edit,
			data: {
				id: id
			},
			success: function( response ) {
				callback( response );
			},
			error: function( error ) {
				callback( false, error );
			},
			complete: function() {
				that.setThinkingState( false );
			}
		} );
    };

	return CommentsModel;
} );

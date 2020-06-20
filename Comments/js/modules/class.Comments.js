Air.defineClass( 'class.Comments', 'module.metrics, module.comments_last_visit, module.location, module.ajaxify, module.DOM, module.auth_data, module.notify, class.CommentsModel, class.CommentsTree, class.CommentsForm, class.CommentsFolding, class.CommentsUpdates, class.Timer, lib.DOM', function( metr, comments_last_visit, module_location, ajaxify, DOM, auth_data, module_notify, CommentsModel, CommentsTree, CommentsForm, CommentsFolding, CommentsUpdates, Timer, $, util ) {

    var Comments = function( params ) {
        var that = this;

        this.settings = JSON.parse( $.html( $.find( params.element, 'air-settings' ) ) );

        this.controlling_module = params.controlling_module;
        this.module_auth_data = util.inherit( auth_data );
        this.module_DOM = util.inherit( DOM );
        this.module_ajaxify = util.inherit( ajaxify );

        this.is_activated = false;

        this.last_visit_time = comments_last_visit.getTime(this.settings.id);
        this.current_visit_time = comments_last_visit.getCurrentTime();

        this.updateVisitData_timer = new Timer( this.updateVisitData.bind( this ) );

        this.CommentsFolding_instance = new CommentsFolding();

        this.CommentsUpdates_instance = new CommentsUpdates( {
            element: $.find( params.element, '.comments_updates' ),
            handlers: {
                onAdd: function(id) {
                    that.CommentsTree_instance.toggleItemSpaceMod(id, 'new', true);
                },
                onRemove: function(id, is_manual) {
                    if (!is_manual) {
                        that.CommentsUpdates_instance.block(true);

                        that.CommentsTree_instance.scrollAndHighlight(id, {
                            with_animation: true
                        }, function () {
                            that.CommentsUpdates_instance.block(false);
                        });
                    }

                    that.CommentsTree_instance.toggleItemSpaceMod(id, 'new', false);
                }
            }
        } );

        this.CommentsTree_instance = new CommentsTree( {
            element: params.element,
			id: this.settings.id,
            handlers: {
                onReady: function() {
                    that.processQuery(false);
                    that.updateVisitData_timer.start( 5000 );

                    $.delegateEvent(params.element, '.comments__item__space', 'mouseover', function() {
                        that.CommentsUpdates_instance.remove($.data($.parents(this, '.comments__item'), 'id'), true);
                    });
                },
                onItemAssimilated: function(item) {
                    if (item.is_mine === false) {
                        let is_new_since_last_visit = that.last_visit_time !== null && item.date_created > that.last_visit_time;
                        let is_new_since_current_visit = that.last_visit_time === null && item.date_created > that.current_visit_time;
                        // _log(`id: ${item.id}, date: ${item.date_created}, last_visit: ${that.last_visit_time}, current_visit: ${that.current_visit_time}, since_last: ${is_new_since_last_visit}, since_current: ${is_new_since_current_visit}`);

                        if (is_new_since_last_visit || is_new_since_current_visit) {
                            that.CommentsUpdates_instance.delayedAdd(item.id);
                        }
                    }
                }
			},
            sorting_rules: {
                'best': function( item_a, item_b ) {
                    return item_b.result_rating - item_a.result_rating;
                },
                'old': function() {
                    return 0;
                }
            },
            current_sorting_rule: 'best'
	    } );

        this.CommentsModel_instance = new CommentsModel( {
			id: this.settings.id,
			author_id: this.settings.author_id,
			diff_limit: this.settings.diff_limit,
			urls: this.settings.urls,
            last_date: this.CommentsTree_instance.getLastDate(),
            items_ids: this.CommentsTree_instance.getItemsIds(),
	        handlers: {
				onAdd: function( item ) {
					that.CommentsTree_instance.addItem( item );
		        },
				onModify: function( item ) {
					that.CommentsTree_instance.modifyItem( item );
				},
				onThinking: function( state ) {
                    that.CommentsForm_instance.setWaitingState(state);
				}
			}
	    } );

        this.CommentsForm_instance = new CommentsForm( {
			id: this.settings.id,
			element: $.find(params.element, '.comments_form'),
			attach_limit: this.settings.attach_limit,
			handlers: {
			    onWantAdd: function( data ) {
					that.controlling_module.trigger( 'Comment added' );

					that.CommentsModel_instance.sendItem( {
                        text: data.text,
                        media: data.media,
                        reply_to: data.id,
                        inversion: data.inversion
                    }, function( result ) {
                        if ( result !== false ) {
                            that.CommentsForm_instance.clear();
                            that.CommentsForm_instance.storeUnsent( false );
							that.CommentsForm_instance.place( null );

							// пасхалка от Дениса
							if ( Math.random() >= 0.99 ) {
								module_notify.success( Math.random() < 0.5 ? 'Отличный комментарий, так&nbsp;держать!' : 'Нет ничего лучше х��рошего&nbsp;комментария' );
							}
						}
					} );
				},
				onWantEdit: function( data ) {
					that.controlling_module.trigger( 'Comment edited' );

					that.CommentsModel_instance.editItem( {
                        text: data.text,
                        media: data.media,
                        edited_id: data.id
                    }, function( result ) {
						if ( result !== false ) {
                            that.CommentsForm_instance.clear();
                            that.CommentsForm_instance.storeUnsent( false );
                            that.CommentsForm_instance.place( null );
						}
					} );
				},
                requireOriginalText: function(comment_id) {
                    that.CommentsForm_instance.setDisabledState(true);

                    that.CommentsModel_instance.getOriginalItem( comment_id, function( data ) {
                        that.CommentsForm_instance.setDisabledState(false);

                        if ( data ) {
                            that.CommentsForm_instance.setText( data.pure_text );
                        }
                    } );
                },
				onSubmitError: function (data) {
					module_notify.error(data.message);
				},
                beforePlaced: function(data) {
                    // У "reply" и "edit" есть айди коммента, относительно которого мы фиксируем скролл
			        that.CommentsTree_instance.setScrollAnchorId(data.id || null);
			        that.CommentsTree_instance.rememberScroll(); 
                },
                afterPlaced: function(data) {
                    that.CommentsTree_instance.restoreScroll();

			        if (metr.is_mobile && (data.mode === 'reply' || data.mode === 'edit')) {
                        that.CommentsTree_instance.scrollAndHighlight(data.id, {
                            to_bottom: true
                        });
                    }
                }
			}
	    } );

        this.module_auth_data.on( 'Change', this.CommentsForm_instance.setUserData.bind( this.CommentsForm_instance ) );

        this.module_DOM.on( 'place_form', function(data) {
            var place_options = null;

            switch (data.data.to) {
                case 'before_me':
                    place_options = {
                        mode: 'new',
                        before: data.el,
                        focus: true
                    };
                    break;

                case 'item':
                    place_options = {
                        mode: data.data.mode, // "reply" or "edit"
                        id: data.data.id,
                        before: that.CommentsTree_instance.getElementForForm(data.data.id),
                        focus: true
                    };
                    break;

                case 'restore':
                default:
                    // null
                    break;
            }

            that.CommentsForm_instance.place(place_options);
		} );

        this.module_DOM.on( 'comments_highlight_id', function( data ) {
			that.CommentsTree_instance.highlightItem( $.data( data.el, 'id' ), true );
		} );

        this.module_DOM.on( 'comments_unhighlight_id', function( data ) {
            that.CommentsTree_instance.highlightItem( $.data( data.el, 'id' ), false );
		} );

        this.module_DOM.on( 'comments_sort', function( data ) {
            that.CommentsTree_instance.sort( $.data( data.el, 'sort' ) );
		} );

        this.module_DOM.on( 'load_more', function( data ) {
            var folding_item;

            that.CommentsFolding_instance.add(data.el);

            folding_item = that.CommentsFolding_instance.get(data.el);

            folding_item.setWait(true);

            that.CommentsModel_instance.loadMore( {
                ids: folding_item.getIds(),
                with_subtree: folding_item.isWithSubtree()
            }, function(result) {
                if (result !== null) {
                    folding_item.substract(result.items.map(function(item) {
                        return item.id + '';
                    }));

                    folding_item.setCount(result.remaining_count);
                }

                folding_item.setWait(false);
            } );
		} );

        this.module_DOM.on( 'collapse_subtree', function(data) {
            that.CommentsTree_instance.collapseItemById(data.data.id, data.data.state === '1');
		} );

        this.module_ajaxify.on( 'Scroll to comments', function() {
			that.processQuery(true);
		} );

        // this.checkNewComments(this.settings.id_date_map);
    };

    Comments.prototype.updateVisitData = function() {
        comments_last_visit.setCount( this.settings.id, this.CommentsTree_instance.getLength() );
        comments_last_visit.setTime( this.settings.id );
    };

    /**
     * Обрабатывает текущий GET-запрос в урле
     */
    Comments.prototype.processQuery = function( need_animation ) {
		var query = module_location.getSearch();

        if ( query.comments ) { // если ?comments
			this.scrollToAll();
		} else if ( query.comment ) { // если ?comment={{id}}
            if (this.CommentsTree_instance.isItemHere(query.comment) || query.hard) {
                this.CommentsTree_instance.scrollAndHighlight(query.comment, {
                    with_animation: need_animation
                });

                if (query.mode !== undefined) { // если ?comment={{id}}&mode=reply/edit
                    this.CommentsForm_instance.place({
                        mode: query.mode,
                        id: query.comment,
                        before: this.CommentsTree_instance.getElementForForm(query.comment),
                        focus: true
                    });
                }
            } else {
                this.module_ajaxify.goTo(`?comment=${query.comment}&hard`);
            }
		}
	};

    Comments.prototype.scrollToAll = function() {
        this.CommentsTree_instance.scrollIntoView();
    };

    Comments.prototype.activate = function( state ) {
		if ( state !== false && this.is_activated === false ) {
			this.is_activated = true;
			this.CommentsModel_instance.update();
			this.CommentsModel_instance.listenSocket( true );
		}

        this.CommentsUpdates_instance.show(state);
	};

    Comments.prototype.destroy = function() {
        this.updateVisitData_timer.destroy();

        this.CommentsTree_instance.destroy();
        this.CommentsModel_instance.destroy();
        this.CommentsForm_instance.destroy();
        this.CommentsUpdates_instance.destroy();
        this.CommentsFolding_instance.destroy();

        this.module_auth_data.off();
        this.module_DOM.off();
        this.module_ajaxify.off();
    };

    return Comments;

} );

Air.defineClass( 'class.CommentsTree', 'module.auth_data, module.metrics, module.comments_admin, module.votes, module.DOM, module.favorite, module.date, module.andropov, class.Timer, class.Tree, lib.DOM, lib.console, lib.remember_scroll, fn.declineWord, fn.isOnScreen', function( auth_data, metr, module_comments_admin, module_votes, DOM, module_favorite, module_date, module_andropov, Timer, Tree, $, console, remember_scroll, declineWord, isOnScreen, util ) {

    var CommentsTree = function( params ) {
        var that = this;

        this.id = params.id;

        this.handlers = params.handlers;

        this.tree_instance = new Tree( {
            root_uid: '0',
            self_uid_field: 'id',
            parent_uid_field: 'reply_to'
        } );

        this.sorting_rules = this.createSortingRules( params.sorting_rules );
        this.current_sorting_rule = params.current_sorting_rule;
        this.current_scroll_anchor_id = null;

        this.render_timer = new Timer( this.render.bind( this ) );

        this.is_ready = false;

        this.elements = {
            main: params.element,
            content: $.bem.find( params.element, 'content' ),
            title: $.bem.find( params.element, 'title' ),
            title_long: $.bem.find( params.element, 'title__long' ),
			title_short: $.bem.find( params.element, 'title__short' ),
            sort_items: $.findAll( params.element, '.comments__sort .ui_tabs__tab' )
        };

        this.parseTree( this.elements.content, this.tree_instance );

        this.current_length = parseInt($.data(this.elements.title, 'count'));

        // this.updateTitle();

        // TODO: нужно ли делать это в начале?
        // Кажется, что нет
        // this.refreshRelatedModules();

        this.ready();
    };

    CommentsTree.prototype.createSortingRules = function( rules ) {
        var name,
            new_rules = {};

        for ( name in rules ) {
            new_rules[ name ] = this.createSortingRule( rules[ name ] );
        }

        return new_rules;
    };

    CommentsTree.prototype.createSortingRule = function( mainRule ) {
		return function( item_a, item_b, level ) {
            /**
             * У только что написанных комментов может быть обратная инверсия (а может и не быть),
             * у всех остальных – всегда прямая.
             * У верхней формы и формы ответа – обратные инверсии, а у нижней - прямая.
             *
             * Если хотя бы один из комментов написан только что,
             *      и у них разные инверсии,
             *          то ставим выше тот, у которого обратная инверсия (A, B);
             *      если инверсии совпадают,
             *          и если обе обратные,
             *              то ставим выше тот, который написан последним (C);
             *          а если обе прямые,
             *              то ставим выше тот, который написан раньше (D);
             *
             * Если оба коммента написаны не только что,
             *      то применяем заданное правило сортировки,
             *          а если оно вернет 0,
             *              то применяем хронологическую сортировку (E).
             */

            if (item_a.is_just_answered || item_b.is_just_answered) {
                let inversion_a = item_a.inversion || 1;
                let inversion_b = item_b.inversion || 1;

                if (inversion_a !== inversion_b) {
                    if (inversion_a === -1) {
                        return -1; // A
                    } else {
                        return 1; // B
                    }
                } else {
                    return (item_a.id - item_b.id) * inversion_a; // C, D
                }
            } else {
                return mainRule( item_a, item_b, level ) || (item_a.id - item_b.id); // E
            }

            // if (inversion_a !== inversion_b) { // ...Если ТОЛЬКО ОДИН из комментов написан через верхнюю форму...
             //    // ...то вставляем выше тот, который написан через верхнюю
             //    if (inversion_a === -1) {
             //        return -1;
             //    } else {
             //        return 1;
             //    }
            // } else if (inversion_a === -1) { // ...и ОБА написаны через верхнюю форму
             //    return item_b.id - item_a.id; // ...то вставляем выше тот, который написан последним
            // } else {
             //    // ...применяем правила описанные ниже
            // }
            //
			// if ( item_a.is_just_answered !== item_b.is_just_answered ) { // Если ТОЛЬКО ОДИН из комментов только что написан...
             //    // ...то поднимаем его наверх (но если он корневой, то, наоборот – вниз).
             //    return ( item_a.is_just_answered ? 1 : -1 ) * ( level === 1 ? 1 : -1 );
			// } else {
			// 	// Применяем некоторое правило.
			// 	// Если оно вернет 0, то сортируем хронологически.
             //    return mainRule( item_a, item_b, level ) || (item_a.id - item_b.id);
			// }
		};
	};

    CommentsTree.prototype.setScrollAnchorId = function(id) {
        this.current_scroll_anchor_id = id || null;
    };

    CommentsTree.prototype.rememberScroll = function() {
        remember_scroll.reset();

        if ( this.current_scroll_anchor_id === null ) {
			this.tree_instance.walk( function( item ) {
				if ( item.dom !== undefined ) {
                    remember_scroll.tryAnchorCandidate( item.dom.self );
				}
			} );
		} else {
            remember_scroll.setAnchor( this.tree_instance.getDataByUid( this.current_scroll_anchor_id ).dom.self );
		}
    };

    CommentsTree.prototype.restoreScroll = function() {
		remember_scroll.restore();
	};

	CommentsTree.prototype.ignoreScrollRestoreOnce = function() {
		remember_scroll.ignoreRestoreOnce();
	};

    CommentsTree.prototype.refreshRelatedModules = function() {
        module_favorite.refresh();
        module_votes.refresh();
        module_date.refresh();
		module_andropov.refresh();
        module_comments_admin.refresh();
    };

    CommentsTree.prototype.ready = function() {
        if ( this.is_ready === false ) {
			this.is_ready = true;

			$.bem.add( this.elements.main, 'ready' );

			// this.timer_setLastVisitTime.start( 5000 );

			if ( this.handlers.onReady ) {
                setTimeout( this.handlers.onReady.bind( this ), 0 );
			}
		}
    };

    CommentsTree.prototype.assimilateItem = function( item_data, item_element ) {
        /* Сработает лишь раз для каждого коммента */
        if ( item_data.is_assimilated !== true ) {
            /* Если коммент не спаршен из DOM, то генерим элемент по хтмльке */
            if ( item_element === undefined ) {
                item_element = $.parseHTML( item_data.html );
            }

            /* Запоминаем DOM-структуру */
            if ( item_data.dom === undefined ) {
                item_data.dom = {
                    item: item_element,
                    text: $.bem.find( item_element, 'text' ),
                    self: $.bem.find( item_element, 'self' ),
                    space: $.bem.find( item_element, 'space' ),
                    children: $.bem.find( item_element, 'children' ),
                    other: $.bem.find( item_element, 'other' ),
                    expand: null
                };
            }

            /* Принадлежит ли коммент текущему пользователю */
            item_data.is_mine = auth_data.isMe(item_data.user_id);

            /* Удален ли */
            item_data.is_removed = $.bem.hasMod(item_data.dom.item, 'removed');

            if ( this.handlers.onItemAssimilated ) {
                this.handlers.onItemAssimilated(item_data);
            }

            item_data.highlight_counter = 0;

            item_data.is_assimilated = true;
        }

        item_element = null;

        return item_data;
    };

    CommentsTree.prototype.collapseItemById = function( id, state ) {
        var item = this.tree_instance.getDataByUid(id),
            title,
            length;

        if (state === true) {
            // length = item.dom.children.children.length;
            // title = `${length}&nbsp;${declineWord(length, ['комментариев', 'комментарий', 'комментария'])}`;
            title = 'Развернуть ветку';

            if (item.dom.expand === null) {
                item.dom.expand = $.parseHTML(`<div class="comments__item__expand" air-click="collapse_subtree?id=${item.id}&state=0">Развернуть</div>`);

                $.append(item.dom.other, item.dom.expand);
            }

            $.html(item.dom.expand, title);
        }

        if (!isOnScreen(item.dom.self)) {
            this.scrollIntoView(id, {
                to_bottom: true
            });
        }

        this.toggleItemMod(id, 'collapsed', state);
    };

    CommentsTree.prototype.checkItemHighlight = function( id ) {
        // console.log('comm','checkItemHighlight', id);

        var item = this.tree_instance.getDataByUid( id );

        if ( item !== null && item.dom !== undefined ) {
            $.bem.toggle(item.dom.space, 'highlighted', item.highlight_counter > 0);
        }
    };

    CommentsTree.prototype.highlightItem = function( id, state, delay ) {
        var item = this.tree_instance.getDataByUid( id );

        if ( item !== null && item.dom !== undefined ) {
            item.highlight_counter += state ? 1 : -1;

            if ( item.highlight_counter < 0 ) {
                item.highlight_counter = 0;
            }

            // if ( item.highlight_timer !== null ) {
            //     clearTimeout( item.highlight_timer );
            //     item.highlight_timer = null;
            // }

            this.checkItemHighlight( id );

            if ( delay !== undefined ) {
                setTimeout( this.highlightItem.bind( this ), delay, id, !state );
            }
        }
    };

    CommentsTree.prototype.parseTree = function( parent_element, tree_instance ) {
        var that = this;

        $.walk( parent_element, function( item_element ) {
            tree_instance.add( that.assimilateItem( {
                id: $.data( item_element, 'id' ),
                reply_to: $.data( item_element, 'reply_to' ),
                user_id: $.data( item_element, 'user_id' ),
                date_created: parseInt( $.data( item_element, 'date' ) ),
                result_rating: parseFloat( $.data( item_element, 'rating' ) )
            }, item_element ) );
        }, '.comments__item' );
    };

    CommentsTree.prototype.getLastDate = function() {
        var last_date = 0;

        this.tree_instance.walk( function( item ) {
            if ( last_date < item.date_created ) {
                last_date = item.date_created;
            }
        } );

        return last_date;
    };

    CommentsTree.prototype.getItemsIds = function() {
        var ids = [];

        this.tree_instance.walk( function( item ) {
            ids.push( item.id );
        } );

        return ids;
    };

    CommentsTree.prototype.addItem = function( item ) {
        this.tree_instance.add( item );

        this.render_timer.debounce( 100 );
    };

    CommentsTree.prototype.modifyItem = function( data ) {
        var item = this.tree_instance.getDataByUid( data.id );

        if ( item !== null && item.dom !== undefined ) {
            $.html( item.dom.text, data.text );
        }
    };

    CommentsTree.prototype.calculateItemDomIndexes = function( item ) {
        item.dom_index = $.index( item.dom.item );
    };

    CommentsTree.prototype.insertTreeItemIntoDom = function( item, level, index, parent_item ) {
        var parent_element,
            prev_element;

        if ( item.dom_index !== index ) {
            parent_element = parent_item === null ? this.elements.content : parent_item.dom.children;

            if ( index === 0 ) {
                $.prepend( parent_element, item.dom.item );
            } else {
                prev_element = $.children( parent_element, '.comments__item' )[ index - 1 ];

                if ( prev_element === undefined ) {
                    $.append( parent_element, item.dom.item );
                } else {
                    $.after( prev_element, item.dom.item );
                }
            }
        }
    };

    CommentsTree.prototype.sort = function( name ) {
        this.elements.sort_items.forEach( function( item ) {
            $.bem.toggle( item, 'active', $.data( item, 'sort' ) === name );
        } );

        this.current_sorting_rule = name;

        this.render_timer.reset();

        this.render( {
            ignore_scroll_restorance: true
        } );
    };

    CommentsTree.prototype.render = function( options ) {
        var that = this;

        if ( options === undefined ) {
            options = {};
        }

        if ( options.ignore_scroll_restorance !== true && this.is_ready ) {
            this.rememberScroll();
        }

        // Сортируем виртуальное дерево.
        this.tree_instance.sort( this.sorting_rules[ this.current_sorting_rule ] );

        // Идем по виртуальному дереву,
        // создаем DOM для тех элементов, у которых его нет.
        this.tree_instance.walk( function( item_data ) {
            that.assimilateItem( item_data, item_data.dom && item_data.dom.item );
        } );

        // Вычисляем реальный индекс его DOM-элементов.
        this.tree_instance.walk( this.calculateItemDomIndexes.bind( this ) );

        // Идем по виртуальному дереву,
        // и вставляем его элементы в реальное дерево.
        this.tree_instance.walk( this.insertTreeItemIntoDom.bind( this ) );

        // Обновляем тайтл.
        this.updateTitle();

        // Рефрешим связанные модули.
        this.refreshRelatedModules();

        if ( options.ignore_scroll_restorance !== true ) {
            this.restoreScroll();
        }
    };

    CommentsTree.prototype.toggleItemMod = function( id, modifier, state ) {
        $.bem.toggle( this.tree_instance.getDataByUid( id ).dom.item, modifier, state );
	};

    CommentsTree.prototype.toggleItemSpaceMod = function( id, modifier, state ) {
        $.bem.toggle( this.tree_instance.getDataByUid( id ).dom.space, modifier, state );
	};

    // CommentsTree.prototype.appendIntoItem = function( id, element ) {
	// 	$.before( this.tree_instance.getDataByUid( id ).dom.children, element );
	// };

    CommentsTree.prototype.getElementForForm = function(id) {
        return this.tree_instance.getDataByUid( id ).dom.children;
    };

    CommentsTree.prototype.isItemHere = function(comment_id) {
        let item = this.tree_instance.getDataByUid( comment_id );

        return item !== null && item.dom !== undefined;
    };

    CommentsTree.prototype.scrollIntoView = function( comment_id, options, callback ) {
        var anchor_element = this.elements.main,
			options = options || {},
            item;

        if (metr.is_mobile) {
            options.shift = 0;
        } else {
            options.shift = -80;
        }

		if ( comment_id !== undefined ) {
            item = this.tree_instance.getDataByUid( comment_id );

            if ( item !== null && item.dom !== undefined ) {
                anchor_element = item.dom.item;

                if (metr.is_mobile) {
                    options.shift = -30;
                } else {
                    options.shift = -200;
                }

                if (options.to_bottom === true) {
                    options.shift += $.rect(item.dom.self).height;
                }
            }
		}

		DOM.scrollToElement( anchor_element, options, callback );
	};

    CommentsTree.prototype.scrollAndHighlight = function(comment_id, options, callback) {
        if (options.with_animation === true) {
            options.duration = 400;
        }

        this.scrollIntoView( comment_id, options, callback );
        this.highlightItem( comment_id, true, 2500 );
    };

    CommentsTree.prototype.setTitle = function( value ) {
		if ( this.current_length < value ) {
			$.html( this.elements.title_long, value + ' ' + declineWord( value, [ 'комментариев', 'комментарий', 'комментария' ] ) );
			$.html( this.elements.title_short, value + ' комм.' );

            this.current_length = value;
		}
	};

    CommentsTree.prototype.updateTitle = function() {
        this.setTitle( this.getLength() );
    };

    /**
     * Кол-во комментов в дереве, без учета удаленных
     */
    CommentsTree.prototype.getLength = function() {
        let tree_length = this.tree_instance.getLength(function(item_data) {
            return item_data.is_removed !== true;
        });

        return Math.max(this.current_length, tree_length);
    };

    CommentsTree.prototype.destroy = function() {
        this.tree_instance.destroy();
        this.render_timer.destroy();
    };

    return CommentsTree;

} );

Air.defineModule( 'module.live_view', 'module.date, module.metrics, lib.DOM, module.andropov', function( module_date, metr, $, andropov, util ) {
    var self = this,
        element,
        element_content,
        element_scrollable,
        default_parent,
        is_wheel_enabled = true,
        items = [],
        limit_length = 20;

    /**
     * Prevents wheel event if needed
     */
    var wheelHandler = function (e) {
		var delta = e.deltaY || e.detail || e.wheelDelta,
			prevent = false;

		if (is_wheel_enabled)  {
			if (delta < 0 && element_scrollable.scrollTop === 0) {
				prevent = true;
			} else if (delta > 0 && element_scrollable.scrollTop >= element_scrollable.scrollHeight - $.height(element_scrollable)) {
				prevent = true;
			} else {
				prevent = false;
			}

			if (prevent) {
				e.preventDefault();
				e.stopPropagation();
				return false;
			}
		}
	};

    /**
     * Sorts items from new to old
     */
    var sortByDate = function( a, b ) {
        return b.date - a.date;
    };

    /**
     * Checks if item going aboard the limit
     */
    var checkItemOverflowed = function( item, index ) {
        if ( index >= limit_length ) {
            item.is_need_to_remove = true;
        }
    };

    /**
     * Marks similar items to be removed
     */
    var checkMorePrivilegedItems = function( item ) {
        switch ( item.type ) {
            case 'comment_replied':
            case 'entry_commented':
                items.forEach( function( another_item ) {
                    if ( !isSameItems( item, another_item ) ) {
                        if ( another_item.comment_id === item.comment_id ) {
                            another_item.is_need_to_remove = true;
                        }
                    }
                } );
                break;
        }
    };

    /**
     * Returns true if item already rendered
     */
    var isItemRendered = function( item ) {
        return item.element !== null;
    };

    /**
     * Renders item
     */
    var renderItem = function( item ) {
        let is_rendered = isItemRendered( item );

        if ( item.is_need_to_remove === true ) {
            if ( is_rendered ) {
                $.remove( item.element );
            }
        } else {
            if (item.is_need_to_edit === true) {
                if ( is_rendered ) {
                    let new_element = $.parseHTML(item.edited_html);

                    $.after(item.element, new_element);
                    $.remove(item.element);

                    item.element = new_element;
                } else {
                    item.live_html = item.edited_html;
                }

                item.is_need_to_edit = false;
            }

            if (!is_rendered) {
                item.element = $.parseHTML( item.live_html );
                $.prepend( element_content, item.element );
            }
        }
    };

    /**
     * Renders current items list
     */
    var renderItems = function() {
        items.sort( sortByDate );

        items.forEach( checkItemOverflowed );

        items.forEach( checkMorePrivilegedItems );

        items.reverse().forEach( renderItem );

        module_date.refresh();

        andropov.refresh();

        items = items.filter( isItemRendered );
    };

    /**
     * Returns item hash
     */
    var getItemHash = function( item ) {
        return item.hash;
    };

    /**
     * Returns true if items are similar
     */
    var isSameItems = function( item_a, item_b ) {
        return item_a.hash === item_b.hash;
    };

    /**
     * Return all items similar to the given
     */
    var getSameItems = function( item ) {
        return items.filter( function( another_item ) {
            return isSameItems( item, another_item );
        } )
    };

    // var isItemExists = function( item ) {
    //     return items.map( getItemHash ).indexOf( item.hash ) >= 0;
    // };

    /**
     * Adds new item
     */
    var addItem = function( item ) {
        if ( item.hash && item.live_html ) {
            getSameItems( item ).forEach( removeItem );

            item.element = null;
            item.is_need_to_remove = false;
            items.push( item );
        }
    };

    /**
     * Removes item
     */
    var removeItem = function( item ) {
        item.is_need_to_remove = true;
    };

    /**
     * Returns items by given field and value
     */
    var getItemsByField = function( field, value ) {
        return items.filter( function( item ) {
            return item[ field ] === value;
        } );
    };

    /**
     * Processes given item
     */
    var processItem = function( item ) {
        switch ( item.type ) {
			case 'comment_add':
			case 'comment_replied':
			case 'comment_voted':
			case 'entry_commented':
                addItem( item );
				break;

			case 'comment_removed':
                getItemsByField( 'comment_id', item.comment_id ).forEach( removeItem );
				break;

            case 'comment_edited':
                getItemsByField('comment_id', item.comment_id).forEach(function(edited_item) {
                    edited_item.is_need_to_edit = true;
                    edited_item.edited_html = item.live_html;
                });
                break;

			default:
				util.warn( 'module.live_view: unknown item type "%s"', item.type );
		}
    };

    /**
     * Precesses new items list
     */
    self.processItems = function( new_items ) {
        new_items.forEach( processItem );
        renderItems();
    };

    /**
     * Enables/disables wheel
     */
    self.enableWheel = function( state ) {
        is_wheel_enabled = state !== false;
    };

    /**
     * Places live
     */
    self.placeIt = function( parent_element ) {
		var parent_element = parent_element || default_parent;

		if ( $.parent( element ) !== parent_element ) {
			$.append( parent_element, element );
            self.trigger( 'Placed in new place' );
		}

		/* fix for different scrollbar types */
		$.css( element_scrollable, 'padding-right', ( parent_element === default_parent ? ( 30 - metr.scrollbar_width ) : 0 ) + 'px' );
	};

	self.init = function() {
        element = $.find( '.live' );
        element_content = $.bem.find( element, 'content' );
        element_scrollable = $.bem.find( element, 'scrollable' );
        default_parent = $.parent( element );

        $.on(element, 'wheel', wheelHandler);
		$.on(element, 'DOMMouseScroll', wheelHandler);
    };

    /**
     * Refresh
     */
    self.refresh = function() {
    };

    /**
     * Destroy
     */
    self.destroy = function() {
        $.off(element);
    };
} );

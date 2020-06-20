/**
  * @class for working with set of DOM-elements and its derivative.
  *
  * @params {Object} params - {
  *   {function} create - Creating callback.
  *   {function} destroy - Creating callback.
  * }
  *
  * @callback create.
  * @param {Object} DOM-element.
  * @return {*} Arbitary derivative.
  *
  *
  * @callback destroy.
  * @param {Object} DOM-element.
  * @param {*} Arbitary derivative.
  */
Air.define( 'class.Collection', function() {

	var Collection = function( params ) {
		this.elements_list = [];
		this.created_list = [];
		this.length = 0;

		if ( params !== undefined ) {
			this.create = params.create;
	  		this.destroy = params.destroy;
			this.refresh = params.refresh;
		}
	};

	/**
  	  * Returns collection item by DOM-element.
  	  * @param {Object} element - DOM-element.
  	  * @return {Object|undefined} Collection item or nothing.
  	  */
	Collection.prototype.getByElement = function( element ) {
		var index = this.elements_list.indexOf( element );

		if ( index >= 0 ) {
			return this.created_list[ index ];
		}
	};

	/**
  	  * Checks if DOM-element already exists in collection.
  	  * @param {Object} element - DOM-element.
  	  * @return {boolean} True if exists.
  	  */
  	Collection.prototype.isExists = function( element ) {
  		return this.elements_list.indexOf( element ) >= 0;
  	};

	/**
	 * Returns collection length.
	 * @return {number}.
	 */
	Collection.prototype.getLength = function() {
		return this.length;
	};

	/**
	 * Returns collection elements.
	 * @return {Array}.
	 */
	Collection.prototype.getElements = function() {
		return this.elements_list;
	};

	/**
	 * Returns collection instances.
	 * @return {Array}.
	 */
	Collection.prototype.getInstances = function() {
		return this.created_list;
	};

	/**
  	  * Adds DOM-element to collection.
  	  * @param {Object} element - DOM-element.
  	  * @return {boolean} False if DOM-element already exists.
  	  */
  	Collection.prototype.addElement = function( element ) {
		if ( this.isExists( element ) === false ) {
			this.elements_list[ this.length ] = element;
			this.created_list[ this.length ] = this.create ? this.create( element ) : undefined;

			this.length++;

  			return true;
  		} else {
			return false;
		}
  	};

	/**
  	  * Adds several DOM-elements to collection.
  	  * @param {Array} elements - DOM-element.
  	  * @return {number} NUmber of added elements.
  	  */
	Collection.prototype.addElements = function( elements ) {
		var elements_length = elements.length,
			i,
			result = 0;

		for ( i = 0; i < elements_length; i++ ) {
			if ( this.addElement( elements[ i ] ) ) {
				result++;
			}
		}

		return result;
  	};

	/**
  	  * Runs each collection item.
  	  * @param {function} iterator - DOM-element.
  	  *
  	  * @callback iterator.
  	  * @param {Object} DOM-element.
  	  * @param {*} Arbitary derivative.
  	  * @param {number} Item index.
  	  * @param {number} Collection length.
  	  */
  	Collection.prototype.each = function( iterator ) {
  		var i;

  		for ( i = 0; i < this.length; i++ ) {
  			if ( iterator( this.elements_list[ i ], this.created_list[ i ], i, this.length ) === null ) {
  				break;
  			}
  		}
  	};

	/**
  	  * Returns @iterator result for item by @index.
  	  * @param {number} index - collection item index.
  	  * @param {function} iterator - DOM-element.
  	  *
  	  * @callback iterator.
  	  * @param {Object} DOM-element.
  	  * @param {*} Arbitary derivative.
  	  * @param {number} Item index.
  	  * @param {number} Collection length.
  	  */
  	Collection.prototype.eq = function( index, iterator ) {
  		return iterator( this.elements_list[ index ], this.created_list[ index ], index, this.length );
  	};

	/**
  	  * Returns map of collection items.
  	  * @param {function} iterator - DOM-element.
  	  *
  	  * @callback iterator.
  	  * @param {Object} DOM-element.
  	  * @param {*} Arbitary derivative.
  	  * @param {number} Item index.
  	  * @param {number} Collection length.
  	  */
	Collection.prototype.map = function( iterator ) {
		var i,
			result = [];

		for ( i = 0; i < this.length; i++ ) {
			result[ i ] = iterator( this.elements_list[ i ], this.created_list[ i ], i, this.length );
		}

		return result;
	};

	/**
  	  * Returns AND-result of applying iterator to collection items.
  	  * @param {function} iterator - DOM-element.
  	  *
  	  * @callback iterator.
  	  * @param {Object} DOM-element.
  	  * @param {*} Arbitary derivative.
  	  * @param {number} Item index.
  	  * @param {number} Collection length.
  	  */
	Collection.prototype.every = function( iterator ) {
		var i;

		for ( i = 0; i < this.length; i++ ) {
			if ( iterator( this.elements_list[ i ], this.created_list[ i ], i, this.length ) !== true ) {
				return false;
			}
		}

		return true;
	};

	/**
  	  * Returns OR-result of applying iterator to collection items.
  	  * @param {function} iterator - DOM-element.
  	  *
  	  * @callback iterator.
  	  * @param {Object} DOM-element.
  	  * @param {*} Arbitary derivative.
  	  * @param {number} Item index.
  	  * @param {number} Collection length.
  	  */
	Collection.prototype.some = function( iterator ) {
		var i;

		for ( i = 0; i < this.length; i++ ) {
			if ( iterator( this.elements_list[ i ], this.created_list[ i ], i, this.length ) === true ) {
				return true;
			}
		}

		return false;
	};

	/**
  	  * Reduce through collection items.
  	  * @param {function} iterator - DOM-element.
  	  *
  	  * @callback iterator.
  	  * @param {*} Arbitary value.
  	  * @param {Object} DOM-element.
  	  * @param {*} Arbitary derivative.
  	  * @param {number} Item index.
  	  * @param {number} Collection length.
  	  */
	Collection.prototype.reduce = function( iterator, current_value ) {
		var i;

		for ( i = 0; i < this.length; i++ ) {
			current_value = iterator( current_value, this.elements_list[ i ], this.created_list[ i ], i, this.length );
		}

		return current_value;
	};

	/**
  	  * Removes DOM-element from collection.
  	  * @param {Object} element - DOM-element.
  	  * @return {boolean} False if DOM-element doesn't exists.
  	  */
  	Collection.prototype.removeElement = function( element ) {
  		var i;

  		for ( i = 0; i < this.length; i++ ) {
  			if ( element === this.elements_list[ i ] ) {
				if ( this.destroy !== undefined ) {
					this.destroy( this.elements_list[ i ], this.created_list[ i ] );
				}

  				this.elements_list.splice( i, 1 );
				this.created_list.splice( i, 1 );

  				this.length--;

  				return true;
  			}
  		}

  		return false;
  	};

	/**
  	  * Removes several DOM-elements from collection.
  	  * @param {Array} elements - DOM-element.
  	  * @return {number} Number of removed elements.
  	  */
	Collection.prototype.removeElements = function( elements ) {
		var elements_length = elements.length,
			i,
			result = 0;

		for ( i = 0; i < elements_length; i++ ) {
			if ( this.removeElement( elements[ i ] ) ) {
				result++;
			}
		}

		return result;
  	};

	/**
  	  * Removes all DOM-elements from collection.
  	  * @return {boolean} True if any DOM-element has been removed.
  	  */
  	Collection.prototype.clear = function() {
  		var i,
  			result = false;

  		for ( i = 0; i < this.length; i++ ) {
  			if ( this.destroy !== undefined ) {
				this.destroy( this.elements_list[ i ], this.created_list[ i ] );
			}

  			result = true;
  		}

  		this.elements_list = [];
		this.created_list = [];
  		this.length = 0;

  		return result;
  	};

	/**
  	  * Applies any method to collection items by CSS-selector.
  	  * @param {string} action_name - method name.
  	  * @param {string} selector - CSS-selector.
  	  * @return {number} Number of proceeded DOM-elements.
  	  */
  	Collection.prototype.makeAction = function( action_name, selector ) {
  		var elements = document.querySelectorAll( selector ),
  			elements_length = elements.length,
  			i,
  			result;

  		for ( i = 0; i < elements_length; i++ ) {
  			if ( this[ action_name ]( elements[ i ] ) === true ) {
  				result++;
  			}
  		}

  		return result;
  	};

	/**
  	  * Adds DOM-element to collection by CSS-selector.
  	  * @param {string} selector - CSS-selector.
  	  * @return {number} Number of added DOM-elements.
  	  */
  	Collection.prototype.add = function( selector ) {
  		return this.makeAction( 'addElement', selector );
  	};

	/**
  	  * Removes DOM-element from collection by CSS-selector.
  	  * @param {string} selector - CSS-selector.
  	  * @return {number} Number of removed DOM-elements.
  	  */
  	Collection.prototype.remove = function( selector ) {
  		return this.makeAction( 'removeElement', selector );
  	};

	/**
  	  * Remove all DOM-elements from collection and adds new by CSS-selector.
  	  * @param {string} selector - CSS-selector.
  	  * @return {number} Number of added DOM-elements.
  	  */
  	Collection.prototype.replace = function( selector ) {
  		this.clear();
  		return this.add( selector );
  	};

	/**
  	  * Returns collection items conform to the @rule.
  	  * @param {function} rule - sieving function.
  	  * @return {Aray} thinned items.
  	  *
  	  * @callback rule.
  	  * @param {Object} DOM-element.
  	  * @param {Object} DOM-element derivative.
  	  * @return {boolean} True if collection item must be in result.
  	  */
  	Collection.prototype.filterByRule = function( rule, is_reverse ) {
  		var i,
  			result = [],
			result_length = 0;

  		for ( i = 0; i < this.length; i++ ) {
  			if ( rule( this.elements_list[ i ], this.created_list[ i ], i, this.length ) === ( is_reverse !== true ) ) {
  				result[ result_length++ ] = {
					element: this.elements_list[ i ],
					created: this.created_list[ i ],
					index: i
				};
  			}
  		}

  		return result;
  	};

	/**
  	  * Removes collection items by sieving function.
  	  * @param {function} rule - sieving function.
  	  * @return {number} Number of sifted elements.
  	  *
  	  * @callback rule.
  	  * @param {Object} DOM-element.
  	  * @param {Object} DOM-element derivative.
  	  * @return {boolean} True if collection item must be removed.
  	  */
  	Collection.prototype.removeByRule = function( rule, is_reverse ) {
		var thinned = this.filterByRule( rule, is_reverse ).reverse(),
			thinned_length = thinned.length,
			i,
			item,
			new_index;

		for ( i = thinned_length - 1; i >= 0; i-- ) {
			item = thinned[ i ];

			if ( this.destroy !== undefined ) {
				this.destroy( this.elements_list[ item.index ], this.created_list[ item.index ] );
			}
		}

		for ( i = thinned_length - 1; i >= 0; i-- ) {
			new_index = this.elements_list.indexOf( thinned[ i ].element );

			this.elements_list.splice( new_index, 1 );
			this.created_list.splice( new_index, 1 );
		}

		this.length -= thinned_length;

		return thinned_length;
  	};

	/**
	 * Returns true if DOM-element exists on the page.
	 * @param  {Object} element - DOM-element.
	 * @return {Boolean} True if exists.
	 */
	Collection.prototype.isElementExists = function( element ) {
		return document.body.contains( element );
	};

	/**
  	  * Removes collection items which are no longer exist and add new by selector.
  	  * @param {string} selector.
  	  */
	Collection.prototype.update = function( selector ) {
		this.removeByRule( this.isElementExists, true );

		if ( this.refresh !== undefined ) {
			this.each( this.refreshItem.bind( this ) );
		}

		this.add( selector );
	};

	Collection.prototype.refreshItem = function( element, instance, i ) {
		var result = this.refresh( element, instance );

		if ( result !== undefined ) {
			this.created_list[ i ] = result;
		}
	};

	return Collection;
} );

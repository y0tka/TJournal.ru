Air.defineLib( 'lib.ratings', {

    /**
     * Calculates Wilson lower bound.
     * https://en.wikipedia.org/wiki/Binomial_proportion_confidence_interval#Wilson_score_interval
     */
    wilsonLowerBound: function( plus, minus ) {
		var n = plus + minus,
			z = 1.959,
			z_2 = z * z,
			p,
			value;

		if ( n > 0 ) {
			p = plus / n;

			if ( p === 0 ) {
				return 0;
			} else {
				value = ( 2 * n * p + z_2 - ( z * Math.sqrt( z_2 - 1 / n + 4 * n * p * ( 1 - p ) + ( 4 * p - 2 ) ) + 1 ) ) / ( 2 * ( n + z_2 ) );

				return Math.max( 0, value );
			}
		} else {
			return 0;
		}
	},

    /**
	 * Sum of probabilities
	 * @param  {Number} a
	 * @param  {Number} b
	 * @return {Number}
	 */
	sum: function( a, b ) {
		return a + b - a * b;
	},

    hotness: function( t, T ) {
		return 1 / ( 1 + Math.log( 1 + ( Math.E - 1 ) * t / T ) );
		// return 1 / ( 1 + Math.sqrt( t / T ) );
		// return Math.exp( -Math.log( 2 ) * t / T );
	},

    calculateOne: function( plus, minus ) {
        return this.wilsonLowerBound( plus + 1, minus + 1 ) - this.wilsonLowerBound( 1, 1 );
    },

    calculate: function( tree_instance, items, children_weight ) {
		var that = this,
			id,
			child_id;

		tree_instance.each( function( item ) {
			if ( item.is_removed ) {
                item.rating.self = that.calculateOne( 0, 100 );
			} else {
				item.rating.self = that.calculateOne( item.rating.plus, item.rating.minus );
			}

            item.rating.result = item.rating.self;

            if ( item.rating.result >= 0 ) { // не прибавлять дочерний рейтинг заминусованным коментам
                for ( child_id in items ) {
					if ( items[ child_id ].parent_id === item.id ) {
						if ( items[ child_id ].rating.result > 0 ) { // прибавлять дочерний рейтинг, только если он больше дефолтного
							item.rating.result = that.sum( item.rating.result, items[ child_id ].rating.result * children_weight );
						}
					}
				}
			}
		}, true );
	}
} );

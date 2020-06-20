Air.defineLib( 'lib.remember_scroll', 'module.metrics, lib.DOM', function( metr, $ ) {

    return {

        anchor_element: null,

        last_anchor_y: null,

        min_y_diff: 100000,

        ignore_once: false,

        reset: function() {
            this.anchor_element = null;
            this.last_anchor_y = null;
            this.min_y_diff = 100000;
            this.ignore_once = false;
        },

        tryAnchorCandidate: function( element ) {
            var aim_y = this.getRectCenter( 0, metr.window_height ),
                y = this.getElementCenterY( element ),
                diff = Math.abs( y - aim_y );

            if ( this.min_y_diff > diff ) {
                this.min_y_diff = diff;

                this.setAnchor( element );
            }
        },

        setAnchor: function( element ) {
            this.anchor_element = element;
            this.last_anchor_y = this.getElementCenterY( element );
        },

        getRectCenter: function( top, height ) {
            return top + height * 0.5;
        },

        getElementCenterY: function( element ) {
    		var rect = $.rect( element );

            return this.getRectCenter( rect.top, rect.height );
    	},

        restore: function() {
            if ( this.ignore_once === false && this.anchor_element !== null ) {
                window.scrollBy( 0, this.getElementCenterY( this.anchor_element ) - this.last_anchor_y );
            }

            this.ignore_once = false;
        },

        ignoreRestoreOnce: function() {
            this.ignore_once = true;
        }

    };

} );

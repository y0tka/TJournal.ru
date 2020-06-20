Air.defineClass( 'class.Tree', function() {

    var Tree = function( params ) {
        this.params = params || {};
        this.tree = this.createKnot( null );
        this.length = 0;
    };

    Tree.prototype.createKnot = function( data ) {
        return {
            uid: data === null ? this.params.root_uid : data[ this.params.self_uid_field ],
            parent_uid: data === null ? null : data[ this.params.parent_uid_field ],
            level: 0,
            data: data,
            children: [],
            children_length: 0
        };
    };

    Tree.prototype.add = function( data ) {
        var that = this,
            new_knot = this.createKnot( data );

        this.walkKnots( function( current_knot ) {
            if ( current_knot.uid == new_knot.parent_uid ) {
                current_knot.children[ current_knot.children_length++ ] = new_knot;

                new_knot.level = current_knot.level + 1;

                that.length++;

                return null;
            }
        } );
    };

    Tree.prototype.sort = function( sortingFunction ) {
        var that = this;

        function sortingKnotFunction( knot_a, knot_b ) {
            return sortingFunction( knot_a.data, knot_b.data, knot_a.level );
        };

        this.walkKnots( function( knot ) {
            knot.children.sort( sortingKnotFunction );
        } );
    };

    Tree.prototype.walkKnots = function( iterator, knot, level, index, parent_knot ) {
        var i;

        if ( knot === undefined ) {
            knot = this.tree;
        }

        if ( level === undefined ) {
            level = 0;
        }

        if ( index === undefined ) {
            index = 0;
        }

        if ( parent_knot === undefined ) {
            parent_knot = null;
        }

        if ( iterator( knot, level, index, parent_knot ) === null ) {
            return null;
        }

        for ( i = 0; i < knot.children_length; i++ ) {
            if ( this.walkKnots( iterator, knot.children[ i ], level + 1, i, knot ) === null ) {
                return null;
            }
        }
    };

    Tree.prototype.walk = function( iterator ) {
        return this.walkKnots( function( knot, level, index, parent_knot ) {
            if ( knot.data !== null ) {
                return iterator( knot.data, level, index, parent_knot.data );
            }
        } );
    };

    Tree.prototype.getDataByUid = function( uid ) {
        var data = null;

        this.walkKnots( function( knot ) {
            if ( knot !== null && knot.uid == uid ) {
                data = knot.data;
                return null;
            }
        } );

        return data;
    };

    Tree.prototype.getLength = function(condition) {
        if (condition === undefined) {
            return this.length;
        } else {
            let length = 0;

            this.walk(function(data) {
                if (condition(data) !== false) {
                    length++;
                }
            });

            return length;
        }
    };

    Tree.prototype.destroy = function() {

    };

    return Tree;

} );

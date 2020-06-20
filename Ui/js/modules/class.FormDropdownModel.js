/**
 * TODO: check destroy
 */
Air.defineClass( 'class.FormDropdownModel', 'module.smart_ajax', function( smart_ajax, util ) {

    var DropdownModel = function( params, handlers ) {
        this.init( params, handlers );
    };

    DropdownModel.prototype.init = function( params, handlers ) {
        this.local_items = params.items || [];
        this.limit = params.limit || 1;
        this.primary_key = params.primary_key || 'id';
        this.search_by = params.search_by || null;
        this.search_url = params.search_url || null;
        this.get_url = params.get_url || null;
        this.last_found_items = [];
        this.last_search_value = null;

        this.handlers = handlers || {};

        this.original_keys = [];
    };

    DropdownModel.prototype.destroy = function() {
    };

    DropdownModel.prototype.keysToInt = function( keys ) {
        return keys.map( function( key ) {
            return parseInt( key );
        } );
    };

    DropdownModel.prototype.getLocalItemsByPk = function( keys, callback ) {
        var that = this,
            local_items;

        local_items = this.local_items.filter( function( item ) {
            return keys.indexOf( item[ that.primary_key ] ) >= 0;
        } );

        callback( local_items );
    };

    DropdownModel.prototype.getItemsWithAjax = function( keys, callback ) {
        if ( this.get_url !== null ) {
            smart_ajax.get( {
                url: this.get_url,
                cache: true,
                data: {
                    'ids': keys ? keys.join(',') : '',
                    'raw': true
                },
                success: function( data ) {
                    callback( data );
                },
                error: function( error ) {
                    callback( [] );
                }
            } );
        } else {
            callback( [] );
        }
    };

    DropdownModel.prototype.getAllItems = function( callback ) {
        var that = this;

        this.getItemsWithAjax( null, function( gotten_items ) {

            callback( gotten_items.concat( that.local_items ) );

        } );
    };

    DropdownModel.prototype.getItemsByPk = function( keys, callback ) {
        var that = this;

        keys = this.keysToInt( keys );

        this.getLocalItemsByPk( keys, function( local_items ) {

            keys = that.weedOutLocalPk( keys );

            if ( keys.length > 0 ) {

                that.getItemsWithAjax( keys, function( gotten_items ) {

                    callback( gotten_items.concat( local_items ) );

                } );

            } else {

                callback( local_items );

            }

        } );
    };

    DropdownModel.prototype.setOriginalPk = function( keys ) {
        var keys_length;

        keys = util.unique( keys );

        keys_length = keys.length

        if ( keys_length > this.limit ) {
            this.handlers.originalPkRemoved( keys.splice( 0, keys_length - this.limit ) );
        }

        this.original_keys = keys;

        this.handlers.originalPkChanged( this.original_keys );
    };

    DropdownModel.prototype.addOriginalPk = function( primary_key ) {
        this.setOriginalPk( this.original_keys.concat( [ primary_key ] ) );
    };

    DropdownModel.prototype.updateOriginalPk = function() {
        this.setOriginalPk( this.original_keys );
    };

    DropdownModel.prototype.weedOutPermanentItems = function( items ) {
        return items.filter( function( item ) {
            return item.is_permanent !== true;
        } );
    };

    DropdownModel.prototype.weedOutLocalPk = function( keys ) {
        var that = this;

        return keys.filter( function( key ) {
            return that.local_items.every( function( item ) {
                return item[ that.primary_key ] !== key;
            } );
        } );
    };

    DropdownModel.prototype.isSearchAvailable = function() {
        return ( this.search_url !== null ) || ( this.search_by !== null && this.search_by[ 0 ] !== undefined );
    };

    DropdownModel.prototype.searchInItems = function( items, search_value, callback ) {
        var that = this;

        if ( search_value.length > 0 ) {
            search_value = search_value.toLowerCase();

            if ( that.search_by !== null ) {
                callback( items.filter( function( item ) {
                    return that.search_by.some( function( search_field ) {
                        return item[ search_field ].toLowerCase().indexOf( search_value ) >= 0;
                    } );
                } ) );
            } else {
                callback( items );
            }

        } else {
            callback( items );
        }
    };

    DropdownModel.prototype.searchItemsWithAjax = function( search_value, callback ) {
        smart_ajax.get( {
            url: this.search_url,
            cache: true,
            data: {
                'query': search_value,
                'raw': true
            },
            success: function( data ) {
                callback( data );
            },
            error: function( error ) {
                callback( [] );
            }
        } );
    };

    DropdownModel.prototype.searchAllItems = function( search_value, callback ) {
        var that = this;

        this.searchInItems( this.local_items, search_value, function( found_local_items ) {
            if ( that.search_url !== null ) {
                that.searchItemsWithAjax( search_value, function( found_ajax_items ) {
                    callback( found_ajax_items.concat( found_local_items ) )
                } );
            } else {
                callback( found_local_items );
            }
        } );
    };

    DropdownModel.prototype.getItemsBySearch = function( search_value, callback ) {
        var that = this;

        this.last_search_value = search_value;

        this.searchAllItems( search_value, function( items ) {
            that.last_found_items = items;

            callback( items );
        } );
    };

    DropdownModel.prototype.getPkInLastFound = function( search_value, callback ) {
        var that = this;

        if ( search_value.length > 0 && this.last_found_items.length === 1 ) {
            this.searchInItems( this.last_found_items, search_value, function( found_items ) {
                if ( found_items[ 0 ] !== undefined && found_items[ 0 ].is_permanent !== true ) {
                    callback( found_items[ 0 ][ that.primary_key ] );
                } else {
                    callback( null );
                }
            } );
        } else {
            callback( null );
        }
    };

    return DropdownModel;

} );

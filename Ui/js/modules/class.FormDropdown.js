/**
 * TODO: check destroy
 */
Air.defineClass( 'class.FormDropdown', 'class.FormDropdownModel, class.FormDropdownView, lib.string', function( DropdownModel, DropdownView, lib_string ) {

    var Dropdown = function( params, handlers ) {
       this.init( params, handlers );
    };

    Dropdown.prototype.init = function( params, handlers ) {
        var that = this;

        this.validate = params.validate || {};

        this.model = new DropdownModel( params, {
           originalPkChanged: function( keys ) {
            //    _log('B',keys);
               that.view.setOriginalValue( keys.join( ',' ) );

               that.model.getItemsByPk( keys, function( items ) {
                   // Не нужно селектить permanent_item, если он не указан явно
                   if ( keys.length === 0 ) {
                       items = that.model.weedOutPermanentItems( items );
                   }

                   that.view.renderSelectedItems( items );
                   that.view.renderSelectedOuterItems( that.model.weedOutPermanentItems( items ) );
                   that.view.fillSearch( items );

                   if ( handlers.onChangeItems ) {
                       handlers.onChangeItems( items );
                   }
               } );

               that.view.setFocus( false );

               if ( handlers.onChange ) {
                   handlers.onChange( keys );
               }
           },
           originalPkRemoved: function( keys ) {
           }
        } );

        this.view = new DropdownView( params, {
            searchTextChanged: function( search_text ) {
                if ( that.model.isSearchAvailable() ) {
                    that.model.getItemsBySearch( search_text, function( items ) {
                    that.view.renderFoundItems( items, search_text );
                } );
            }
           },
           foundPkChosen: function( key ) {
               that.model.addOriginalPk( key );
           },
           focused: function( state ) {
               if ( state === false && that.model.isSearchAvailable() ) {
                   that.model.getPkInLastFound( that.view.getSearchText(), function( key ) {
                       if ( key !== null ) {
                           that.model.addOriginalPk( key );
                       } else {
                        //    that.model.updateOriginalPk();
                       }
                   } );
               }
           }
        } );

        this.model.getAllItems( function( items ) {
            // _log('A', items);
           that.view.renderFoundItems( items );
        } );

        this.model.setOriginalPk( lib_string.listToArray( this.view.getOriginalValue() ) );
    };

    Dropdown.prototype.destroy = function() {
       this.model.destroy();
       this.view.destroy();
    };

    // Если количество выбранных элементов не меньше указанного.
    Dropdown.prototype.isValid = function() {
        var value = lib_string.listToArray( this.view.getOriginalValue() ),
            result = true;

        if ( this.validate.min !== undefined ) {
            result = value.length >= this.validate.min;
        }

        return result;
    };

    Dropdown.prototype.getLastSearchValue = function() {
        return this.model.last_search_value;
    };

    return Dropdown;

} );

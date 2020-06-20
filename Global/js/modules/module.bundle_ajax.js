/**
 * Бандл состоит из подзапросов (подзапрос, например, может запрашивать числа для голосоваок).
 * Подзапрос может запрашивать данные для нескольких айтемов сразу (айтемом может быть, например, конкретная голосовалка).
 * rid - идентификатор подзапроса.
 * uid - идентификатор айтема в подзапросе.
 */
Air.defineModule( 'module.bundle_ajax', 'class.Timer, lib.ajax', function( Timer, ajax, util ) {
    var self = this,
        current_buffer,
        flushing_buffer,
        current_status,
        timer_flush;

    self.flush = function( callback ) {
        if ( current_status === 'buffering' ) {
            current_status = 'flushing';
            flushing_buffer = current_buffer;
            current_buffer = [];

            ajax.post( {
                url: '/request/bundle?f=' + formName( flushing_buffer ),
                data: {
                    requests: bufferToServerFormat( flushing_buffer ),
                    mode: 'raw'
                },
                dataType: 'json',
                success: function( response ) {
                    switch ( response.rc ) {
                        case 200:
                            processBuffer( flushing_buffer, response.data );
                            break;

                        default:
                            processBuffer( flushing_buffer, false );
                    }

                    current_status = 'buffering';
                    flushing_buffer = [];
                },
                error: function( error ) {
                    processBuffer( flushing_buffer, false );

                    current_status = 'buffering';
                    flushing_buffer = [];
                }
            } );
        } else {
            timer_flush.debounce( 100 );
        }
    };

    var formName = function( buffer ) {
        return buffer.map( function( buffer_item ) {
            return buffer_item.url.replace( /\//g, '.' ) + '.' + buffer_item.items.length;
        } ).join( '.' );
    };

    var bufferToServerFormat = function( buffer ) {
        return buffer.map( function( buffer_item ) {
            var sended_data = {};

            buffer_item.items.forEach( function( item ) {
                if ( item.item !== undefined ) {
                    sended_data[ item.uid ] = item.item;
                }
            } );

            return JSON.stringify( {
                rid: buffer_item.rid,
                method: buffer_item.type,
                uri: buffer_item.url,
                parameters: {
                    items: sended_data,
                    mode: 'raw'
                }
            } );
        } );
    };

    var processBuffer = function( buffer, responses ) {
        var buffer_length = buffer.length,
            responses_length = responses ? responses.length : 0,
            response,
            i,
            j;

        if ( responses && responses_length > 0 ) {
            for ( i = 0; i < buffer_length; i++ ) {
                for ( j = 0; j < responses_length; j++ ) {
                     if ( buffer[ i ].rid == responses[ j ].rid ) {
                         response = responses[ j ].result;

                         if ( response.rc === 200 ) {
                             buffer[ i ].items.forEach( function( item ) {
                                 if ( item.item ) {
                                     if ( response.data[ item.uid ] || ( response.data[ item.uid ] === false ) ) {
                                         item.callback( response.data[ item.uid ] );
                                     } else {
                                         console.warn('Wrong bundle subresponse data: RID=%s, UID=%s', buffer[ i ].rid, item.uid );
                                         item.callback( null, 'wrong bundle subresponse data' );
                                     }
                                 } else {
                                     item.callback( response.data );
                                 }
                             } );
                         } else {
                             buffer[ i ].items.forEach( function( item ) {
                                 console.warn('Wrong bundle subresponse (code ' + response.rc + '): RID=%s, UID=%s', buffer[ i ].rid, item.uid );
                                 item.callback( null, 'wrong bundle subresponse (code ' + response.rc + ')' );
                             } );
                         }
                     }
                }
            }
        } else {
            for ( i = 0; i < buffer_length; i++ ) {
                buffer[ i ].items.forEach( function( item ) {
                    item.callback( null, 'wrong bundle response' );
                } );
            }
        }
    };

    var cancelBuffer = function( buffer, uid ) {
        var buffer_length = buffer.length,
            i,
            thinned_out_indexes = [];

        for ( i = 0; i < buffer_length; i++ ) {
            buffer[ i ].items = buffer[ i ].items.filter( function( item ) {
                return item.uid !== uid;
            } );

            if ( buffer[ i ].items.length === 0 ) {
                thinned_out_indexes.unshift( i );
            }
        }

        thinned_out_indexes.forEach( function( index ) {
            buffer.splice( index, 1 );
        } );
    };

    self.cancel = function( uid ) {
        cancelBuffer( current_buffer, uid );
        cancelBuffer( flushing_buffer, uid );
    };

    self.request = function( uid, type, url, item, callback ) {
        var current_buffer_length = current_buffer.length,
            i,
            buffer_item_queue,
            is_exists = false;

        for ( i = 0; i < current_buffer_length; i++ ) {
            if ( current_buffer[ i ].url === url ) {
                is_exists = true;
                break;
            }
        }

        if ( is_exists !== true ) {
            current_buffer.push( {
                rid: util.uid(),
                type: type,
                url: url,
                items: [ {
                    uid: uid,
                    item: item,
                    callback: callback
                } ]
            } );
        } else {
            current_buffer[ i ].items.push( {
                uid: uid,
                item: item,
                callback: callback
            } );
        }

        /* ARTEM, поменяли, чтобы бандлов было 2, а не 3 */
        timer_flush.debounce( 300 );
    };

    self.post = function( uid, url, item, callback ) {
        self.request( uid, 'post', url, item, callback );
    };

    self.get = function( uid, url, item, callback ) {
        self.request( uid, 'get', url, item, callback );
    };

    self.init = function() {
        current_buffer = [];
        flushing_buffer = [];
        current_status = 'buffering';
        timer_flush = new Timer( self.flush.bind( self ) );
    };

    self.refresh = function() {

    };

    self.destroy = function() {

    };
} );

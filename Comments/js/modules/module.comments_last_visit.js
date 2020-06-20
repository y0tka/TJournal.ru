Air.defineModule( 'module.comments_last_visit', 'lib.storage', function( storage ) {
    var self = this;

    var prefixes = {
        time: 'comments_last_visit_',
        count: 'comments_last_count_'
    };

    var tryChance = function( p, callback ) {
        if ( p >= Math.random() ) {
            callback();
        }
    };

    self.clearOldItems = function() {
        console.groupCollapsed('clearOldItems');
        console.time('clearOldItems');
        storage.each( function( key ) {
            var key_age;
            _log('check key %s', key);
            if ( key && (key.indexOf( prefixes.time ) >= 0) ) {
                key_age = ( Date.now() / 1000 - storage.get( key ) ) / (60 * 60 * 24);
                _log('%s age %s days', key, key_age);
                if ( key_age > 30 ) {
                    _log('remove %s and %s', key, key.replace( prefixes.time, prefixes.count ));
                    storage.remove( key );
                    storage.remove( key.replace( prefixes.time, prefixes.count ) );
                }
            }
        } );
        console.timeEnd('clearOldItems');
        console.groupEnd('clearOldItems');
    };

    /**
     * Last visit time
     */
    self.getTime = function( id ) {
        var time = storage.get( prefixes.time + id );

        if ( time ) {
            return parseInt( time );
        } else {
            return null;
        }
    };

    self.getCurrentTime = function() {
        return Math.round( Date.now() / 1000 );
    };

    self.setTime = function( id ) {
        storage.set( prefixes.time + id, self.getCurrentTime() );
    };

    /**
     * Last visit count
     */
     self.isThereCount = function( id ) {
         return storage.get( prefixes.count + id ) !== null;
     };

    self.getCount = function( id ) {
        return parseInt( storage.get( prefixes.count + id ) || 0 );
    };

    self.setCount = function( id, value ) {
        storage.set( prefixes.count + id, value );
    };

    self.init = function() {
        /**
         * Очищать старые записи в среднем в 1 разе из 20.
         * https://en.wikipedia.org/wiki/Negative_binomial_distribution
         */
        tryChance( 1 / 20, self.clearOldItems );
    };
} );

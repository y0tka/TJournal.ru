/**
  * @module for working with document location.
  *
  * TODO:
  * – переход стрелочками, когда урл содержит хеш.
  */
Air.define( 'module.location', 'lib.string, fn.parseQuery, fn.parseUrl', function(lib_string, parseQuery, parseUrl) {
	var self = this,
		loc = {},
		is_unajax_next = false,
		action_source = 'browser',
        timeline = [],
        dont_trigger_url_changed_next_time = false;

    self.addToTimeline = function(value) {
        timeline.push(value);
    };

    self.getFromTimeline = function(index) {
        if (index < 0) {
            index = timeline.length + index;
        }

        return timeline[index];
    };

	/**
	 * Returns current path.
	 * @return {string}.
	 */
	self.getPath = function() {
		return '/' + this.getPathComponents().join('/');
	};

	/**
	 * Returns current path.
	 * @return {string}.
	 */
	self.getFullPath = function() {
		return this.getPath() + location.search;
	};

	/**
	 * Returns current path components.
	 * @return {Array}.
	 */
	self.getPathComponents = function() {
		return location.pathname.split('/').filter(lib_string.isNotEmpty);
	};

	/**
	 * Returns get params.
	 * @return {Object}.
	 */
	self.getSearch = function() {
		return parseQuery(location.search.substring(1));
	};

	/**
	 * Returns hash.
	 * @return {Object}.
	 */
	self.getHash = function() {
		return location.hash.substr(1);
	};

	/**
	 * Returns hash as key-value pair.
	 * @return {Object}.
	 */
	self.getHashData = function() {
		var hash = this.getHash(),
			result = {};

		hash = hash.split('-');

		if (hash[ 0 ]) {
			result[hash[0]] = hash[1] || true;
		}

		return result;
	};

	/**
	 * Returns current hostname.
	 * @return {string}.
	 */
	self.getHostname = function() {
		return location.hostname;
	};

	/**
	 * Disables AJAX on the next goTo
	 */
	self.unajaxNext = function() {
		is_unajax_next = true;
	};

	/**
	 * Changes current URL.
	 * @param {string} url - URL to go.
	 */
	self.goTo = function(url, without_history) {
		var parsed_url = parseUrl(url);

		action_source = 'user';

        if (is_unajax_next === true) {
            self.goToHard(parsed_url.path);
        } else {
            if (parsed_url.full_path === self.getFullPath()) {
                stateChangeHandler();
            }

            if (without_history === true) {
                History.replaceState(null, document.title, parsed_url.full_path);
            } else {
                History.pushState(null, document.title, parsed_url.full_path);
            }
        }
	};

    self.restorePrevious = function() {
        var previous_url = self.getFromTimeline(-2);

        if (previous_url !== undefined) {
            self.replace(previous_url);
        }
    };

	self.forward = function() {
		History.forward();
	};

	self.back = function() {
		History.back();
	};

	self.replace = function(url, without_history) {
		dont_trigger_url_changed_next_time = true;

        if (without_history === true) {
            History.replaceState(null, document.title, url);
        } else {
            History.pushState(null, document.title, url);
        }
	};

	/**
	 * Changes URL in a hard way.
	 * @param {string} url - URL to go.
	 */
	self.goToHard = function( url ) {
		self.restorePrevious();
		location.href = url;
	};

	self.setHash = function( hash ) {
		location.hash = hash;
	};

	// self.retriveHashFromUrl = function( url ) {
	// 	var hash = '',
	// 		index = url.indexOf( '#' );
    //
	// 	if ( index >= 0 ) {
	// 		hash = url.substr( index + 1 );
	// 	}
    //
	// 	return hash;
	// };

	self.isSameWithoutHash = function( url ) {
		var url_without_host = url.split( location.hostname );

		if ( url_without_host.length === 1 ) {
			url_without_host = url_without_host[ 0 ];
		} else {
			url_without_host = url_without_host[ 1 ];
		}

		return self.getPath() === url_without_host.split( '#' )[ 0 ];
	};

	self.isOnlyHashChanged = function(url) {
		return url.indexOf( '#' ) >= 0 && ( ( url[ 0 ] === '#' ) || self.isSameWithoutHash( url ) );
	};

	self.isOnlyGetChanged = function(first, second) {
        if (first === undefined || second === undefined) {
            return false;
        } else if (second.indexOf('?') >= 0) {
            first = parseUrl(first);
            second = parseUrl(second);

            if (first.path === second.path /*&& first.search !== second.search*/) {
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
	};

	self.reload = function () {
		self.goTo(self.getPath());
	};

	/**
	 * Handler for statechange event. Refreshes location data and triggers module event.
	 */
	var stateChangeHandler = function() {
        self.addToTimeline(self.getFullPath());
        
        if (dont_trigger_url_changed_next_time === false) {
            self.trigger('Url changed', {
                url: self.getFullPath(),
                action_source: action_source,
                only_get_changed: self.isOnlyGetChanged(self.getFromTimeline(-2), self.getFromTimeline(-1))
            });
        } else {
            dont_trigger_url_changed_next_time = false;
        }

        action_source = 'browser';
	};

	/**
	 * Initializes module.
	 */
	self.init = function() {
		if (History.Adapter) {
			History.Adapter.bind( window, 'statechange', stateChangeHandler );
		}

        self.addToTimeline(self.getFullPath());

        window.loc = self;
	};
} );

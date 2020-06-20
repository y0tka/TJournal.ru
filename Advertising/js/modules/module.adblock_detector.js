Air.defineModule( 'module.adblock_detector', 'lib.DOM, module.metrics, lib.cookie', function($, metrics, lib_cookie) {
	var self = this;

    self.check = function( callback ) {
		var ads = document.createElement("div"),
			result = false,
			is_ie = metrics.browser[0] === 'IE';

        if (is_ie) {

            callback(false);

        } else {

            ads.innerHTML = '&nbsp;';
    		ads.className = 'adsbox';

    		document.body.appendChild(ads);
    		result = document.getElementsByClassName("adsbox")[0].offsetHeight === 0;
    		document.body.removeChild(ads);

            if (result === true) {
                callback(result);
            }else{
                var xhr = new XMLHttpRequest();

                xhr.onreadystatechange = function() {
                    // READYSTATE_COMPLETE for IE
                    if ( xhr.readyState === ( XMLHttpRequest.DONE || XMLHttpRequest.READYSTATE_COMPLETE ) ) {
                        callback( xhr.status !== 200 );
        				xhr = null;
                    }
                }

                xhr.open( 'GET', '/advert.gif', true );
                xhr.send( null );
            }

        }

    };

	self.init = function( callback ) {
        self.check( function( is_detected ) {
            self.state = is_detected;
			// self.state = true;

            $.toggleClass(document.body, 'with--adblock', is_detected);

            lib_cookie.set('adblock-state', self.state ? '1' : '0', 365);

            callback();
        } );
    };

    self.refresh = function( callback ) {
        callback();
    };

    self.destroy = function( callback ) {
        callback();
    };
}, {
    async: true
} );

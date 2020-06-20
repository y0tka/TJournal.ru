/**
  * TODO: add pause/unpause methods (а для чего?...)
  * @class for throttling, debouncing and repeating.
  *
  */
Air.defineClass( 'class.Timer', 'class.AnimationFrame', function( AnimationFrame ) {

    /**
     * @module Timer
     * @param {function} func - Called function.
     * @param {number} [def_time=0] - time.
     * @constructor
     */
	var Timer = function( func, def_time ) {
		this.init( func, def_time );
	};

	Timer.prototype.init = function( func, def_time ) {
		this.func = func;
		this.def_time = def_time;
		this.last_throttle = 0;
		this.timeout_next = null;

		this.animation_frame = new AnimationFrame( this.tick.bind( this ) );
	};

	Timer.prototype.tick = function() {
		if ( Date.now() - this.debounce_time_expires > 0 ) {
			this.animation_frame.stop();
			this.run();
		}
	};

	/**
	  * Returns @def_time if @time is not defined.
	  * @param {number} [time]
	  */
    Timer.prototype.getTime = function( time ) {
        if ( time === undefined ) {
            return this.def_time || 0;
        } else {
            return time;
        }
    };

    /**
	  * Runs no more than once per @time.
	  * @param {number} [time]
	  */
    Timer.prototype.throttle = function( time ) {
		var time = this.getTime( time );

		if ( time === 0 || ( Date.now() - this.last_throttle >= time ) ) {
			this.run();
		}

		if ( time > 0 ) {
			this.debounce( time );
		}
    };

	/**
	 * Runs function like setTimeout(0)
	 */
	Timer.prototype.next = function() {
		clearTimeout( this.timeout_next );
		this.timeout_next = setTimeout( this.run.bind(this), 0 );
	};

	/**
	  * Runs after last call in @time.
	  * @param {number|boolean} [time] - False to cancel debouncing.
	  */
    Timer.prototype.debounce = function( time ) {
		this.debounce_time_expires = this.getTime( time ) + Date.now();

		this.animation_frame.start();

		// clearTimeout( this.debounce_timeout );
		//
		// if ( time !== false ) {
		// 	time = this.getTime( time );
		//
		// 	if ( time > 0 ) {
		// 		this.debounce_timeout = setTimeout( this.run.bind( this ), time );
		// 	} else {
		// 		this.run();
		// 	}
		// }
    };

	/**
	  * Starts to repeat every @time.
	  * @param {number} [time]
	  */
    Timer.prototype.start = function( time, is_run_immediately ) {
		clearInterval( this.repeat_interval );

		if ( is_run_immediately !== false ) {
			this.run();
		}

        this.repeat_interval = setInterval( this.run.bind( this ), this.getTime( time ) );
    };

	/**
	  * Stops to repeat.
	  */
    Timer.prototype.stop = function() {
        clearInterval( this.repeat_interval );
    };

	/**
	  * Runs immediately.
	  */
    Timer.prototype.run = function() {
		clearTimeout( this.timeout_next );
		this.animation_frame.stop();
		// clearTimeout( this.debounce_timeout );
		this.last_throttle = Date.now();
		this.func();
    };

	/**
	  * Cancels all.
	  */
    Timer.prototype.reset = function() {
		this.last_throttle = 0;
		// this.animation_frame.stop();
		// clearTimeout( this.debounce_timeout );
		clearTimeout( this.timeout_next );
		clearInterval( this.repeat_interval );

		if ( this.animation_frame ) {
			this.animation_frame.stop();
		}
    };

	/**
	  * Sets new @func.
	  * @param {function} fn.
	  */
    Timer.prototype.setFn = function( fn ) {
		this.func = fn;
    };

	// Timer.prototype.makeLongPolling = function() {
	// 	this.animation_frame.stop();
	// 	// clearTimeout( this.debounce_timeout );
	// 	clearInterval( this.repeat_interval );
	// 	this.last_throttle = Date.now();
	//
	// 	if ( this.long_polling_time !== undefined ) {
	// 		if ( this.long_polling_time === 0 ) {
	// 			func( this.makeLongPolling.bind( this ) );
	// 		} else {
	// 			// this.debounce(  );
	// 			// this.debounce_timeout = setTimeout( function() {
	// 			// 	func( this.makeLongPolling.bind( this ) );
	// 			// }, this.long_polling_time );
	// 		}
	// 	}
	// };

	/**
	  * Repeats @func recursively through the @time or immediately.
	  * @param {number|boolean} [time] - False to stop.
	  */
	// Timer.prototype.longPolling = function( time ) {
	// 	this.long_polling_time = time !== false ? this.getTime( time ) : undefined;
	//
	// 	if ( this.long_polling_time !== undefined ) {
	// 		this.func( this.makeLongPolling.bind( this ) );
	// 	} else {
	// 		this.animation_frame.stop();
	// 		// clearTimeout( this.debounce_timeout );
	// 	}
	// };

	Timer.prototype.destroy = function() {
		this.reset();
	};

	return Timer;
} );

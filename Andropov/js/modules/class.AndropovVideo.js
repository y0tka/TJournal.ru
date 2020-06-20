Air.define( 'class.AndropovVideo', 'module.metrics, lib.DOM, module.lazy_load, lib.andropov, lib.console', function( metr, $, lazy_load, lib_andropov, console ) {

    /**
     * States:
     * "deactivated" – before embed inserted;
     * "loading" - embed loading;
     * "playing" - playing.
     */

    function AndropovVideo( element ) {
        this.$dom = {
            main: element,
            dummy: $.bem.find( element, 'dummy' ),
            container: $.bem.find( element, 'container' ),
            iframe: null,
            video: null
        };

        this.data = {
            thumbnail: $.data( element, 'video-thumbnail' ),
            iframe: $.data( element, 'video-iframe' ),
            mp4: $.data( element, 'video-mp4' ),
            play_mode: metr.is_webview ? 'click' : $.data( element, 'video-play-mode' ),
            has_audio: $.data( element, 'video-has-audio' ) === '1',
            service: $.data( element, 'video-service' ),
        };

        this.classname = $.bem.getMainClass( element );

        this.all_classes = ['loading', 'playing', 'paused'].map(this.formStatusClassName.bind(this)).join(' ');

        this.is_thumbnail_loaded = false;
        this.is_play_mode_binded = false;
        this.play_timer = null;

        this.setStatus( 'deactivated' );
    };

    AndropovVideo.prototype.formStatusClassName = function(status) {
        return `${this.classname}--status-${status}`;
    };

    AndropovVideo.prototype.setStatus = function( status ) {
        // _log('current: %s, new: %s', this.current_status, status);
        if ( this.current_status !== status ) {
            this.current_status = status;

            $.removeClass( this.$dom.main, this.all_classes );

            if ( this.current_status !== 'deactivated' ) {
                $.bem.add( this.$dom.main, 'status-' + this.current_status );
            }
        }
    };

    AndropovVideo.prototype.getIframeSrcWithAutoplay = function() {
        var get_param,
            src = this.data.iframe;

        switch (this.data.service) {
            case 'youtube':
            case 'vk':
            case 'vimeo':
                get_param = 'autoplay=1';
                break;

            case 'coub':
                get_param = 'autostart=true';
                break;

            default:
                get_param = null;
        }

        if (get_param !== null) {
            if (src.indexOf('?') >= 0) {
                src += '&' + get_param;
            } else {
                src += '?' + get_param;
            }
        }

        return src;
    };

    AndropovVideo.prototype.insertIframe = function() {
        if ( this.$dom.iframe === null ) {
            this.setStatus( 'loading' );

            this.$dom.iframe = $.create( 'iframe' );

            $.one( this.$dom.iframe, 'load', this.setStatus.bind( this, 'playing' ) );

            $.attr( this.$dom.iframe, 'allowFullScreen', 'allowFullScreen' );

            $.attr( this.$dom.iframe, 'src', this.getIframeSrcWithAutoplay() );

            $.append( this.$dom.container, this.$dom.iframe );
        }
    };

    AndropovVideo.prototype.removeIframe = function() {
        if ( this.$dom.iframe !== null ) {
            $.off( this.$dom.iframe );
            $.remove( this.$dom.iframe );

            this.$dom.iframe = null;

            this.setStatus( 'deactivated' );
        }
    };

    AndropovVideo.prototype.insertVideo = function() {
        var source_element;

        if ( this.$dom.video === null ) {
            this.setStatus( 'loading' );

            this.$dom.video = $.create( 'video' );
            source_element = $.create( 'source' );

            this.$dom.video.autoplay = true;
            this.$dom.video.loop = true;
            this.$dom.video.muted = true;
            this.$dom.video.playsinline = true;

            if (metr.is_mobile) {
                this.$dom.video.controls = true;
            }

            $.one( this.$dom.video, 'play', this.setStatus.bind( this, 'playing' ) );
            $.on( this.$dom.video, 'click', this.play.bind( this, false ) );

            $.attr( source_element, 'src', this.data.mp4 );
            $.attr( source_element, 'type', 'video/mp4' );

            $.append( this.$dom.video, source_element );
            $.append( this.$dom.container, this.$dom.video );

            this.playVideo();

            source_element = null;
        }
    };

    AndropovVideo.prototype.removeVideo = function() {
        if ( this.$dom.video !== null ) {
            $.off( this.$dom.video );
            $.remove( this.$dom.video );

            this.$dom.video = null;

            this.setStatus( 'deactivated' );
        }
    };

    AndropovVideo.prototype.playVideo = function() {
        if ( this.$dom.video !== null ) {
            this.$dom.video.play();

            this.setStatus('playing');
        }
    };

    AndropovVideo.prototype.pauseVideo = function() {
        if ( this.$dom.video !== null ) {
            $.off(this.$dom.video, 'canplay');
            clearTimeout(this.play_timer);

            this.$dom.video.pause();

            this.setDummyImage(null);

            this.setStatus('paused');
        }
    };

    AndropovVideo.prototype.setDummyImage = function(src) {
        if (src === null) {
            $.css(this.$dom.dummy, {
                'background-image': 'none',
                'background-color': 'transparent'
            });
        } else {
            $.css(this.$dom.dummy, 'background-image', 'url(' + src + ')');
        }
    };

    // AndropovVideo.prototype.getCurrentFrame = function() {
    //     var canvas,
    //         canvasContext;
    //
    //     if ( this.$dom.video !== null ) {
    //         canvas = document.createElement('canvas');
    //         canvas.width = this.$dom.video.videoWidth;
    //         canvas.height = this.$dom.video.videoHeight;
    //
    //         canvasContext = canvas.getContext('2d');
    //         canvasContext.drawImage(this.$dom.video, 0, 0);
    //
    //         return canvas.toDataURL('image/jpeg');
    //     } else {
    //         return null;
    //     }
    // };

    AndropovVideo.prototype.insertStructure = function() {
        if ( this.data.iframe ) {
            this.insertIframe();
        } else if ( this.data.mp4 ) {
            this.insertVideo();
        } else {
            console.warn( 'andropov', 'AndropovVideo has no iframe URL or mp4 URL', this.$dom.main );
        }
    };

    AndropovVideo.prototype.removeStructure = function() {
        if ( this.data.iframe ) {
            this.removeIframe();
        } else if ( this.data.mp4 ) {
            this.removeVideo();
        }
    };

    AndropovVideo.prototype.pauseStructure = function() {
        if (this.data.mp4) {
            this.pauseVideo();
        }
    };

    AndropovVideo.prototype.playStructure = function() {
        if (this.data.mp4) {
            this.playVideo();
        }
    };

    AndropovVideo.prototype.play = function( state ) {
        state = state !== false;

        if (state) {
            switch ( this.current_status ) {
                case 'deactivated':
                    this.insertStructure();
                    break;

                case 'paused':
                    this.playStructure();

                case 'loading':
                case 'playing':
                    // do nothing
                    break;
            }
        } else {
            switch ( this.current_status ) {
                case 'deactivated':
                case 'paused':
                    // do nothing
                    break;

                case 'playing':
                case 'loading':
                    this.pauseStructure();
                    break;
            }
        }
    };

    AndropovVideo.prototype.loadThumbnail = function() {
        var that = this;

        if ( this.is_thumbnail_loaded === false ) {
            this.is_thumbnail_loaded = true;

            lazy_load.add(lib_andropov.formImageUrl(this.data.thumbnail, $.width(this.$dom.dummy), $.height(this.$dom.dummy)), function(src) {
                $.css(that.$dom.dummy, 'background-image', 'url(' + src + ')');
            });
        }
    };

    AndropovVideo.prototype.bindPlayMode = function() {
        if (this.is_play_mode_binded === false) {
            this.is_play_mode_binded = true;

            $.on(this.$dom.dummy, 'click', this.play.bind(this, true));

            switch (this.data.play_mode) {
                // case 'click':
                //     break;

                case 'visible':
                    this.play(true);
                    break;
            }
        }
    };

    AndropovVideo.prototype.onVisible = function( state ) {
        if ( state === true ) {
            this.load();
        }
    };

    AndropovVideo.prototype.load = function() {
        this.loadThumbnail();
        this.bindPlayMode();
    };

    AndropovVideo.prototype.destroy = function() {
        this.removeStructure( false );

        $.off(this.$dom.dummy);

        this.$dom = null;
        this.data = null;
    };

    return AndropovVideo;

} );

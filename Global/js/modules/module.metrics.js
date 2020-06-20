Air.define('module.metrics', 'lib.DOM', function($) {
    var self = this,
        body = document.body,
        html = document.documentElement;

    var updateScrollMetrics = function() {
        self.scroll_top = $.windowTop();
        self.scroll_left = $.windowLeft();
    };

    var updateResizeMetrics = function() {
        self.window_width = $.windowWidth();
        self.window_height = $.windowHeight();

        self.document_width = Math.max(body.scrollWidth, body.offsetWidth, html.clientWidth, html.scrollWidth, html.offsetWidth);
        self.document_height = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
    };

    var updateNavigatorData = function() {
        self.is_mobile = (function(a) {
            return (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4)));
        })(navigator.userAgent || navigator.vendor || window.opera);
        self.is_desktop = !self.is_mobile;

        self.browser = (function() {
            var ua = navigator.userAgent,
                tem,
                M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];

            if (/trident/i.test(M[1])) {
                tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
                return ['IE', tem[1] || ''];
            }

            if (M[1] === 'Chrome') {
                tem = ua.match(/\bOPR\/(\d+)/)
                if (tem != null) {
                    return ['Opera', tem[1]];
                }
            }

            M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];

            if ((tem = ua.match(/version\/(\d+)/i)) != null) {
                M.splice(1, 1, tem[1]);
            }

            return M;
        })();

        self.is_retina = (function() {
            var mediaQuery = "(-webkit-min-device-pixel-ratio: 1.5),\
		            (min--moz-device-pixel-ratio: 1.5),\
		            (-o-min-device-pixel-ratio: 3/2),\
		            (min-resolution: 1.5dppx)";

            if (window.devicePixelRatio > 1)
                return true;
            if (window.matchMedia && window.matchMedia(mediaQuery).matches)
                return true;
            return false;
        })();

        self.is_ios_webview = (function() {
            /**
             * WebView detection
             * http://stackoverflow.com/questions/4460205/detect-ipad-iphone-webview-via-javascript
             */
            var standalone = window.navigator.standalone,
                userAgent = window.navigator.userAgent.toLowerCase(),
                safari = /safari/.test( userAgent ),
                ios = /iphone|ipod|ipad/.test( userAgent );

            if( ios ) {
                if ( !standalone && safari ) {
                    //browser
                } else if ( standalone && !safari ) {
                    //standalone
                } else if ( !standalone && !safari ) {
                    return true;
                };
            } else {
                //not iOS
            };

            return false;
        })();

        self.is_android_webview = window.navigator.userAgent.toLowerCase().indexOf('-android/') > -1;

        self.is_webview = self.is_ios_webview || self.is_android_webview;

        self.is_android = window.navigator.userAgent.toLowerCase().indexOf('android') > -1;

        self.platform = (function () {

            let ua = window.navigator.userAgent.toLowerCase();

            if (/win/i.test(ua) && !(/windows phone/i.test(ua))) {
                return 'Windows';
            } else if (/macintosh/i.test(ua)){
                return 'Mac';
            } else if (/linux/i.test(ua)){
                return 'Linux';
            } else if (/iphone/i.test(ua)){
                return 'iPhone';
            } else if (/ipad/i.test(ua)){
                return 'iPad';
            } else if (/android/i.test(ua)){
                return 'Android';
            } else if (/pike/i.test(ua)){
                return 'Pike';
            } else if (/symbian/i.test(ua)){
                return 'Symbian';
            } else if (/windows phone/i.test(ua)){
                return 'Windows Phone';
            }

            return 'Unknown';
        })();
    };

    var updateBreakpoints = function() {
        var w = self.window_width,
            breakpoints = self.config.breakpoints,
            breakpoint_name,
            from,
            to,
            matched_name;

        for (breakpoint_name in breakpoints) {
            from = breakpoints[breakpoint_name][0];
            to = breakpoints[breakpoint_name][1];

            if (w >= from && w <= to) {
                matched_name = breakpoint_name;
            }
        }

        if (self.breakpoint != matched_name) {
            self.breakpoint = matched_name;
            self.triggerOnce('Breakpoint changed', self.breakpoint);
        }
    };

    var updateScrollBarWidth = function() {
        var outer = document.createElement( 'div' ),
            widthNoScroll,
            inner,
            widthWithScroll;

        outer.style.visibility = 'hidden';
        outer.style.width = '100px';
        outer.style.msOverflowStyle = 'scrollbar'; // needed for WinJS apps

        document.body.appendChild(outer);

        widthNoScroll = outer.offsetWidth;

        outer.style.overflow = 'scroll';

        inner = document.createElement( 'div' );
        inner.style.width = '100%';
        outer.appendChild(inner);

        widthWithScroll = inner.offsetWidth;

        outer.parentNode.removeChild(outer);

        self.scrollbar_width = widthNoScroll - widthWithScroll;
    };

    self.init = function() {

        updateScrollMetrics();
        updateResizeMetrics();

        updateNavigatorData();

        updateBreakpoints();

        updateScrollBarWidth();

        $.on(window, 'scroll.module_metrics', function() {
            updateScrollMetrics();
            updateResizeMetrics();
        });

        $.on(window, 'resize.module_metrics', function() {
            updateScrollMetrics();
            updateResizeMetrics();
            updateBreakpoints();
        });

    };

    self.refresh = function() {
        updateScrollMetrics();
        updateResizeMetrics();
        updateBreakpoints();
    };

    self.destroy = function() {
        $.off(window, 'scroll.module_metrics');
        $.off(window, 'resize.module_metrics');
    };

    self.update = self.refresh;

    // _metr = this;
});

require('intersection-observer');

(function (console) {
    /**
     * @namespace console
     */

    /**
     * @namespace consoleStyle
     */

    /* istanbul ignore if */
    if (!console || !console.log) {
        return;
    }

    var colors = 'Black Blue Cyan Gray Green Magenta Red White Yellow'.split(' ');
    var rxTags = /<(css|b|i)(?:=['"](.*?)['"])?>(.*?)<\/(?:css|b|i)>/ig;
    var rxRules = /([a-z\-]+)\s?:\s?([^;'"]+);?/ig;
    var rxTokens = /%[sdifoO]/g;
    var rxImgs = /<img=['"](.*?)['"]>/ig;
    var bg = 'background';
    var px = 'px';
    var style;
    var wrap;

    /**
     * Regex mojo to parse the text to log in the console.
     * @function parse
     * @memberOf consoleStyle
     * @param {string} text - the text with styles to parse
     * @returns {Array} args - an array of console.log arguments
     */
    var parse = function (text) {
        var args = [text];
        if (typeof text === 'string') {
            text = text.replace(rxImgs, function (matchI, $1I) {
                var width;
                var height;
                var halfHeight;
                var halfWidth;
                var styles = ['font-size:1px'];
                $1I.replace(rxRules, function (matchR, $1R, $2R) {
                    switch ($1R) {
                        case bg:
                        case bg + '-image':
                            styles.push($1R + ':' + $2R, bg + '-repeat:no-repeat');
                            break;
                        case 'width':
                            width = $2R;
                            break;
                        case 'height':
                            height = $2R;
                            styles.push('line-height:' + $2R);
                            break;
                    }
                });
                halfWidth = Math.ceil(parseInt(width) / 2);
                halfHeight = Math.ceil(parseInt(height) / 2);
                styles.push(bg + '-size:' + width + ' ' + height);
                styles.push('padding:' + halfHeight + px + ' ' + halfWidth + px);
                return wrap('', styles.join(';'));
            });
            args[0] = text.replace(rxTags, function (matchT, $1T, $2T, $3T) {
                $2T = $2T || '';
                $3T = $3T.replace(rxTokens, '');
                switch ($1T) {
                    case 'b':
                        $2T += ';font-weight:bold';
                        break;
                    case 'i':
                        $2T += ';font-style:italic';
                        break;
                }
                args.push($2T, '');
                return '%c' + $3T + '%c';
            });
        }
        return args;
    };

    /**
     * Define color shortcut methods on the console.
     * @function colors
     * @memberOf console
     * @param {string} color - the CSS color rule to apply
     * @example console.style('Wow, this is ' + console.colors.green('so much') + ' better!');
     */
    console.colors = {};
    colors.forEach(function (color) {
        console.colors[color.toLowerCase()] = function (text) {
            return wrap(text, 'color:' + color);
        };
        console.colors['bg' + color] = function (text) {
            return wrap(text, bg + '-color:' + color);
        };
    });

    /**
     * Intuitively Style Browser Console Text with CSS.
     * @function style
     * @memberOf console
     * @param text - the text to style
     * @example console.style('Wow, this is <css="color:green;font-weight:bold;">so much</css> better!');
     */
    console.style = style = function () {
        var args = [].slice.call(arguments);
        console.log.apply(console, parse(args.shift()).concat(args));
    };

    /**
     * Wraps the given text in a <css> tag with the provided style rules.
     * @function wrap
     * @memberOf console
     * @param {string} text - the text to wrap
     * @param {string} rule - CSS rules to apply
     * @returns {string} - the wrapped text
     * @example console.style('I just ' + console.style.wrap('love', 'color:#c00;font-weight:bold;') + ' console.style');
     */
    console.style.wrap = wrap = function (text, rules) {
        return '<css="' + rules + '">' + text + '</css>';
    };

}(window.console));

(function (is_show) {
    if (is_show) {
        console.style('5 Сентября, 2018.');
    }
})(!window.__debug);

window._log = console.log.bind(console);

window.inspector = {
    arrToStr: function (arr) {
        return '[' + arr.map(function (v) {
            return '"' + v + '"';
        }).join(', ') + ']';
    },
    getGlobalVariables: function (is_str) {
        var result = [];

        for (name in window) {
            result.push(name);
        }

        if (is_str === true) {
            result = this.arrToStr(result);
        }

        return result;
    },
    inspectGlobalVariables: function (is_str) {
        var vars = this.getGlobalVariables(),
            default_vars = ["stop", "open", "alert", "confirm", "prompt", "print", "requestAnimationFrame", "cancelAnimationFrame", "requestIdleCallback", "cancelIdleCallback", "captureEvents", "releaseEvents", "getComputedStyle", "matchMedia", "moveTo", "moveBy", "resizeTo", "resizeBy", "getSelection", "find", "getMatchedCSSRules", "webkitRequestAnimationFrame", "webkitCancelAnimationFrame", "btoa", "atob", "setTimeout", "clearTimeout", "setInterval", "clearInterval", "postMessage", "createImageBitmap", "blur", "scroll", "focus", "close", "scrollTo", "scrollBy", "fetch", "webkitRequestFileSystem", "webkitResolveLocalFileSystemURL", "openDatabase", "chrome", "console", "parent", "opener", "top", "length", "frames", "closed", "location", "self", "window", "document", "name", "history", "locationbar", "menubar", "personalbar", "scrollbars", "statusbar", "toolbar", "status", "frameElement", "navigator", "applicationCache", "external", "screen", "innerWidth", "innerHeight", "scrollX", "pageXOffset", "scrollY", "pageYOffset", "screenX", "screenY", "outerWidth", "outerHeight", "devicePixelRatio", "clientInformation", "screenLeft", "screenTop", "defaultStatus", "defaultstatus", "styleMedia", "onanimationend", "onanimationiteration", "onanimationstart", "onsearch", "ontransitionend", "onwebkitanimationend", "onwebkitanimationiteration", "onwebkitanimationstart", "onwebkittransitionend", "onwheel", "isSecureContext", "onabort", "onblur", "oncancel", "oncanplay", "oncanplaythrough", "onchange", "onclick", "onclose", "oncontextmenu", "oncuechange", "ondblclick", "ondrag", "ondragend", "ondragenter", "ondragleave", "ondragover", "ondragstart", "ondrop", "ondurationchange", "onemptied", "onended", "onerror", "onfocus", "oninput", "oninvalid", "onkeydown", "onkeypress", "onkeyup", "onload", "onloadeddata", "onloadedmetadata", "onloadstart", "onmousedown", "onmouseenter", "onmouseleave", "onmousemove", "onmouseout", "onmouseover", "onmouseup", "onmousewheel", "onpause", "onplay", "onplaying", "onprogress", "onratechange", "onreset", "onresize", "onscroll", "onseeked", "onseeking", "onselect", "onshow", "onstalled", "onsubmit", "onsuspend", "ontimeupdate", "ontoggle", "onvolumechange", "onwaiting", "onbeforeunload", "onhashchange", "onlanguagechange", "onmessage", "onoffline", "ononline", "onpagehide", "onpageshow", "onpopstate", "onrejectionhandled", "onstorage", "onunhandledrejection", "onunload", "performance", "onauxclick", "customElements", "ongotpointercapture", "onlostpointercapture", "onpointercancel", "onpointerdown", "onpointerenter", "onpointerleave", "onpointermove", "onpointerout", "onpointerover", "onpointerup", "crypto", "ondevicemotion", "ondeviceorientation", "ondeviceorientationabsolute", "indexedDB", "webkitStorageInfo", "sessionStorage", "localStorage", "caches", "speechSynthesis", "getGlobalVariables", "TEMPORARY", "PERSISTENT", "addEventListener", "removeEventListener", "dispatchEvent"],
            result;

        result = vars.filter(function (var_name) {
            return default_vars.indexOf(var_name) < 0;
        });

        if (is_str === true) {
            result = this.arrToStr(result);
        }

        return result;
    },
    intersection: function (first, second) {
        return arrToStr(first.filter(function (element) {
            return second.indexOf(element) >= 0;
        }));
    }
};

Air.config({
    'variables': {
        'global_modules': ''
    },
    'router': {},
    'global': '{{global_modules}}', // переменная – просто так, для демонстрации
    'modules': {
        'module.renderer': {
            'path_to_templates': '/static/build/' + window.__domain + '/tpl/'
        },
        'module.push': {
            'push_domain': 'push.' + window.__domain,
            'apple_web_push_id': window.__apple_web_push_id
        },
        'module.error_tracker': {
            'domain': window.__domain
        },
        'module.metrics': {
            'breakpoints': {
                'mobile': [0, 679],
                'tablet': [680, 1024],
                'desktop': [1025, 1339],
                'wide': [1340, 4096]
            }
        },
        'module.entry_events': {
            'socket_url': window.__socket_url
        },
        'module.live_model': {
            'socket_url': window.__socket_url
        },
        'module.auth_form': {
            'email_auth': window.__email_auth
        },
        'module.auth_data': {
            'socket_url': window.__socket_url
        },
        'module.waterfall': {
            'space_id': window.__waterfall_space_id
        },
        'module.system_messages': {
            'socket_url': window.__socket_url
        },
        'module.sticky_sidebar': {
            'site_name': window.__ad_site_name
        }

    },
    'path': {
        'modules': '/not/used/path/to/modules'
    }
});

if (window.__air_autostart !== false) {
    Air.start({
        is_debug: window.__debug
    });
}

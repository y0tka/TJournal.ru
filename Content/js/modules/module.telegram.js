Air.defineModule( 'module.telegram', 'class.Fabric', function( Fabric, util ) {
    var self = this,
		fabric;

    /**
     * Telegram API
     */
    // (function(window) {
    //   function addEvent(el, event, handler) {
    //     var events = event.split(/\s+/);
    //     for (var i = 0; i < events.length; i++) {
    //       if (el.addEventListener) {
    //         el.addEventListener(events[i], handler);
    //       } else {
    //         el.attachEvent('on' + events[i], handler);
    //       }
    //     }
    //   }
    //   function removeEvent(el, event, handler) {
    //     var events = event.split(/\s+/);
    //     for (var i = 0; i < events.length; i++) {
    //       if (el.removeEventListener) {
    //         el.removeEventListener(events[i], handler);
    //       } else {
    //         el.detachEvent('on' + events[i], handler);
    //       }
    //     }
    //   }
    //   function getCssProperty(el, prop) {
    //     if (window.getComputedStyle) {
    //       return window.getComputedStyle(el, '').getPropertyValue(prop) || null;
    //     } else if (el.currentStyle) {
    //       return el.currentStyle[prop] || null;
    //     }
    //     return null;
    //   }
    //
    //   var widgetsOrigin = (function() {
    //     var link = document.createElement('A');
    //     link.href = document.currentScript && document.currentScript.src || 'https://t.me';
    //     var origin = link.origin || link.protocol + '//' + link.hostname;
    //     if (origin == 'https://telegram.org') {
    //       origin = 'https://t.me';
    //     }
    //     return origin;
    //   })();
    //
    //   function initWidget(widgetEl) {
    //     var widgetId;
    //     if (!widgetEl.tagName ||
    //         !(widgetEl.tagName.toUpperCase() == 'SCRIPT' ||
    //           widgetEl.tagName.toUpperCase() == 'BLOCKQUOTE' &&
    //           widgetEl.classList.contains('telegram-post')) ||
    //         !(widgetId = widgetEl.getAttribute('data-telegram-post'))) {
    //       return null;
    //     }
    //     var widgetElId = 'telegram-post-' + widgetId.replace(/[^a-z0-9_]/ig, '-');
    //     var existsEl = document.getElementById(widgetElId);
    //     if (existsEl) {
    //       return existsEl;
    //     }
    //     function visibilityHandler() {
    //       try {
    //         if (isVisible(iframe, 50)) {
    //           var data = {event: 'visible', frame: widgetElId};
    //           iframe.contentWindow.postMessage(JSON.stringify(data), '*');
    //           console.log('send', data);
    //         }
    //       } catch(e) {}
    //     }
    //     function postMessageHandler(event) {
    //       if (event.source !== iframe.contentWindow ||
    //           event.origin != widgetsOrigin) {
    //         return;
    //       }
    //       try {
    //         var data = JSON.parse(event.data);
    //       } catch(e) {
    //         var data = {};
    //       }
    //       if (data.event == 'resize') {
    //         iframe.style.height = data.height + 'px';
    //       } else if (data.event == 'visible_off') {
    //         removeEvent(window, 'scroll', visibilityHandler);
    //         removeEvent(window, 'resize', visibilityHandler);
    //       }
    //     }
    //     var src = 'https://t.me/' + widgetId + '?embed=1';
    //     if (widgetEl.hasAttribute('data-no-userpic')) {
    //       src += '&no_userpic=1';
    //     }
    //     var iframe = document.createElement('iframe');
    //     iframe.id = widgetElId;
    //     iframe.src = src;
    //     iframe.width = widgetEl.getAttribute('data-width') || '100%';
    //     iframe.setAttribute('frameborder', '0');
    //     iframe.setAttribute('scrolling', 'no');
    //     iframe.style.border = 'none';
    //     iframe.style.overflow = 'hidden';
    //     if (widgetEl.parentNode) {
    //       widgetEl.parentNode.insertBefore(iframe, widgetEl);
    //       if (widgetEl.tagName.toUpperCase() == 'BLOCKQUOTE') {
    //         widgetEl.parentNode.removeChild(widgetEl);
    //       }
    //     }
    //     addEvent(iframe, 'load', function() {
    //       removeEvent(iframe, 'load', visibilityHandler);
    //       addEvent(window, 'scroll', visibilityHandler);
    //       addEvent(window, 'resize', visibilityHandler);
    //       visibilityHandler();
    //     });
    //     addEvent(window, 'message', postMessageHandler);
    //     return iframe;
    //   }
    //   function isVisible(el, padding) {
    //     var node = el, val;
    //     var visibility = getCssProperty(node, 'visibility');
    //     if (visibility == 'hidden') return false;
    //     while (node) {
    //       if (node === document.documentElement) break;
    //       var display = getCssProperty(node, 'display');
    //       if (display == 'none') return false;
    //       var opacity = getCssProperty(node, 'opacity');
    //       if (opacity !== null && opacity < 0.1) return false;
    //       node = node.parentNode;
    //     }
    //     if (el.getBoundingClientRect) {
    //       padding = +padding || 0;
    //       var rect = el.getBoundingClientRect();
    //       var html = document.documentElement;
    //       if (rect.bottom < padding ||
    //           rect.right < padding ||
    //           rect.top > (window.innerHeight || html.clientHeight) - padding ||
    //           rect.left > (window.innerWidth || html.clientWidth) - padding) {
    //         return false;
    //       }
    //     }
    //     return true;
    //   }
    //
    //   window.TelegramDIY = {
    //       initWidget: initWidget
    //   };
    // })(window);

    var requireApi = function() {
        if ( document.querySelectorAll('script[data-telegram-post],blockquote.telegram-post').length > 0 ) {
            util.requireScript('https://telegram.org/js/telegram-widget.js?rnd=' + util.uid() );
        }
    };

    self.init = function() {
        requireApi();
		// fabric = new Fabric( {
		// 	selector: '[data-telegram-post]',
		// 	Constructor: function(params) {
        //         // TelegramDIY.initWidget(params.element);
        //     }
 		// } );
	};

	self.refresh = function() {
        requireApi();
		// fabric.update();
	};

	self.destroy = function() {
		// fabric.destroy();
	};
} );

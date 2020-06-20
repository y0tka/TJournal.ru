Air.define('module.scroll_locker', 'lib.DOM', function($) {
    var self = this;

    var getScrollbarWidth = function() {
        var outer = document.createElement("div");
        outer.style.visibility = "hidden";
        outer.style.width = "100px";
        outer.style.msOverflowStyle = "scrollbar"; // needed for WinJS apps

        document.body.appendChild(outer);

        var widthNoScroll = outer.offsetWidth;
        // force scrollbars
        outer.style.overflow = "scroll";

        // add innerdiv
        var inner = document.createElement("div");
        inner.style.width = "100%";
        outer.appendChild(inner);

        var widthWithScroll = inner.offsetWidth;

        // remove divs
        outer.parentNode.removeChild(outer);

        return widthNoScroll - widthWithScroll;
    }

    self.lock = function(state) {

        if (state === true) {
            $.css(document.documentElement, {
                'overflow': 'hidden',
                'margin-right': self.scrollbars_width + 'px'
            });

            $.toggleClass(document.documentElement, 'with--no_scroll', true);
        }else{
            $.css(document.documentElement, {
                'overflow': '',
                'margin-right': ''
            });

            $.toggleClass(document.documentElement, 'with--no_scroll', false);
        }

    };

    self.init = function() {
		self.scrollbars_width = getScrollbarWidth();
    };

    self.refresh = function() {

    };

    self.destroy = function() {

    };
});

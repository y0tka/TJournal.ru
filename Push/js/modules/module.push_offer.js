Air.define('module.push_offer', 'module.push2, lib.DOM, class.Timer, lib.analytics, lib.cookie', function(push, $, Timer, lib_analytics, cookie) {

    let self = this,
        $dom = {},
        timer,
        titles,
        title_index = 0,
        cookie_name = 'pushVisitsCount',
        cookie_visit_count = 1;

    function getVisitCount() {
        return parseInt(cookie.get(cookie_name)) || 0;
    }

    function addVisitCount(n) {
        cookie.set(cookie_name, getVisitCount() + n, 365);
    }

    function isVisitCountReached() {
        return getVisitCount() >= cookie_visit_count;
    }

    function show(state = true) {
        $.bem.toggle($dom.offer, 'shown', state);
    }

    function subscribe() {
        push.subscribe();
        lib_analytics.sendDefaultEvent('Push Notifications — Accept');
    }

    function tryToShow() {
        if (push.isSupported() && !push.getState() && isVisitCountReached()) {
            show(true);
            lib_analytics.sendDefaultEvent('Push Notifications — Window Shown');
        }
    }

    function close() {
        show(false);
        addVisitCount(-50000);
        lib_analytics.sendDefaultEvent('Push Notifications — Decline');
    }

    function onEnabled() {
        timer.reset();
        show(false);
    }

    function nextTitle() {
        setTitle(titles[++title_index % titles.length]);
        lib_analytics.sendDefaultEvent('Push Notifications — Fake Title Click');
    }

    function setTitle(title) {
        $.html($dom.title, title);
    }

    self.init = function() {
        $dom.offer = $.find('.push_offer');
        $dom.title = $.bem.find($dom.offer, 'title');
        $dom.close = $.bem.find($dom.offer, 'close');
        $dom.accept = $.bem.find($dom.offer, 'button');
        $dom.content = $.bem.find($dom.offer, 'content');

        titles = JSON.parse($.html($.bem.find($dom.offer, 'titles')));

        timer = new Timer(tryToShow);

        timer.debounce(10000);

        $.click($dom.close, close);
        $.click($dom.accept, subscribe);
        $.click($dom.content, nextTitle);

        push.on('Enabled', onEnabled);

        addVisitCount(1);
    };

    self.destroy = function() {
        push.off();
        timer.destroy();

        $.off($dom.close);
        $.off($dom.accept);

        $dom = null;
    };

});
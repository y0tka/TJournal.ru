/**
 * Хит (на просмотр) для материалов, отдающихся через API
 */

Air.defineModule('module.entry_hit', 'module.andropov, lib.ajax, lib.DOM, lib.string, module.gallery, module.metrics, module.DOM, fn.mobileAppSend, class.Timer, module.iframe_lazy_load', function(andropov, ajax, $, lib_string, gallery, metr, DOM, mobileAppSend, Timer, iframe_lazy_load) {
    var self = this,
        timer;

    self.hit = function(entry_id) {
        ajax.post( {
            url: '//' + window.__url_domain + '/hit/' + entry_id + '/mobile',
            success: function(resp){
                if (resp.rc === 200) {
                    if ($.find('.views')) {
                        $.html($.find('.views__value'), lib_string.numberFormat(resp.data.count));
                    }
                }
            }
        });
    };

    self.init = function() {

        dealWithLinks();

        andropov.loadImmediately();
        iframe_lazy_load.loadImmediately();

        if (metr.is_android) {
            gallery.detachEvents();
            gallery.showArrows(true);
        }

        timer = new Timer(self.timerHandler.bind(this), 500);

        mobileAppSend('document_resize', metr.document_height);
        // _log('Send docuemnt height to mobile:', metr.document_height);

        DOM.on('Document resized', function () {
            timer.debounce();
        });

        self.hit($.data(self.elements[0].element, 'entry-id'));
    };

    self.timerHandler = function () {
        mobileAppSend('document_resize', metr.document_height);
        // _log('Send docuemnt height to mobile:', metr.document_height);
    };

    var dealWithLinks = function () {
        var links = $.findAll('a[href*="/tag/"], a[href*="/u/"]');

        $.each(links, function (link) {
            $.attr(link, 'target', '_blank');
        });

        $.off( document, 'click.module_ajaxify' );

    };

});

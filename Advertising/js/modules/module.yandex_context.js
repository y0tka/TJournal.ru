Air.define('module.yandex_context', 'lib.DOM', function($, util) {
    var self = this,
        yandex_context_in_progress = false,
        yandex_context_loaded = false,
        n = 'yandexContextAsyncCallbacks';

    var initYandeContext = function (callback) {

        if (yandex_context_loaded === false && yandex_context_in_progress === false) {

            yandex_context_in_progress = true;

            window[n] = window[n] || [];

            window[n].push(function () {
                yandex_context_in_progress = false;
                yandex_context_loaded = true;

                callback && callback();
            });

            var t = document.getElementsByTagName("script")[0];
            var s = document.createElement("script");
            s.type = "text/javascript";
            s.src = "//an.yandex.ru/system/context.js";
            s.async = true;
            t.parentNode.insertBefore(s, t);

            // util.requireScript('//an.yandex.ru/system/context.js', null, true);

        } else if (yandex_context_loaded === true ) {

            callback && callback();

        }

    };

    self.render = function (data) {

        initYandeContext(function () {

            var pr = Math.floor(Math.random() * 4294967295) + 1;

            Ya.Context.AdvManager.render({
                blockId: data.block_id,
                renderTo: data.render_to,
                inpage: {
                    slide: true,
                    visibleAfterInit: false,
                    adFoxUrl: data.adfox_url + pr,
                    insertAfter: 'undefined',
                    insertPosition: '0'
                }
            }, function callback(params) {
                // _log('------------', params);
            });

        });

    };

});

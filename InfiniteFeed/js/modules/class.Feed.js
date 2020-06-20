Air.define('class.Feed', 'lib.DOM, class.ScrollManager, module.smart_ajax, module.sticky, module.telegram, module.entry, module.gallery, module.evaluate_script, module.quiz, module.andropov, module.andropov_audio, module.iframe_lazy_load', function($, ScrollManager, smart_ajax, sticky_module, module_telegram, module_entry, module_gallery, evaluate_script, module_quiz, andropov, andropov_audio, iframe_lazy_load, util) {

    function Feed(params) {
        this.$dom = {
            feed: params.element,
            container: $.bem.find(params.element, 'container'),
            horizon: $.bem.find(params.element, 'horizon')
        };

        this.data = {
            id: $.data(this.$dom.feed, 'feed-id'),
            more_url: $.data(this.$dom.feed, 'feed-more-url'),
            last_id: parseInt($.data(this.$dom.feed, 'feed-last-id')),
            last_loaded_id: null
        };

        if (this.isLoadingAvailable()) {
            this.scroll_manager = new ScrollManager({
                selector: this.getHorizonSelector(),
                throttle: 100,
                offset: $.windowHeight() * 2,
                events: {
                    onEnter: this.onHorizonVisible.bind(this)
                }
            });
        } else {
            this.hideHorizon(true);
        }
    }

    Feed.prototype.getLastId = function() {
        return this.data.last_id;
    };

    Feed.prototype.setLastId = function(id) {
        this.data.last_id = id;
    };

    Feed.prototype.getLastLoadedId = function() {
        return this.data.last_loaded_id;
    };

    Feed.prototype.setLastLoadedId = function(id) {
        this.data.last_loaded_id = id;
    };

    Feed.prototype.isLastIdsSame = function() {
        return this.getLastId() === this.getLastLoadedId();
    };

    Feed.prototype.isLoadingAvailable = function() {
        return this.getLastId() > 0;
    };

    Feed.prototype.destroy = function() {
        if (this.scroll_manager) {
            this.scroll_manager.destroy();
        }

        this.data = null;
        this.$dom = null;
    };

    Feed.prototype.getHorizonSelector = function() {
        return `#feed_horizon_${this.data.id}`;
    };

    Feed.prototype.hideHorizon = function(state) {
        $.bem.toggle(this.$dom.horizon, 'hidden', state);
    };

    Feed.prototype.checkHorizon = function() {
        if (!this.isLoadingAvailable()) {
            this.hideHorizon(true);
            this.scroll_manager.destroy();
            this.scroll_manager = null;
        }
    };

    Feed.prototype.requestContent = function(url, callback) {
        smart_ajax.get({
            url: url,
            dataType: 'json',
            data: {
                mode: 'raw'
            },
            complete: callback
        });
    };

    Feed.prototype.loadContent = function(callback) {
        let that = this;

        if (this.isLoadingAvailable() && !this.isLastIdsSame()) {

            this.setLastLoadedId(this.getLastId());

            this.requestContent(this.getMoreUrl(), function(result, error) {
                if (error) {
                    that.setLastId(0);
                    callback(null, error);
                } else {
                    that.setLastId(result.last_id);
                    callback(result.items_html);
                }

            });
        } else {
            callback(null);
        }
    };

    Feed.prototype.onHorizonVisible = function() {
        let that = this;

        this.loadContent(function(html) {
            if (html) {
                that.appendHtml(html);
            }

            that.checkHorizon();
        });
    };

    Feed.prototype.appendHtml = function(html) {
        let $chunk = $.parseHTML(`<div class="feed__chunk"></div>`);

        $.html($chunk, html);

        $.append(this.$dom.container, $chunk);

        sticky_module.refresh();
        module_telegram.refresh();
        module_entry.refresh();
        module_gallery.refresh();
        evaluate_script.refresh();
        module_quiz.refresh();
        andropov.refresh();
        andropov_audio.refresh();
        iframe_lazy_load.refresh();
    };

    Feed.prototype.makeUrl = function(url, last_id) {
        url = url.replace(/&amp;/g, '&');

        if (url.indexOf('?') > 0) {
            url = url.split('?');

            url[ 0 ] += '/' + last_id;

            url = url.join('?');
        } else {
            url += '/' + last_id;
        }

        return url;
    };

    Feed.prototype.getMoreUrl = function() {
        return this.makeUrl(this.data.more_url, this.data.last_id);
    };

    return Feed;

});
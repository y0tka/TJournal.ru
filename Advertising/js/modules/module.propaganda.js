Air.define('module.propaganda', 'class.Fabric, module.DOM, lib.DOM, module.metrics, module.adblock_detector, module.auth_data, module.targeting, fn.extend, module.yandex_context, module.ajaxify', function(Fabric, DOM, $, metrics, adblock, auth_data, targeting, extend, yandex_context, ajaxify, util) {
    var self = this,
        fabric,
        banners_json,
        custom_domain;

    /** Adfox banner constructor */
    var AdfoxBanner = function (config, element, id) {

        this.config = config;

        this.element = element;

        this.provider_data = config[config.provider];

        this.banner_id = id;

        this.id = 'propaganda_' + util.uid();

        $.attr(this.element, 'id', this.id);

    };

    AdfoxBanner.prototype.init = function() {
        var that = this;

        this.provider_data.containerId = this.id;

        if (custom_domain) {

            this.provider_data.customDomain = custom_domain;

        }

        this.provider_data.onLoad = function(data) {

        };

        this.provider_data.onRender = function() {
            var empty_banner = $.find(that.element, '[src*="banners.adfox.ru/transparent.gif"]');

            if (!empty_banner) {

                $.addClass(that.element, 'propaganda--shown');

                self.trigger('Propaganda shown', {
                    id: that.banner_id,
                    container_id: that.id,
                    element: that.element
                });

            } else {

                that.provider_data.onStub();

            }

            empty_banner = null;
        };

        this.provider_data.onStub = function() {
            $.addClass(that.element, 'propaganda--empty');

            self.triggerOnce('Propaganda empty', {
                id: that.banner_id,
                container_id: that.id,
                element: that.element
            });
        };

        this.provider_data.onError = function(error) {
            $.addClass(that.element, 'propaganda--error');

            self.triggerOnce('Propaganda error', {
                id: that.banner_id,
                container_id: that.id,
                element: that.element
            });
        };

        this.provider_data.params = extend({}, this.provider_data.params, targeting.get());

        if (this.config.adfox_method == undefined) {
            this.config.adfox_method = 'createScroll';
        }

        this.instance = window.Ya.adfoxCode[this.config.adfox_method](this.provider_data, this.config.adaptive, {
            tabletWidth: 1024,
            phoneWidth: 679,
            isAutoReloads: true
        });

    };

    AdfoxBanner.prototype.refresh = function() {

        this.destroyInstance();

        this.init();
    };

    AdfoxBanner.prototype.reload = function() {
        if ( this.instance ) {
            this.instance.reload();
        }
    };

    AdfoxBanner.prototype.destroy = function() {

        this.destroyInstance();

        this.element = this.instance = this.provider_data = this.config = null;

    };

    AdfoxBanner.prototype.destroyInstance = function() {
        if ( this.instance ) {

            try {

                this.instance.destroy();

                this.clear();

            } catch (e) {

                console.warn('Error while destroying adfox banner id="'+ this.banner_id +'"', e);

            }

        }
    };

    AdfoxBanner.prototype.clear = function() {

        var clear_classes = ['empty', 'error', 'shown'],
            element = this.element;

        clear_classes.forEach(function (clear_class) {

            $.bem.toggle(element, clear_class, false);

        });

    };

    /** Yandex banner constructor */
    var YandexBanner = function (config, element, id) {

        this.config = config;

        this.element = element;

        this.banner_id = id;

        this.provider_data = config[config.provider];

        $.attr(this.element, 'id', this.provider_data.render_to);
    };

    YandexBanner.prototype.init = function() {

        yandex_context.render({
            block_id: this.provider_data.block_id,
            render_to: this.provider_data.render_to,
            adfox_url: this.provider_data.adfox_url
        });

    };

    YandexBanner.prototype.refresh = function() {

    };

    YandexBanner.prototype.destroy = function() {
        this.element = this.config = this.provider_data = null;
    };

    /** Base constructor */
    var Banner = function(parameters) {
        var banner = this;

        this.element = parameters.element;

        this.banner_id = parseInt($.attr(this.element, 'data-id'));

        this.config = findBannerConfig(this.banner_id);

        this.init();
    };

    Banner.prototype.init = function() {

        if (!this.config.disable) {

            switch (this.config.provider) {

                case 'adfox':

                    this.instance = new AdfoxBanner(this.config, this.element, this.banner_id);

                break;

                case 'yandex':

                    this.instance = new YandexBanner(this.config, this.element, this.banner_id);

                break;

            }

            if ( this.instance ) {
                this.instance.init();
            }

        }

    };

    Banner.prototype.refresh = function() {
        if (this.config.auto_reload && !this.config.disable) {

            this.init();

        }
    };

    Banner.prototype.reload = function() {

        if (!this.config.disable) {

            if ( this.instance ) {
                this.instance.reload();
            }

        }

    };

    Banner.prototype.destroy = function() {
        if (!this.config.disable) {

            if ( this.instance ) {
                this.instance.destroy();
            }

            this.element = this.config = this.instance = null;
        }
    };

    Banner.prototype.destroyInstance = function () {
        if (!this.config.disable) {

            if ( this.instance ) {
                this.instance.destroy();
            }

            this.instance = null;
        }
    };

    var findBannerConfig = function(id) {
        return banners_json.filter(function(banner) {
            return banner.id === id;
        })[0] || {};
    };

    var clearBranding = function () {
        var adfox_branding = $.find('#adfox-branding'),
            adfox_shifter = $.find('#adfox-branding-shifter'),
            adfox_branding_next = $.next(adfox_branding),
            propaganda_container = $.find('.propaganda[data-id="1"]'),
            html = $.find('html');

        $.attr(adfox_branding, 'style', null);

        $.removeClass(adfox_branding, 'adfoxClickable');

        $.html(adfox_branding, '');

        $.attr(adfox_shifter, 'style', null);

        $.removeClass(html, 'm-branding');

        $.html(propaganda_container, '');

        $.css(document.body, 'background-color', '');

        /** Find next to adfox_branding div and check if it shifter div */
        if (adfox_branding_next) {

            if ($.attr(adfox_branding_next, 'class') === undefined && $.html(adfox_branding_next) === '') {

                $.remove(adfox_branding_next)

            }

        }

        adfox_branding = adfox_shifter = html = propaganda_container = adfox_branding_next = null;
    };

    var checkInlineVideoBanner = function () {
        var inline_video_banner = $.find('.inline_video_banner'),
            yandex_video_banner = $.find('.propaganda[data-id="14"]'),
            mobile_banner = $.find('.propaganda[data-id="4"]'),
            tgb_banner = $.find('.propaganda[data-id="3"]'),
            user_data = auth_data.get(),
            is_anonym = user_data === false,
            is_paid = user_data && user_data.is_paid;

        if (inline_video_banner && !is_anonym) {
            $.remove(inline_video_banner);
        }

        if (yandex_video_banner && is_paid) {
            $.remove(yandex_video_banner);
        }

        if (mobile_banner && is_paid) {
            $.remove(mobile_banner);
        }

        if (tgb_banner && is_paid) {
            $.remove(tgb_banner);
        }

        inline_video_banner = yandex_video_banner = mobile_banner = tgb_banner = null;
    };

    var checkAdEnabled = function (callback) {
        var ad_disabled = $.find('noad');

        if (ad_disabled && fabric) {

            fabric.clear();

        }

        if (!adblock.state && !ad_disabled) {

            callback && callback(true);

        }else{

            callback && callback(false);

        }

        ad_disabled = null;
    };

    self.reload = function(propaganda_id) {
        checkAdEnabled(function (state) {

            if (state && fabric) {

                fabric.each(function(element, data) {
                    if (data.banner_id == propaganda_id) {
                        data.reload();
                    }
                });

            }

        })
    };

    self.init = function(callback) {
        var adfox_script_src = 'https://yastatic.net/pcode/adfox/loader.js',
            is_ua = $.attr(document.body, 'data-country-code') === 'UA';

        if (is_ua) {
            /** Чит для Украины */
            adfox_script_src = 'https://d1177nxzmxwomq.cloudfront.net/pcode/adfox/loader_rel.js';

            custom_domain = 'ads.adfox.me';
        }

        checkAdEnabled(function (state) {

            if (state) {

                banners_json = self.elements[0].settings;

                targeting.update();

                checkInlineVideoBanner();

                util.requireScript(adfox_script_src, function(state) {

                    if (state === true && window.Ya !== undefined) {
                        fabric = new Fabric({
                            selector: '.propaganda[data-id]',
                            Constructor: Banner
                        });
                    }

                    callback && callback();
                });

            } else {

                callback && callback();

            }

        });

        /** Clear branding if paid user loggined */
        auth_data.on('Change', function (user_data) {
            if (user_data) {
                if (user_data.is_paid) {
                    clearBranding();
                }
            }
        });

        /** Destroy banner instances before page html changed */
        ajaxify.on('Before page changed', function () {

            checkAdEnabled(function (state) {
                if (state && fabric) {
                    fabric.each(function (element, data) {

                        data.destroyInstance();

                        /** Hardcode for manual clearing branding */
                        if (data.banner_id === 1) {
                            clearBranding();
                        }

                    });
                }
            });

        });
    };

    self.refresh = function(callback) {
        checkAdEnabled(function (state) {
            if (state) {
                targeting.update();
                checkInlineVideoBanner();

                if ( fabric ) {
                    fabric.update();
                }else{
                    self.init();
                }
            }

            callback();
        });
    };

    self.destroy = function(callback) {
        checkAdEnabled(function (state) {
            if (state) {
                if ( fabric ) {
                    fabric.clear();
                }
            }else{
                clearBranding();
            }

            callback();
        });
    };

}, {
    async: true
});

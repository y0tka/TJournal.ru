Air.define('module.image_zoom', 'module.metrics, module.renderer, lib.DOM, fn.mobileAppSend', function (metr, renderer, $, mobileAppSend) {
    const PhotoSwipe = require('vendor/photoswipe');
    const PhotoSwipeUI_Default = require('photoswipe/dist/photoswipe-ui-default');

    this.init = function () {
        this.$dom = {
            pswp: null
        };
    };

    /**
     * Renders DOM-structure if needed
     */
    this.createStructure = function (success, error) {
        var that = this;

        if (this.$dom.pswp === null) {
            renderer.render({
                template: 'photo_swipe',
                onReady: function (el) {
                    that.$dom.pswp = el;

                    that.$dom.pswp_close = $.find(that.$dom.pswp, '.pswp__close_area');

                    $.append(document.body, that.$dom.pswp);

                    success();
                },
                onError: error
            });
        } else {
            success();
        }
    };

    /**
     * Zooms items
     */
    this.zoomIn = function (items, start_index = 0, animation = true) {
        if (metr.is_webview) {
            if (items.length > 1) {
                mobileAppSend('images_click', JSON.stringify({
                    items: items.map( item => item.src ),
                    start: start_index
                }));
            } else {
                mobileAppSend('image_click', items[0].src);
            }
        } else {
            this.createStructure(this.open.bind(this, items.map(this.itemToPhotoSwipeItem), start_index, animation));
        }
    };

    /**
     * Converts items to PhotoSwipe format
     */
    this.itemToPhotoSwipeItem = function (item) {
        return {
            src: item.src,
            msrc: item.preview_src,
            w: item.width,
            h: item.height,
            element: item.element,
            title: item.title
        };
    };

    /**
     * Opens PhotoSwipe
     */
    this.open = function (items, start_index, animation) {
        $.toggleClass(this.$dom.pswp_close, 'l-hidden', items.length === 1);

        (new PhotoSwipe(this.$dom.pswp, PhotoSwipeUI_Default, items, {
            history: false,
            focus: false,
            tapToToggleControls: false,
            clickToCloseNonZoomable: true,
            showAnimationDuration: animation ? 333 : 0,
            hideAnimationDuration: animation ? 333 : 0,
            tapToClose: true,
            getThumbBoundsFn: function (index) {
                /**
                 * Not always swiped items have thumbnail elements
                 * For example, in gallery we have only 5 photos visible, but in PS there can be a lot more
                 */
                if (!items[index].element) {
                    return null;
                }

                var rect = $.rect(items[index].element);

                return {
                    x: rect.left,
                    y: rect.top + $.windowTop(),
                    w: rect.width
                };
            },
            closeElClasses: ['item', 'caption', 'zoom-wrap', 'ui', 'top-bar', 'img', 'close_area'],
            index: parseInt(start_index)
        })).init();
    };
});
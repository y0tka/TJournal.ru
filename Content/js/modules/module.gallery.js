/**
 * Gallery view
 */
 /**
 * @typedef {object} GallerySettings
 * @property {GalleryItem[]} items
 */
 /**
 * @typedef {object} GalleryItem
 * @property {string} title
 * @property {object} image
 * @property {string} image.type   - "image"
 * @property {AndropovImage} image.data - image data
 */
Air.defineModule('module.gallery',
    `lib.DOM, module.image_zoom, class.Image`,
    function($, zoom, AndropovImage) {

        var self = this;

        /**
         * Initialized Galleries
         * @type {Gallery[]}
         */
        var galleries = [];

        class Gallery {

            /**
             * Initialize Gallery
             * @param {HTMLElement} element - gallery holder
             * @param {GallerySettings} settings
             */
            constructor({element, settings}){
                this.element = element;
                this.settings = settings;

                // enable clicks on items
                $.delegateEvent(element, '.gall__item', 'click', (e) => {
                    this.itemClicked(e.target);
                });
            }

            /**
             * Handle clicks on the gallery items
             * @param {HTMLElement} clickedItem
             */
            itemClicked(clickedItem) {
                let itemIndex = clickedItem.dataset.index;
                let items = this.settings.items.map( item => new AndropovImage(item.image.data) );
                let els = $.findAll(this.element, '.gall__item');

                let itemsToZoom = items.map( (item, index) => {
                    return {
                        src: item.getUrl('/resize/1400'),
                        preview_src: item.getUrl('/resize/680'),
                        width: item.width,
                        height: item.height,
                        element: els[index],
                        title: this.settings.items[index].title
                    }
                });

                zoom.zoomIn(itemsToZoom, itemIndex, false);
            }

            destroy(){
                $.off(this.element);

                this.settings = null;
                this.element = null;
            }
        }

        /**
         * Init
         */
        this.init = function() {
            if (self.elements && self.elements.length) {
                galleries = self.elements.map(gallery => new Gallery(gallery));
            }
        };

        /**
         * Refresh
         */
        this.refresh = function() {
            this.destroy();
            this.init();
        };

        /**
         * Destroy
         */
        this.destroy = function() {
            galleries.forEach(gallery => gallery.destroy());
            galleries = [];
        };
    }
);

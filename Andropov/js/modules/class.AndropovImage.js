Air.define( 'class.AndropovImage', 'module.tab, module.image_zoom, lib.DOM, module.lazy_load, lib.andropov', function( tab, image_zoom, $, lazy_load, lib_andropov, util ) {

    function AndropovImage( element ) {
        this.$dom = {
            main: element,
            inner: $.bem.find(element, 'inner'),
            img: null
        };

        this.data = {
            uid: 'andropov_image_' + util.uid(),
            original_src: $.data( element, 'image-src' ),
            // image_type: $.data( element, 'image-type' ),
            used_src: null,
            is_responsive: element.tagName === 'DIV',
            element_width: $.width(element),
            element_height: $.height(element),
            is_zoom_enabled: null,
            original_width: parseInt($.data(element, 'image-width')),
            original_height: parseInt($.data(element, 'image-height')),
            max_width: null,
            max_height: null,
            rendered_width: null,
            rendered_height: null
        };

        let max_width = $.data(element, 'image-max-width');

        if (max_width !== undefined) {
            // this.data.max_width = max_width;
            this.data.rendered_width = Math.min(this.data.element_width, max_width);
        } else {
            this.data.rendered_width = this.data.element_width;
        }

        let max_height = $.data(element, 'image-max-height');

        if (max_height !== undefined) {
            // this.data.max_height = max_height;
            this.data.rendered_height = Math.min(this.data.element_height, max_height);
        } else {
            this.data.rendered_height = this.data.element_height;
        }

        this.data.used_src = lib_andropov.formImageUrl(this.data.original_src, this.data.rendered_width, this.data.rendered_height);
    };

    AndropovImage.prototype.onVisible = function( state ) {
        if ( state === true ) {
            this.load();
        }
    };

    AndropovImage.prototype.zoomIn = function() {
        image_zoom.zoomIn([
            {
                src: this.data.original_src,
                preview_src: this.data.used_src,
                width: this.data.original_width,
                height: this.data.original_height,
                element: this.$dom.main
            }
        ]);
    };

    AndropovImage.prototype.enableZoom = function() {
        if (this.data.is_zoom_enabled === null) {
            if (this.data.original_width > this.data.rendered_width || this.data.original_height > this.data.rendered_height) {
                this.data.is_zoom_enabled = true;
                $.on(this.$dom.main, 'click.' + this.data.uid, this.zoomIn.bind(this));
            } else {
                this.data.is_zoom_enabled = false;
            }

            if (this.data.is_zoom_enabled) {
                $.bem.add(this.$dom.main, 'zoomable');
            }
        }
    };

    AndropovImage.prototype.load = function() {
        if ( this.data.is_responsive === true ) {
            this.appendImage();
        } else {
            this.loadImage();
        }

        this.enableZoom();
    };

    AndropovImage.prototype.appendImage = function() {
        if ( this.$dom.img === null ) {
            this.$dom.img = $.create( 'img' );

            // if (this.data.max_height !== undefined) {
            //     $.css(this.$dom.img, {
            //         'max-height': this.data.max_height + 'px'
            //     });
            // }
            lazy_load.add(this.data.used_src, this.setImageAndRemoveHolderPadding.bind(this));
        }
    };

    AndropovImage.prototype.loadImage = function() {
        var that = this;

        if ( this.$dom.img === null ) {
            this.$dom.img = this.$dom.main;

            lazy_load.add(this.data.used_src, function(src) {
                $.attr(that.$dom.img, 'src', src);
                $.css(that.$dom.main, 'background-color', 'transparent');
            });
        }
    };

    AndropovImage.prototype.setImageAndRemoveHolderPadding = function(src) {
        $.css(this.$dom.inner, 'padding-bottom', 0);
        $.css(this.$dom.inner, 'background-color', 'transparent');

        $.append(this.$dom.inner, this.$dom.img);
        $.attr(this.$dom.img, 'src', src);
    };

    AndropovImage.prototype.destroy = function() {
        $.off(this.$dom.img);
        $.off(this.$dom.main, 'click.' + this.data.uid);

        this.$dom = null;
        this.data = null;
    };

    return AndropovImage;

} );

Air.defineModule('module.subsite_cover', 'module.smart_ajax, module.notify, lib.DOM, class.AndropovUploader, module.auth_data, module.DOM, fn.imgUrl, module.drag', function(smart_ajax, notify, $, AndropovUploader, auth_data, DOM, imgUrl, drag) {
    var self = this,
        dom,
        andropov_uploader_instance = [],
        cover_image_obj = {},
        last_image_top = 0,
        last_image_src,
        uploaded_image_obj,
        is_cover_uploaded_fisrt_time = false;

    var moveCoverImage = function (dy) {
        var image_bcr = $.rect(dom.cover_img),
            crop_bcr = cover_image_obj.crop_bcr,
            image_top = cover_image_obj.image_top,
            prop = 100 / crop_bcr.height;

        if (image_bcr.height > crop_bcr.height) {

            new_top = image_top + dy;

            if (new_top > 0) {
                new_top = 0;
            } else if (Math.abs(new_top) > image_bcr.height - crop_bcr.height) {
                new_top = -(image_bcr.height - crop_bcr.height);
            }

            setCoverImageTop(new_top * prop);

            return new_top * prop;
        }else{
            return 0;
        }
    };

    var setEditMode = function (state) {
        if (dom.draggable) {

            if (state) {

                $.bem.toggle(dom.cover, 'edit_mode', true);

                drag.bind(dom.draggable, {
                    start: dragStartHandler,
                    move: dragMoveHandler,
                    end: dragEndHandler
                });

            }else{

                $.bem.toggle(dom.cover, 'edit_mode', false);

                drag.unbind(dom.draggable);

            }

        }
    };

    var setCoverImage = function (src, add_filter = true) {
        var filter;

        if (add_filter) {
            filter = '-/resize/1600/';
        }else{
            filter = '';
        }

        $.attr(dom.cover_img, 'src', imgUrl(src, filter));
    };

    var getCoverImage = function () {
        return $.attr(dom.cover_img, 'src');
    };

    var setCoverImageTop = function (value) {
        $.css(dom.cover_img, 'top', value + '%');
    };

    var getCoverImageTop = function () {
        return parseInt(dom.cover_img.style.top);
    };

    /**
     * Button handlers
     */
    var settingsHandler = function () {

        last_image_top = getCoverImageTop();

        last_image_src = getCoverImage();

        setEditMode(true);
    };

    var removeHandler = function () {
        smart_ajax.post({
            url: '/subsite/save_settings/' + $.data($.find('.page--subsite'), 'id'),
            data: {
                cover: ''
            },
            success: function( response ) {
                $.bem.toggle(dom.cover, 'first_time', true);
                $.bem.toggle(dom.cover, 'image', false);
                $.bem.toggle(dom.cover, 'can_edit', false);
            },
            error: function( error ) {

            }
        });
    };

    var saveHandler = function (callback) {
        var data = {};

        data.cover_y = getCoverImageTop();

        if (uploaded_image_obj) {
            data.cover = JSON.stringify(uploaded_image_obj.getData());
        }

        smart_ajax.post({
            url: '/subsite/save_settings/' + $.data($.find('.page--subsite'), 'id'),
            data: data,
            success: function( response ) {
                setEditMode(false);
                is_cover_uploaded_fisrt_time = false;
                uploaded_image_obj = null;
            },
            error: function( error ) {

            }
        });

    };

    var cancelHandler = function () {
        if (is_cover_uploaded_fisrt_time) {

            $.bem.toggle(dom.cover, 'first_time', true);
            $.bem.toggle(dom.cover, 'image', false);
            $.bem.toggle(dom.cover, 'can_edit', false);

            is_cover_uploaded_fisrt_time = false;

        }else{
            setCoverImageTop(last_image_top);

            setCoverImage(last_image_src, false);
        }


        setEditMode(false);
    };

    /**
     * Drag handlers
     */
    var dragStartHandler = function () {
        cover_image_obj.crop_bcr = $.rect(dom.cover_crop);
        cover_image_obj.image_top = parseInt($.css(dom.cover_img, 'top'));
    };

    var dragMoveHandler = function (dx, dy) {
        moveCoverImage(dy);
    };

    var dragEndHandler = function (dx, dy) {
        moveCoverImage(dy);
    };

    self.init = function() {
        dom = {};

        dom.cover = $.find('.subsite__cover');
        dom.cover_img = $.find('.subsite__cover img');
        dom.cover_crop = $.find('.subsite__cover__crop');
        dom.cover_uploader = $.findAll('.subsite__cover__add__button, .subsite__cover__button--change');
        dom.draggable = $.find('.subsite__cover__crop--draggable');

        if ( dom.cover_uploader ) {

            $.each(dom.cover_uploader, function (item) {

                andropov_uploader_instance.push(new AndropovUploader({
                    file: {
                        button: item,
                        accept: 'image/*'
                    },
                    handlers: {
                        waiting: function(state) {
                            $.bem.toggle(dom.cover, 'uploading', state);
                        },
                        change: function(items) {
                            if (items.length > 0) {
                                var first_cover = $.find('.subsite__cover--first_time');

                                if (first_cover) {
                                    $.bem.toggle(dom.cover, 'first_time', false);
                                    $.bem.toggle(dom.cover, 'image', true);
                                    $.bem.toggle(dom.cover, 'can_edit', true);

                                    is_cover_uploaded_fisrt_time = true;

                                    last_image_top = 0;
                                }else{
                                    last_image_top = getCoverImageTop();

                                    last_image_src = getCoverImage();
                                }

                                uploaded_image_obj = items[0];

                                setCoverImage(items[0].getImageUrl());

                                $.one(dom.cover_img, 'load', function () {
                                    setCoverImageTop(0);

                                    $.bem.toggle(dom.cover, 'uploading', false);

                                    auth_data.update();

                                    setEditMode(true);

                                    first_cover = null;
                                });
                            }else{
                                notify.success('Не удалось загрузить фотографию');
                                $.bem.toggle(dom.cover, 'uploading', false);
                            }
                        }
                    }
                }));
            });
        }

        DOM.on('cover_settings:click', settingsHandler);

        DOM.on('cover_remove:click', removeHandler);

        DOM.on('cover_save:click', saveHandler);

        DOM.on('cover_cancel:click', cancelHandler);

    };

    self.refresh = function() {
        self.destroy();
        self.init();
    };

    self.destroy = function() {

        if ( andropov_uploader_instance ) {
            andropov_uploader_instance.forEach(function(instance){
                instance.destructor();
                instance = null;
            });

            andropov_uploader_instance = [];
        }

        DOM.off();

        dom = null;
    };

});

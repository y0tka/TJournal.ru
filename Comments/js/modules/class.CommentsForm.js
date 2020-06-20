Air.defineClass( 'class.CommentsForm', 'module.popup, module.DOM, class.AndropovUploader, class.Timer, lib.storage, lib.DOM, fn.validateCommentText, lib.andropov, lib.console', function( module_popup, gDOM, AndropovUploader, Timer, storage, $, validateCommentText, lib_andropov, console, util ) {

    var CommentsForm = function( params ) {
        var that = this;

        this.id = params.id;
        this.storage_name_unsent = 'comments_unsent_' + this.id;

        this.current_replying_id = 0;
        this.current_mode = 'new';
        this.current_inversion = 1;

        this.elements = {
            main: params.element,
            reply_images: $.bem.find( params.element, 'images' ),
            upload_images: $.bem.find( params.element, 'upload_images' ),
            form_user_image: $.bem.find( params.element, 'user_image' ),
            cancel: $.bem.find( params.element, 'cancel' ),
            textarea: $.bem.find( params.element, 'textarea' ),
            reply: $.bem.find( params.element, 'reply' ),
            last_after: $.next(params.element)
        };

        this.handlers = params.handlers || {};

        this.andropov_uploader_instance = new AndropovUploader( {
            file: {
                button: this.elements.upload_images,
                textarea: this.elements.textarea,
                accept: 'image/*, video/mp4, video/x-m4v, video/*'
            },
            link: {
                // button: $button,
                textarea: this.elements.textarea
            },
            limit: params.attach_limit,
            preview: {
                container: this.elements.reply_images,
                size: 80
                // render_class: 'reply_image_item',
            },
            handlers: {
                wait: this.setDisabledState.bind(this)
            }
        } );

        this.text_change_timer = new Timer( this.handleTextChanges.bind( this ) );

        this.DOM = util.inherit( gDOM );

        $.bindTextareaAutoResize( this.elements.textarea, true );

        this.DOM.on( 'comments_input_comment', function() {
            that.text_change_timer.throttle( 100 );
        } );

        this.DOM.on( 'comments_add_comment:click', function() {
            that.submit();
        } );

        this.DOM.on( 'comments_add_comment:key', function( data ) {
            if ( data.is_enter && ( data.is_meta || data.is_ctrl ) ) {
                that.submit();
            }
        } );

        this.DOM.on('comments_popup_attach_service', function (data) {
            module_popup.show({
                template: 'attach_service'
            });
        });

        this.DOM.on('comments_attach_service', function (data) {
            if (that.andropov_uploader_instance.parseText($.val(data.el))) {
                module_popup.hide();
            }
        });

        this.checkUnsent();
    };

    CommentsForm.prototype.destroy = function( params ) {
        this.text_change_timer.destroy();

        this.andropov_uploader_instance.destructor();

        this.DOM.off();

        $.bindTextareaAutoResize( this.elements.textarea, false );
        $.off( this.elements.textarea );
    };

    CommentsForm.prototype.handle = function( name, args ) {
        if (this.handlers !== undefined && this.handlers[name] !== undefined) {
            this.handlers[name].apply(this, args);
        }
    };

    CommentsForm.prototype.setDisabledState = function( state ) {
        $.bem.toggle( this.elements.main, 'disabled', state );
    };

    CommentsForm.prototype.setWaitingState = function( state ) {
        $.bem.toggle( this.elements.main, 'waiting', state );
    };

    CommentsForm.prototype.checkUnsent = function() {
        var unsent = this.getUnsent();

        if (unsent && (unsent.parent_id === this.current_replying_id)) {
            this.setText( unsent.text );
        } else {
            this.setText( '' );
        }
    };

    CommentsForm.prototype.storeUnsent = function( data ) {
        if ( data ) {
            // console.log('comm', 'Form: storeUnsent', data);
            storage.set( this.storage_name_unsent, data, true );
        } else {
            storage.remove( this.storage_name_unsent );
        }
    };

    CommentsForm.prototype.getUnsent = function() {
        return storage.get( this.storage_name_unsent, true );
    };

    CommentsForm.prototype.handleTextChanges = function(store_unsent) {
        var text = this.getText();

        if (store_unsent !== false) {
            if ((text.error_msg === null) && (this.current_mode !== 'edit')) {
                this.storeUnsent({
                    text: text.text,
                    parent_id: this.current_replying_id
                });
            } else {
                this.storeUnsent( null );
            }
        }
    };

    CommentsForm.prototype.submit = function() {
        var text_and_media = this.getTextAndMedia();

        if (text_and_media.error_msg === null) {
            switch (this.current_mode) {
                case 'new':
                case 'reply':
                    this.handle('onWantAdd', [{
                        text: text_and_media.text,
                        media: text_and_media.media,
                        id: this.current_replying_id,
                        inversion: this.current_inversion
                    }]);
                    break;

                case 'edit':
                    this.handle('onWantEdit', [{
                        text: text_and_media.text,
                        media: text_and_media.media,
                        id: this.current_replying_id
                    }]);
                    break;
            }
        } else {
            this.handle('onSubmitError', [{
                message: text_and_media.error_msg
            }]);
        }
    };

    CommentsForm.prototype.getTextAndMedia = function() {
        var text = this.getText(),
            media = this.andropov_uploader_instance.getData();

        if (text.error_code === 1 && media.length > 0) {
            text.error_msg = null;
            text.error_code = null;
        }

        text.media = media;

        return text;
    };

    CommentsForm.prototype.getText = function() {
        return validateCommentText($.val( this.elements.textarea ));
    };

    CommentsForm.prototype.setText = function( value ) {
        $.val( this.elements.textarea, value );

        this.handleTextChanges(false);
    };

    CommentsForm.prototype.setTextareaPlaceholder = function( value ) {
        $.attr( this.elements.textarea, 'placeholder', value );
    };

    CommentsForm.prototype.setFocus = function( state ) {
        $.focus( this.elements.textarea, state );
    };

    CommentsForm.prototype.place = function(options) {
        if (options === null) {
            options = {
                mode: 'new'
            };
        }

        this.handle('beforePlaced', [options]);

        this.clear();

        switch (options.mode) {
            case 'new':
                let after_element = options.before === undefined ? this.elements.last_after : options.before;

                $.before( after_element, this.elements.main );
                this.current_inversion = parseInt($.data(after_element, 'inversion'));

                if (options.before !== undefined) {
                    this.elements.last_after = options.before;
                }

                $.bem.toggle( this.elements.main, 'replying', false );
                $.bem.toggle( this.elements.main, 'editing', false );

                this.setTextareaPlaceholder( 'Написать комментарий...' );
                this.setButtonTitle( 'Отправить' );

                this.current_mode = 'new';
                this.current_replying_id = 0;
                break;

            case 'reply':
                $.before( options.before, this.elements.main );

                $.bem.toggle( this.elements.main, 'replying', true );
                $.bem.toggle( this.elements.main, 'editing', false );

                this.setTextareaPlaceholder( 'Написать ответ...'  );
                this.setButtonTitle( 'Ответить' );

                this.current_mode = 'reply';
                this.current_replying_id = options.id;
                this.current_inversion = -1;
                break;

            case 'edit':
                $.before( options.before, this.elements.main );

                $.bem.toggle( this.elements.main, 'replying', false );
                $.bem.toggle( this.elements.main, 'editing', true );

                this.current_mode = 'edit';
                this.current_replying_id = options.id;
                this.current_inversion = 1;

                this.setTextareaPlaceholder( 'Исправить комментарий...' );
                this.setButtonTitle( 'Исправить' );

                this.handle('requireOriginalText', [options.id]);
                break;

            default:
                console.log('comm', 'Form: Invalid place options', options);
        }

        this.setFocus(options.focus === true);
        this.checkUnsent();
        
        this.handle('afterPlaced', [options]);
    };

    CommentsForm.prototype.setButtonTitle = function( value ) {
        $.text( this.elements.reply, value );
    };

    CommentsForm.prototype.clear = function() {
        this.setText( '' );
        this.andropov_uploader_instance.reset();
    };

    CommentsForm.prototype.setUserData = function( data ) {
        if ( data ) {
            $.attr( this.elements.form_user_image, 'src', lib_andropov.formImageUrl(data.avatar_url, 40) );
        }

        $.bem.toggle( this.elements.main, 'user_logged_in', data !== false );
    };

    /*
    CommentsForm.prototype.
     */

    return CommentsForm;

} );

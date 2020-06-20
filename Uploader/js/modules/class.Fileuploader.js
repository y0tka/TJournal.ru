/**
 * @module Fileuploader - uses for AJAX file-uploading
 *
 * @typedef {object} module:Fileuploader.FileUploaderResponse
 * @property {{base64: '', name: '', size: ''}} data
 * @property {{lastModified: number, name: '', size: '', type: ''}} file
 * @property {string} id
 * @property {string} origin - 'file'
 * @property {string} type   - 'image'
 * @property {AndropovImage|AndropovMovie} upload_data
 * @property {undefined} upload_index
 * @property {string} upload_status - 'ready'
 */
Air.defineClass( 'class.Fileuploader',
    'lib.DOM, lib.ajax, module.notify, fn.declineWord, class.Image, class.Movie',
    function( $, ajax, notify, declineWord, AndropovImage, Movie, util ) {

    /**
     * Class constructor.
     * @param {Object} params.
     */
    var Constructor = function( params ) {
        this.init( params );
    };

    /**
     * Initializes class instance.
     */
    Constructor.prototype.init = function( params ) {
        this.element = params.element;

        this.render_parent = params.render_parent;
        this.render_class = params.render_class;

        this.length_limit = params.length || 1;
        this.accept = params.accept;

        this.BYTES_IN_MEGABYTE = 1024 * 1024;
        this.filesize_limit = 20 * this.BYTES_IN_MEGABYTE;

        this.uploading_status_counter = 0;

        this.handlers = {
            onChange: params.onChange,
            onCut: params.onCut,
            onProcess: params.onProcess,
            onError: params.onError
        };

        /**
         * @type {UploadedFile[]}
         */
        this.items = [];
        this.items_length = 0;

        // creating
        this.element_input = $.parseHTML( '<input type="file" '  + ( this.accept ? 'accept="' + this.accept + '"' : '' ) + ' style="position: absolute; z-index: 1; width: 100%; height: 100%; left: 0; top: 0;" ' + ( this.length_limit > 1 ? 'multiple' : '' ) + '>' );

        $.css( this.element_input, {
            'position': 'absolute',
            'z-index': 2,
            'width': '100%',
            'height': '100%',
            'left': 0,
            'top': 0,
            'opacity': 0,
            'cursor': 'pointer'
        } );

        // setting styles
        this.original_position = $.css( this.element, 'position' );

        if ( this.original_position === 'static' ) {
            $.css( this.element, 'position', 'relative' );
        }

        this.original_overflow = $.css( this.element, 'overflow' );

        if ( this.original_overflow !== 'hidden' ) {
            $.css( this.element, 'overflow', 'hidden' );
        }

        // binding
        $.on( this.element_input, 'change', this.onChange.bind( this ) );

        // appending
        $.append( this.element, this.element_input );
    };

    /**
     * Destroys class instance.
     */
    Constructor.prototype.destroy = function() {
        var i;

        /**
         * Prevent error when destroy called when class does not initialized
         */
        if (!this.element_input) {
            return;
        }

        clearTimeout( this.get_timeout );

        $.off( this.element_input, 'change' );

        for ( i = 0; i < this.items_length; i++ ) {
            if ( this.items[ i ] && this.items[ i ].element ) {
                $.off( $.lastChild( this.items[ i ].element ), 'click' );
            }
        }

        $.remove( this.element_input );

        if ( this.original_position === 'static' ) {
            $.css( this.element, 'position', 'static' );
        }

        if ( this.original_overflow !== 'hidden' ) {
            $.css( this.element, 'overflow', this.original_overflow );
        }

        this.element_input = null;
        this.items = null;
    };

    /**
     * Converts list structure to array.
     * @param {*} list.
     */
    Constructor.prototype.toArray = function( list ) {
        return Array.prototype.slice.call( list );
    };

    /**
     * Returns file type.
     * @param {Object} file.
     */
    Constructor.prototype.getFileType = function( file ) {
        var result;

        if ( file.type.indexOf( 'image' ) >= 0 ) {
            result = 'image';
        } else if ( file.type.indexOf( 'video' ) >= 0 ) {
            result = 'video';
        }

        return result;
    };

    Constructor.prototype.setCommonUploadingStatus = function( state ) {
        this.uploading_status_counter += state ? 1 : -1;

        $.bem.toggle( this.element, 'uploading', this.uploading_status_counter > 0 );
    };

    /**
     * Converts file to local item.
     * @param {Object} file.
     */
    Constructor.prototype.makeItemFromFile = function( file ) {
        var that = this;

        return {
            id: util.uid(),
            file: file,
            type: this.getFileType( file ),
            origin: 'file',
            onChangeUploadStatus: function( status ) {
                var state = status !== 'ready';

                that.setCommonUploadingStatus( state );

                if ( this.element ) {
                    $.toggleClass( this.element, that.render_class + '--uploading', state );
                }
            }
        };
    };

    /**
     * Forms error message in case of big file
     * @return {String}
     */
    Constructor.prototype.formSizeErrorMessage = function( filename ) {
        var mb = Math.floor( this.filesize_limit / this.BYTES_IN_MEGABYTE );

        return 'Файл "' + filename + '" превышает размер ' + mb + ' ' + declineWord( mb, [ 'мегабайт', 'мегабайта', 'мегабайт' ] );
    };

    /**
     * Adds new files.
     * @param {Array} files.
     */
    Constructor.prototype.addFiles = function( new_files ) {
        var new_files_length = new_files.length,
            i,
            new_item;

        for ( i = 0; i < new_files_length; i++ ) {
            new_item = this.makeItemFromFile( new_files[ i ] );

            if ( this.isItemOk( new_item ) ) {
                this.items[ this.items_length++ ] = new_item;
            } else {
                notify.error( this.formSizeErrorMessage( new_item.file.name ) );
            }
        }

        new_item = null;

        this.checkLimit();

        this.processAddedItems();
    };

    /**
     * Converts file to local item.
     * @param {Object} file.
     */
    Constructor.prototype.makeItemFromUrl = function( url ) {
        var that = this;

        return {
            id: util.uid(),
            url: url,
            type: 'image',
            origin: 'url',
            onChangeUploadStatus: function( status ) {
                var state = status !== 'ready';

                that.setCommonUploadingStatus( state );

                if ( this.element ) {
                    $.toggleClass( this.element, that.render_class + '--uploading', state );
                }
            }
        };
    };

    /**
     * Adds new files.
     * @param {Array} files.
     */
    Constructor.prototype.addUrls = function( urls ) {
        var that = this,
            length,
            i;

        urls = urls.filter( function( url ) {
            var j;

            for ( j = 0; j < that.items_length; j++ ) {
                if ( that.items[ j ].url === url ) {
                    return false;
                }
            }

            return true;
        } );

        length = urls.length;

        for ( i = 0; i < length; i++ ) {
            this.items[ this.items_length++ ] = this.makeItemFromUrl( urls[ i ] );
        }

        if ( length > 0 ) {
            this.checkLimit();

            this.processAddedItems();
        }
    };

    /**
     * Checks limit of uploaded files.
     */
    Constructor.prototype.checkLimit = function() {
        while ( this.items_length > this.length_limit ) {
            this.remove( this.items[ 0 ] );
        }
    };

    /**
     * Removes item.
     * @param {Object} item.
     */
    Constructor.prototype.remove = function( item ) {
        var i;

        for ( i = 0; i < this.items_length; i++ ) {
            if ( this.items[ i ].id === item.id ) {
                if ( this.items[ i ].element ) {
                    $.off( $.lastChild( this.items[ i ].element ), 'click' );
                    $.remove( this.items[ i ].element );
                }

                this.items.splice( i, 1 );
                this.items_length--;

                break;
            }
        }

        this.triggerChange();
    };

    /**
     * Reset fileuploader.
     */
    Constructor.prototype.reset = function() {
        this.items = [];
        this.items_length = 0;

        this.element_input.value = '';
        if (this.render_parent) {
            this.render_parent.innerHTML = '';
        }

        this.triggerChange();
    };

    Constructor.prototype.triggerChange = function() {
        if ( this.items_length === 0 ) {
            this.element_input.value = '';
        }

        $.bem.toggle( this.element, 'has_items', this.items_length !== 0 );

        if ( this.handlers.onChange ) {
            this.handlers.onChange( this.items );
        }
    };

    /**
     * Passes to callback files data.
     * @param {Function} callback.
     */
    Constructor.prototype.get = function( callback ) {
        var is_all_uploaded = true,
            i,
            upload_data = [];

        clearTimeout( this.get_timeout );

        for ( i = 0; i < this.items_length; i++ ) {
            if ( this.items[ i ].upload_status !== 'ready' ) {
                is_all_uploaded = false;
                break;
            } else {
                upload_data[ i ] = this.items[ i ].upload_data;
            }
        }

        if ( is_all_uploaded === true ) {
            callback( upload_data );
        } else {
            this.get_timeout = setTimeout( this.get.bind( this ), 100, callback );
        }
    };

    Constructor.prototype.processAddedItems = function( event ) {
        var that = this;

        if ( this.handlers.onProcess ) {
            this.handlers.onProcess( true );
        }

        if ( that.render_parent ) {
            $.css( that.render_parent, 'pointer-events', 'none' );

            this.render( this.render_class, function( items ) {
                items.forEach( function( item ) {
                    $.append( that.render_parent, item.element );
                } );

                that.upload( function( state ) {
                    $.css( that.render_parent, 'pointer-events', 'auto' );

                    if ( that.handlers.onProcess ) {
                        that.handlers.onProcess( false );
                    }

                    if ( state ) {
                        that.triggerChange();
                    } else {
                        notify.error('Мы пытались загрузить файл, но ничего не вышло, увы');

                        if ( that.handlers.onError ) {
                            that.handlers.onError( that.items );
                        }
                    }
                } );
            } );
        } else {
            that.retriveFilesData( function( items ) {
                that.upload( function( state ) {

                    if ( that.handlers.onProcess ) {
                        that.handlers.onProcess( false );
                    }

                    if ( state ) {
                        that.triggerChange();
                    } else {
                        notify.error('Мы пытались загрузить файл, но ничего не вышло, увы');

                        if ( that.handlers.onError ) {
                            that.handlers.onError( that.items );
                        }
                    }
                } );
            } );
        }
	};

    /**
     * Calls when fileuploader changes files list.
     * @param {Object} event.
     */
    Constructor.prototype.onChange = function( event ) {
        this.addFiles( this.toArray( event.target.files ) );
	};

    /**
     * Uploades files to server.
     * @param {Array} files.
     * @param {Function} callback.
     */
    Constructor.prototype.uploadFiles = function( files, callback ) {
        if ( files.length > 0 ) {
            ajax.post( {
                url: '/andropov/upload',
                dataType: 'json',
    			format: 'MFD',
    			data: {
                    file: files
                },
    			success: function( response ) {
                    if ( response && response.result ) {
                        callback( response.result );
                    } else {
                        callback( false );
                    }
    			},
    			error: function() {
    				callback( false );
    			}
            } );
        } else {
            callback( [] );
        }
    };

    /**
     * Uploades files to server.
     * @param {Array} files.
     * @param {Function} callback.
     */
    Constructor.prototype.uploadUrls = function( urls, callback ) {
        if ( urls.length > 0 ) {
            ajax.post( {
                url: '/andropov/upload/urls',
                dataType: 'json',
    			data: {
                    urls: urls
                },
    			success: function( response ) {
                    if ( response && response.result ) {
                        callback( response.result );
                    } else {
                        callback( false );
                    }
    			},
    			error: function() {
    				callback( false );
    			}
            } );
        } else {
            callback( [] );
        }
    };

    /**
     * Checks file sizes.
     * @param {Object} item.
     * @return {Boolean} True if ok.
     */
    Constructor.prototype.isItemOk = function( item ) {
        var is_ok = true;

        switch ( item.origin ) {
            case 'file':
                is_ok = item.file.size <= this.filesize_limit;
                break;
        }

        return is_ok;
    };

    /**
     * Checks is item uploaded to server.
     * @param {Object} item.
     * @return {Boolean} True if uploaded.
     */
    Constructor.prototype.isItemNotUploaded = function( item ) {
        return item.upload_status === undefined;
    };

    Constructor.prototype.itemIsFile = function( item ) {
        return item.origin === 'file';
    };

    Constructor.prototype.itemIsUrl = function( item ) {
        return item.origin === 'url';
    };

    /**
     * Changes upload status and calls handler.
     * @param {Object} item.
     * @return {number} i - Item index.
     */
    Constructor.prototype.prepareItemForUploading = function( item, i ) {
        item.upload_index = i;
        item.upload_status = 'pending';

        if ( item.onChangeUploadStatus ) {
            item.onChangeUploadStatus( 'pending' );
        }

        return item;
    };

    Constructor.prototype.dealWithItemsStatusesAfterFail = function() {
        var j;

        for ( j = this.items_length - 1; j >= 0; j-- ) {
            this.items[ j ].upload_index = undefined;
            this.items[ j ].upload_status = 'failed';

            if ( this.items[ j ].onChangeUploadStatus ) {
                this.items[ j ].onChangeUploadStatus( 'ready' );
            }

            this.remove( this.items[ j ] );
        }
    };

    Constructor.prototype.dealWithItemsStatusesAfterSuccess = function( response ) {
        var i,
            j,
            length;
    
        for ( i = 0, length = response.length; i < length; i++ ) {
            for ( j = 0; j < this.items_length; j++ ) {
                if ( this.items[ j ].upload_index === i ) {

                    /**
                     * @type {AndropovFile}
                     */
                    let file;

                    switch (response[i].type){
                        case 'image': file = new AndropovImage(response[i].data); break;
                        case 'movie': file = new Movie(response[i].data); break;
                        default: file = response[i];
                    }

                    this.items[ j ].upload_data = file;
                    this.items[ j ].upload_index = undefined;
                    this.items[ j ].upload_status = 'ready';

                    if ( this.items[ j ].onChangeUploadStatus ) {
                        this.items[ j ].onChangeUploadStatus( 'ready' );
                    }

                    break;
                }
            }
        }
    };

    Constructor.prototype.dealWithItemsStatusesAfterUpload = function( fileData, callback ) {
        if ( fileData ) {
            this.dealWithItemsStatusesAfterSuccess( fileData );

            if ( callback ) {
                callback( true );
            }
        } else {
            this.dealWithItemsStatusesAfterFail();

            if ( callback ) {
                callback( false );
            }
        }
    };

    Constructor.prototype.getItemFile = function( item ) {
        return item.file;
    };

    Constructor.prototype.getItemUrl = function( item ) {
        return item.url;
    };

    /**
     * Uploades all unuploaded items to server.
     * @param {Function} callback.
     */
    Constructor.prototype.upload = function( callback ) {
        var that = this,
            items_to_upload = this.items.filter( this.isItemOk.bind( this ) ).filter( this.isItemNotUploaded ),
            files_to_upload = items_to_upload.filter( this.itemIsFile ).map( this.prepareItemForUploading ).map( this.getItemFile ),
            urls_to_upload = items_to_upload.filter( this.itemIsUrl ).map( this.prepareItemForUploading ).map( this.getItemUrl ),
            upload_counter = 0,
            upload_counter_success = 0;

        var localCallback = function( state ) {
            upload_counter++;

            if ( state ) {
                upload_counter_success++;
            }

            if ( upload_counter === 2 ) {
                callback( upload_counter === upload_counter_success );
            }
        };

        this.uploadFiles( files_to_upload, function( response ) {
            that.dealWithItemsStatusesAfterUpload( response, localCallback );
        } );

        this.uploadUrls( urls_to_upload, function( response ) {
            that.dealWithItemsStatusesAfterUpload( response, localCallback );
        } );
    };

    /**
     * Retrives base64 from item[origin=file].
     * @param {Object} item.
     * @param {Function} callback.
     */
    Constructor.prototype.retriveImageDataFromFile = function( item, callback ) {
        var reader;

        if ( window.FileReader ) {
            reader = new FileReader();

            if ( item.file.type.indexOf( 'image' ) >= 0 ) {
                // Если исходный файл картинка, то достаем из него base64.
                reader.onload = function ( event ) {
                    item.data.base64 = event.target.result;
                    callback( item );
                };

                reader.readAsDataURL( item.file );
            } else if ( item.file.type.indexOf( 'video' ) >= 0 ) {
                // Если исходный файл видео, то загоняем его в канвас и достаем картинку из последнего.
                _log('<Retrive video image> It\'s video');
                if ( window.Blob && window.URL ) {
                    _log('<Retrive video image> Read file');
                    reader.onload = function() {
                        _log('<Retrive video image> Onload file');
                        var blob = new Blob( [ event.target.result ], { type: item.file.type }),
                            url = URL.createObjectURL( blob ),
                            video_element = $.create( 'video' );

                        var onTimeUpdated = function() {
                            var image = snapImage();

                            _log('<Retrive video image> onTimeUpdated, image length:' + image.length);

                            $.off( video_element, 'loadeddata' );
                            $.off( video_element, 'timeupdate' );
                            video_element.pause();
                            video_element = null;

                            item.data.base64 = image;
                            callback( item );
                        };

                        var snapImage = function() {
                            var canvas_element = $.create( 'canvas' ),
                                image,
                                image_element;
                            _log('<Retrive video image> snapImage');
                            canvas_element.width = video_element.videoWidth;
                            canvas_element.height = video_element.videoHeight;

                            canvas_element.getContext( '2d' ).drawImage( video_element, 0, 0, canvas_element.width, canvas_element.height);

                            return canvas_element.toDataURL();
                        };

                        $.on( video_element, 'loadeddata', onTimeUpdated );
                        $.on( video_element, 'timeupdate', onTimeUpdated );

                        video_element.preload = 'metadata';
                        video_element.src = url;
                        video_element.muted = true;
                        video_element.playsInline = true;
                        video_element.play();
                    };

                    reader.readAsArrayBuffer( item.file );
                } else {
                    callback( item );
                }
            } else {
                callback( item );
            }

        } else {
            callback( item );
        }
    };

    Constructor.prototype.retriveItemData = function( item, callback ) {
        switch ( item.origin ) {
            case 'file':
                this.retriveImageDataFromFile( item, callback );
                break;

            case 'url':
                callback( item );
                break;

            default:
                callback( false );
        }
    };

    /**
     * Retrives data from items.
     * @param {Function} callback.
     */
    Constructor.prototype.retriveFilesData = function( callback ) {
        var that = this,
            i,
            counter = 0,
            item;

        var localCallback = function( item ) {
            counter++;

            if ( counter === that.items_length ) {
                callback();
            }
        };

        for ( i = 0; i < this.items_length; i++ ) {
            item = this.items[ i ];

            if ( item.data === undefined ) {
                item.data = {};

                switch ( item.origin ) {
                    case 'file':
                        item.data.name = item.file.name;
                        item.data.size = this.getFileSize( item.file );
                        break;

                    case 'url':
                        item.data.name = item.url.split( '/' ).pop();
                        item.data.size = 'unknown';
                        break;
                }

                switch ( item.type ) {
                    case 'image':
                    case 'video':
                        this.retriveItemData( this.items[ i ], localCallback );
                    break;

                    default:
                        localCallback( item );
                        // nothing
                }
            } else {
                localCallback( item );
            }
        }

        if ( that.items_length === 0 ) {
            callback();
        }
    };

    /**
     * Returns formatted file size.
     * @param  {Object} file.
     */
    Constructor.prototype.getFileSize = function( file ) {
        var result,
            bytes = file.size || 0,
            k_bytes = Math.floor( bytes / 1000 ),
            m_bytes = Math.floor( 10 * k_bytes / 1000 ) / 10;

        if ( m_bytes >= 1 ) {
            result = m_bytes + 'Mb';
        } else if ( k_bytes >= 1 ) {
            result = k_bytes + 'kb';
        } else {
            result = bytes + 'bytes';
        }

        return result;
    };

    /**
     * Creates DOM element for item.
     * @param {String} classname - classname for element.
     * @param {Object} item.
     */
    Constructor.prototype.renderItem = function( classname, item ) {
        var that = this,
            item_classname = classname ? ( classname + ' ' + classname + '--type-' + item.type ) : '',
            content_html,
            html,
            element,
            element_remove,
            preview_src;

        switch ( item.type ) {
            case 'image':
            case 'video':
                switch ( item.origin ) {
                    case 'file':
                        preview_src = item.data.base64;
                        break;

                    case 'url':
                        preview_src = item.url;
                        break;
                }

                content_html = '<img class="' + classname + '__content" src="' + preview_src + '">';
            break;

            default:
                content_html = '<div class="' + classname + '__content"></div>';
        }

        // content_html += '<p class="' + classname + '__name">' + item.data.name + '</p>';
        // content_html += '<p class="' + classname + '__size">' + item.data.size + '</p>';
        content_html += '<p class="' + classname + '__remove"></p>';

        element = $.parseHTML( '<div class="' + item_classname + '">' + content_html + '</div>' );
        element_remove = $.lastChild( element );

        $.on( element_remove, 'click' , function( event ) {
            event.stopPropagation();

            that.remove( item );
        } );

        return element;
    };

    /**
     * Creates DOM-elements for items and appends into specified container.
     * @param {String} classname.
     * @param {Function} callback.
     */
    Constructor.prototype.render = function( classname, callback ) {
        var that = this;

        if ( callback === undefined ) {
            callback = classname;
            classname = undefined;
        }

        classname = classname || '';

        this.retriveFilesData( function() {
            var i;

            for ( i = 0; i < that.items_length; i++ ) {
                if ( that.items[ i ].element === undefined ) {
                    that.items[ i ].element = that.renderItem( classname, that.items[ i ] );
                }
            }

            callback( that.items );
        } );
    };

    return Constructor;
} );

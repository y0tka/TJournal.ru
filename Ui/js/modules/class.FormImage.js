/**
 * TODO: check destroy
 */
Air.defineClass( 'class.FormImage', 'class.AndropovUploader, lib.DOM', function( AndropovUploader, $, util ) {

    var FormImage = function( params, handlers ) {
        this.init( params, handlers );
    };

    FormImage.prototype.init = function( params, handlers ) {
        this.uid = util.uid();
        this.elements = {};
        this.handlers = handlers || {};

        this.elements.original_input = params.element;

        this.createStructure();
    };

    FormImage.prototype.createStructure = function() {
        var that = this,
            value = $.val( this.elements.original_input );

        this.classname = 'image';

        this.elements.container = $.parseHTML( `<div class="${this.classname}">
                <div class="${this.classname}__upload">${$.svgHtml('ui_load_image', 42, 36)}</div>
                <div class="${this.classname}__uploaded"></div>
            </div>` );

        this.elements.upload = $.bem.find( this.elements.container, 'upload' );
        this.elements.uploaded = $.bem.find( this.elements.container, 'uploaded' );

        $.after( this.elements.original_input, this.elements.container );

        // {
		// 	element: this.elements.upload,
		// 	render_parent: this.elements.uploaded,
		// 	render_class: `${this.classname}__uploaded__item`,
		// 	length: 1,
		// 	accept: 'image/*',
		// 	onProcess: function( state ) {
        //     },
        //     onChange: function( items ) {
        //
        //
        //     }
		// }

        this.andropov_uploader_instance = new AndropovUploader({
            file: {
                button: this.elements.upload,
                accept: 'image/*'
            },
            preview: {
                container: this.elements.uploaded,
                size: 82
            },
            handlers: {
                waiting: function(state) {

                },
                change: function(items) {
                    var value = '';

                    if ( items[ 0 ] !== undefined ) {
                        value = items[ 0 ].toString();
                    }

                    $.val( that.elements.original_input, value );

                    if (  that.handlers.onChange ) {
                         that.handlers.onChange( value );
                    }
                }
            }
        });

        if ( value ) {
            this.andropov_uploader_instance.addItem( JSON.parse(value) );
        }
    };

    FormImage.prototype.destroy = function() {
        this.andropov_uploader_instance.destructor();
    };

    // Если картинка загружена
    FormImage.prototype.isValid = function() {
        return $.val( this.elements.original_input ).length > 0;
    };

    /*
    FormImage.prototype. = function() {

    };
     */

    return FormImage;

} );

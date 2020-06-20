/**
 * TODO: check destroy
 * @deprecated - use class.InlineEditor.js with the CodeX Editor and Attaches classes
 */
Air.defineClass( 'class.Microeditor', 'class.AndropovUploader, lib.DOM', function( AndropovUploader, $ ) {

    var Microeditor = function( params ) {
        this.init( params );
    };

    Microeditor.prototype.init = function( params ) {
        this.elements = {};

        this.elements.original_input = params.element;
        this.tab_index = params.tab_index;

        this.createStructure();
    };

    Microeditor.prototype.createStructure = function() {

        var that = this,
            value = this.getValue();

        this.classname = 'microeditor';

        this.elements.main = $.parseHTML( `<div class="${this.classname}">
                <textarea class="${this.classname}__text"></textarea>
                <div class="${this.classname}__attached"></div>
                <div class="${this.classname}__attach">
                    <div class="${this.classname}__attach__image">${$.svgHtml('attach-image', 15, 15)}</div>
                </div>
            </div>` );

        this.elements.text = $.bem.find( this.elements.main, 'text' );
        this.elements.attached = $.bem.find( this.elements.main, 'attached' );
        this.elements.attach_image = $.bem.find( this.elements.main, 'attach__image' );

        $.attr( this.elements.text, 'tabindex', this.tab_index );

        $.on( this.elements.text, 'input', this.onTextChanged.bind( this ) );


        this.andropov_uploader_instance = new AndropovUploader({
            file: {
                button: this.elements.attach_image,
                accept: 'image/*'
            },
            handlers: {
                change: function(items) {
                    that.onImageChanged( items[ 0 ].getData() );
                }
            }
        });

        $.val( this.elements.text, value.text );

        this.andropov_uploader_instance.addUrls( value.images.map( function( data ) {
            return `https://leonardo.osnova.io/${data.uuid}`;
        } ) );

        $.after( this.elements.original_input, this.elements.main );

        $.bindTextareaAutoResize( this.elements.text, true );
    };

    Microeditor.prototype.destroyStructure = function() {
        $.off( this.elements.text );

        this.andropov_uploader_instance.destructor();

        $.bindTextareaAutoResize( this.elements.text, false );
    };

    Microeditor.prototype.onTextChanged = function() {
        this.setValue( {
            text: $.val( this.elements.text )
        } );
    };

    Microeditor.prototype.onImageChanged = function( image ) {
        this.setValue( {
            images: image ? [ image ] : []
        } );
    };

    Microeditor.prototype.getValue = function() {
        return JSON.parse( $.val( this.elements.original_input ) || '{"text": "", "images": []}' );
    };

    Microeditor.prototype.setValue = function( data ) {
        var value = this.getValue();

        if ( data.text !== undefined ) {
            value.text = data.text;
        }

        if ( data.images !== undefined ) {
            value.images = data.images;
        }

        $.val( this.elements.original_input, JSON.stringify( value ) );
    };

    Microeditor.prototype.destroy = function() {
        this.destroyStructure();
    };

    Microeditor.prototype.onChange = function() {
    };

    /*
    Microeditor.prototype. = function() {

    };
     */

    return Microeditor;

} );

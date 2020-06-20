Air.defineModule( 'module.leak', 'module.notify, module.DOM, lib.ajax, module.popup, lib.DOM, lib.string', function( notify, DOM, ajax, popup, $, lib_string ) {
    var self = this,
        elements = null;

    var assimilatePopup = function( popup_element ) {
        elements = {
            form: $.find( popup_element, '.leak_form' ),
            textarea: $.find( popup_element, '.leak_form__text' ),
            file_input: $.find( popup_element, '.leak_form__attach_file input' ),
            attached_file: $.find( popup_element, '.leak_form__attached_file' )
        };

        $.on( elements.file_input, 'change', onFileInputChange.bind( this ) );
    };

    var dissolvePopup = function() {
        $.off( elements.file_input );
        elements = null;
    };

    var onFileInputChange = function() {
        var file = elements.file_input.files[ 0 ],
            name,
            size;

        if ( file ) {
            name = lib_string.cut( file.name, 30 );
            size = Math.round( file.size / 1000 ) + 'КБ';

            if ( size >= 1000 ) {
                size = Math.round( size / 100 ) / 10 + 'МБ';
            }

            $.html( elements.attached_file, '<span class="leak_form__attached_file__name">' + name + '</span><span class="leak_form__attached_file__size">' + size + '</span>' );
        }

        $.bem.toggle( elements.attached_file, 'shown', file !== undefined );
    };

    var getFormData = function() {
        return {
            text: $.val( elements.textarea ),
            file: elements.file_input.files[ 0 ]
        };
    };

    var setWaitState = function( state ) {
        if ( elements ) {
            $.bem.toggle( elements.form, 'waiting', state );
        }
    };

    self.send = function() {
        var data = getFormData();

        if ( data.text || data.file ) {
            setWaitState( true );

            ajax.post( {
                url: '/leak',
                dataType: 'json',
                format: 'MFD',
                data: {
                    text: data.text,
                    file: data.file
                },
                success: function( response ) {
                    notify.success( 'Сообщение отправлено редакции. Спасибо!' );
                    _log( response );
                    popup.hide();
                },
                error: function() {

                },
                complete: function() {
                    setWaitState( false );
                }
            } );
        }
    };

    self.showForm = function( state ) {
        popup.show( {
            template: 'leak_form',
            data: {},
            isNeedConfirm: function() {
                return true;
            },
            onReady: function( popup_element ) {
                assimilatePopup( popup_element );
            },
            onClose: function() {
                dissolvePopup();
            }
        } );
    };

    self.init = function() {
        DOM.on( 'Show leak form', function() {
            self.showForm();
        } );

        DOM.on( 'Leak send', function() {
            self.send();
        } );
    };

    self.refresh = function() {

    };

    self.destroy = function() {
        DOM.off();
    };
} );

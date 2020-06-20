Air.defineModule( 'module.company_edit', 'module.ajaxify, module.notify, class.Form2, lib.DOM', function( ajaxify, notify, Form, $ ) {

    var self = this,
        form_instance = null;

    var initForm = function() {
        form_instance = new Form( {
            element: $.find( '.vacancy_edit__form .form2' ),
            actions: {
                save: {
                    url: '/job/save-company',
                    success: function( result ) {
                        notify.success( 'Изменения сохранены' );
                        ajaxify.goTo( '/job/edit-company/' + result.company_id );
                    },
                    error: function( error ) {
                    }
                }
            }
        } );
    };

    var destroyForm = function() {
        form_instance.destroy();
    };

    self.init = function() {
        initForm();
    };

    self.refresh = function() {
        destroyForm();
        initForm();
    };

    self.destroy = function() {
        destroyForm();
    };

} );

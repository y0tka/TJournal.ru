Air.defineModule('module.vacancy_admin', 'lib.DOM, module.DOM, module.modal_window, module.renderer, module.location, module.smart_ajax, module.notify, module.etc_controls', function($, DOM, modal_window, renderer, location, smart_ajax, notify, etc_controls) {

    var self = this;

    self.init = function() {

        /** Архивировать */
        etc_controls.defineControl({
            name: 'archive_vacancy',
            use: 'button',
            label: 'Архивировать',
            action: function(main_element, callback) {

                modal_window.show({
                    name: 'confirm',
                    data: {
                        title: 'Архивировать?',
                        text: 'Вакансия будет снята с публикации. Это действие необратимо.',
                        button_yes: 'Архивировать',
                        button_no: 'Отмена'
                    },
                    onClose: function (status) {

                        if (status) {

                            smart_ajax.post( {
                                url: '/job/archive/' + $.data(main_element, 'content-id'),
                                data: {},
                                success: function() {
                                    location.reload();
                                },
                                error: function( error ) {
                                    notify.error('Что-то пошло не так');
                                }
                            });

                        }

                    }
                });

                callback(true);
            }
        });

        /** Редактировать */
        etc_controls.defineControl({
            name: 'edit_vacancy',
            use: 'link',
            label: 'Редактировать',
            getHref: function(main_element) {
                return '/job/edit/' + $.data(main_element, 'content-id');
            }
        });

    };

    self.refresh = function() {
        self.destroy();
        self.init();
    };

    self.destroy = function() {

        DOM.off();

    };

} );

Air.defineModule( 'module.vacancy_contacts', 'lib.analytics, lib.DOM, module.DOM, module.smart_ajax', function ( lib_analytics, $, DOM, smart_ajax ) {
    var self = this,
        contacts,
        contacts_button_counter,
        vacancy_id;

    var showContactsHandler = function (data) {
        $.remove(data.el);

        if (vacancy_id) {
            contactsHit(vacancy_id);

            $.bem.toggle(contacts, 'shown', true);

            lib_analytics.sendDefaultEvent('Vacancy — Show contacts — Clicked');
        }

        contacts = null;
    };

    var contactsHit = function (vacancy_id, callback) {
        smart_ajax.post( {
			url: '/job/hit/' + vacancy_id,
			data: {},
            success: function (data) {

            },
            error: function ( error ) {

            }
		} );
    };

    var getHitsCount = function (vacancy_id) {
        smart_ajax.get({
            url: '/job/hits/' + vacancy_id,
            complete: function (data) {
                if ( data && data.count) {
                    $.text(contacts_button_counter, data.count);
                } else {
                    $.remove($.parent(contacts_button_counter));
                }
            }
        });
    };

    self.init = function () {
        contacts = $.find('.vacancy_contacts');
        contacts_button_counter = $.find('.show_vacancy_contact__counter span');
        vacancy_id = $.data(self.elements[0].element, 'vacancy-id');

        getHitsCount(vacancy_id);

        DOM.on('Show contacts:click', showContactsHandler);
    };

    self.refresh = function () {
        self.destroy();
        self.init();
    };

    self.destroy = function () {
        DOM.off();
    };
} );

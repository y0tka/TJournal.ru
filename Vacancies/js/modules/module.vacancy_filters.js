Air.defineModule( 'module.vacancy_filters', 'class.Form2, lib.DOM, module.ajaxify, module.DOM', function( Form, $, ajaxify, DOM ) {
    var self = this,
        form_instance_filters = null,
        form_instance_specs = null,
        vacancy_url = '/job',
        default_filter_url = vacancy_url + '?schedule=0&area=0&city_id=0';

    var initForms = function() {

        form_instance_filters = new Form( {
            element: $.find( '.vacancy_filters' ),
            events: {
                change: function( name, value ) {
                    changeUrl();
                }
            }
        } );

        form_instance_specs = new Form( {
            element: $.find( '.vacancy_specializations' ),
            events: {
                change: function( name, value ) {
                    changeUrl();
                }
            }
        } );

        checkInputVisibility();
    };

    var getFilterUrl = function (callback) {
        form_instance_filters.getValues().then(values => {
            let url = '',
                octet;

            for (octet in values) {
                url += octet + '=' + values[octet] + '&';
            }

            url = vacancy_url + '?' + url.slice(0, -1);

            form_instance_specs.getValues().then(values => {
                let specs = [],
                    val;

                for(val in values) {
                    if (values[val] === true) {
                        specs.push(val);
                    }
                }

                if (specs.length > 0) {
                    url += '&specialization_ids=' + specs.join(',');
                }

                callback(url);

            });

        });
    };

    var changeUrl = function () {
        getFilterUrl(function (url) {
            ajaxify.goTo(url, {
                save_scroll: true
            });
        });
    };

    var checkInputVisibility = function () {
        form_instance_filters.getValues().then( values => {

            form_instance_filters.show( 'city_id', values.area[0] != 2 );

            getFilterUrl(function (url) {
                $.bem.toggle($.find('.vacancy_filters__reset'), 'hidden', default_filter_url === url);
            });

        });
    };

    self.init = function() {
        initForms();
    };

    self.refresh = function() {
        self.destroy();
        self.init();
    };

    self.destroy = function() {
        form_instance_filters.destroy();
        form_instance_specs.destroy();
    };

} );

/**
 * @module renderer
 */
Air.defineModule( 'module.renderer', 'lib.DOM, lib.ajax', function( $, ajax ) {
    var self = this,
        path_to_templates = self.config.path_to_templates,
        templates_storage = {},
        callbacks_storage = {},
        vars_regex_storage = {},
        Mustache = require('mustache');

    self.render = function(params) {
        var rendered_html,
            rendered_elements;

        loadTemplate(params.template, function(template_html) {
            if (template_html) {
                rendered_html = Mustache.render(template_html, params.data || {});
                rendered_elements = $.parseHTML(rendered_html);

                rendered_html = null;

                if (params.el) {
                    $.each(params.el, function(el) {
                        $.html(el, '');

                        $.each(rendered_elements, function(r_el) {
                            $.append(el, r_el);
                        });

                    });
                }

                params.onReady && params.onReady(rendered_elements);
            } else {
                params.onError && params.onError();
            }
        });
    };

    self.replaceVars = function( str, variables ) {
		var var_name,
			s_1 = '\\{{',
			s_2 = '\\}}';

        if ( vars_regex_storage[ '__clear' ] === undefined ) {
            vars_regex_storage[ '__clear' ] = new RegExp( s_1 + '[^' + s_1 + '|' + s_2 + ']*' + s_2, 'g' );
        }

        for ( var_name in variables ) {
            if ( vars_regex_storage[ var_name ] === undefined ) {
                vars_regex_storage[ var_name ] = new RegExp( s_1 + var_name + s_2, 'g' );
            }

			str = str.replace( vars_regex_storage[ var_name ], variables[ var_name ] );
		}

		str = str.replace( vars_regex_storage[ '__clear' ], '' );

		return str;
	};

    self.refresh = function () {
        Mustache.clearCache();
    };

    var loadTemplate = function(file_name, callback) {
        if (templates_storage[file_name] === undefined && callbacks_storage[file_name] === undefined) {

            // Collect callback by template_name
            callbacks_storage[file_name] = [];
            callbacks_storage[file_name].push(callback);

            ajax.get({
                url: path_to_templates + file_name + '.html',
                data: {
                    v: window.__static_version
                },
                success: function(response) {
                    templates_storage[file_name] = response;

                    callbacks_storage[file_name].forEach(function(func) {
                        func && func(response);
                    });

                    callbacks_storage[file_name] = undefined;
                },
                error: function() {
                    templates_storage[file_name] = '';

                    callbacks_storage[file_name].forEach(function(func) {
                        func && func('');
                    });

                    callbacks_storage[file_name] = undefined;
                }
            })
        } else if (templates_storage[file_name] === undefined && callbacks_storage[file_name] !== undefined) {
            callbacks_storage[file_name].push(callback);
        } else {
            callback && callback(templates_storage[file_name]);
        }
    };
} );

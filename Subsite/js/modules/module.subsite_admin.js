Air.defineModule( 'module.subsite_admin', 'module.DOM, module.modal_window, module.smart_ajax, module.auth_data, module.etc_controls, module.notify, lib.DOM', function( DOM, modal_window, smart_ajax, auth_data, etc_controls, notify, $ ) {
    var self = this;

    self.changeRole = function (subsite_id, roles) {
        var roles_arr = [],
            role;

        /** Convert roles to array */
        for (role in roles) {
            roles_arr.push({
                id: role,
                name: roles[role].name,
                active: roles[role].active
            });
        }

        modal_window.show({
            name: 'subsite_roles',
            data: {
                roles: roles_arr
            },
            onClose: function (status, selected_role) {
                if (status) {
                    smart_ajax.post({
                        url: '/access/subsite/' + subsite_id,
                        data: {
                            level: selected_role
                        },
                        success: function (response) {
                            notify.success('Права пользователя изменены');
                        },
                        error: function (error) {
                            notify.error('Не удалось изменить права пользователя: ' + error.toLowerCase());
                        }
                    });

                }
            }
        });
    };

    self.init = function() {
        /** Настройки */
        etc_controls.defineControl({
            name: 'settings_subsite',
            use: 'link',
            label: 'Настройки',
            getHref: function(main_element) {
                return $.data(main_element, 'subsite-url') + '/settings';
            }
        });

        /** Смена роли */
        etc_controls.defineControl({
            name: 'change_role',
            use: 'button',
            label: 'Тип пользователя',
            action: function(main_element, callback) {
                self.changeRole($.data(main_element, 'user-id'), JSON.parse($.data(main_element, 'roles') || {}));
                callback(true);
            }
        });

        /** Modal Window Controller for subsite roles */
        modal_window.addController('subsite_roles', function(element, dom_list) {

            this.init = function () {

            };

            this.getData = function () {
                return parseInt(dom_list.subsite_role.val());
            };

        });

    };

    self.refresh = function() {

    };

    self.destroy = function() {

    };
} );

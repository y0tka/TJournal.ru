Air.define('module.comments_admin', 'module.etc_controls, lib.DOM', function(etc_controls, $) {

    var self = this;

    self.init = function() {
        etc_controls.defineControl({
            name: 'edit_comment',
            use: 'button',
            label: 'Редактировать',
            getClickData: function(main_element) {
                return `place_form?to=item&id=${$.data(main_element, 'comment-id')}&mode=edit`;
            }
        });

        etc_controls.defineControl({
            name: 'edit_comment_link',
            use: 'link',
            label: 'Редактировать',
            getHref: function(main_element) {
                let content_id = $.data(main_element, 'content-id');
                let comment_id = $.data(main_element, 'comment-id');
                return `/${content_id}?comment=${comment_id}&mode=edit`;
            }
        });

        etc_controls.defineControl({
            name: 'remove_comment',
            use: 'ajax_button',
            label: 'Удалить',
            url: '/admin/comments/remove',
            getData: function(main_element) {
                return {
                    id: $.data(main_element, 'comment-id'),
                    mode: 'raw'
                };
            },
            msg: {
                confirm: 'Вы действительно хотите удалить этот комментарий?',
                success: 'Комментарий удален',
                error: 'Не удалось удалить комментарий'
            }
        });

        etc_controls.defineControl({
            name: 'complain_comment',
            use: 'ajax_button',
            label: 'Пожаловаться',
            url: '/comments/complain',
            getData: function(main_element) {
                return {
                    content_id: $.data(main_element, 'content-id'),
                    comment_id: $.data(main_element, 'comment-id'),
                    user_id: $.data(main_element, 'user-id'),
                    mode: 'raw'
                };
            },
            msg: {
                success: 'Ваша жалоба отправлена модератору',
                error: 'Не удалось отправить жалобу'
            }
        });

        etc_controls.defineControl({
            name: 'pin_comment',
            use: 'ajax_toggle',
            labels: ['Закрепить', 'Открепить'],
            url: '/admin/comments/pin',
            getData: function(main_element, current_state) {
                return {
                    id: $.data(main_element, 'comment-id'),
                    state: !current_state,
                    mode: 'raw'
                };
            },
            msg: {
                success: ['Комментарий закреплен', 'Комментарий откреплен'],
                error: ['Не удалось закрепить комментарий', 'Не удалось открепить комментарий']
            }
        });
    };

    self.refresh = function() {
        etc_controls.refresh();
    };

});
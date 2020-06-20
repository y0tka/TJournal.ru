/**
 * Author selector
 *
 * Used on /writing page
 *
 */
Air.defineClass(
    'class.AuthorSelector',
    `lib.DOM, class.Dropdown, module.smart_ajax`,
    function ($, Dropdown, smart_ajax) {

        'use strict';

        /**
         * Author selector classnames
         */
        var CSS = {
            dropdown: 'ui_sub_menu',
            dropdownBordered: 'ui_sub_menu--bordered',
            dropdownAutowidth: 'ui_sub_menu--autowidth',
            dropdownLeftArrow: 'ui_sub_menu--left-arrow',
            editorDropdown: 'editor__dropdown',
            editorEditable: 'editor__editable',
            editorEditMode: 'editor__edit-mode',
            author: 'editor__author',
            authorName: 'editor__author-name',
            authorPhoto: 'editor__author-photo',
            userOption: 'user-option'
        };

        /**
         * AuthorSelector constructor
         *
         * @param  {Element} options.element      - holder for helper
         * @param  {String} options.inputName     - hidden input name
         * @param  {String} options.placeholder   - input placeholder
         * @param  {String} options.defaultAvatar - default avatar url
         */
        return class AuthorSelector {

            constructor({
                element,
                inputName,
                placeholder,
                defaultAvatar
            }) {

                this.holder = element;
                this.placeholder = placeholder;
                this.defaultAvatar = defaultAvatar;

                this.wrapper = $.make('div', [
                    CSS.editorDropdown,
                    CSS.dropdown,
                    CSS.dropdownBordered,
                    CSS.dropdownAutowidth,
                    CSS.dropdownLeftArrow
                ]);
                this.input = $.make('input', [], {
                    name: inputName,
                    type: 'hidden',
                });

                this.wrapper.appendChild(this.input);
                this.holder.appendChild(this.wrapper);

                /**
                 * Activate editable state
                 */
                this.content = $.find(this.holder, '[name="js-content"]');
                this.content.classList.add(CSS.editorEditable);

                this.getUsers();

                $.on(this.holder, 'click', (event) => this.toggleDropdown(event));

            }

            /**
             * Get users list
             */
            getUsers() {

                smart_ajax.get({
                    url: '/writing/search/users',
                    success: (response) => this.makeDropdown(response),
                    error: (error) => {
                        // module_notify.error( 'Не удалось запросить список модераторов: ' + error.toLowerCase() );
                    }
                });

            }

            /**
             * Make dropdown with users list
             * @param {Array} data - array with users data
             */
            makeDropdown(data) {

                this.dropdown = new Dropdown({
                    element: this.input,
                    items: data,
                    // search_by: ['first_name', 'last_name'],
                    urls: {
                        search: '/writing/search/users',
                        select: '/writing/search/users'
                    },
                    limit: 1,
                    placeholder: this.placeholder,
                    primary_key: 'id',
                    renderFoundItem: (data, search_text) => {

                        let name = data.name || '',
                            photo = data.avatar_url || this.defaultAvatar;

                        /**
                         * Dont use filters for photos delivered from side-servers
                         * @example https://png.cmtt.space/user-userpic/81/85/d9/321f00b52f9390.jpg
                         */
                        let filtersSupported = photo.includes('leonardo') || photo.includes('uploadcare');

                        return `<div class="${CSS.userOption}" data-id="${data.id}">
                                                <img src="${photo}${filtersSupported ? '-/scale_crop/40x40/center/' : ''}">
                                                ${name.replace(new RegExp('(' + search_text + ')', 'gi'), '<b>$1</b>')}
                                            </div>`;
                    },
                    renderSelectedItem: (data) => {

                        /**
                         * Dont use filters for photos delivered from side-servers
                         * @example https://png.cmtt.space/user-userpic/81/85/d9/321f00b52f9390.jpg
                         */
                        let photo = data.avatar_url || this.defaultAvatar;
                        let filtersSupported = photo.includes('leonardo') || photo.includes('uploadcare');

                        /** show new author */
                        this.replaceAuthor({
                            name: data.name || '',
                            photo: `${photo}${filtersSupported ? '-/scale_crop/40x40/center/' : ''}`
                        });

                        /** hide dropdown panel */
                        this.holder.classList.remove(CSS.editorEditMode);

                        return false;
                    }
                });

            }

            /**
             * Changes entry author name and photo
             * @param {Object} userData
             */
            replaceAuthor(userData) {

                let authorName = $.find(this.holder, `.${CSS.authorName}`),
                    authorPhoto = $.find(this.holder, `.${CSS.authorPhoto}`);

                authorName.textContent = userData.name;
                authorPhoto.src = userData.photo;

            }

            /**
             * Toggles dropdown visibility
             * @param {Object} event - click event
             */
            toggleDropdown(event) {

                let clickedEl = event.target;

                /** Allow click on panel */
                if ($.belong(clickedEl, `.${CSS.editorDropdown}`)) {
                    return;
                }

                this.holder.classList.toggle(CSS.editorEditMode);

                this.dropdown.focus();

            }

            /**
             * Remove listeners from holder and destroy dropdown
             */
            destroy() {
                $.off(this.holder);
                this.dropdown.destroy();
            }

        };

    }
);
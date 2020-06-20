/**
 * Publish date input dropdown
 *
 * Used on /writing page
 */
Air.defineClass(
    'class.PublishDate',
    'lib.DOM',
    function ($) {

        'use strict';

        /**
         * Dropdown classnames
         */
        var CSS = {
            dropdown: 'ui_sub_menu',
            dropdownBordered: 'ui_sub_menu--bordered',
            dropdownAutowidth: 'ui_sub_menu--autowidth',
            dropdownLeftArrow: 'ui_sub_menu--left-arrow',
            editorDropdown: 'editor__dropdown',
            editorDateInput: 'editor__date-input',
            editorEditable: 'editor__editable',
            editorEditMode: 'editor__edit-mode',
        };

        /**
         * Toggles dropdown input
         *
         * @class PublishDate
         * @classdesc Makes dropdown input, which allows user to change publish date
         */
        return class PublishDate {

            /**
             * PublishDate constructor
             *
             * @param  {Element} element     - holder for dropdown
             * @param  {string} initialValue - date to fill the input
             * @param {String} placeholder   - input placeholder
             *
             */
            constructor({
                element,
                initialValue,
                placeholder
            }) {

                this.holder = element;

                this.dropdown = $.make('div', [CSS.editorDropdown, CSS.dropdown, CSS.dropdownBordered, CSS.dropdownAutowidth, CSS.dropdownLeftArrow]);
                this.input = $.make('input', [CSS.editorDateInput], {
                    type: 'datetime-local',
                    name: 'date',
                    value: initialValue,
                    placeholder: placeholder
                });

                this.dropdown.appendChild(this.input);

                this.holder.appendChild(this.dropdown);
                this.holder.classList.add(CSS.editorEditable);

                $.on(this.holder, 'click', (event) => this.toggleDropdown(event));

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

            }

            /**
             * Remove listeners from holder
             */
            destroy() {
                $.off(this.holder);
            }

        };

    }
);
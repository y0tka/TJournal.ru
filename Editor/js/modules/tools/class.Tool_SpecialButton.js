Air.defineClass('class.SpecialButton', 'lib.DOM', function($) {

    'use strict';

    /**
     * Plugins View submodule
     * @module SpecialButton
     */
    class SpecialButtonView {

        /**
         * @constructor
         */
        constructor() {
            this.elements = {};
        }

        static get CSS() {
            return {
                specialButtonWrapper : 'special-button',
                specialButtonIcon : 'special-button-icon',
                specialButtonAppearance : 'special-button__appearance',
                specialButtonText : 'special-button__text',
                specialButtonTextColor : 'special-button__text-color',
                specialButtonBackgroundColor : 'special-button__background-color',
                specialButtonUrl : 'special-button__url',

                cdxInput : 'cdx-input',
                cdxTool : 'cdx-tool',
                clearFloat : 'l-clear'
            };
        }

        /**
         * @param {SpecialButtonData} data
         * @returns {string|Element|*}
         */
        drawForm(data = {}) {

            this.elements.formHolder = $.make('DIV', [SpecialButtonView.CSS.cdxTool, SpecialButtonView.CSS.specialButtonWrapper], {});

            this.elements.buttonText = $.make('INPUT', [SpecialButtonView.CSS.specialButtonText, SpecialButtonView.CSS.cdxInput], {
                value: data.text || '',
                placeholder : 'Текст на кнопке'
            });

            this.elements.buttonTextColor = $.make('INPUT', [SpecialButtonView.CSS.specialButtonTextColor, SpecialButtonView.CSS.cdxInput], {
                value: data.textColor || '',
                placeholder : 'Цвет текста с #'
            });

            this.elements.buttonBackground = $.make('INPUT', [SpecialButtonView.CSS.specialButtonBackgroundColor, SpecialButtonView.CSS.cdxInput], {
                value : data.backgroundColor || '',
                placeholder: 'Цвет фона c #'
            });

            this.elements.buttonAppearanceHolder = $.make('DIV', [SpecialButtonView.CSS.specialButtonAppearance, SpecialButtonView.CSS.clearFloat], {});

            this.elements.buttonUrl = $.make('INPUT', [SpecialButtonView.CSS.specialButtonUrl, SpecialButtonView.CSS.cdxInput], {
                value : data.url || '',
                placeholder : 'Ссылка'
            });

            $.append(this.elements.buttonAppearanceHolder, this.elements.buttonText);
            $.append(this.elements.buttonAppearanceHolder, this.elements.buttonBackground);
            $.append(this.elements.buttonAppearanceHolder, this.elements.buttonTextColor);
            $.append(this.elements.formHolder, this.elements.buttonAppearanceHolder);
            $.append(this.elements.formHolder, this.elements.buttonUrl);

            return this.elements.formHolder;
        }
    }

    /**
     * Plugins Model submodule
     */

    /**
     * @typedef {Object} SpecialButtonData
     * @property {String} text - button text
     * @property {String} textColor - color with # (HEXT)
     * @property {String} backgroundColor - color with # (HEXT)
     * @property {String} url - button url
     */
    class SpecialButtonModel {

        /**
         * @constructor
         */
        constructor() {
            this._data = {};
        }

        set data(data = {}) {
            this._data.text = data.text || '';
            this._data.textColor = data.textColor || '';
            this._data.backgroundColor = data.backgroundColor || '';
            this._data.url = data.url || '';

            if (this._data.textColor[0] !== '#') {
                this._data.textColor = '#' + this._data.textColor;
            }

            if (this._data.backgroundColor[0] !== '#') {
                this._data.backgroundColor = '#' + this._data.backgroundColor;
            }

            for(let dataitem in this._data) {
                this._data[dataitem] = this._data[dataitem].trim();
            }

        }

        /**
         * @returns {SpecialButtonData}
         */
        get data() {
            return this._data;
        }

        validateData(elements) {

            let elementsData = {
                text : elements.buttonText.value,
                backgroundColor : elements.buttonBackground.value,
                textColor : elements.buttonTextColor.value,
                url : elements.buttonUrl.value
            };

            this.data = elementsData;

            if (!this.data.text.trim() || !this.data.url.trim()) {
                return false;
            }

            return true;

        }

        /**
         * Returns pure Data
         * @returns {*}
         */
        extractData() {
            return this.data;
        }
    }

    /**
     * Special Button Tool
     *
     * @property {SpecialButtonModel} this.model - plugins model. Contains data
     * @property {SpecialButtonView} this.view - plugins view. Draws plugin elements
     */
    return class SpecialButton {

        static get type() {
            return 'special_button';
        }

        static get title() {
            return 'Партнерская кнопка';
        }

        static get iconClassname() {
            return SpecialButtonView.CSS.specialButtonIcon;
        }

        static get displayInToolbox() {
            return true;
        }

        static get enableLineBreaks() {
            return true;
        }

        static get contentless() {
            return true;
        }

        /**
         * @constructor
         */
        constructor() {
            this.view = new SpecialButtonView();
            this.model = new SpecialButtonModel();
        }

        /**
         * @param {SpecialButtonData} data
         * @returns {string|Element|*}
         */
        render(data) {

            this.model.data = data;
            return this.view.drawForm(data);

        }

        /**
         * @param {Element} wrapper - better to extract data from passed wrapper for correct CMD+Z behaviour
         * @returns {SpecialButtonData}
         */
        save(wrapper) {

            this.view.elements.text = $.find(wrapper, `.${SpecialButtonView.CSS.specialButtonText}`);
            this.view.elements.backgroundColor = $.find(wrapper, `.${SpecialButtonView.CSS.specialButtonBackgroundColor}`);
            this.view.elements.textColor = $.find(wrapper, `.${SpecialButtonView.CSS.specialButtonTextColor}`);
            this.view.elements.url = $.find(wrapper, `.${SpecialButtonView.CSS.specialButtonUrl}`);

            return this.model.extractData();
        }

        validate() {
            return this.model.validateData(this.view.elements);
        }

        destroy() {
            this.model.destroy();
            this.view.destroy();
        }

    }

});

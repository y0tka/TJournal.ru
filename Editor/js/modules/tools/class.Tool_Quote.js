/**
 * «Quote» plugin for CodeX Editor
 */
/**
 * @typedef {object} QuoteToolData
 * @property {string} text          - quote text
 * @property {string} subline1      - quote person's name
 * @property {string} subline2      - quote person's job
 * @property {string} text_size     - 'small', 'medium', 'big'
 * @property {string} type          - 'default', 'centered', 'opinion'
 * @property {{type: string, data: AndropovImage}} image         - quote person's photo
 */
Air.defineClass(
    'class.QuoteTool',
    `lib.DOM, class.Fileuploader, module.notify`,
    function( $ , Fileuploader, notify ) {

        'use strict';

        /**
         * Class names
         */
        const CSS = {
            /**
             * Base classes
             */
            baseToolClass: 'cdx-tool',
            input: 'cdx-input',

            /**
             * Quote tool
             */
            wrapper      : 'quote-tool',
            inputName    : 'quote-tool__name',
            inputJob     : 'quote-tool__job',
            inputQuote   : 'quote-tool__quote',
            photoWrapper : 'quote-tool__photo-wrapper',
            photoEmpty   : 'quote-tool__photo-wrapper--empty',
            photoLoading : 'quote-tool__photo-wrapper--loading',

            toolboxIcon: 'quote-tool__icon',

            settings  : {
                holder     : 'cdx-plugin-settings--horisontal',
                buttons    : 'cdx-plugin-settings__item',
                activeType : 'cdx-plugin-settings__item--active'
            },

            setStyleButton: 'quote-tool__button-style'
        };

        /**
         * Quote types
         * On the server it calls 'size'
         * @type {Object}
         */
        const quoteTypes = [
            {
                name: 'opinion',
                title: 'Мнение',
                icon: 'quote-left',
                default: false
            },
            {
                name: 'centered',
                title: 'По центру',
                icon: 'quote-center',
                default: false
            },
            {
                name: 'default',
                title: 'Основная',
                icon: 'quote-right',
                default: true
            }
        ];

        /**
         * Quote base class
         *
         * @module QuoteTool
         *
         * @typedef {QuoteTool} module.QuoteTool.QuoteTool
         * @property {Object} nodes
         * @property {Element} nodes.wrapper
         * @property {Element} nodes.image
         * @property {Element} nodes.name
         * @property {Element} nodes.job
         * @property {Element} nodes.text
         * @property {module:Fileuploader} uploader    - FileUploader instance
         * @property {QuoteToolData} _data
         */
        return class QuoteTool {

            /**
             * Quote item class
             *
             * @constructor
             *
             */
            constructor() {

                /**
                 * UI nodes cache
                 * @type {Object}
                 */
                this.nodes = {
                    wrapper: null,
                    image: null,
                    name: null,
                    job: null,
                    text: null,
                    styleButtons: []
                };

                /**
                 * @type {FileUploader|null}
                 */
                this.uploader = null;

                /**
                 * Data available with getter 'data'
                 * @type {QuoteToolData}
                 */
                this._data = {
                    text: null,
                    subline1: null,
                    subline2: null,
                    text_size: 'medium',
                    image: null,
                    type: quoteTypes.find( style => style.default ).name,
                };
            }

            /**
             * Tool type
             * @return {string}
             */
            static get type(){
                return 'quote';
            }

            /**
             * Tool title. Uses in toolbar hover helper
             * @return {string}
             */
            static get title(){
                return 'Цитата';
            }

            /**
             * Tool icon CSS classname
             * @return {string}
             */
            static get iconClassname(){
                return CSS.toolboxIcon;
            }

            /**
             * Is need to display in toolbox
             * @return {Boolean}
             */
            static get displayInToolbox(){
                return true;
            }

            /**
             * By ENTER keypress on the contenteditbale field, it will add paragraph, not create new block
             * @return {Boolean}
             */
            static get enableLineBreaks(){
                return true;
            }

            /**
             * Enable to showing inline toolbar
             * @return {Boolean}
             */
            static get inlineToolbar() {
                return true;
            }

            /**
             * Handle this tags on paste
             * @return {Object}
             */
            static get handleTags() {
                return {
                    tags: ['BLOCKQUOTE'], // these tags will rendered as QuoteTool
                    fill: 'text' // this field will be passed from tag innerHTML to the render method
                };
            }

            /**
             * Always highlight even it is empty
             * @returns {boolean}
             */
            static get contentless() {
                return true;
            }

              /**
             * Makes HTML node with passed data
             * @param {QuoteToolData} [quoteData]
             * @return {Element}
             */
            render( quoteData ){

                /**
                 * Make UI
                 */
                this.nodes.wrapper = $.make('div', [CSS.wrapper, CSS.baseToolClass]);
                this.nodes.name  = $.make('div', [CSS.input, CSS.inputName], {
                    contentEditable: true
                });
                this.nodes.job = $.make('div', [CSS.input, CSS.inputJob], {
                    contentEditable: true
                });
                this.nodes.text = $.make('div', [CSS.input, CSS.inputQuote], {
                    contentEditable: true
                });
                this.nodes.image = $.make('div', [CSS.input, CSS.photoWrapper, CSS.photoEmpty]);

                /**
                 * Placeholders
                 */
                this.nodes.name.setAttribute('data-placeholder', 'Имя автора');
                this.nodes.job.setAttribute('data-placeholder', 'Должность');
                this.nodes.text.setAttribute('data-placeholder', 'Текст цитаты');

                /**
                 * Append created nodes
                 */
                this.nodes.wrapper.appendChild(this.nodes.image);
                this.nodes.wrapper.appendChild(this.nodes.name);
                this.nodes.wrapper.appendChild(this.nodes.job);
                this.nodes.wrapper.appendChild(this.nodes.text);

                /**
                 * Fill nodes
                 */
                this.data = quoteData;

                /**
                 * Enable photo uploader
                 */
                $.on(this.nodes.image,'click', (e) => {
                    this.imageClicked(e);
                });
                this.activatePhotoUploader();

                return this.nodes.wrapper;
            }

            /**
             * Set author photo
             * @param {string} photoURL
             */
            setImage(photoURL){

                /**
                 * Dont use filters for photos delivered from side-servers
                 * @example https://png.cmtt.space/user-userpic/81/85/d9/321f00b52f9390.jpg
                 */
                let filtersSupported = photoURL.includes('leonardo') || photoURL.includes('uploadcare');

                let thumbURL = filtersSupported ? photoURL.replace(/\/+$/, '') + '/-/scale_crop/150x150/center/' : photoURL;

                this.nodes.image.classList.remove(CSS.photoEmpty);
                this.nodes.image.style.backgroundImage = `url(${thumbURL})`;
            }

            /**
             * Removes author's photo
             */
            removeImage(){
                this.nodes.image.classList.add(CSS.photoEmpty);
                this.nodes.image.style.backgroundImage = 'none';
                this._data.image = null;
                this.uploader.reset();
            }

            /**
             * Clicks on the photo: remove|upload
             * @param {MouseEvent} e
             */
            imageClicked(e){
                if (this._data.image === null){
                    return true;
                }

                e.preventDefault();
                e.stopImmediatePropagation();
                e.stopPropagation();
                this.removeImage();
            }

            /**
             * Allows to select and upload photo
             */
            activatePhotoUploader () {

                this.uploader = new Fileuploader({
                    element: this.nodes.image,
                    accept: 'image/*',
                    length: 1,
                    onProcess: loading => {

                        if (loading) {
                            this.nodes.image.classList.add(CSS.photoLoading);
                        } else {
                            this.nodes.image.classList.remove(CSS.photoLoading);
                        }

                    },
                    onError: error => {
                        notify.error( 'Не удалось загрузить изображение: ' + error.toLowerCase() );
                    },
                    /**
                     * @param {module:Fileuploader.FileUploaderResponse[]} items
                     */
                    onChange: items => {

                        if (!items.length){ // .reset() triggers onChange with 0 items
                            return;
                        }
                        
                        let uploadedPhotoData = items[0],
                            uploadedImage = uploadedPhotoData.upload_data;

                        if (!uploadedImage) {
                            notify.error( 'Попробуйте другой файл');
                            return;
                        }

                        this.setImage(uploadedImage.url);

                        this._data.image = {
                            type: 'image',
                            data: uploadedImage
                        };

                    }
                });
            }




            /**
             * Tool settings renderer
             * @uses  quoteTypes  - dictionary with available quote types
             */
            makeSettings(){

                var holder  = $.make('div', [CSS.settings.holder]);

                /** Now add style selectors */
                quoteTypes.forEach( style => {

                    let selectTypeButton = $.make('span', [
                            CSS.settings.buttons,
                            CSS.setStyleButton + '--' + style.name,
                        ], {
                            title: style.title
                        }),
                        icon = $.svg(style.icon, 14, 14);

                    selectTypeButton.appendChild(icon);
                    selectTypeButton.dataset.name = style.name;

                    if (this._data.type === style.name) {
                        selectTypeButton.classList.add(CSS.settings.activeType);
                    }

                    selectTypeButton.addEventListener('click', () => {
                        this.changeStyle(event.target.dataset.name);
                    }, false);

                    holder.appendChild(selectTypeButton);

                    /**
                     * Save created button to this.nodes.styleButtons
                     */
                    this.nodes.styleButtons.push(selectTypeButton);

                });

                return holder;

            }

            /**
             * Set quote style
             * @param  {String} style  - name from quoteTypes dictionary
             */
            changeStyle(style){

                this._data.type = style;

                this.nodes.styleButtons.forEach( button => {
                    if (button.dataset.name === style){
                        button.classList.add(CSS.settings.activeType);
                    } else {
                        button.classList.remove(CSS.settings.activeType);
                    }
                });
            }

            /**
             * Saving data validation
             * @param  {QuoteToolData} data
             * @return {Boolean}
             */
            validate( data ){

                if (!data) {
                    return false;
                }

                if (!data.text ) {
                    return false;
                }

                if (!data.text.trim()) {
                    return false;
                }

                return true;
            }

            /**
             * Extract and returns quote data
             * @return {Object}
             */
            get data(){

                /**
                 * Extract data from HTML
                 */
                this.extractEditableData();

                return this._data;

            }

            /**
             * Set passed data in this._data and put it in DOM elements
             * @param {QuoteToolData} quoteData
             */
            set data(quoteData = {}){

                /**
                 * Override defaults this._data with saved data
                 */
                for ( let key in quoteData ) {
                    this._data[key] = quoteData[key];
                }

                /**
                 * Fill DOM
                 */
                if (quoteData.image) {
                    this.setImage('https://leonardo.osnova.io/' + quoteData.image.data.uuid);
                }

                if (quoteData.subline1) {
                    this.nodes.name.innerHTML = quoteData.subline1 || '';
                }

                if (quoteData.subline2) {
                    this.nodes.job.innerHTML = quoteData.subline2 || '';
                }

                if (quoteData.text) {
                    this.nodes.text.innerHTML = quoteData.text || '';
                } else  {
                    let emptyP = $.make('p');
                    emptyP.appendChild(document.createTextNode('\u200B'));
                    this.nodes.text.appendChild(emptyP);
                }

            }

            /**
             * Extracts data drom HTML
             * Updates this.data property
             *
             * this.text
             * this.cite
             * this.caption
             */
            extractEditableData() {

                /**
                 * Contenteditable fields or inputs
                 * @type {Object}
                 */
                let fieldsWithHTML = {
                    text: this.nodes.text,
                    subline1: this.nodes.name,
                    subline2: this.nodes.job
                };

                /**
                 * Sanitizer module config
                 * @type {Object}
                 */
                const sanitizerConfig = {
                    tags : {
                        a: {
                            href: true,
                            target: '_blank',
                            rel: 'nofollow'
                        },
                        b: {},
                        i: {},
                        p: {},
                        br: {},
                        span: el => el.classList.contains('cdx-marked-text'),
                        mark: el => el.classList.contains('cdx-marked-text'),
                    }
                };

                for ( let field in fieldsWithHTML ){
                    let value = fieldsWithHTML[field].innerHTML || fieldsWithHTML[field].value;

                    if ( value ) {
                        value = codex.editor.sanitizer.clean(value, sanitizerConfig , true);
                        value = value.trim();
                    }

                    /**
                     * @fix Backspace on Safari leaves empty br's
                     * So that we need an extra clean
                     */
                    if ( value === "<br>") {
                        value = "";
                    }

                    this._data[field] = value || '';
                }

                /**
                 * @todo  replace with air-module for wrapping text with <p>
                 */
                this._data.text = codex.editor.content.wrapTextWithParagraphs(this._data.text);


                /**
                 * Compute text size that correspondes with quote length
                 */
                let textLength = this.nodes.text.textContent.length;

                if ( textLength > 200 ){
                    this._data.text_size = 'small';
                } else if ( textLength > 100 ){
                    this._data.text_size = 'medium';
                } else {
                    this._data.text_size = 'big';
                }

            }

            /**
             * Extract tool's data from HTML block
             * @param {Element} wrapper - current Block's wrapper
             * @fires this.data getter
             * @return {Object}
             */
            save(wrapper){
                /**
                 * Updates nodes links for correct CMD+Z behaviour
                 */
                this.nodes.wrapper = wrapper;
                this.nodes.name  = $.find(wrapper, `.${CSS.inputName}`);
                this.nodes.job = $.find(wrapper, `.${CSS.inputJob}`);
                this.nodes.text = $.find(wrapper, `.${CSS.inputQuote}`);
                this.nodes.image = $.find(wrapper, `.${CSS.photoWrapper}`);

                return this.data;
            }

            destroy(){

                $.off(this.nodes.image);
                this.nodes.styleButtons.forEach( button => $.off(button) );

                this.nodes = {
                    wrapper: null,
                    image: null,
                    name: null,
                    job: null,
                    text: null,
                    styleButtons: []
                };

                this.style = null;

                this._data = {
                    text: null,
                    subline1: null,
                    subline2: null,
                    text_size: '',
                    image: null,
                    type: null
                };

                if (this.uploader) {
                    this.uploader.destroy();
                }
            }

        };

    }
);

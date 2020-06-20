Air.define( 'module.editableIsland', 'lib.DOM, module.smart_ajax, class.AndropovUploader, module.notify, lib.string, module.renderer, module.DOM, lib.color', function($, ajax, AndropovUploader, notify, libString, renderer, DOM, color, util) {

    'use strict';

    var self = this;

    /**
     * Path for image-uploader and storage service
     * @uses  in image sources with file uuid
     * @type {String}
     */
    const IMG_SERVER_PATH = 'leonardo.osnova.io';

    /**
     * CSS classnames
     * @type {Object}
     */
    var CSS = {
        island          : 'island',
        islandEmpty     : 'island--empty',
        islandOpened    : 'island--opened',
        islandContainer : 'island__container',
        islandList      : 'island__list',
        islandListItem  : 'island__list__item',
        islandListImage : 'island__list__img',
        islandFormTypes: {
            'title-description' : 'island-form--simple',
            'list-type-1': 'island__list--type_1',
            'list-type-2': 'island__list--type_2',
            'hashtag-form' : 'island__list--type-hashtag'
        },
        editToggler     : 'island__header__link',
        hidden          : 'l-hidden',
        form            : {
            holder : 'island-form',
            elements : {
                item     : 'island-form__item',
                input    : 'island-form__input',
                inputShort: 'island-form__input--short',
                inputHashtag: 'island-form__input--hashtag',
                textarea : 'island-form__textarea',
                img      : 'island-form__img',
                imgEmpty : 'island-form__img--empty',
                remove   : 'island-form__removing',
                input_text_color: 'island-form__input--text_color',
                input_bg_color: 'island-form__input--bg_color',
                input_name: 'island-form__input--name',
                settings : 'island-form__settings'
            },
            addItem : 'island-form__add-item',
            saveButton: 'island-form__save'
        }
    };

    /**
     * All activated AndropovUploader exemplars stored here
     * @uses  to destroy class
     * @type {Array}
     */
    var andropovUploaderInstances = [];

    /**
     * Cache for activated module objects
     * @type {Object}
     *       controlName => { element, settings }
     */
    var activated = {};

    /**
     * Activates AndropovUploader instance on element
     * @uses class.AndropovUploader
     * @param  {Element} element  - Image holder which triggers uploading by click
     */
    function activateImageUploader( element ) {

        andropovUploaderInstances.push(new AndropovUploader({
            file: {
                button: element,
                accept: 'image/*'
            },
            handlers: {
                waiting: function(state) {
                    $.bem.toggle(element, 'loading', state);
                },
                change: function(items) {
                    var imageUrl;

                    if (items[0] !== undefined) {
                        imageUrl = items[0].getImageUrl(160);

                        if (imageUrl !== null) {
                            element.classList.remove(CSS.form.elements.imgEmpty);
                            element.style.backgroundImage = `url(${imageUrl})`;
                            element.dataset.url = imageUrl;
                        }

                    }
                }
            }
        }));
    }

    /**
     * Renew activated module state
     * @param  {string} name     - module controlName
     * @param  {object} newData  - new items data
     */
    function updateModuleState( name, newData ) {

        let module = activated[name];

        if (!module){
            _log(`Module «${name}» was not found in activated states`);
            return;
        }

        module.settings.items = newData;

    }

    /**
     * Editable form methods
     * @type {Object}
     */
    var form = {

        /**
         * Return editable form
         * @param {String|Number} formType  - form type modifier (@see Global/styles/ui.css@.island__list)
         * @return {Element}  - form holder
         */
        make( formType ){

            return $.make('DIV', [CSS.form.holder, CSS.islandContainer, CSS.islandList, CSS.islandFormTypes[formType] ]);

        },

        /**
         * Specifies method that makes editable form
         * @param {string} formType - form type passed in module settings
         * @return {Function} making form method
         */
        specifyFormMethod( formType) {

            switch ( formType ) {
                case 'title-description' :
                    return form.makeSimpleForm;
                case 'list-type-1':
                case 'list-type-2':
                    return form.makeListItem;
                case 'hashtag-form' :
                    return form.makeHashtagForm;
            }

        },

        /**
         * Fills form with elements
         * @param {Element} formHolder
         * @param {Object}  settings
         * @param {string}  settings.formType                - form template type
         * @param {Boolean} settings.showAddItemButtonfalse  - pass 'true' to show Add-item button
         * @param {Array}   settings.items
         * @param {String}  settings.items[].img
         * @param {String}  settings.items[].title
         * @param {String}  settings.items[].text
         * @param {String}  settings.items[].url
         */
        fill( formHolder , settings ){

            let items = activated[settings.controlName].settings.items,
                addItemButton,
                saveButton,
                makingFormMethod = form.specifyFormMethod(settings.formType);

            console.assert(typeof makingFormMethod === 'function', 'Wrong making-form method specified');

            /**
             * Fill form with data passed in air-settings.items
             */
            if ( items && items.length ) {

                for (let i = 0, item; !!(item = items[i]); i++) {

                    formHolder.appendChild(makingFormMethod(item));

                }

            } else {

                formHolder.appendChild(makingFormMethod());

            }

            /**
             * Adds add-item buton, if settings.showAddItemButtonfalse provided
             */
            if ( settings.showAddItemButton ) {

                addItemButton = $.make('DIV', [CSS.form.addItem], {textContent: settings.addItemButtonText || '+ Добавить'});
                addItemButton.dataset.formType = settings.formType;

                formHolder.appendChild(addItemButton);
                $.on(addItemButton, 'click', form.addItem);

            }

            saveButton    = $.make('DIV', [CSS.form.saveButton], {textContent: 'Сохранить изменения'});
            formHolder.appendChild(saveButton);

            $.on(saveButton, 'click', form.save);
            $.delegateEvent(formHolder, `.${CSS.form.elements.remove}`, 'click', form.removeItem);

        },

        /**
         * Adds new empty-filled item to the form
         * @this Add-button Element
         */
        addItem() {

            let addButton = this,
                formType = addButton.dataset.formType,
                newItemMaker = form.specifyFormMethod(formType),
                newItem;

            console.assert(typeof newItemMaker === 'function', 'Wrong making-form method specified');

            newItem = newItemMaker();

            $.before(addButton, newItem);

        },

        /**
         * Remove item click listener
         * @this {Element} - remove item button
         */
        removeItem() {

            var button = this,
                item = $.parents(button, `.${CSS.form.elements.item}`);

            item.remove();

        },

        /**
         * Saving method
         */
        save() {

            var button = this,
                moduleHolder = $.parents(button, `[air-module="module.editableIsland"]`),
                formHolder = $.parents(button, `.${CSS.form.holder}`),
                items = $.findAll(formHolder, `.${CSS.form.elements.item}`),
                savingUrl = formHolder.dataset.savingUrl,
                controlName = formHolder.dataset.controlName,
                savingData;

            savingData = items.reduce((data , item) => {

                data.push(form.getItemData(item));
                return data;

            }, []);

            ajax.post({
                url: savingUrl,
                dataType: 'json',
                data: {
                    items : savingData
                },
                success: function(resp) {

                    let html = resp.html;

                    if (!html) {

                        notify.error('Некорректный ответ от сервера.');

                    }

                    let blockContent = $.find(moduleHolder, '[name="island-container"]'),
                        formToggler  = $.find(moduleHolder, `.${CSS.editToggler}`);

                    blockContent.innerHTML = html;
                    blockContent.classList.remove(CSS.hidden);
                    formToggler.textContent = 'Редактировать';

                    destroyForm(formHolder);

                    formHolder.remove();
                    moduleHolder.classList.remove(CSS.islandOpened, CSS.islandEmpty);

                    /**
                     * Renew activated module state
                     */
                    updateModuleState(controlName, savingData);

                },
                error: function() {

                    notify.error('Не удалось сохранить информацию');

                }
            });

        },

        getItemData( item ){

            let img = $.find(item, `.${CSS.form.elements.img}`),
                inputs = $.findAll(item, `.${CSS.form.elements.input}`),
                itemData = {};

            if ( img ) {

                itemData.img = img.dataset.url || '';

            }

            for (var i = inputs.length - 1; i >= 0; i--) {

                itemData[inputs[i].name] = inputs[i].value.trim();

            }

            return itemData;

        },

        /**
         * Form editable item
         * @return {Element}
         */
        makeListItem( itemData = {} ){

            let item         = $.make('DIV', [CSS.form.elements.item, CSS.islandListItem]),
                img          = $.make('DIV', [CSS.form.elements.img, CSS.islandListImage, CSS.form.elements.imgEmpty]),
                container    = $.make('DIV', ['l-overflow-hidden']),
                title        = $.make('INPUT', [CSS.form.elements.input], {
                    name: 'title',
                    placeholder: 'Заголовок',
                    value: itemData.title || ''
                }),
                text = $.make('INPUT', [CSS.form.elements.input], {
                    name: 'text',
                    placeholder: 'Описание',
                    value: itemData.text || ''
                }),
                url = $.make('INPUT', [CSS.form.elements.input], {
                    name: 'url',
                    placeholder: 'Ссылка',
                    value: itemData.url || ''
                }),
                contacts = $.make('INPUT', [CSS.form.elements.input], {
                    name: 'contacts',
                    placeholder: 'Контакты',
                    value: itemData.contacts || ''
                }),
                removeButton = $.make('DIV', [CSS.form.elements.remove], {textContent: 'Удалить'});

            if ( itemData.img ){

                img.classList.remove(CSS.form.elements.imgEmpty);
                img.style.backgroundImage = `url(${itemData.img})`;
                img.dataset.url = itemData.img;

            }

            activateImageUploader(img);

            $.on(img, 'click', form.imageClicked);

            item.appendChild(img);
            container.appendChild(title);
            container.appendChild(text);
            container.appendChild(url);
            container.appendChild(contacts);

            item.appendChild(container);
            item.appendChild(removeButton);

            return item;

        },

        /**
         * Simple form with title and description.
         * @uses  in hashtag general-settings island
         * @return {Element}
         */
        makeSimpleForm( itemData = {} ){

            let item         = $.make('DIV', [CSS.form.elements.item, CSS.islandListItem]),
                title        = $.make('INPUT', [ CSS.form.elements.input, CSS.form.elements.inputShort], {
                    name: 'title',
                    placeholder: 'Заголовок',
                    value: itemData.title || ''
                }),
                text = $.make('TEXTAREA', [CSS.form.elements.input, CSS.form.elements.textarea], {
                    name: 'text',
                    placeholder: 'Описание',
                    value: itemData.text ? libString.unescapeHTML(itemData.text) : ''
                });

            item.appendChild(title);
            item.appendChild(text);

            return item;

        },


        /**
         * Simple form with title and description.
         * @uses  in hashtag general-settings island
         * @return {Element}
         */
        makeHashtagForm( itemData = {} ){

            let item         = $.make('DIV', [CSS.form.elements.item, CSS.islandListItem]),
                title        = $.make('INPUT', [ CSS.form.elements.input, CSS.form.elements.input_name], {
                    name: 'name',
                    placeholder: 'Название',
                    value: itemData.name || ''
                }),
                text_color   = $.make('INPUT', [ CSS.form.elements.input, CSS.form.elements.input_text_color], {
                    name: 'text_color',
                    placeholder: 'HEX текст',
                    value: itemData.text_color || ''
                }),
                bg_color     = $.make('INPUT', [ CSS.form.elements.input, CSS.form.elements.input_bg_color], {
                    name: 'bg_color',
                    placeholder: 'HEX фон',
                    value: itemData.bg_color || ''
                }),
                settings     = $.make('SPAN', [CSS.form.elements.settings]);

            $.on(settings, 'click', function () {

                if (!settings._visible) {

                    settings._visible = true;

                    $.css(text_color, 'display', 'inline-block');
                    $.css(bg_color, 'display', 'inline-block');

                }else{

                    settings._visible = false;

                    $.css(text_color, 'display', '');
                    $.css(bg_color, 'display', '');

                }

            });

            $.html(settings, '<svg class="icon icon--ui_gear" width="15" height="15"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#ui_gear"></use></svg>')

            item.appendChild(title);
            item.appendChild(settings);
            item.appendChild(bg_color);
            item.appendChild(text_color);

            return item;

        },


        /**
         * Clicks on form item image
         * @this {Element} image block
         */
        imageClicked(){

            let img = this;

            if ( !img.classList.contains(CSS.form.elements.imgEmpty) ) {

                form.clearImage(img);

            }
        },

        /**
         * Clears image form element
         * @param {Element} img  - Element to clear
         */
        clearImage(img){

            img.dataset.url = '';
            img.style.backgroundImage = '';
            img.classList.add(CSS.form.elements.imgEmpty);

        }

    };

     /**
     * Unbinds all handler from form elements
     * @param  {Element} formHolder  - form holder element
     */
    function destroyForm( formHolder ) {

        let saveButton = $.find(formHolder, `.${CSS.form.saveButton}`),
            addItemButton = $.find(formHolder, `.${CSS.form.addItem}`),
            addImageButtons = $.findAll(formHolder, `.${CSS.form.elements.img}`),
            settingButtons = $.findAll(formHolder, `.${CSS.form.elements.settings}`);

        /**
         * Remove upload|remove image button click listeners
         */
        addImageButtons.forEach( button => $.off(button) );

        $.off(saveButton);
        $.off(addItemButton);
        $.off(formHolder);
        $.off(settingButtons);

    }

    /**
     * Hide/Show edit form
     * @this - editable island
     * @param {Boolean} forceHide  - pass true to close form
     */
    function toggleForm( forceHide ) {

        var module = this,
            island = module.element,
            currentContent = $.find(island, '[name="island-container"]'),
            formHolder = $.find(island, `.${CSS.form.holder}`),
            formToggler = $.find(island, `.${CSS.editToggler}`),
            formOpened;

        console.assert(currentContent, 'module.editableIsland: element with name="island-content" is missed');

        formOpened = currentContent.classList.contains(CSS.hidden);

        if ( formOpened || forceHide ) {

            /** Show current content */
            currentContent.classList.remove(CSS.hidden);
            formToggler.textContent = 'Редактировать';

            /** Unbind events */
            destroyForm(formHolder);

            /** Clear form */
            formHolder.innerHTML = '';
            island.classList.remove(CSS.islandOpened);

        } else {

            /** Hide current content */
            currentContent.classList.add(CSS.hidden);
            formToggler.textContent = 'Отмена';

            if (!formHolder) {

                formHolder = form.make(module.settings.formType);
                island.appendChild(formHolder);

            }

            console.assert(module.settings.savingURL, 'module.editableIsland: savingURL is missed');
            formHolder.dataset.savingUrl = module.settings.savingURL;
            formHolder.dataset.controlName = module.settings.controlName;

            form.fill(formHolder, module.settings);
            island.classList.add(CSS.islandOpened);


        }

    }

    /**
     * Returns module object from self.elements by Element
     * @param  {Element} moduleElement  - DOM Element which contains air-module="" attribute
     * @return {Object}  Module object with 'element' and 'settigns'.
     */
    function getModuleByHolder(moduleElement) {

        return self.elements.find( el => {

            return el.element === moduleElement;

        });

    }

    /**
     * Appends empty-message block with filling motivator
     * @param  {Object} module
     */
    function appendEmptyMessageBlock( module ) {

        let container = $.find(module.element, '[name="island-container"]');

        renderer.render({
            el: container,
            template: 'empty-island-content',
            data: module.settings.emptyBlockData,
            onReady: function( el ) {

                 /**
                 * In empty block, we have motivator with additional edit-button
                 * @type {Element|null}
                 */
                let emptyBlockEditButton = $.find(el, '[name="js-edit-button"]');

                if (emptyBlockEditButton) {

                    $.on(emptyBlockEditButton, 'click', toggleForm.bind(module, false));

                }

                self.trigger('Empty island content');

            }
        });

    }

    /**
     * Initialize editable island
     * @param  {Object} island - module data
     * @param  {Element} island.element
     * @param  {Object} island.settings
     */
    function activate( island ) {

        if (island.settings.permissions === '1') {
            /**
              * Create edit toggler
              */
            let editToggler = $.find(island.element, `.${CSS.editToggler}`);

            /**
             * Find module by admin control element
             */
            let moduleHolder = island.element,
                module = getModuleByHolder(moduleHolder);

            console.assert(module, 'Module was not found by admin control');

            /**
             * Call toggle-mode method with module-data as context
             */
            $.on(editToggler, 'click', toggleForm.bind(module, false));

            /**
             * If there is no items, append empty-motivator for those who has edit-privilege
             */
            let isBlockEmpty = !module.settings.items || !module.settings.items.length;
            if (isBlockEmpty && module.settings.emptyBlockData){

                appendEmptyMessageBlock(module);
                moduleHolder.classList.add(CSS.islandEmpty);

            }

            /**
             * Remove 'hidden' classname. It can exists if block is empty.
             */
            module.element.classList.remove(CSS.hidden);

        }

        /**
         * Save activated module
         */
        activated[island.settings.controlName] = island;

    }

    /**
     * Destroyes module element
     * @param  {Object} island - module data
     * @param  {Element} island.element
     * @param  {Object} island.settings
     */
    function deactivate(island) {

        let holder = island.element,
            emptyBlockEditButton = $.find(holder, '[name="js-edit-button"]'),
            formHolder = $.find(holder, `.${CSS.form.holder}`);

        if (formHolder) {

            /** Hide form and unbind all internal handlers */
            toggleForm.call(island, true);

        }

        $.off(emptyBlockEditButton);


    }

    /**
     * Module entry point
     */
    self.init = function() {

        if (self.elements) {

            self.elements.forEach(activate);

            /** Set color on hover */
            DOM.on('Hashtag hover:hover', function (data) {
                var bg_color = $.attr(data.el, 'data-bg-color');

                $.css(data.el, 'background-color', color.shadeBlend(-0.25, bg_color));
            });

            DOM.on('Hashtag hover:leave', function (data) {
                var bg_color = $.attr(data.el, 'data-bg-color');

                $.css(data.el, 'background-color', bg_color);
            });

        }

    };

    /**
     * Module destruction method
     */
    self.destroy = function() {

        if (self.elements) {

            self.elements.forEach(deactivate);

            /** Destroy AndropovUploader instances */
            andropovUploaderInstances.forEach( instance => instance.destructor() );
            andropovUploaderInstances = [];

            /**
             * Clear activated state
             */
            activated = {};

            DOM.off();

        }

    };

    /**
     * Module update method
     */
    self.refresh = function() {

        if (self.elements) {

            self.elements.forEach(deactivate);
            self.elements.forEach(activate);

        }

    };

});

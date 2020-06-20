/**
 * @module miniEditor
 *
 * Module Settings:
 * @typedef {object} module:writing.settings
 * @property {string} cdn_path                  - Editor CDN path
 * @property {number} cdn_version               - Editor revision
 * @property {string} placeholder               - Placeholder text
 * @property {string[]} plugins_list            - CodeX Editor plugins list
 * @property {boolean} isNeedSubscribtion - is subscribtion required for the publishing
 * @property {module:Entry.getEntryResponseFormat} entryData - edited Entry's data
 */
Air.defineModule(
    'module.miniEditor',
    `lib.analytics, lib.ajax, module.push, module.ajaxify,
    module.auth, module.auth_data,
    module.notify, class.Dropdown, class.Timer, lib.DOM,
    class.EntryEditor, lib.string, module.payments, class.Attaches`,
    function( lib_analytics, ajax, module_push, ajaxify,
        auth, auth_data,
        module_notify, Dropdown, Timer, $,
        EntryEditor, libString, module_payments, Attaches, util ) {

        'use strict';

        var self = this,
            editor_settings;
        /**
         * CSS elements class dictionary
         * @type {Object}
         */
        var CSS = {
            hidden: 'l-hidden',

            overlay: 'small-editor-overlay',
            bodyOverlayShowed: 'overlay-showed',

            wrapper       : 'small-editor',
            formHolder    : 'small-editor__form',
            moduleUnready : 'small-editor--unready',
            editorOpened  : 'small-editor--opened',
            settingHolder : 'small-editor__settings',

            /** Placeholder */
            placeholder      : 'small-editor__placeholder',
            placeholderPhoto : 'small-editor__placeholder-photo',
            placeholderPhotoHidden: 'small-editor__placeholder-photo--hidden',
            placeholderText  : 'small-editor__placeholder-text',

            editor     : 'small-editor__editor',
            titleInput : 'small-editor__title',
            button     : 'ui_button',
            buttonLoading: 'ui_button--loading',
            buttonMaster : 'ui_button--1',
            saveButton : 'small-editor__save',
            goFull     : 'small-editor__gofull',
            codexEditorInline: 'inline-editor',

            /** Attaches */
            fakeAttachButtons : 'small-editor__attach-buttons',
        };

        /**
         * Elements cache
         * @type {Object}
         */
        var elements = {
            moduleHolder: null,
            overlay: null,
            editorHolder: null,
            placeholder: null,
            editor: null,
            title: null,
            saveButton: null,
            goFull: null,
            attachButtons: null,
            settingsForm: null
        };

        /**
         * class.EntryEditor instance
         * @type {EntryEditor|null}
         */
        var editorInstance = null;

        /**
         * Attaches class instance.
         * Uses to provide Image, Video, Instagram, Twitter attaches.
         *
         * @type {Attaches|null}
         */
        var attachesInstance = null;

        /**
         * Default user avatar source
         * @type {String}
         */
        var defaultAvatar = 'https://leonardo.osnova.io/2b1829fb-5f49-494f-b193-7a4257bde6f0/';

        /**
         * Editor ready state
         * @type {Boolean}
         */
        var editorIsReady = false;

        /**
         * Logged-in user's data
         * @type {Object|null}
         */
        var currentUserData = null;


    /**
     * Callback for attaches addition
     * @param {string} type   - Attach type (Link, Image, Video, Tweet, Instagram)
     * @param {Attach} attach - Attach exemplar
     */
    function attachAdded (type, attach) {

        /**
         * Send event for the analytics
         */
        self.trigger(`${type} Attached`);

        /**
         * Open module because its no empty anymore
         */
        elements.moduleHolder.classList.add(CSS.editorOpened);
        document.body.classList.add(CSS.bodyOverlayShowed);

        if (type === 'Link'){
            /**
             * Set fetched link title as Entry title
             */
            if (!elements.title.value.trim()) {
                elements.title.value = libString.unescapeHTML(attach.link.data.title);
            }

            elements.title.focus();
        }

    }

    /**
     * Callback fired after successful Entry saving
     * @param {object}    savedData                   Saved Entry's data
     * @param {number}    savedData.id
     * @param {boolean}   savedData.is_draft
     * @param {number}    savedData.hash
     */
    function savingCallback(savedData){

        module_notify.success( 'Материал сохранен' );

        /**
         * Hide overlay
         */
        document.body.classList.remove(CSS.bodyOverlayShowed);

        if (!savedData.is_draft){
            self.trigger('New Entry Published');
            console.log(`ajaxify.goTo( '/' + response.id );`);
            ajaxify.goTo( '/' + savedData.id );
        } else {
            self.trigger('Full Editor Opened, Draft Saved');
            console.log(`ajaxify.goTo( '/writing/' + response.id );`);
            ajaxify.goTo( '/writing/' + savedData.id );
        }
    }

    /**
     * Submit-button click handler
     * @param {Boolean} [isOpeningFull] - Pass true for Open Full Screen button behaviour
     */
    function save ({isOpeningFull} = {}) {
        elements.saveButton.classList.add(CSS.buttonLoading);

        editorInstance
            .save({
                entryDataOverride: {
                    is_published: !isOpeningFull // Mini Editor always publish an Entry on saving.
                                                 // And save a Draft on opening full-editor
                },
                additionalValidation: function(savedData){
                    let blocks = savedData.entry.blocks;

                    /**
                     * Opening full screen:
                     * - if Title, Text and Attaches is empty, simply go to /writing
                     * - otherwise, save a Draft
                     */
                    if (isOpeningFull && !blocks.length && !savedData.settings.title.trim() && !savedData.attaches.length){
                        let writingURL = '/writing';
                        if (editor_settings.entryData && editor_settings.entryData.subsite_name){
                            writingURL += '?to=' + editor_settings.entryData.subsite_name;
                        }
                        ajaxify.goTo(writingURL);
                        throw 'go-to-full-editor'; // we don't need to continue Entry saving
                    }

                    return savedData;
                },
                allowEmptyTitle: isOpeningFull || false // allow to save empty form on the go-full-screen segue
            })
            .then( savedData => {
                return savingCallback(savedData);
            })
            .catch(error => {

                /**
                 * Don't show error notify, when saving was canceled by go-full-screen button
                 */
                if (error === 'go-to-full-editor'){
                    return;
                }

                _log('[CodeX Editor] Entry saving error:', error);
                module_notify.error( 'Не удалось сохранить материал: ' + error);
            })
            .then(() => {
                elements.saveButton.classList.remove(CSS.buttonLoading);
            });

    }


    /**
     * Append Mini Writing controls:
     * - title
     * - attache buttons
     * - attache list
     * - save button
     * - go full button
     */
    var appendControls = function() {

        elements.overlay = $.make('div', CSS.overlay);
        $.append(elements.moduleHolder, elements.overlay);

        /**
         * Activate module for Links, Images, Videos, Tweets attaches.
         */
        attachesInstance = new Attaches({
            limit: 1,
            onAttach: attachAdded,
            limitReachedText: 'Больше вложений можно добавить в полной версии редактора',
            onAttachLinkButtonClick: () => {
                placeholderClicked(); // expand mini-editor
                editorInstance.focus();
            }
        });

        /**
         * Append Attach buttons and thumbnails zone
         */
        let attachesList = attachesInstance.renderList(),
            attachesButtons = attachesInstance.renderButtons();

        $.before(elements.editorHolder, attachesButtons);
        $.append(elements.editorHolder, attachesList);

        /**
         * Hide fake placeholder's attach-buttons
         */
        elements.attachButtons = $.find(elements.moduleHolder, `.${CSS.fakeAttachButtons}`);
        elements.attachButtons.classList.add(CSS.hidden);

        /**
         * Entry title
         * @type {Element}
         */
        elements.title = $.make('textarea', [CSS.titleInput], {
            placeholder: 'Заголовок',
            name: 'js-editor-title'
        });
        $.prepend(elements.editorHolder, elements.title);
        $.on(elements.title, 'paste.miniEditor', (event) => attachesInstance.pasteHandler(event) );


        /**
         * Save button
         * @type {Element}
         */
        elements.saveButton = $.make('span', [CSS.button, CSS.buttonMaster, CSS.saveButton], {
            textContent: 'Отправить'
        });
        $.append(elements.editorHolder, elements.saveButton);
        $.on( elements.saveButton, 'click', save);

        /**
         * Go full screen button
         * @type {Element}
         */
        elements.goFull = $.make('span', [CSS.button, CSS.goFull]);
        $.append(elements.editorHolder, elements.goFull);
        $.on( elements.goFull, 'click', () => { save({isOpeningFull: true}); });
    };

    /**
     * All clicks on document
     * @param {MouseEvent} event - click
     */
    function documentClicked (event){

        let clickedElement = event.target,
            formIsEmpty = true;

        /**
         * @todo Dont close form by clicks on the popup layer
         */
        // if (popupOpened) {
        //     return;
        // }
        //

        /**
         * Close form by outside click
         */
        let isOverlayClicked = $.belong(clickedElement, `.${CSS.overlay}`);


        if (elements.title && elements.title.value.trim() || attachesInstance.count) {
            formIsEmpty = false;
        }

        /**
         * Don't close form if it is not empty
         */
        if (!formIsEmpty) {

            /**
             * If overlay clicked with not empty form, just hide overlay, don't toggle form
             */
            if (isOverlayClicked && elements.moduleHolder.classList.contains(CSS.editorOpened)) {
                document.body.classList.remove(CSS.bodyOverlayShowed);
            }

            return;
        }

        /**
         * Don't close by clicks on the hashtags inline-search dropdown
         */
        if (clickedElement.classList && clickedElement.classList.contains('inline-dropdown__found-item')) {
            return;
        }

        if ( !$.belong(clickedElement, `.${CSS.wrapper}`) || isOverlayClicked ){
            elements.moduleHolder.classList.remove(CSS.editorOpened);
            document.body.classList.remove(CSS.bodyOverlayShowed);
            $.off(document, 'click.editor');
        }
    }

    /**
     * When placeholder is clicked, show editor
     */
    function placeholderClicked() {

        if (!currentUserData) {

            self.trigger('Placeholder Clicked By Unauthorized User');

            auth.showAuth({
                callback: function( is_authorized ) {
                    if (is_authorized) {
                        self.trigger('User logged in due to access editor');
                    }
                }
            });

            return;
        }

        /**
         * If Project requires pay for subscription to access Entry writing,
         * check userData.is_paid property
         */
        if (editor_settings.isNeedSubscribtion && !currentUserData.is_paid) {
            self.trigger('Placeholder Clicked By Unpaid User');
            module_payments.show();
            return;
        }


        if (!editorIsReady) {
            elements.moduleHolder.classList.add(CSS.moduleUnready);
        }

        /**
         * Show page overlay
         */
        document.body.classList.add(CSS.bodyOverlayShowed);

        elements.moduleHolder.classList.add(CSS.editorOpened);
        self.trigger('Editor Opened');

        /**
         * Set focus to the Editor
         */
        editorInstance.focus();

        /**
         * Uses to close form by outside click with small debounce
         */
        $.on(document, 'click.editor', (event) => {
            setTimeout(function() {
                documentClicked(event);
            }, 50);
        });
    }

    /**
     * Fires when Editor and Panel is ready or something went wrong
     * @param  {Boolean} state  - true if load, false on error
     * @param  {string} error   - error message
     */
    function editorReadyCallback(state, error){

        if ( !state ) {
            module_notify.error( 'Редактор: ' + error );
            return;
        }

        editorIsReady = true;
        elements.moduleHolder.classList.remove(CSS.moduleUnready);
    }

    /**
     * Shows CodeX Editor with plugins
     */
    function showEditor() {

        console.assert(editor_settings.plugins_list, 'module.miniEditor: plugins_list missed in settings');

        if (!editor_settings.plugins_list) {
            editor_settings.plugins_list = [];
        }

        /**
         * Holder for title, editor and save-buttons
         * @type {Element}
         */
        elements.editorHolder = $.make('div', [CSS.formHolder]);
        $.append(elements.moduleHolder, elements.editorHolder);

        /**
         * Editor wrapper
         * @type {Element}
         */
        elements.editor = $.make('div', [CSS.editor, CSS.codexEditorInline]);
        $.append(elements.editorHolder, elements.editor);

        /**
         * Append Mini Editor's UI elements:
         * - title
         * - attach buttons
         * - attach list
         * - save button
         * - go full button
         */
        appendControls();

        /**
         * Make Editor class instance
         */
        editorInstance = new EntryEditor({
            moduleWrapper: elements.moduleHolder,
            cdnPath: editor_settings.cdn_path,
            cdnVersion: editor_settings.cdn_version,
            holder: elements.editor,
            title: elements.title,
            plugins: editor_settings.plugins_list,
            attaches: attachesInstance,
            editorSettings: {
                hideToolbar: true,
                placeholder: 'Напишите текст или вставьте ссылку...'
            },
            onReady: editorReadyCallback,
            entryData: editor_settings.entryData,
            customToolsConfig: {
                text: {
                    pasteCallback: (event, htmlData, plainData) => {
                        return attachesInstance.pasteHandler(event, plainData);
                    }
                }
            }
        });

    }


    /**
     * Updates placeholder 'Write your story' with user photo
     * @param {Object|false} userData        - @see module.auth.js@setUserData
     * @param {string}  userData.avatar_url  - "https://leonardo.osnova.io/db133181-58e9-7831-8d3a-15fa82b6ec34/"
     */
    function updatePlaceholder(userData) {

        let placeholder = $.find(elements.moduleHolder, `.${CSS.placeholder}`),
            photo = $.find(elements.moduleHolder, `.${CSS.placeholderPhoto}`),
            text = $.find(elements.moduleHolder, `.${CSS.placeholderText}`);

        /**
         * Update placeholder photo
         */
        if (userData.avatar_url) {
            /**
             * Don't use Leonardo filters for old photos looks like
             * https://gif.cmtt.space/3/user-userpic/ca/6f/7d/2e071a4f2adac0.jpg
             * @see  /src/Osnova/Helper/TwigExtend.php@isOldImg
             * @type {Boolean}
             */
            let isOldURL = /\.(jpg|png|jpeg|gif)/.test(userData.avatar_url);

            if (isOldURL) {
                photo.src = userData.avatar_url;
            } else {
                photo.src = `${userData.avatar_url}-/scale_crop/40x40/center/`;
            }

        } else {
            photo.src = `${defaultAvatar}-/scale_crop/40x40/center/`;
        }

        text.textContent = editor_settings.placeholder || 'Напишите текст или вставьте ссылку...';

        // placeholder.appendChild(photo);
        // placeholder.appendChild(text);
        // elements.moduleHolder.appendChild(placeholder);

        /**
        * Show editor by click on the placeholder
        */
        elements.placeholder = placeholder;
        $.on(elements.placeholder, 'click', placeholderClicked);

    }

    /**
     * Starts module
     * @param  {object} userData
     * @param  {Boolean} userData.is_paid - true if Project requires pay subscription
     * @param  {Boolean} userData.is_banned - true or false
     * @param  {String} userData.avatar_url - User's photo
     */
    function start(userData) {

        /**
         * Update editor placeholder
         */
        updatePlaceholder(userData);

        if (!userData) {
            return;
        }

        if (userData.is_banned) {
            return;
        }

        /**
         * Show photo that is hidden by default for unauthorized users
         */
        let placeholderPhoto = $.find(elements.moduleHolder, `.${CSS.placeholderPhoto}`);
        placeholderPhoto.classList.remove(CSS.placeholderPhotoHidden);

        /**
         * Save logged-in user's dara
         * @type {object}
         */
        currentUserData = userData;

        /**
         * If Project requires pay for subscription to access Entry writing,
         * check userData.is_paid property
         */
        if (editor_settings.isNeedSubscribtion && !userData.is_paid) {
            _log('Subscription required for access Editor');
            return;
        }

        /**
         * Load Editor
         */
        showEditor();
    }


    /**
     * @private
     *
     * After success authentication
     * @fires showEditor()  method
     * @param {Object|false} userData  - if user logged-in, accepts user data. Otherwise, accepts 'false'
     */
    function userLoggedIn(userData) {

        start(userData);

    }

    /**
     * Standard module methods.
     */
    self.init = function() {

        if ( !self.elements || !self.elements.length ) {
            // _log('module.miniEditor initialized without UI');
            return;
        }

        elements.moduleHolder = self.elements[ 0 ].element;
        editor_settings = self.elements[ 0 ].settings || {};

        /**
        * Mini Editor events
        */
       [
           'Placeholder Clicked By Unauthorized User',
           'Placeholder Clicked By Unpaid User',
           'User logged in due to access editor',
           'Editor Opened',
           'New Entry Published',
           'Full Editor Opened, Draft Saved',
           'Video Attached',
           'Link Attached',
           'Image Attached',
           'Tweet attached',
           'Instagram attached'
       ].forEach( event => {
           self.on( event, () => lib_analytics.sendDefaultEvent(`Mini Editor - ${event}`) );
       });

        let userData = auth_data.get();

        if (userData) {

            start(userData);

        } else {

            auth_data.on( 'Change', userLoggedIn );

        }

    };

    self.refresh = function() {
        self.destroy();
        self.init();
    };

    self.destroy = function() {

        editor_settings = null;

        $.off(document, '.editor');
        auth_data.off();
        self.off();

        if ( editorInstance !== null ) {
            editorInstance.destroy();
        }

        if (attachesInstance){
            attachesInstance.destroy();
        }

        $.off(elements.placeholder);
        document.body.classList.remove(CSS.bodyOverlayShowed);

        // popupOpened = false;
        editorIsReady = false;

        elements = {
            moduleHolder: null,
            overlay: null,
            editorHolder: null,
            placeholder: null,
            editor: null,
            title: null,
            saveButton: null,
            goFull: null,
            attachButtons: null,
            settingsForm: null
        };
    };
} );
/**
 * @module writing
 *
 * Module Settings:
 * @typedef {object} module:writing.settings
 * @property {string} cdn_path                  - Editor CDN path
 * @property {number} cdn_version               - Editor revision
 * @property {string[]} plugins_list            - CodeX Editor plugins list
 * @property {{id: number, label: '', name: '', default: boolean}[]} subsites - available subsites
 * @property {string} push_default_icon
 * @property {string} domain
 * @property {string} path
 * @property {string} external_access
 * @property {privileges} superaccess_levels - privileges
 *
 * @typedef {object} privileges - access levels used by module:writing
 * @property {boolean} [yellow_features]
 * @property {boolean} [blue_features] - distribution: IA, AMP, social
 * @property {boolean} [red_features] - pushes
 * @property {boolean} [withheld] - can hide for Russia
 */
Air.defineModule(
    'module.writing',
    `lib.analytics, module.smart_ajax, module.ajaxify, module.auth, module.notify,
    class.Timer, lib.DOM, fn.copyToClipboard, module.renderer, module.main_menu,
    class.SectionSelector, class.PublishDate, class.AuthorSelector,
    class.SimilarArticles, class.Adviser,
    module.inputs, class.EntryEditor, fn.clearEntryCache`,

    /**
     * @param analytics
     * @param {module:smartAjax} smart_ajax
     * @param ajaxify
     * @param module_auth
     * @param {module:notify} notify
     * @param Timer
     * @param {module:libDom} $
     * @param copyToClipboard
     * @param {module:renderer} renderer
     * @param mainMenu
     * @param SectionSelector
     * @param PublishDate
     * @param AuthorSelector
     * @param SimilarArticles
     * @param Adviser
     * @param moduleInputs
     * @param EntryEditor
     * @param clearEntryCache
     */
    function( analytics, smart_ajax, ajaxify, module_auth, notify,
        Timer, $, copyToClipboard, renderer, mainMenu,
        SectionSelector, PublishDate, AuthorSelector,
        SimilarArticles, Adviser,
        moduleInputs, EntryEditor, clearEntryCache) {

        'use strict';

        let self = this;

        /**
         * @type {module:writing.settings}
         */
        let editor_settings;

        /**
         * class.EntryEditor instance
         * @type {EntryEditor|null}
         */
        let editorInstance = null;

        /**
         * Holder for settings tabs
         * @type {Element|null}
         */
        let settingsTogglersHolder = null;

        /**
         * Entry data for editing
         * @type {module:Entry.getEntryResponseFormat} entryData
         */
        let entryData = {};

        /**
         * CSS elements class dictionary
         * @type {Object}
         */
        const CSS = {
            headerMenu           : 'editor__header-menu',
            headerTab            : 'editor__header-tab',
            headerTabCurrent     : 'editor__header-tab--current',
            settingsPanel        : 'editor__panel',
            panelSection         : 'editor__panel-section',
            panelLoading         : 'editor__panel--loading',
            hidden               : 'l-hidden',
            date                 : 'editor__date',
            editable             : 'editor__editable',
            editableOpened       : 'editor__edit-mode',

            writingUnready       : 'editor__body--unready',
            button               : 'ui_button',
            buttonRed            : 'ui_button--2',
            buttonLoading        : 'ui_button--loading',
            buttonDisabled       : 'ui_button--disabled',

            /**
             * Entry author
             */
            author: 'editor__author',

            /**
             * Feedback
             */
            editorFeedback: 'editor__feedback',

            /**
             * Entry section
             */
            section: 'editor__header-select',
        };

        /**
         * Elements cache
         * @type {Object}
         */
        let elements = {
            moduleHolder: null,
            title: null,
            editorHolder: null,
            saveButton: null,
            settingsPanel : null,
            settingsTabs: [],
            settingsSections: {}, // [{section: el}],
            showCustomStyleButton: null,
            protectedLinkButton: null,
            removeRestoreButton: null,
            buttonWebPush: null,
            buttonMobilePush: null,
            clearCacheButton: null,
        };

        /**
         * Current opened settings-section
         * @type {Element|null}
         */
        let openedSettingsSection = null;

        /**
         * Section selector instance
         * @type {SectionSelector|null}
         */
        let sectionSelectorInstance = null;

        /**
         * Similar articles class instance
         * @type {SimilarArticles|null}
         */
        let similarArticlesInstance = null;

        /**
         * Publish date class instance
         * @type {PublishDate|null}
         */
        let publishDateInstance = null;

        /**
         * Author selector class instance
         * @type {AuthorSelector|null}
         */
        let authorSelectorInstance = null;

        /**
         * Feedback helper class instance
         * @type {FeedbackHelper|null}
         */
        let feedbackHelperInstance = null;

        /**
         * Adviser instance
         * @type {Adviser|null}
         */
        let adviserInstance = null;

        /**
         * Maximum allowed mobile/web push title length
         * @type {Number}
         */
        const PUSH_TITLE_MAX_LENGTH = 24;

        /**
         * Used to prevent multiple send-push clicks
         * @type {object} url => true|false
         * @example {
         *          '/push/web' : true,
         *          '/push/mobile' : false
         * }
         */
        let pushButtonLocked = {};

        /**
         * Append UI controls:
         * - Section Selector
         * - Publish Date Selector
         * - Author Selector
         * - Similar Articles Selector
         *
         * @param {module:Entry.Entry} Entry
         */
        function appendControls (Entry) {

            /**
             * Entry subsite
             */
            // if ( editor_settings.superaccess_levels.yellow_features ){
                let subsiteSelectorWrapper = document.getElementsByName('js-subsite-selector')[0];
                if (subsiteSelectorWrapper){
                     /**
                      * Make section selector
                      * @type {SectionSelector}
                      */
                     // sectionSelectorInstance = new SectionSelector({
                     //     element: subsiteSelectorWrapper,
                     //     currentId: Entry.subsite_id,
                     //     inputName: 'subsite_id',
                     //     sections: editor_settings.subsites
                     // });

                     sectionSelectorInstance = new SectionSelector({
                         element: subsiteSelectorWrapper,
                         inputName: 'subsite_id',
                         placeholder: 'Введите имя сабсайта...',
                         defaultAvatar: 'https://leonardo.osnova.io/2b1829fb-5f49-494f-b193-7a4257bde6f0/',
                         sections: editor_settings.subsites,
                         currentId: Entry.subsite_id
                     });
                }
            // }

            /**
             * Publish date
             */
            if ( editor_settings.superaccess_levels.yellow_features ){
                let publishDateSelector = document.getElementsByName('js-publish-date-selector')[0];
                if (publishDateSelector){
                    /**
                     * Make publish date dropdown
                     * @type {PublishDate}
                     */
                    publishDateInstance = new PublishDate({
                        element: publishDateSelector,
                        initialValue: Entry.date_str || Entry.modification_date_str || $.attr(publishDateSelector, 'data-date'),
                        placeholder: 'дд/мм/ггггTчч:мм'
                    });
                }
            }

            /**
             * Similar articles
             */
            if ( editor_settings.superaccess_levels.yellow_features ){
                let similarSelector = document.getElementsByName('js-same-materials')[0];
                if (similarSelector){
                    /**
                     * Make similar articles dropdown
                     * @type {SimilarArticles}
                     */
                    similarArticlesInstance = new SimilarArticles({
                        element: similarSelector,
                        label: 'Похожие статьи'
                    });
                }
            }

            /**
             * Remove entry
             */
            if ( editor_settings.superaccess_levels.red_features ){
                let removeButton = document.getElementsByName('js-remove-button')[0];
                if (removeButton){
                    elements.removeRestoreButton = $.make('div', [CSS.button, CSS.buttonRed], {
                        textContent: Entry.removed ? 'Восстановить' : 'Удалить'
                    });

                    $.append(removeButton, elements.removeRestoreButton);
                    $.on(elements.removeRestoreButton, 'click', removeRestoreButtonClicked);
                }
            }

            /**
             * Author
             */
            if ( editor_settings.superaccess_levels.red_features ){
                let authorSelectorWrapper = document.getElementsByName('js-author-selector')[0];
                if (authorSelectorWrapper){
                    /**
                     * Make author selector
                     * @type {AuthorSelector}
                     */
                    authorSelectorInstance = new AuthorSelector({
                        element: authorSelectorWrapper,
                        inputName: 'user_id',
                        placeholder: 'Введите имя автора...',
                        defaultAvatar: 'https://leonardo.osnova.io/2b1829fb-5f49-494f-b193-7a4257bde6f0/'
                    });
                }
            }

            /**
             * Feedback
             */
            // if ( editor_settings.superaccess_levels.yellow_features ){
            //     let feedbackHelperWrapper = document.getElementsByName('js-writing-feedback')[0];
            //     if (feedbackHelperWrapper){
            //         /**
            //          * Make Feedback helper class instance
            //          * @type {FeedbackHelper}
            //          */
            //         feedbackHelperInstance = new FeedbackHelper({
            //             element: feedbackHelperWrapper,
            //             placeholder: 'Расскажите, что не нравится в редакторе',
            //             endpoint: editor_settings.url_feedback
            //         });
            //     }
            // }

            /**
             * Adviser
             * @type {Adviser}
             */
            adviserInstance = new Adviser({
                advices: [
                    {
                        id: 100,
                        type: 'list',
                        title: 'Как написать хорошую заметку',
                        items: [
                            'Расскажите о личном опыте',
                            'Об интересной находке в сети',
                            'Или смешной гифке',
                            'Ведите себя как в обычной жизни'
                        ]
                    },
                    {
                        id: 200,
                        type: 'list',
                        title: 'Что нельзя делать',
                        items: [
                            'Копировать статьи с других сайтов',
                            'Злоупотреблять жирностью и курсивом',
                            'Публиковать пресс-релизы',
                        ]
                    },
                    {
                        id: 300,
                        type: 'shortcuts',
                        title: 'Используйте быстрые сочетания клавиш',
                        items: [
                            { label: 'Сохранить', shortcut: '<span class="key">⌘</span>+S' },
                            { label: 'Жирность', shortcut: '<span class="key">⌘</span>+B' },
                            { label: 'Курсив', shortcut: '<span class="key">⌘</span>+I' },
                            { label: 'Ссылка', shortcut: '<span class="key">⌘</span>+K' },
                            { label: 'Новый блок', shortcut: ['Enter', 'Tab'] },
                        ]
                    },
                    {
                        id: 400,
                        type: 'rawhtml',
                        title: 'Создавайте опросы',
                        html: `<video class="advice__image" style="min-height: 37px" src="https://leonardo.osnova.io/2d8ada0d-25c5-10fc-2ff0-920a569fdf9b/-/format/mp4/" autoplay loop muted playsinline></video>`
                    },
                    {
                        id: 500,
                        type: 'rawhtml',
                        title: 'Выберите, что выводить на обложку статьи',
                        html: `<video class="advice__image" style="min-height: 188px" src="https://leonardo.osnova.io/7c01638d-c2bc-e516-356d-b6aec6d88ed4/-/format/mp4/" autoplay loop muted playsinline></video>`
                    },
                    {
                        id: 600,
                        type: 'rawhtml',
                        title: 'Вставляйте ссылки на Youtube, Twitter,  Instagram прямо в текст',
                        html: `<div class="advice__caption">Редактор превратит их в видео и снимки.</div>`
                    },
                ]
            });
        }

        /**
         * Remove/Restore button listener
         */
        function removeRestoreButtonClicked() {
            if (editorInstance.entry.removed){
                editorInstance.entry.restore();
            } else {
                editorInstance.entry.remove().then(() => {
                    ajaxify.goTo(`/u/${editorInstance.entry.user_id || 'me'}`);
                }).catch(err => {
                    _log('Entry removing/restore cancelled:', err);
                });
            }
        }

        /**
         * All clicks on document
         * @uses to hide select-date or select-author selectors by click outside them
         */
        function documentClicked (event){

            let clickedElement = event.target,
                editablePanels = $.findAll(document, `.${CSS.date}, .${CSS.author}, .${CSS.section}`),
                openedPanels = editablePanels.filter( panel => panel.classList.contains(CSS.editableOpened) );

            openedPanels.forEach( panel => {

                /** Allow clicks inside date */
                if (panel.classList.contains(CSS.date) && $.belong(clickedElement, `.${CSS.date}`)) {
                    return;

                /** Allow clicks inside author */
                } else if (panel.classList.contains(CSS.author) && $.belong(clickedElement, `.${CSS.author}`)) {
                    return;

                /** Allow clicks inside section */
                }else if (panel.classList.contains(CSS.section) && $.belong(clickedElement, `.${CSS.section}`)) {
                    return;
                }

                panel.classList.remove(CSS.editableOpened);

                event.preventDefault();
                event.stopPropagation();
                event.stopImmediatePropagation();

            });

            /**
             * Close feedback form
             */
            let feedbackHolder = $.find(document, `.${CSS.editorFeedback}`);

            if ( feedbackHolder && feedbackHelperInstance && !$.belong(clickedElement, `.${CSS.editorFeedback}`) ){
                feedbackHelperInstance.close();
            }

            /**
             * Close opened settins tab
             */
            if (elements.settingsPanel && !$.belong(clickedElement, `.${CSS.settingsPanel}`) && !$.belong(clickedElement, `.${CSS.headerMenu}`)) {
                elements.settingsPanel.classList.add(CSS.hidden);
                openedSettingsSection = null;
            }

        }

        /**
         * Loads history list from the server
         * @param {Number} entryId
         */
        function loadHistory(entryId) {

            let panel = elements.settingsPanel;

            panel.classList.add(CSS.panelLoading);

            smart_ajax.get({
                url: '/writing/' + entryId + '/history',
                success: function( response ) {

                    panel.classList.remove(CSS.panelLoading);
                    elements.settingsSections.history.innerHTML = response.result;

                    /**
                     * @todo Добавить скролл-лок;
                     * В следующей версии!
                     */
                },
                error: function( error ) {

                    _log('load entry history error: %o', error);

                    panel.classList.remove(CSS.panelLoading);
                    // notify.error( 'Не удалось получить историю версий: ' + error );

                }
            });
        }

        /**
         * Header section toggler click listener
         * @this {Element} - tab
         */
        function headerTabClicked() {

            let tab = this,
                section = tab.dataset.section,
                panel = elements.settingsPanel;

            /** If section is already opened, close it */
            if (openedSettingsSection == section) {
                panel.classList.add(CSS.hidden);
                tab.classList.remove(CSS.headerTabCurrent);
                openedSettingsSection = null;
                return;
            }

            /** Mark current tab with modificator */
            elements.settingsTabs.forEach( tab => tab.classList.remove(CSS.headerTabCurrent) );
            tab.classList.add(CSS.headerTabCurrent);

            /** Hide all sections and show requested */
            for (let sect in elements.settingsSections ){
                if (sect == section) {
                    elements.settingsSections[sect].classList.remove(CSS.hidden);
                } else {
                    elements.settingsSections[sect].classList.add(CSS.hidden);
                }
            }

            /** Show panel and add preloader */
            panel.classList.remove(CSS.hidden);

            if (section == 'history' && editor_settings.edited_id) {

                loadHistory(editor_settings.edited_id);

            }

            openedSettingsSection = section;


        }

        /**
         * Handles clicks on the 'send mobile push' and 'send web push' buttons
         * @param {string} type - mobile|web
         * @param {Element} button - mobile|web
         */
        function sendPush(type, button){

            if (!editorInstance.entry.id) {
                notify.error('Перед отправкой пуша, нужно сохранить статью');
                return;
            }

            if (!editorInstance.entry.is_published) {
                notify.error('Нел��зя отправить push для неопубликованной статьи');
                return;
            }

            let fieldset = $.parents(button, 'fieldset'),
                elements = fieldset.elements,
                icon = $.find(fieldset, '[name="icon"]'),
                requestURL = fieldset.dataset.url,
                payload = {
                    id: editorInstance.entry.id,
                    title: '',
                    text: '',
                    url: ''
                };

            for (let i = elements.length - 1; i >= 0; i--) {
                switch (elements[i].type){
                    case 'checkbox':
                        payload[elements[i].name] = elements[i].checked; break;
                    case 'file':
                        continue;
                    default:

                        if (elements[i].name == 'push_title'){
                            payload['title'] = elements[i].value;
                        }

                        if (elements[i].name == 'push_text'){
                            payload['text'] = elements[i].value;
                        }

                        if (elements[i].name != 'push_title' && elements[i].name != 'push_text') {
                            payload[elements[i].name] = elements[i].value;
                        }

                        break;
                }
            }

            if (payload['title'].length > PUSH_TITLE_MAX_LENGTH) {
                notify.error('Слишком длинный заголовок push-уведомления');
                return;
            }

            if (icon && icon.getAttribute('value')) {
                payload.icon = icon.getAttribute('value');
            }

            if (type === 'web' && payload.url) {
                payload.url +=  `${payload.url.includes('?') ? '&' : '?' }from=push`;
            }

            /**
             * Prevent multiple send-push clicks
             * @type {Boolean}
             */
            if (pushButtonLocked[requestURL]) {
                notify.error('Полегче! Мы же не хотим дублирования пушей.');
                return;
            }

            pushButtonLocked[requestURL] = true;
            button.classList.add(CSS.buttonDisabled);

            editorInstance.entry.push(requestURL, payload)
                .then(() => {
                    _log('Push sent:', payload);
                })
                .catch(error => {
                    _log('Push sending error:', error);

                    // unlock button
                    window.setTimeout(() => {
                        pushButtonLocked[requestURL] = false;
                        button.classList.remove(CSS.buttonDisabled);
                    }, 2000);
                });
        }

        /**
         * Distribution panel:
         *  - fill push fields
         *  - activate push button
         */
        function prepareDistribution(){

            /**
             * Fill push texts
             */
            let pushTextInputs = $.findAll(elements.moduleHolder, '[name="push_text"]');
            if (pushTextInputs.length) {
                pushTextInputs.forEach( input => $.val(input, editorInstance.entry.title) );
            }


            if (editor_settings.edited_url) {
                let pushUrl = $.find('.distribution__form input[name="url"]');
                if (pushUrl){
                    $.val(pushUrl, editor_settings.edited_url);
                }
            }


            /**
             * Activate push buttons
             */
            elements.buttonWebPush =  $.find( elements.settingsPanel, '.editor__button--web_push' );
            elements.buttonMobilePush =  $.find( elements.settingsPanel, '.editor__button--mobile_push' );
            if (elements.buttonWebPush) {
                $.on(elements.buttonWebPush, 'click', () => sendPush('web', event.target));
            }
            if (elements.buttonMobilePush) {
                $.on(elements.buttonMobilePush, 'click', () => sendPush('mobile', event.target));
            }
        }

        /**
         * Requires entry-settings section
         * @param {String} sectionName
         * @param {array} permissions - list of allowed permissions
         * @return {Promise<string>} - loaded section's name
         */
        function requireSection( sectionName, permissions ) {

            return new Promise((resolve, reject) => {

                /**
                 * Require settings block
                 */
                let sectionHolder = $.find(elements.settingsPanel, `.${CSS.panelSection}--${sectionName}`);

                renderer.render({
                    el: sectionHolder,
                    template: `writing-${sectionName}`,
                    data: {
                        'yellow_features' : permissions.includes('yellow_features'),
                        'blue_features' : permissions.includes('blue_features'),
                        'red_features' : permissions.includes('red_features'),
                        'access_withheld': permissions.includes('withheld'),
                        'push_default_icon': editor_settings.push_default_icon,
                        'entry_id': entryData.id || null,
                        'entry_url': entryData.url || null,
                        'entry_path': editor_settings.path || null,
                        'domain': editor_settings.domain,
                        'is_needs_advanced_access_to_comments' : window.__is_need_advanced_access_to_comments
                    },
                    onReady: function( renderedElements ) {

                        /**
                         * Workaround cases when renderedElements is an Element, not Array
                         */
                        if (!Array.isArray(renderedElements)) {
                            renderedElements = [renderedElements];
                        }

                        renderedElements.forEach( el => {
                            moduleInputs.processVisibleIn(el);
                        });

                        // if (sectionName === 'distribution'){
                        //     prepareDistribution();
                        // }

                        resolve(sectionName);

                    },
                    onError: (error) => {
                        reject(error);
                    }
                });
            });
        }

        /**
         * Shows entry-settings togglers
         * @param  {Array} permissions     - list of allowed permissions
         * @return {Promise<string[]>} - wait 'settings' and 'distribution' sections loading and return their names
         */
        function showSettingsSections (permissions) {

            /**
             * Save panel Element
             * @type {Element}
             */
            elements.settingsPanel = document.getElementsByName('js-settings-panel')[0];

            /**
             * Don't show settings for users without permissions
             */
            if (!elements.settingsPanel) {
                return Promise.reject('Settings panel holder was not found.');
            }

            let sections = {
                settings : {
                    title: 'Настройки',
                    icon: 'writing-settings'
                },
                distribution : {
                    title: 'Дистрибуция',
                    icon: 'writing-distribution'
                }
            };

            /** push history tab if article has saved data */
            if (editor_settings.edited_id) {

                sections.history = {
                    title: 'История версий',
                    icon: 'writing-save'
                };

            }

            /**
             * Append panel togglers
             */
            console.assert(settingsTogglersHolder, 'Cannot find settings-panel menu holder by name «entry_settings_togglers»');

            for ( let section in sections ){

                let toggler = $.make('span', [CSS.headerTab]),
                    icon = $.svg(sections[section].icon, 14, 14),
                    panelSection = $.make('div', [CSS.panelSection, `${CSS.panelSection}--${section}`, CSS.hidden]);

                toggler.appendChild(icon);
                toggler.appendChild(document.createTextNode(sections[section].title));

                /** Save section name in toggler's dataset */
                toggler.dataset.section = section;

                $.append(settingsTogglersHolder, toggler);

                /** Cache toggler and holder */
                elements.settingsTabs.push(toggler);
                elements.settingsSections[section] = panelSection;

                /** Add section holder to the panel */
                elements.settingsPanel.appendChild(panelSection);

            }

            /**
             * Delegate click listener
             */
            $.delegateEvent( settingsTogglersHolder, `.${CSS.headerTab}`, 'click', headerTabClicked);

            /**
             * We need to require sections 'settings' and 'distribution' on initializing
             * to gain access to the checkboxes and inputs while saving
             */
            return Promise.all([
               requireSection('settings', permissions),
               requireSection('distribution', permissions)
            ]);

        }

        /**
         * Callback fired after successful Entry saving
         * @param {object}    savedData                   Saved Entry's data
         * @param {number}    savedData.id
         * @param {boolean}   savedData.is_draft
         * @param {boolean} previousPublished - true if an Entry was published before saving
         */
        function savingCallback(savedData, previousPublished){

            notify.success( 'Материал сохранен' );

            if (!savedData.is_draft){ // [✓] Published
                if (!previousPublished) {
                    self.trigger('New Entry Published');

                    if (module_auth.isSuperuser()) {
                        ajaxify.goTo('/writing/' + savedData.id);
                    } else {
                        ajaxify.goTo('/' + savedData.id);
                    }
                } else {
                    self.trigger('Entry Updated');
                }
            } else if (!editorInstance.entry.id) {
                ajaxify.goTo( '/writing/' + savedData.id );
            }
        }

        /**
         * Submit-button click handler
         */
        function save () {
            elements.saveButton.classList.add(CSS.buttonLoading);

            /**
             * Remember is_published state before saving
             * @type {boolean}
             */
            let previousPublished = editorInstance.entry.is_published;

            editorInstance.save()
                .then( savedData => {
                    return savingCallback(savedData, previousPublished);
                })
                .catch(error => {
                    _log('[CodeX Editor] Entry saving error:', error);
                    notify.error( 'Не удалось сохранить материал: ' + error);
                })
                .then(() => {
                    elements.saveButton.classList.remove(CSS.buttonLoading);
                });

        }

        /**
         * Save Entry by CMD+S
         * @param {Event} event
         */
        function saveByCmdS(event) {

            let key = event.keyCode,
                cmdPressed = event.ctrlKey || event.metaKey,
                keyS = 83;

            if (key === keyS && cmdPressed) {
                event.preventDefault();
                save();
            }
        }

        /**
         * Fires when Editor and Entry data is loaded
         */
        function editorReadyCallback(){

            let unreadyContent = $.find(elements.moduleHolder, `.${CSS.writingUnready}`);

            /**
             * Enable saving-button
             */
            $.on( elements.saveButton, 'click', save);

            /**
             * Enable saving by CMD+S
             */
            $.on(document, 'keydown.editor', saveByCmdS);

            /**
             * Show selected similar articles after input was filled
             */
            if (similarArticlesInstance) {
                similarArticlesInstance.showSelected();
            }

             /**
             * Activate toggler for "Show custom style input"
             */
            elements.showCustomStyleButton = $.find(document, '[name="js-show-custom-style"]');

            if (elements.showCustomStyleButton){
                $.on(elements.showCustomStyleButton, 'click', () => {
                    let zone = $.find(document, '[name="js-custom-style-zone"]');
                    if (zone) {
                        $.bem.toggle(zone, 'shown');
                    }
                });
            }

            /** Uses to hide select-date or select-author dropdowns by click outside them */
            $.on(document, 'click.editor', documentClicked);

            if (unreadyContent) {
                unreadyContent.classList.remove(CSS.writingUnready);
            }

            let isShowThanks = $.find(elements.moduleHolder, '[name="js-editor-is_show_thanks"]'),
                lockedByAdmin = $.find(elements.moduleHolder, '[name="js-editor-locked_by_admin"]');

            if (isShowThanks && lockedByAdmin) {

                $.on(isShowThanks, 'click', () => {

                    let isShowThanksCheckbox = $.find(isShowThanks, '.ui-checkbox'),
                        lockedByAdminCheckbox = $.find(lockedByAdmin, '.ui-checkbox');

                    if (!lockedByAdminCheckbox.classList.contains('ui-checkbox--checked')
                        && !isShowThanksCheckbox.classList.contains('ui-checkbox--checked')) {
                        lockedByAdminCheckbox.classList.add('ui-checkbox--checked');

                        $.find(lockedByAdminCheckbox, 'input[type="checkbox"]').checked = true;
                    }

                });
            }

            /**
             * Copy protected entry link to clipboard
            */
            elements.protectedLinkButton = $.find(document, '[name="js-copy-protected-link"]');

            if (elements.protectedLinkButton) {
                $.on(elements.protectedLinkButton, 'click', () => {

                    if (editor_settings.edited_id) {

                        copyToClipboard(editor_settings.external_access, function (is_success) {
                            if (is_success) {
                                notify.success('Ссылка для доступа скопирована');
                            } else {
                                notify.error('Не удалось скопировать ссылку');
                            }
                        });

                    } else {
                        notify.error('Сначала сохраните статью');
                    }
                });
            }

             /**
             * Use CodeX Editor custom events to send analytics
             */
            let cdxEvents = [
                'cdxToolClick',
                'cdxBlockSettingsOpening',
                'cdxToolSkippedWhileSaving',
                'cdxSavingError',
                'cdxSavingSuccess',
                'cdxShortcutUsed',
                'cdxBlockMarkedAsCover',
                'cdxBlockRemoved',
                'cdxBlockMoved'
            ];

            cdxEvents.forEach( name => {
                $.on(document, name + '.editor', event => {
                    self.trigger('CodeX Editor Emit Event', {
                        name: name.replace('cdx', '').replace(/([A-Z])/g, ' $1').trim(),
                        data: event.detail
                    });
                });
            });

            elements.clearCacheButton = $.find(elements.moduleHolder, '.js-writing-clearcache');

            if (elements.clearCacheButton){
                $.on(elements.clearCacheButton, 'click', () => {
                    clearEntryCache(editor_settings.edited_url);
                });
            }
        }

        /**
         * Load settings section if User has permissions
         * @return {Promise<String[]>}
         */
        function loadSettingsSections() {

            /**
             * This permissions is required to view Settings Sections
             * @type {string[]}
             */
            const permissionsForSettings = [
                'yellow_features',
                'blue_features',
                'red_features',
                'withheld'
            ];

            return new Promise((resolve, reject) => {

                let allowedPermissions = permissionsForSettings.filter( requiredPerm => {
                    return editor_settings.superaccess_levels[requiredPerm] === true;
                });

                if (allowedPermissions.length < 1){
                    reject('Access denied');
                    return;
                }

                showSettingsSections(allowedPermissions).then((loadedSections) => {
                    resolve(loadedSections);
                }).catch(error => {
                    reject(error);
                });
            });

        }

        /**
         * - Check permissions for tools
         * - Construct EntryEditor
         *
         * @return {Promise} EntryEditor loading promise
         */
        function loadEditor() {
            return new Promise((resolve, reject) => {

                if (!editor_settings.plugins_list) {
                    editor_settings.plugins_list = [];
                }

                if ( editor_settings.superaccess_levels['yellow_features'] ) {
                    // extended tools list
                    editor_settings.plugins_list.push(
                        'delimiter',
                        'raw',
                        'audio',
                        'quiz',
                        'number',
                        'warning',
                        'wtrfall',
                        'special_button',
                    );
                }

                /**
                 * Make Editor class instance
                 */
                editorInstance = new EntryEditor({
                    moduleWrapper: elements.moduleHolder,
                    cdnPath: editor_settings.cdn_path,
                    cdnVersion: editor_settings.cdn_version,
                    holder: elements.editorHolder,
                    title: elements.title,
                    plugins: editor_settings.plugins_list,
                    editorSettings: {
                        placeholder: 'Напишите текст или вставьте ссылку...'
                    },
                    entryData: entryData
                });

                editorInstance.loading.then(() => {
                    resolve();
                }).catch((error) => {
                    reject(error);
                });
            } );
        }

        /**
         * Shows CodeX Editor with plugins
         *
         * Have 2 parallel processes:
         *  - loading and rendering templates for the Settings
         *  - loading an EntryEditor (includes loading Editor, Plugins and Entry data)
         *
         *  After all of them finished, we should fill settings with the Entry data
         */
        function showUI() {

            /**
             * Entry settings panels loading process
             * @type {Promise<String[]>}
             */
            let sectionsLoading = loadSettingsSections().catch(error => {
                _log('Entry Settings Sections: ', error);
            });

            let editorLoading = loadEditor().catch(error => {
                console.warn('Can not setup an EntryEditor:', error);
            });

            Promise.all([sectionsLoading, editorLoading]).then(uiLoaded => {
                // _log('Module Writing: UI is ready');

                let loadedSections = uiLoaded.shift();

                appendControls(editorInstance.entry);

                // little timeout for waiting UI elements rendered (especially similar articles dropdown)
                window.setTimeout(() => {
                    editorInstance.fillForm();
                    editorReadyCallback();
                }, 100);

                if (loadedSections && $.isArray(loadedSections) && loadedSections.includes('distribution')){
                    prepareDistribution();
                }
            })


        }

        self.init = function() {

            /**
             * Module can be initialized without UI. For example, for some methods or events
             */
            if (!self.elements || !self.elements.length) {
                return;
            }

            elements.moduleHolder= self.elements[ 0 ].element;
            editor_settings = self.elements[ 0 ].settings || {};

            elements.title = document.getElementsByName('js-editor-title')[0];
            elements.editorHolder = document.getElementsByName('js-editor-holder')[0];
            elements.saveButton = document.getElementsByName('js-writing-save')[0];

            /**
             * Entry data stores by hidden textarea for safe-passing html entities with json
             */
            let entryDataHolder = document.getElementById('entryDataHolder');

            try {
                let entryDataHolderContent = entryDataHolder.value.trim();
                entryData = entryDataHolderContent ? JSON.parse(entryDataHolderContent) : {};
            } catch (e) {
                _log('Incorrect Entry Data format', e);
            }

            /**
             * Holder for settings tabs
             */
            settingsTogglersHolder = document.getElementsByName('entry_settings_togglers')[0];


            [
                'New Entry Published',
            ].forEach( event => {
                self.on( event, () => analytics.sendDefaultEvent(`Editor - ${event}`) );
            });

            /**
             * CodeX Editor custom events
             * @param  {object} event
             * @param  {object} event.name — custom event name
             * @param  {object} event.data - data
             */
            self.on( 'CodeX Editor Emit Event', event  => {
                analytics.pushToDataLayer({
                    event: `Editor - ${event.name}`,
                    data: event.data
                });
            });

            /**
             * Show UI:
             *  - settings sections
             *  - Editor
             */
            showUI();

            /** Unstick site header */
            mainMenu.unstick(true);
        };

        self.refresh = function() {
            self.destroy();
            self.init();

            moduleInputs.init();
        };

        self.destroy = function() {

            moduleInputs.destroy();
            editorInstance.destroy();
            mainMenu.unstick(false);

            if (elements.clearCacheButton){
                $.off(elements.clearCacheButton);
            }

            if (elements.showCustomStyleButton) {
                $.off(elements.showCustomStyleButton);
            }

            if (elements.protectedLinkButton) {
                $.off(elements.protectedLinkButton);
            }

            if (sectionSelectorInstance) {
                sectionSelectorInstance.destroy();
            }

            if (publishDateInstance) {
                publishDateInstance.destroy();
            }

            if (similarArticlesInstance) {
                similarArticlesInstance.destroy();
            }

            if (authorSelectorInstance) {
                authorSelectorInstance.destroy();
            }

            if (feedbackHelperInstance) {
                feedbackHelperInstance.destroy();
            }

            if (adviserInstance) {
                adviserInstance.destroy();
            }

            if (elements.removeRestoreButton){
                $.off(elements.removeRestoreButton);
            }

            elements = {
                moduleHolder: null,
                title: null,
                editorHolder: null,
                saveButton: null,
                settingsPanel : null,
                settingsTabs: [],
                settingsSections: {},
                showCustomStyleButton: null,
                protectedLinkButton: null,
                removeRestoreButton: null,
                clearCacheButton: null,
            };
            // editor_settings = null;

            if (settingsTogglersHolder) {
                $.off(settingsTogglersHolder);
            }

            $.off(document, '.editor');


        };

    }
);

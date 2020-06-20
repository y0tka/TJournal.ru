/**
 * @module Attaches
 *  _______________________________
 * | ............................. |
 * | .       Attaches zone       . |
 * | ............................. |
 * |                               |
 * | [Add Image] [Add Video]       |
 * |_______________________________|
 *
 * Can be used with the CodeX Editor, for example in the module.MiniWriting.js
 */
Air.defineClass(
    'class.Attaches',
    `lib.DOM, lib.string, module.notify, module.DOM,
    module.popup, fn.parseServiceUrl, fn.declineWord, fn.parseImageUrl,
    class.Fileuploader, class.ImageAttach, class.VideoAttach,
    class.LinkAttacher, class.TwitterAttacher, class.InstagramAttacher,
    lib.andropov`,
    /**
     * @param {module:libDom} $
     */
    function( $ , libString, notify, gDOM,
              popup, parseServiceUrl, declineWord, parseImageUrl,
              FileUploader, ImageAttach, VideoAttach,
              LinkAttacher, TwitterAttacher, InstagramAttacher,
              andropov, util) {

        'use strict';

        /**
         * Instance for module.DOM
         * @type {Object}
         */
        const DOM = util.inherit( gDOM );

        /**
         * @class Attaches
         * @classdesc Provide Image, Video, Tweet, Instagram attaches
         *
         * @typedef {Attaches} module:Attaches.Attaches
         * @property {Array} attaches                         - Attaches list
         * @property {Object} nodes                           - DOM Elements cache
         * @property {Number} limit                           - maximum allowed Attaches count
         * @property {Boolean} locked                         - sets to True when limit is reached
         * @property {String[]} typesAllowed                  - list of available attaches
         * @property {FileUploader|null} fileUploaderInstance - FileUploader
         * @property {string} imageServer                     - path to image storage (Leonardo)
         * @property {Boolean} popupOpened                    - true when Video URL popup is open
         * @property {module:LinkAttacher.LinkAttacher} linkAttacherInstance                - Link Attacher
         * @property {module:TwitterAttacher.TwitterAttacher} twitterAttacherInstance       - Twitter Attacher
         * @property {module:InstagramAttacher.InstagramAttacher} instagramAttacherInstance - Instagram Attacher
         */
        return class Attaches {

            /**
             * @constructor
             * @param {number} limit      - maximum allowed attaches count
             * @param {Function} onAttach - callback fired after attach
             * @param {Function} onAttachLinkButtonClick - callback fired on attach-link button clicks
             * @param {String[]} [attachesAvailable] - list of available attache types: by default ['image', 'video', 'link', 'instagram', 'tweets']
             * @param {String[]} [limitReachedText] - message that will be showed after attaches count will reached the limit
             */
            constructor({limit, onAttach, onAttachLinkButtonClick, attachesAvailable, limitReachedText} = {}) {

                this.attaches = [];
                this.locked = false;
                this.limit = limit || 2;
                this.fileUploaderInstance = null;
                this.linkAttacherInstance = null;
                this.limitReachedText = limitReachedText || `Можно прикреплять не более ${this.limit}
                    ${declineWord( this.limit, [ 'вложений', 'вложения', 'вложений' ] )}`;

                this.nodes = {
                    wrapper: null,
                    list: null,
                    buttons: null,
                    imageButton: null,
                    linkButton: null
                };

                this.handlers = {
                    onAttach: onAttach || null,
                    onAttachLinkButtonClick: onAttachLinkButtonClick || null
                };

                /**
                 * List of available Attaches
                 * @type {String[]}
                 */
                this.typesAllowed = attachesAvailable || ['image', 'video', 'link', 'instagram', 'tweets'];

                /**
                 * Path for image-uploader and storage service
                 * @uses  in image sources with file uuid
                 * @type {String}
                 */
                this.imageServer = 'leonardo.osnova.io';

                /**
                 * Flag for Video URL Popup opening state
                 * @type {Boolean}
                 */
                this.popupOpened = false;

            }

            static get CSS(){
                return {
                    wrapper: 'attaches',
                    list: 'attaches__list',

                    buttons: 'attaches__buttons',
                    buttonsInactive : 'attaches__buttons--inactive',
                    buttonsDisabled : 'attaches__buttons--disabled',

                    buttonBaseClass : 'ui_button',
                    button          : 'attaches__button',
                    buttonLoading   : 'attaches__button--loading',
                    buttonImage     : 'attaches__button--image',
                    buttonVideo     : 'attaches__button--video',
                    buttonLink      : 'attaches__button--link',
                    buttonWithLabel : 'attaches__button--with-label',
                    buttonTooltip   : 'attaches__button-tooltip',
                };
            }

            /**
             * Getter for attaches count
             */
            get count (){
                return this.attaches.length;
            }

            /**
             * Return Attaches wrapper with the List and Buttons
             */
            renderAll(){
                this.nodes.wrapper = $.make('div', Attaches.CSS.wrapper);

                let list = this.renderList(),
                    buttons = this.renderButtons();

                $.append(this.nodes.wrapper, list);
                $.append(this.nodes.wrapper, buttons);
            }

            /**
             * Return List where Attaches will appear
             * @returns {Element}
             */
            renderList(){
                this.nodes.list = $.make('div', Attaches.CSS.list);
                return this.nodes.list;
            }

            /**
             * Return Attach Buttons holder
             * @returns {Element}
             */
            renderButtons(){

                this.nodes.buttons = $.make('div', Attaches.CSS.buttons);

                /**
                 * Attach link button
                 * @type {Element}
                 */
                if (this.typesAllowed.includes('link')) {
                    this.nodes.linkButton = this.makeButton('link', 'attach-link', 16, 'Ссылка');
                    $.append(this.nodes.buttons, this.nodes.linkButton);
                    this.activateAttachLinkButton();
                }

                /**
                 * Attach image button
                 * @type {Element}
                 */
                if (this.typesAllowed.includes('image')) {
                    this.nodes.imageButton = this.makeButton('image', 'attach-image', 16, '', 'Загрузить изображение');
                    $.append(this.nodes.buttons, this.nodes.imageButton);
                    this.activateImageAttach();
                }

                /**
                 * Attach video button
                 * @type {Element}
                 */
                if (this.typesAllowed.includes('video')) {
                    this.nodes.videoButton = this.makeButton('video', 'attach-video', 12, '', 'Прикрепить видео');
                    $.append(this.nodes.buttons, this.nodes.videoButton);
                    this.activateVideoAttach();
                }

                /**
                 * Activate links attach
                 */
                if (this.typesAllowed.includes('link')) {
                    this.activateLinkAttach();
                }

                /**
                 * Activate tweets attach
                 */
                if (this.typesAllowed.includes('tweets')) {
                    this.activateTwitterAttach();
                }

                /**
                 * Activate Instagram attaches
                 */
                if (this.typesAllowed.includes('instagram')) {
                    this.activateInstagramAttach();
                }

                return this.nodes.buttons;
            }

            /**
             * Makes attach button
             * @param {string} name             - type of attach
             * @param {string} iconFileName     - SVG icon file name
             * @param {number|null} [iconWidth] - width of SVG icon
             * @param {string} [label]          - text of label
             * @param {string} [tooltip]        - text for hover tooltip
             * @returns {Element}
             */
            makeButton(name, iconFileName, iconWidth = 14, label = '', tooltip = ''){

                let button = $.make('span', [Attaches.CSS.buttonBaseClass, Attaches.CSS.button]),
                    icon = $.svg(iconFileName, iconWidth);

                /**
                 * Add BEM modifier to the button
                 */
                button.classList.add(Attaches.CSS['button' + libString.capFirstLetter(name)]);

                $.append(button, icon);

                if (label){
                    $.append(button, $.textNode(label));
                    button.classList.add(Attaches.CSS.buttonWithLabel);
                }

                if (tooltip){
                    let tooltipEl = $.make('div', Attaches.CSS.buttonTooltip, {
                        textContent: tooltip
                    });
                    $.append(button, tooltipEl);
                }

                return button;
            }

            /**
             * Enable attach-link button
             */
            activateAttachLinkButton(){
                $.on(this.nodes.linkButton, 'click', event => {
                    if (this.handlers.onAttachLinkButtonClick){
                        this.handlers.onAttachLinkButtonClick(event);
                    }
                });
            }

            /**
             * Enable URL pasting on the title input
             */
            activateLinkAttach() {

                this.linkAttacherInstance = new LinkAttacher({
                    attachesHolder: this.nodes.list,
                    onRemove: (attach) => {
                        this.attachRemoved(attach);
                    },
                    onAdd: (attach) => {
                        this.appendLink(attach);
                    }
                });
            }

            /**
             * Enable pasting twitter URLs
             */
            activateTwitterAttach() {

                this.twitterAttacherInstance = new TwitterAttacher({
                    attachesHolder: this.nodes.list,
                    onRemove: (attach) => {
                        this.attachRemoved(attach);
                    },
                    onAdd: (attach) => {
                        this.tweetAdded(attach);
                    }
                });

            }

            /**
             * Enable pasting Instagram URLs
             */
             activateInstagramAttach() {

                this.instagramAttacherInstance = new InstagramAttacher({
                    attachesHolder: this.nodes.list,
                    onRemove: (attach) => {
                        this.attachRemoved(attach);
                    },
                    onAdd: (attach) => {
                        this.instagramAdded(attach);
                    }
                });

            }


            /**
             * Allows to select and upload image for attach
             */
            activateImageAttach () {

                this.fileUploaderInstance = new FileUploader({
                    element: this.nodes.imageButton,
                    accept: 'image/*, video/mp4',
                    length: this.limit,
                    onProcess: () => {
                        this.nodes.imageButton.classList.add(Attaches.CSS.buttonLoading);
                    },
                    onError: (error) => {
                        notify.error( 'Не удалось загрузить изображение: ' + error.toLowerCase() );
                        this.nodes.imageButton.classList.remove(Attaches.CSS.buttonLoading);
                    },
                    onChange: (items) => {
                        this.nodes.imageButton.classList.remove(Attaches.CSS.buttonLoading);
                        items.forEach(item => this.appendImage(item));
                    }
                });
            }

            /**
             * Allow to paste URL for video attach
             * @fires module:popup#show
             */
            activateVideoAttach() {

                /**
                 * Show popup for URL pasting
                 */
                $.on(this.nodes.videoButton, 'click', () => popup.show({
                    template: 'attach_service',
                    onReady: () => this.popupOpened = true,
                    onClose: () => setTimeout( () => { this.popupOpened = false; }, 100)
                }));

                /**
                 * Handle change event on the popup input
                 */
                DOM.on( 'comments_attach_service', ( data ) => {

                    /**
                     * @type {module:parseServiceUrl.ServiceData}
                     */
                    let serviceData = parseServiceUrl( $.val( data.el ), true );

                    if ( serviceData ) {

                        popup.hide();

                        /**
                         * Pass parsed data to the handler
                         */
                        this.extractVideo(serviceData);

                    }
                } );
            }

            /**
             * Fires after Tweet addition
             * @param {TwitterAttach} attach
             */
            tweetAdded( attach ) {

                _log('Tweet attached', attach);

                /** add to list */
                this.attaches.push({ type: 'tweet', attach });

                /**
                 * Fire handler (used for analytics for example)
                 */
                if (typeof this.handlers.onAttach === 'function'){
                    this.handlers.onAttach('Tweet', attach);
                }

                /**
                 * Handle attaches limit
                 */
                this.attachAdded();
            }

            /**
             * Fires after Instagram Post addition
             * @param {InstagramAttach} attach
             */
            instagramAdded( attach ) {

                _log('Instagram attached', attach);

                /** add to list */
                this.attaches.push({ type: 'instagram', attach });

                /**
                 * Fire handler (used for analytics for example)
                 */
                if (typeof this.handlers.onAttach === 'function'){
                    this.handlers.onAttach('Instagram', attach);
                }

                /**
                 * Handle attaches limit
                 */
                this.attachAdded();

            }

            /**
             * Append uploaded image
             *
             * @param {module:Fileuploader.FileUploaderResponse} file
             */
            appendImage( file ) {

                let uploadData = file.upload_data || file.data,
                    uuid = uploadData.uuid;

                if ( !uuid ) {
                    notify.error('Неполадки при загрузке изображения. Попробуйте другой файл');
                    return;
                }

                let imageURL = `//${this.imageServer}/${uuid}/-/scale_crop/160x160/center/`,
                    attach;

                /**
                 * Make attach preview
                 * @type {ImageAttach}
                 */
                attach = new ImageAttach({
                    url: imageURL,
                    fileData: {
                        type: file.type,
                        data: uploadData
                    }
                });

                /**
                 * Set removing callback
                 */
                attach.onRemove = (attach) => {
                    this.attachRemoved(attach);
                };

                /**
                 * Append preview
                 */
                attach.appendTo(this.nodes.list);

                /**
                 * Add to the list
                 */
                this.attaches.push({type: 'image', attach});

                /**
                 * Fire handler (used for analytics for example)
                 */
                if (typeof this.handlers.onAttach === 'function'){
                    this.handlers.onAttach('Image', attach);
                }

                /**
                 * Handle attaches limit
                 */
                this.attachAdded();
            }

            /**
             * Link attached callback
             * @param {LinkAttach} attach
             */
            appendLink( attach ) {

                _log('Link attached', attach);

                /**
                 * Add to the list
                 */
                this.attaches.push({type: 'link', attach});

                /**
                 * Fire handler (used for analytics for example)
                 */
                if (typeof this.handlers.onAttach === 'function'){
                    this.handlers.onAttach('Link', attach);
                }

                /**
                 * Handle attaches limit
                 */
                this.attachAdded();
            }

            /**
             * Video URL parsing callback
             *
             * @param {module:parseServiceUrl.ServiceData} serviceData - data parsed by URL via {@link module:parseServiceUrl}
             */
            extractVideo (serviceData) {

                andropov.extractUrls([serviceData.origin], (response) => {
                    this.appendVideo(response.pop());
                });
            }

            /**
             * @param {{type, data}} uploadedItem
             */
            appendVideo(uploadedItem){
                if (uploadedItem.type === 'error') {
                    notify.error(`Не удалось загрузить видео`);
                    return;
                }

                /**
                 * Make preview
                 * @type {VideoAttach}
                 */
                let attach = new VideoAttach(uploadedItem);

                /**
                 * Set removing callback
                 */
                attach.onRemove = (attach) => {
                    this.attachRemoved(attach);
                };

                /**
                 * Append preview
                 */
                attach.appendTo(this.nodes.list);

                /**
                 * Add to the list
                 */
                this.attaches.push({type: 'video', attach});

                /**
                 * Fire handler (used for analytics)
                 */
                if (typeof this.handlers.onAttach === 'function'){
                    this.handlers.onAttach('Video', attach);
                }

                /**
                 * Handle attaches limit
                 */
                this.attachAdded();
            }

            /**
             * Callback fired when attach is removed
             * Updates attaches list
             * @param {ImageAttach|VideoAttach|LinkAttach|TwitterAttach|InstagramAttach} removedAttach — instance of removed Attach
             */
            attachRemoved(removedAttach) {

                /**
                 * Renew attaches list without removed one
                 */
                this.attaches = this.attaches.filter( item => item.attach !== removedAttach );

                /**
                 * Unlock attaches if need
                 */
                if (this.locked && this.attaches.length < this.limit){

                    /**
                     * Activate buttons
                     */
                    this.nodes.buttons.classList.remove(Attaches.CSS.buttonsDisabled);

                    /**
                     * Remove locker
                     */
                    $.off(this.nodes.buttons, 'click');

                    /**
                     * Activate all attaches again
                     */
                    this.activateImageAttach();
                    this.activateVideoAttach();
                    this.activateLinkAttach();
                    this.activateTwitterAttach();
                    this.activateInstagramAttach();

                    this.locked = false;
                }
            }

            /**
             * Callback fired after attach addition
             * Handles attaches limits
             */
            attachAdded() {

                if (this.attaches.length < this.limit){
                    return;
                }

                _log('Attaches count reaches limit');

                /**
                 * Deactivate buttons
                 */
                this.nodes.buttons.classList.add(Attaches.CSS.buttonsDisabled);

                /**
                 * Disable image attaches
                 */
                if (this.fileUploaderInstance) {
                    this.fileUploaderInstance.destroy();
                    _log('FileUploader destroyed');
                }


                /**
                 * Disable link attaches
                 * Pass withAttaches=false flag, to save attached links
                 */
                if (this.linkAttacherInstance) {
                    this.linkAttacherInstance.destroy( false );
                    _log('LinkAttacher destroyed');
                }

                /**
                 * Disable twitter attaches
                 * Pass withAttaches=false flag, to save attached links
                 */
                if (this.twitterAttacherInstance) {
                    this.twitterAttacherInstance.destroy( false );
                    _log('TwitterAttacher destroyed');
                }

                /**
                 * Disable instagram attaches
                 * Pass withAttaches=false flag, to save attached links
                 */
                if (this.instagramAttacherInstance) {
                    this.instagramAttacherInstance.destroy( false );
                    _log('InstagramAttacher destroyed');
                }

                /**
                 * Disable video attaches
                 */
                if (this.nodes.videoButton) {
                    $.off(this.nodes.videoButton, 'click');

                    if (DOM) {
                        DOM.off('comments_attach_service');
                    }
                    _log('Video attaches switched off');
                }

                /**
                 * Add locker on buttons holder
                 */
                $.on(this.nodes.buttons, 'click', () => notify.error(this.limitReachedText));

                this.locked = true;

            }

            /**
             * Return attaches list data
             *
             * @fires {@link LinkAttacher#data} getter
             * @fires {@link ImageAttach#data} getter
             * @fires {@link VideoAttach#data} getter
             * @return {Object[]}
             */
             get data () {

                let attaches_ = [];

                /**
                 * Attaches images and videos
                 */
                if (this.attaches) {
                    this.attaches.forEach( item => {

                        if (item.attach.removed) {
                            _log('Skip removed', item);
                            return;
                        }

                        attaches_.push({
                            type: item.type,
                            data: item.attach.data,
                        });
                    });
                }

                return attaches_;
            }

            /**
             * Method that handles paste-event on the field (Editor, Textarea, Input, etc)
             *
             * @param  {ClipboardEvent} event
             * @param  {string|null} pastedText - pasted data via plain-text format.
             */
            pasteHandler(event, pastedText) {

                if (!pastedText){
                    pastedText = event.clipboardData.getData('text/plain');
                }

                /**
                 * Do noting when attaches count reaches limit
                 */
                if (this.attaches.length >= this.limit){
                    return;
                }

                /**
                 * Detect video link
                 */
                let serviceData = parseServiceUrl( pastedText , true );
                if (serviceData) {

                    /**
                     * Pass parsed service data to the handler
                     */
                    this.extractVideo(serviceData);
                    event.preventDefault();
                    return false;
                }

                /**
                 * Detect image link
                 * @type {module:parseImageUrl.urls}
                 */
                let imagesURLs = parseImageUrl( pastedText , true );

                if (imagesURLs) {

                    /**
                     * Pass parsed service data to the handler
                     */
                    this.fileUploaderInstance.addUrls( imagesURLs );
                    event.preventDefault();
                    event.stopPropagation();
                    return false;
                }

                /* Detect twitter's URL */
                let twitterURLS = TwitterAttacher.isTwitterURL(pastedText);
                if (twitterURLS) {

                    this.twitterAttacherInstance.handlePastedText(pastedText);
                    event.preventDefault();
                    event.stopPropagation();
                    return false;
                }

                /* Detect instagram's URL */
                let instagramId = InstagramAttacher.getInstagramId(pastedText);
                if (instagramId) {

                    this.instagramAttacherInstance.handlePastedText(pastedText);
                    event.preventDefault();
                    event.stopPropagation();
                    return false;
                }

                /**
                 * Detect link for widget
                 */
                if (this.linkAttacherInstance) {
                    let urlDetectedAndParsed = this.linkAttacherInstance.handlePastedText(pastedText);

                    /**
                     * If URL was parsed, return FALSE to Editor to prevent default paste callback
                     */
                    if ( urlDetectedAndParsed ) {
                        event.preventDefault();
                        event.stopPropagation();
                        return false;
                    }
                }



                return true;

            }

            /**
             * Fill attaches thumbnails
             * @param {{type, data}[]} attaches
             */
            fill(attaches) {
                attaches.forEach( attach => {
                    switch (attach.type){
                        case 'image':
                            this.appendImage(attach.data);
                            break;
                        case 'video':
                            this.appendVideo(attach.data);
                            break;
                    }
                })
            }

            destroy(){
                if (DOM) {
                    DOM.off();
                }

                if ( this.linkAttacherInstance ) {
                    this.linkAttacherInstance.destroy();
                }

                if ( this.twitterAttacherInstance ) {
                    this.twitterAttacherInstance.destroy();
                }

                if ( this.instagramAttacherInstance ) {
                    this.instagramAttacherInstance.destroy();
                }

                if (this.fileUploaderInstance) {
                    this.fileUploaderInstance.destroy();
                }

                $.off(this.nodes.videoButton);
                $.off(this.nodes.linkButton);

                if ( this.attaches.length ){
                    this.attaches.forEach( item => item.attach.destroy() );
                    this.attaches = [];
                }

                this.popupOpened = false;



            }

        };

    }
);

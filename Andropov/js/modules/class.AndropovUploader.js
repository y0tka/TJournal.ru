Air.define('class.AndropovUploader', 'class.Timer, class.AndropovWrapper, lib.DOM, lib.andropov, fn.toArray', function(Timer, AndropovWrapper, $, lib_andropov, toArray, util) {

    function AndropovUploader(params) {
        this.$dom = {
            file_button: null,
            file_input: null,
            file_textarea: null,
            link_button: null,
            link_textarea: null
        };

        this.params = params || {};

        if (this.params.limit === undefined) {
            this.params.limit = 1;
        }

        this.items = [];
        this.items_length = 0;
        this.banned_signatures = [];

        this.timer_processText = null;

        this.createStructure();
    };

    /**
     * Запоминает сигнатуру айтема, который не будет добавляться
     */
    AndropovUploader.prototype.banSignature = function(signature) {
        this.banned_signatures.push(signature);
    };

    /**
     * Забанена ли данная сигнатура
     */
    AndropovUploader.prototype.isSignatureBanned = function(signature) {
        return this.banned_signatures.indexOf(signature) >= 0;
    };

    /**
     * Разбанить все сигнатуры
     */
    AndropovUploader.prototype.unbanAllSignatures = function() {
        this.banned_signatures = [];
    };

    /**
     * Вызывает обработчик, если таковой был передан в параметрах.
     */
    AndropovUploader.prototype.handle = function(handler_name, args) {
        if (this.params.handlers !== undefined && this.params.handlers[handler_name] !== undefined) {
            this.params.handlers[handler_name].apply(this, args);
        }
    };

    /**
     * Включает/выключает состояние ожидания.
     */
    AndropovUploader.prototype.wait = function(state) {
        this.handle('wait', [state !== false]);
    };

    /**
     * Проверяет, есть ли кнопка загрузки файлов.
     */
    AndropovUploader.prototype.hasFileButton = function() {
        return (this.params.file !== undefined) && (this.params.file.button !== undefined);
    };

    /**
     * Проверяет, привязано ли какое-либо текстовое поле к загрузчику фалов.
     */
    AndropovUploader.prototype.hasFileTextarea = function() {
        return (this.params.file !== undefined) && (this.params.file.textarea !== undefined);
    };

    /**
     * Проверя��т, есть ли кнопка загрузки ссылок.
     */
    AndropovUploader.prototype.hasLinkButton = function() {
        return (this.params.link !== undefined) && (this.params.link.button !== undefined);
    };

    /**
     * Проверяет, привязано ли какое-либо текстовое поле к загрузчику ссылок.
     */
    AndropovUploader.prototype.hasLinkTextarea = function() {
        return (this.params.link !== undefined) && (this.params.link.textarea !== undefined);
    };

    /**
     * Проверяет, есть ли контейнер, в котором будут отображаться загруженные айтемы.
     */
    AndropovUploader.prototype.hasPreview = function() {
        return (this.params.preview !== undefined && this.params.preview.container !== undefined);
    };

    /**
     * Создает структуру всего загручзика.
     */
    AndropovUploader.prototype.createStructure = function() {
        this.createStructureForFile();
        this.createStructureForLink();
    };

    /**
     * "Разрушает" структуру всего загручзика.
     */
    AndropovUploader.prototype.destroyStructure = function() {
        this.destroyStructureForFile();
        this.destroyStructureForLink();
    };

    /**
     * Возвращает HTML input'а для загрузки фалов.
     */
    AndropovUploader.prototype.getFileInputHtml = function() {
        var style = `style="position: absolute; z-index: 2; width: 100%; height: 100%; left: 0; top: 0; opacity: 0; cursor: pointer;"`,
            limit,
            accept;

        if (this.params.file.accept !== undefined) {
            accept = `accept="${this.params.file.accept}"`;
        } else {
            accept = ``;
        }

        if (this.params.limit > 1) {
            limit = `multiple`;
        } else {
            limit = ``;
        }

        return `<input type="file" ${accept} ${style} ${limit}/>`;
    };

    /**
     * Создает структуру загрузчика файлов.
     */
    AndropovUploader.prototype.createStructureForFile = function() {
        if (this.hasFileButton()) {

            this.$dom.file_button = this.params.file.button;
            this.$dom.file_input = $.parseHTML(this.getFileInputHtml());

            $.on(this.$dom.file_input, 'change', this.onFileInputChanged.bind(this));

            if ($.css(this.$dom.file_button, 'position') === 'static') {
                $.css(this.$dom.file_button, 'position', 'relative');
            }

            $.css(this.$dom.file_button, 'overflow', 'hidden');

            $.append(this.$dom.file_button, this.$dom.file_input);

        }

        if (this.hasFileTextarea()) {
            this.$dom.file_textarea = this.params.file.textarea;

            $.on(this.$dom.file_textarea, 'paste', this.onFileTextareaPasted.bind(this));
        }
    };

    /**
     * "Разрушает" структуру загрузчика файлов.
     */
    AndropovUploader.prototype.destroyStructureForFile = function() {
        if (this.hasFileButton()) {
            $.off(this.$dom.file_input);
            $.remove(this.$dom.file_input);

            this.$dom.file_button = null;
            this.$dom.file_input = null;
        }

        if (this.hasFileTextarea()) {
            $.off(this.$dom.file_textarea);

            this.$dom.file_textarea = null;
        }
    };

    /**
     * Создает структуру загрузчика ссылок.
     */
    AndropovUploader.prototype.createStructureForLink = function() {
        if (this.hasLinkButton()) {

            // todo

        }

        if (this.hasLinkTextarea()) {
            this.$dom.link_textarea = this.params.link.textarea;

            this.timer_processText = new Timer(this.processText.bind(this));

            $.on(this.$dom.file_textarea, 'input', this.onLinkTextareaChanged.bind(this));
        }
    };

    /**
     * "Разрушает" структуру загрузчика ссылок.
     */
    AndropovUploader.prototype.destroyStructureForLink = function() {
        if (this.hasLinkButton()) {

            // todo

        }

        if (this.hasLinkTextarea()) {
            $.off(this.$dom.file_textarea);

            this.timer_processText.destroy();

            this.$dom.link_textarea = null;
        }
    };

    /**
     * Отслеживает изменение состояния текстового поля загрузчика ссылок.
     */
    AndropovUploader.prototype.onLinkTextareaChanged = function() {
        this.timer_processText.debounce(500);
    };

    /**
     * Ищет ссылки в поле ввода и прогоняет их через андропова.
     */
    AndropovUploader.prototype.processText = function() {
        this.parseText($.val(this.$dom.link_textarea));
    };

    /**
     * Ищет ссылки в тексте и прогоняет их через андропова.
     *
     * Returns true if text has links
     */
    AndropovUploader.prototype.parseText = function(text) {
        var that = this;

        if (lib_andropov.textHasLinks(text)) {
            this.wait(true);

            lib_andropov.parseText(text, function(andropov_data_items, signatures) {
                that.wait(false);

                that.addItems(andropov_data_items, signatures);
            });

            return true;
        } else {
            return false;
        }
    };

    /**
     * Отслеживает изменение состояния текстового поля загрузчика файлов.
     */
    AndropovUploader.prototype.onFileTextareaPasted = function(event) {
        var clipboard = event.clipboardData || event.originalEvent.clipboardData;

        if ( clipboard && clipboard.files && clipboard.files.length > 0 ) {
            this.addFiles(toArray(clipboard.files));
        }
    };

    /**
     * Отслеживает изменение состояния загрузчика файлов.
     */
    AndropovUploader.prototype.onFileInputChanged = function(event) {
        this.addFiles(toArray(event.target.files));
        this.$dom.file_input.value = null;
    };

    /**
     * Добавляет файлы в загрузчик.
     */
    AndropovUploader.prototype.addFiles = function(files) {
        var that = this;

        this.wait(true);

        files.forEach(function(file) {
            file.rand = util.uid();
        });

        lib_andropov.uploadFiles(files, function(andropov_data_items, signatures) {
            that.wait(false);

            that.addItems(andropov_data_items, signatures);
        });
    };

    /**
     * Проверяет существует ли айтем с такой сигнатурой.
     */
    AndropovUploader.prototype.isSignatureExists = function(signature) {
        var i;

        if (signature !== null) {
            for (i = 0; i < this.items_length; i++) {
                if (this.items[i].signature === signature) {
                    return true;
                }
            }
        }

        return false;
    };

    /**
     * Добавляет один айтем.
     */
    AndropovUploader.prototype.addItem = function(andropov_data, signature) {
        if (signature !== undefined && (this.isSignatureExists(signature) || this.isSignatureBanned(signature))) {
            return;
        }

        this.items[this.items_length++] = {
            uid: util.uid(),
            signature: signature === undefined ? null : signature,
            is_processed: false,
            andropov_wrapper: new AndropovWrapper(andropov_data),
            preview_element: null,
            preview_element_remove: null
        };

        this.checkItemsLimit();
        this.processItems();
    };

    /**
     * Проверяет, не превышен ли лимит загруженных айтемов.
     */
    AndropovUploader.prototype.checkItemsLimit = function() {
        if (this.items_length > this.params.limit) {
            this.removeItems(this.items.slice(0, this.items_length - this.params.limit));
        }
    };

    /**
     * Добавляет айтемы, переданные в массиве.
     */
    AndropovUploader.prototype.addItems = function(andropov_data_items, signatures) {
        var length,
            i;

        for (i = 0, length = andropov_data_items.length; i < length; i++) {
            this.addItem(andropov_data_items[i], (signatures === undefined ? undefined : signatures[i]));
        }
    };

    /**
     * Удаляет айтемы, переданные в массиве.
     */
    AndropovUploader.prototype.removeItems = function(items_to_remove) {
        items_to_remove.forEach(this.removeItem.bind(this));
    };

    /**
     * Удаляет один айтем.
     */
    AndropovUploader.prototype.removeItem = function(item, ban_signature) {
        for (let i = 0; i < this.items_length; i++) {
            if (this.items[i].uid === item.uid) {
                if (item.preview_element !== null) {
                    this.removeItemFromPreview(item);
                }

                this.items.splice(i, 1);
                this.items_length--;

                if (ban_signature === true) {
                    this.banSignature(item.signature);
                }

                break;
            }
        }
    };

    /**
     * Возвращает андроповские данные айтема.
     */
    AndropovUploader.prototype.getAndropovData = function(item) {
        return this.getAndropovWrapper(item).getData();
    };

    /**
     * Возвращает AndropovWrapper айтема.
     */
    AndropovUploader.prototype.getAndropovWrapper = function(item) {
        return item.andropov_wrapper;
    };

    /**
     * Обрабатывает айтемы, которые были добавлены но еще не обработаны:
     * – создает превью.
     */
    AndropovUploader.prototype.processItems = function() {
        var i;

        for (i = 0; i < this.items_length; i++) {
            if (this.items[i].is_processed === false) {
                if (this.items[i].preview_element === null) {
                    this.addItemToPreview(this.items[i]);
                }

                this.items[i].is_processed = true;
            }
        }

        this.handle('change', [this.get(), this.getData()]);
    };

    /**
     * Возвращает HTML превью для айтема.
     */
    AndropovUploader.prototype.getPreviewItemHtml = function(item) {
        // var main_class = $.bem.getMainClass(this.params.preview.container);
        var main_class = 'andropov_uploader';

        return `<div class="${main_class}__preview_item">
            ${item.andropov_wrapper.getPreviewHtml({size: this.params.preview.size || 80})}
            <div class="${main_class}__preview_item__remove"></div>
        </div>`;
    };

    /**
     * Отображает айтем в превью.
     */
    AndropovUploader.prototype.addItemToPreview = function(item) {
        if (this.hasPreview()) {
            item.preview_element = $.parseHTML(this.getPreviewItemHtml(item));
            item.preview_element_remove = $.bem.find(item.preview_element, 'remove');

            $.one(item.preview_element_remove, 'click', this.removeItem.bind(this, item, true));

            this.params.preview.container.append(item.preview_element);
        }
    };

    /**
     * Удаляет айтем из превью.
     */
    AndropovUploader.prototype.removeItemFromPreview = function(item) {
        if (this.hasPreview()) {
            $.off(item.preview_element);
            $.off(item.preview_element_remove);
            $.remove(item.preview_element);

            item.preview_element = null;
            item.preview_element_remove = null;
        }
    };

    AndropovUploader.prototype.notNull = function(value) {
        return value !== null;
    };

    AndropovUploader.prototype.getData = function() {
        return this.items.map(this.getAndropovData.bind(this)).filter(this.notNull);
    };

    AndropovUploader.prototype.get = function() {
        return this.items.map(this.getAndropovWrapper.bind(this))
    };

    AndropovUploader.prototype.toString = function() {
        return JSON.stringify(this.getData());
    };

    AndropovUploader.prototype.reset = function() {
        this.removeItems(this.items.slice());
        this.unbanAllSignatures();
    };

    AndropovUploader.prototype.destructor = function() {
        this.destroyStructure();

        this.items = null;
        this.params = null;

        this.$dom = null;
    };

    /*
    AndropovUploader.prototype. = function() {
    };
    */

    return AndropovUploader;

});

Air.define('class.AndropovWrapper', 'lib.andropov, lib.DOM, fn.parseUrl', function(lib_andropov, $, parseUrl) {

    var AndropovWrapper = function(andropov_data) {

        this.andropov_data = andropov_data;

    };

    /**
     * Возвращает данные картинки
     */
    AndropovWrapper.prototype.getImageData = function() {

        switch (this.andropov_data.type) {
            case 'image':
            case 'movie':
                return this.andropov_data.data;
                break;

            case 'video':
                return this.andropov_data.data.thumbnail.data;
                break;

            case 'link':
                return this.andropov_data.data.image.data;
                break;

            case 'universalbox':
                switch (this.andropov_data.data.service) {
                    case 'instagram':
                        return this.andropov_data.data.box_data.image ? this.andropov_data.data.box_data.image.data : null;
                        break;

                    default:
                        return null;
                }
                break;

            case 'tweet':
                let user_data = this.andropov_data.data.tweet_data.user;

                return {
                    uuid: user_data.profile_image_url_https,
                    color: user_data.profile_background_color,
                    size: 1
                };
                break;

            default:
                return null;
        }

    };

    /**
     * Возвращает заголовок
     */
    AndropovWrapper.prototype.getTitle = function() {

        switch (this.andropov_data.type) {
            case 'link':
                return this.andropov_data.data.title || this.getHostname();
                break;

            case 'universalbox':
                switch (this.andropov_data.data.service) {
                    case 'instagram':
                        return this.andropov_data.data.box_data.title || this.getHostname();
                        break;

                    default:
                        return null;
                }
                break;

            case 'tweet':
                return this.andropov_data.data.tweet_data.user.name;
                break;

            default:
                return null;
        }

    };

    /**
     * Возвращает описание
     */
    AndropovWrapper.prototype.getDescription = function() {

        switch (this.andropov_data.type) {
            case 'link':
                return this.andropov_data.data.description || this.getUrl();
                break;

            case 'universalbox':
                switch (this.andropov_data.data.service) {
                    case 'instagram':
                        return this.andropov_data.data.box_data.url || this.getUrl();
                        break;

                    default:
                        return null;
                }
                break;

            case 'tweet':
                return this.andropov_data.data.tweet_data.user.description;
                break;

            default:
                return null;
        }

    };

    /**
     * Возвращает ссылку
     */
    AndropovWrapper.prototype.getUrl = function() {

        switch (this.andropov_data.type) {
            case 'link':
                return this.andropov_data.data.url;
                break;

            case 'universalbox':
                switch (this.andropov_data.data.service) {
                    case 'instagram':
                        return this.andropov_data.data.box_data.url;
                        break;

                    default:
                        return null;
                }
                break;

            case 'tweet':
                return 'https://twitter.com';
                break;

            default:
                return null;
        }

    };

    /**
     * Возвращает хост ссылки
     */
    AndropovWrapper.prototype.getHostname = function() {
        return parseUrl(this.getUrl()).hostname;

    };

    /**
     * Возвращает URL картинки
     */
    AndropovWrapper.prototype.getImageUrl = function(width, height, scale_type) {

        if (this.hasImage()) {
            return lib_andropov.formImageUrl(this.getImageData().uuid, width, height, scale_type);
        } else {
            return null;
        }

    };

    /**
     * Есть ли картинка
     */
    AndropovWrapper.prototype.hasImage = function() {

        var image_data = this.getImageData();

        if (image_data === null || !image_data.uuid || !image_data.size) {
            return false;
        } else {
            return true;
        }

    };

    /**
     * Возвращает цвет картинки
     */
    AndropovWrapper.prototype.getColor = function() {

        var image_data = this.getImageData();

        if (image_data === null || !image_data.color) {
            return null;
        } else {
            return `#${image_data.color}`;
        }

    };

    /**
     * Возвращает андроповские данные
     */
    AndropovWrapper.prototype.getData = function() {
        return this.andropov_data;
    };

    /**
     * Возвращает андроповские данные в виде строки
     */
    AndropovWrapper.prototype.toString = function() {
        return JSON.stringify(this.getData());
    };

    /**
     * Возвращает андроповский тип
     */
    AndropovWrapper.prototype.getType = function() {
        return this.getData().type;
    };

    /**
     * Является ли андроповский тип переданным типом
     */
    AndropovWrapper.prototype.typeIs = function(type) {
        return this.getType() === type;
    };

    /**
     * Возвращает HTML с превьюшкой
     */
    AndropovWrapper.prototype.getPreviewHtml = function(params) {
        var main_class = 'andropov_preview',
            classes = [main_class, `${main_class}--${this.andropov_data.type}`],
            inner_html,
            icon_size = 44,
            image_styles = `width: ${params.size}px; height: ${params.size}px;`;

        switch (this.andropov_data.type) {
            case 'image':
                inner_html = `<img class="${main_class}__image" style="max-width: ${params.size}px; max-height: ${params.size}px;" src="${this.getImageUrl(params.size, params.size, 'preview')}">`;
                break;

            case 'movie':
            case 'video':
                inner_html = `<img class="${main_class}__image" style="${image_styles}" src="${this.getImageUrl(params.size)}">${$.svgHtml('andropov_play_default', icon_size)}`;
                break;

            case 'universalbox':
            case 'link':
            case 'tweet':
                inner_html = `<div class="${main_class}__info ${this.hasImage() ? '' : main_class + '__info--without_image'}">
                        <div class="${main_class}__title">${this.getTitle()}</div>
                        <div class="${main_class}__description">${this.getDescription()}</div>
                        <div class="${main_class}__hostname">${this.getHostname()}</div>
                    </div>`;

                if (this.hasImage()) {
                    inner_html += `<img class="${main_class}__image" style="${image_styles}" src="${this.getImageUrl(params.size)}">`;
                }
                break;

            default:
                inner_html = '';
        }

        return `<div class="${classes.join(' ')}" style="min-height: ${params.size}px; min-width: ${params.size}px">${inner_html}</div>`;
    };

    return AndropovWrapper;

});

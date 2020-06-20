Air.define('lib.andropov', 'module.metrics, lib.ajax, lib.string, fn.hashStr, lib.console', function(metr, ajax, lib_string, hashStr, console) {

    return {

        /**
         * Local cache of uploaded entities.
         * Хранит результаты загрузки. Ключем является сигнатура файла или ссылки.
         */
        cache: {},

        /**
         * Returns file signature.
         * Вычисляет сигнатуру файла по его основным признакам.
         */
        getFileSignature: function(file) {
            return hashStr([file.lastModified, file.name, file.size, file.type, file.rand || 0].join('.'));
        },

        /**
         * Returns link signature.
         * Вычисляет сигнатуру ссылки.
         */
        getLinkSignature: function(link) {
            return hashStr(link);
        },

        /**
         * Returns link of file signature.
         * Вычисляет сигнатуру переданного объекта.
         */
        getSignature: function(file_or_link) {
            if (file_or_link instanceof File) {
                return this.getFileSignature(file_or_link);
            } else if (typeof file_or_link === 'string') {
                return this.getLinkSignature(file_or_link);
            } else {
                console.warn('andropov', 'lib.andropov: couldn\'t get signature', file_or_link);
                return null;
            }
        },

        /**
         * Iterates through files and links and separate 'em to cached and not.
         * Принимает на вход ссылки или файлы,
         * вычисляет их сигнатуры,
         * смотрит есть ли айтемы с такими сигнатурами в локальном кеше,
         * возвращает закешированные результаты, незакешированные айтемы и их сигнатуры.
         */
        splitByCache: function(items) {
            var items_length,
                i,
                signature,
                cached = [],
                cached_signatures = [],
                uncached = [],
                uncached_signatures = [];

            for (i = 0, items_length = items.length; i < items_length; i++) {
                signature = this.getSignature(items[i]);

                if (signature === null || (this.cache[signature] === undefined)) {
                    uncached.push(items[i]);
                    uncached_signatures.push(signature);
                } else {
                    cached.push(this.cache[signature]);
                    cached_signatures.push(signature);
                }
            }

            return {
                cached: cached,
                cached_signatures: cached_signatures,
                uncached: uncached,
                uncached_signatures: uncached_signatures
            };
        },

        /**
         * Adds item to local cache.
         */
        addToCache: function(original, result) {
            this.cache[this.getSignature(original)] = result;
        },

        /**
         * Adds several items to local cache.
         */
        addSeveralToCache: function(originals, results) {
            var length,
                i;

            for (i = 0, length = originals.length; i < length; i++) {
                this.addToCache(originals[i], results[i]);
            }
        },

        /**
         * Filters error results.
         */
        filterErrors: function(andropov_items, original_items, signatures) {
            var i;

            for (i = andropov_items.length - 1; i >= 0; i--) {
                if (andropov_items[i].type === 'error') {
                    andropov_items.splice(i, 1);
                    original_items.splice(i, 1);
                    signatures.splice(i, 1);
                }
            }
        },

        /**
         * Calls specified method having preliminary checked local cache.
         * Принимает айтемы,
         * разделяет их на закешированные и нет,
         * вызывает указанный метод,
         * фильтрует ошибки в результатах,
         * компонует выходные данные.
         */
        callMethodUsingCache: function(method_name, items, callback) {
            var that = this,
                splited = this.splitByCache(items);

            if (splited.uncached.length > 0) {
                this[method_name](splited.uncached, function(andropov_items) {
                    var signatures;

                    if (andropov_items !== null) {
                        that.filterErrors(andropov_items, splited.uncached, splited.uncached_signatures);

                        that.addSeveralToCache(splited.uncached, andropov_items);

                        andropov_items = splited.cached.concat(andropov_items);
                        signatures = splited.cached_signatures.concat(splited.uncached_signatures);
                    }

                    callback(andropov_items, signatures);
                });
            } else {
                callback(splited.cached, splited.cached_signatures);
            }
        },

        /**
         * Uploads files.
         */
        uploadFiles: function(files, callback) {
            this.callMethodUsingCache('uploadFilesDirectly', files, callback);
        },

        /**
         * Uploads files to andropov avoiding local cache.
         */
        uploadFilesDirectly: function(files, callback) {
            ajax.post({
                url: '/andropov/upload',
                dataType: 'json',
                format: 'MFD',
                data: {
                    file: files
                },
                success: function(response) {
                    if (response && response.result) {
                        callback(response.result);
                    } else {
                        callback(null);
                    }
                },
                error: function() {
                    callback(null);
                }
            });
        },

        /**
         * Uploads images within URLs.
         */
        uploadImagesUrls: function(urls, callback) {
            this.callMethodUsingCache('uploadImagesUrlsDirectly', urls, callback);
        },

        /**
         * Uploads images within URLs avoiding local cache.
         */
        uploadImagesUrlsDirectly: function(urls, callback) {
            ajax.post({
                url: '/andropov/upload/urls',
                dataType: 'json',
                data: {
                    urls: urls
                },
                success: function(response) {
                    if (response && response.result) {
                        callback(response.result);
                    } else {
                        callback(null);
                    }
                },
                error: function() {
                    callback(null);
                }
            });
        },

        /**
         * Extracts URLs data within andropov.
         */
        extractUrls: function(urls, callback) {
            this.callMethodUsingCache('extractUrlsDirectly', urls, callback);
        },

        /**
         * Extracts URLs data within andropov avoiding local cache.
         */
        extractUrlsDirectly: function(urls, callback) {
            ajax.get({
                url: '/andropov/extract',
                dataType: 'json',
                data: {
                    urls: urls
                },
                success: function(response) {
                    if (response && response.result) {
                        callback(response.result);
                    } else {
                        callback(null);
                    }
                },
                error: function() {
                    callback(null);
                }
            });
        },

        /**
         * Forms image filter.
         */
        formImageFilter: function(width, height, scale_type = 'scale_crop') {
            var filter = '';

            if (width !== undefined) {
                if (height === undefined) {
                    height = width;
                }

                if (metr.is_retina) {
                    width *= 2;
                    height *= 2;
                }

                filter = `-/${scale_type}/${width}x${height}/center/`;
            }

            return filter;
        },

        /**
         * Forms image URL by uuid, width and height.
         */
        formImageUrl: function(uuid, width, height, scale_type) {
            if (uuid.indexOf('http') === 0) { // для картинок, которые ссылки
                if (uuid.indexOf('leonardo') >= 0 && uuid.indexOf('proxy') < 0) {
                    return `${uuid}${this.formImageFilter(width, height, scale_type)}`;
                } else {
                    return `${uuid}`;
                }
            } else if (uuid[0] === '/') { // "местные" картинки
                return `${uuid}`;
            } else { // uuid
                return `https://leonardo.osnova.io/${uuid}/${this.formImageFilter(width, height, scale_type)}`;
            }
        },

        /**
         * Локальный кеш парсемого текста.
         *
         * ВНИМАНИЕ, КОНКУРС!
         * Какой будет форма глагола "парсить", если это страдательное причастие настоящего времени ("наблюдать – наблюдаемый")?
         * Ответы присылайте на а/я http://www.t.me/artemlegotin
         * Итоги конкурса подведем в конце года.
         */
        text_cache: {},

        addToTextCache: function(text, data) {
            this.text_cache[hashStr(text)] = data;
        },

        getFromTextCache: function(text) {
            return this.text_cache[hashStr(text)];
        },

        /**
         * Extracts and groups links from text.
         * Ищет ссылки в тексте
         */
        getLinksFromText: function(text) {
            var result = this.getFromTextCache(text),
                text_arr;

            if (result === undefined) {
                text_arr = lib_string.replaceLineBreaks(text, ' ').split(' ');

                result = text_arr.filter(lib_string.isURL.bind(lib_string)).map(lib_string.formatURL.bind(lib_string));

                this.addToTextCache(text, result);
            }

            return result;
        },

        /**
         * Есть ли в тексте ссылки для парсинга.
         */
        textHasLinks: function(text) {
            return this.getLinksFromText(text).length > 0;
        },

        /**
         * Extracts data from links in text.
         */
        parseText: function(text, callback) {
            this.extractUrls(this.getLinksFromText(text), callback);
        }
    };

});

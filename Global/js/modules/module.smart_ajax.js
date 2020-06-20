/**
 * Обрабатывает ответ от сервера, с учетом response code
 *
 * TODO:
 * – наравне с success и error добавить callback, который вызывается как callback(data), или callback(false, error)
 *
 * Самому себе: Артем, в следующий раз записывай цель фичи, а то потом не понятно зачем хотел
 */
Air.define( 'module.smart_ajax', 'module.notify, lib.ajax, lib.console',
    /**
     * @module smartAjax
     * Pass ignore_error_notify to disable default error notification
     */
    function( notify, ajax, console ) {

    var self = this,
        response_code_handlers = {};

    self.addResponseCodeHandler = function(code, handler) {
        response_code_handlers[code] = handler;
    };

    self.getResponseCodeHandler = function(code) {
        return response_code_handlers[code] || response_code_handlers['default'];
    };

    self.useResponseCodeHandler = function(code, rm, data, params) {
        console.log('smartajax', `useResponseCodeHandler for code "${code}" ("${rm}")...`);
        self.getResponseCodeHandler(code)(function(status) {
            console.log('smartajax', `...callback status "${status}" for "${params.url}"`);
            switch (status) {
                case 'success':
                    if (params.success) {
                        params.success(data, rm);
                    }

                    if (params.complete) {
                        params.complete(data, false, rm);
                    }
                    break;

                case 'error':
                    if (params.ignore_error_notify !== true) {
                        notify.error(rm);
                    }

                    if (params.error) {
                        params.error(rm, code);
                    }

                    if (params.complete) {
                        params.complete({}, true, rm);
                    }
                    break;

                case 'repeat':
                    self.request(params);
                    break;
            }
        });
    };

    self.request = function( params ) {
        if (params.data === undefined) {
            params.data = {};
        }

        if (params.data.mode === undefined) {
            params.data.mode = 'raw';
        }

        console.log('smartajax', `request to "${params.url}"...`);

        return ajax.request( {
            type: params.type,
            url: params.url,
            data: params.data,
            headers: params.headers,
            format: params.format,
            cache: params.cache,
            dataType: 'json',
            complete: function(response_data, response_code) {
                if (response_code === 200) {
                    if (response_data.rc === undefined) {
                        console.log('smartajax', `...invalid data for "${params.url}"`);
                        self.useResponseCodeHandler('default', `Запрос закончился ошибкой (испорченные данные)`, {}, params);
                    } else {
                        if (response_data.rm === '') {
                            response_data.rm = 'OK';
                        }

                        console.log('smartajax', `...complete with code "${response_data.rc}" for "${params.url}"`);
                        self.useResponseCodeHandler(response_data.rc, response_data.rm, response_data.data, params);
                    }

                } else {
                    console.log('smartajax', `...invalid code "${response_code}" for "${params.url}"`);
                    self.useResponseCodeHandler('default', `Запрос закончился ошибкой (код ${response_code})`, {}, params);
                }
            }
        } );
    };

    self.post = function( params ) {
        params.type = 'post';
        return self.request( params );
    };

    self.get = function( params ) {
        params.type = 'get';
        return self.request( params );
    };

    self.init = function() {
        console.define('smartajax', 'SmartAjax ಠ_ರೃ', '#cd192e');

        self.addResponseCodeHandler( 'default', function( callback ) {
            callback( 'error' );
        } );

        self.addResponseCodeHandler( 200, function( callback ) {
            callback( 'success' );
        } );
    };
} );

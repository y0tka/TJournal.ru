Air.define('module.ajaxify', 'module.notify, module.location, module.online, lib.DOM, lib.ajax, lib.console', function(notify, module_location, online, $, ajax, console, util) {

    var self = this,
        $dom,
        click_lock,
        confirm_lock,
        confirm_lock_message,
        code_handlers,
        ajax_container_selector = null,
        scroll_top_history = {},
        response_code_handlers = {},
        query_events = {},
        timer_getWithAjax = null,
        saved_scroll = null;

    self.addResponseCodeHandler = function(code, handler) {
        response_code_handlers[code] = handler;
    };

    self.getResponseCodeHandler = function(code) {
        return response_code_handlers[code] || response_code_handlers['default'];
    };

    self.useResponseCodeHandler = function(code, data, url) {
        console.log('ajaxify', `useResponseCodeHandler for code "${code}" for "${url}"...`);

        self.getResponseCodeHandler(code)(function(status, reason) {
            console.log('ajaxify', `...callback status "${status}" for "${url}"`);

            switch (status) {
                case 'success':
                    successHandler(data);
                    break;

                case 'error':
                    if (reason === undefined) {
                        reason = `код ${code}`;
                    }

                    errorHandler(`Не удалось перейти на страницу (${reason})`);
                    break;

                case 'repeat':
                    getWithAjax(url);
                    break;
            }
        }, data);
    };

    /**
     * Patch for links inside editor.
     */
    function linkBelongsToEditor(a) {
        return $.belong(a, '.ce-redactor');
    }

    function onClickLink(event, a) {
        if (event.which === 1) {
            if (!click_lock && !linkBelongsToEditor(a)) {
                return goByLink(event, a);
            } else {
                event.preventDefault();
    			return false;
            }
        } else {
            /* Default action */
        }
    }

    function goByLink(event, a) {
        var url = a.getAttribute('href'),
            target = a.getAttribute('target'),
            is_target_self = (target === null) || (target === '_self'),
            is_no_ajax = a.getAttribute('data-no-ajax') !== null,
            is_meta = event.ctrlKey || event.metaKey,
            is_same_host = a.hostname === module_location.getHostname(),
            is_mail = (url !== null) && (url.indexOf( 'mailto:' ) === 0),
            options = {};

		ajax_container_selector = a.getAttribute( 'data-ajax-container' );

        if (url === null) {
            /* Default action */
        } else {
            if (!is_no_ajax && !is_meta && is_same_host && is_target_self && !is_mail) {
                event.preventDefault();

                self.goTo(url, {
                    save_scroll: a.getAttribute('data-save-scroll') !== null
                });

                return false;
            } else if (!is_same_host && !is_meta) {
                window.open(url);
                event.preventDefault();
                return false;
            } else {
                /* Default action */
            }
        }
	}

    function onUrlChanged(data) {
        var can_i_go = true;

        console.log('ajaxify', 'onUrlChanged', data);

        if (data.only_get_changed && self.checkQueryEvents(module_location.getSearch())) {
            console.log('ajaxify', 'intercepted by query handler');
            /* Do nothing */
        } else {
            if (confirm_lock) {
                if (confirm(confirm_lock_message)) {
                    self.confirmLock(false);
                } else {
                    module_location.restorePrevious();
                    can_i_go = false;
                }
            }

            if (can_i_go) {
                switch (data.action_source) {
                    case 'user':
                        history.scrollRestoration = 'auto';
                        break;

                    case 'browser':
                        history.scrollRestoration = 'manual';
                        break;
                }

                getWithAjax(data.url);
            }
        }
    }

    function getWithAjax(url, try_number) {
        clearTimeout(timer_getWithAjax);

        console.log('ajaxify', `getWithAjax "${url}"...`);

		if (online.is()) {
		    self.clickLock(true);

            self.trigger('Before request', {
                url: url
            });

			ajax.get({
				url: url,
				data: {
					'mode': 'ajax'
				},
				dataType: 'JSON',
                complete: function(response_data, response_code) {
                    console.log('ajaxify', `...complete with code "${response_code}" for "${url}"`);

                    self.clickLock(false);

                    self.trigger('After request');
                    self.useResponseCodeHandler(response_code, response_data, url);
                },
				async: false
			});
		} else {
            // Если это первый сбой, то выдаем соответствующее сообщение.
			if (try_number === undefined) {
                errorHandler('Что-то не так с интернетом, переподключаемся');
				try_number = 1;
			}

			let try_timeout = Math.pow(2, try_number) * 1000;

            console.log('ajaxify', `...offline! Try #${try_number}. Next try in ${try_timeout / 1000} seconds`);

			// Повторяем запрос через все больший и больший интервал.
			timer_getWithAjax = setTimeout(getWithAjax, try_timeout, url, try_number + 1);
		}
	}

    function tryToRequireSpecialScripts(data, callback) {
		var scripts_list;

		if (data.is_special) {
			scripts_list = $.parseHTML(data.html).filter(function(el) {
				return el.id === 'special_json';
			}).map(function(el) {
				return JSON.parse($.html(el)).js;
			})[0];

			if (scripts_list === undefined) {
                callback();
			} else {
				util.requireScripts(scripts_list, callback);
			}
		} else {
			callback();
		}
	}

    function setTitle(title) {
		document.title = title;
	}

	function setHTML(html) {
		var ajax_container;

		if (ajax_container_selector === null) {
			$dom.page.innerHTML = html;
		} else {
            ajax_container = $.find(ajax_container_selector);

			if (ajax_container) {
				$.parseHTML(html, true).forEach(function(element) {
					var container = $.find(element, ajax_container_selector);

					if (container) {
						$.replace(ajax_container, container);
					}
				});
			}

			ajax_container_selector = null;
		}
	}

    /**
	 * Remembers and returns scroll position for every URL.
	 */
	function rememberScrollTop() {
		scroll_top_history[module_location.getFullPath()] = window.scrollY;
	}

    function restoreScrollTop() {
        window.scrollTo(0, scroll_top_history[module_location.getFullPath()]);
    }

    function successHandler(response_data) {
        var ajaxify_data = response_data['module.ajaxify'];

        console.log('ajaxify', 'successHandler');

        if (ajaxify_data.redirect === undefined) {
            self.trigger('Before page changed');

            tryToRequireSpecialScripts(ajaxify_data, function() {
                setTitle(ajaxify_data.title);
                setHTML(ajaxify_data.html);

                if (saved_scroll === null) {
                    switch (history.scrollRestoration) {
                        case 'auto':
                            window.scrollTo(0, 0);
                            break;

                        case 'manual':
                            restoreScrollTop();
                            break;
                    }
                } else {
                    window.scrollTo(0, saved_scroll);
                    saved_scroll = null;
                }

                history.scrollRestoration = 'auto';

                util.build(module_location.getPath(), {
                    beforeRefresh: function() {
                        util.delegateData(response_data);
                        self.delegated_data = null; // чистим память
                    },
                    finish: function() {
                        self.trigger('Build finished');
                    }
                } );
            } );
        } else {
            if (ajaxify_data.redirect.external === true) {
                module_location.goToHard(ajaxify_data.redirect.url);
            } else {
                module_location.goTo(ajaxify_data.redirect.url, true);
            }
        }
    }

    function errorHandler(msg) {
        console.log('ajaxify', `errorHandler "${msg}"`);

	    notify.error(msg);
        module_location.restorePrevious();
    }

    self.init = function() {
        console.define('ajaxify', 'Ajaxify (ﾉ´ヮ´)ﾉ', '#dc4e41');

        $dom = {
            page: $.find('#page_wrapper')
        };

        click_lock = false;
        confirm_lock = false;

        code_handlers = {};

        $.delegateEvent(document, 'a', 'click.module_ajaxify', onClickLink);

        module_location.on('Url changed', onUrlChanged);

        self.addResponseCodeHandler('default', function(callback) {
            callback('error');
        });

        self.addResponseCodeHandler(200, function(callback, data) {
            if (self.isDataInvalid(data)) {
                callback('error', 'испорченные данные');
            } else {
                callback('success');
            }

        });
    };

    self.destroy = function() {
        $.off(document, 'click.module_ajaxify');
		module_location.off();
		self.off();
    };

    self.isDataInvalid = function(data) {
        for (let key in data) {
            if (data.hasOwnProperty(key)) {
                return false;
            }
        }

        return true;
    };

    self.clickLock = function(state) {
        click_lock = state !== false;
        // console.log('ajaxify', `clickLock`, click_lock);
    };

    self.confirmLock = function(state, message) {
        confirm_lock = state !== false;
        confirm_lock_message = (message === undefined) ? 'Вы что-то ввели и решили уйти, это не случайность?' : message;
    };

    self.goTo = function(url, options = {}) {
        console.log('ajaxify', `goTo "${url}"`);

        rememberScrollTop();

        if (options.save_scroll) {
            saved_scroll = window.scrollY;
        }

        module_location.goTo(url);
    };

    self.reload = function(){
        module_location.reload();
    };

    self.addQueryEvent = function(name, handler) {
        query_events[name] = handler;
    };

    self.removeQueryEvent = function(name) {
        query_events[name] = null;
    };

    self.checkQueryEvents = function(query) {
        var name,
            handler_result,
            was_handled = false;

        for (name in query_events) {
            if (query_events[name] !== null) {
                handler_result = query_events[name](query);

                if (handler_result !== undefined) {
                    self.trigger(handler_result, query);
                    was_handled = true;
                }
            }
        }

        return was_handled;
    };

});

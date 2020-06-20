( function( window, document, undefined ) {
	"use strict";

	/**
	 * Main framework.
	 * Consists of utility methods, ConfigManager and ModuleManager.
	 *
	 * Краткое описание (눈_눈;)
	 *
	 * Фреймворк позволяет строить приложение из компонент.
	 * Приложение состоит из компонент разных типов:
	 *   - module - часть приложения, singleton работающий по принципу init-refresh-destroy;
	 *   - class - конструктор некоторого класса;
	 *   - lib - набор методов/свойств;
	 *   - fn - простая функция.
	 *
	 * Компоненты могут зависеть от других компонент, образуя иерархию.
	 * Чем больше зависимостей у компоненты, тем больше ее вес: weight = max(dependence weight) + 1.
	 *
	 * По URL и/или DOM приложение понимает, какие компоненты нужно использовать в данный момент.
	 * Формируется 3 списка:
	 *   - компоненты для удаления;
	 *   - компоненты для обновления;
	 *   - компоненты для инициализации.
	 *
	 * Сначала происходит удаление (от самых тяжелых к самым легким),
	 * затем обновление и инициализация (от самых легких к самым тяжелым).
	 * Компоненты могут удаляться, обновляться или инититься асинхронно,
	 * при этом зависимые компоненты будут дожидаться их.
	 *
	 * TODO:
	 * – Сделать, чтобы Air.define понимал тип модуля по префиксу "module.", "class.", "lib." или "fn.".
	 * – В классах приходится делать util.inherit чтобы пользоваться модулями. Подумать на этот счет.
	 */
	var framework = new function() {
		var self = this;

		/**
		 * Set of utility functions.
		 * @module utility
		 */
		self.utility = new function() {
			var manager = this,
				current_uid = 0;

			/**
			  * Creates function which messages to console with color markers.
			  * @param {string} color - HEX-color.
			  * @return {function} log.
			  *
			  * @callback log
			  * @param {...*} - Usual console.log arguments
			  */
			manager.consoleMessage = function( color, sign, type ) {
				return function() {
					var args = [],
						args_length = arguments.length,
						i;

					for ( i = 0; i < args_length; i++ ) {
						args[ i ] = arguments[ i ];
					}

					args[ 0 ] = '%c' + sign + '%c ' + args[ 0 ];

					args.splice( 1, 0, 'color: ' + color + ';' );
					args.splice( 2, 0, 'color: black;' );

					console[ type ].apply( console, args );
				};
			};

			manager.log = manager.consoleMessage( '#38A24C', '#', 'log' );
			manager.info = manager.consoleMessage( '#007bf1', '@', 'log' );
			manager.warn = manager.consoleMessage( '#ffcc00', '?', 'warn' );
			manager.error = manager.consoleMessage( '#ff0033', '!', 'error' );

			/**
			  * Returns unique identifier everytime (uses external variable 'current_uid').
			  * @return {number} Unique number.
			  */
			manager.uid = function( prefix ) {
				return ( prefix ? prefix + '_' : '' ) + current_uid++;
			};

			/**
			  * Returns script element if it already exists. Null if not.
			  * @param {string} path_to_script - URL of file.
			  */
			manager.getScriptElement = function( path_to_script ) {
				var scripts = document.getElementsByTagName( 'script' ),
					scripts_length = scripts.length,
					i;

			    for ( i = 0; i < scripts_length; i++ ) {
			        if ( scripts[ i ].src.indexOf( path_to_script ) >= 0 ) {
						return scripts[ i ];
					}
			    }

			    return null;
			};

			/**
			  * Hooks JS-file by URL.
			  * @param {string} path_to_script - URL of file.
			  * @param {function} callback - Callback function.
			  * @param {boolean} True if file was succesfully hooked.
			  */
			manager.requireScript = function( path_to_script, callback, is_async ) {
				var script_element = manager.getScriptElement( path_to_script );

				var nullEvents = function() {
					script_element.onload = null;
					script_element.onerror = null;
				};

				if ( script_element === null ) {
					script_element = document.createElement( 'script' );
					script_element.type = 'text/javascript';
					script_element.src = path_to_script;

					if (is_async === true) {
						script_element.async = true
					}

					script_element.onload = function( event ) {
						nullEvents();
						callback && callback( true, script_element, path_to_script );
					};

					script_element.onerror = function( event ) {
						nullEvents();
						callback && callback( false );
					};

					document.getElementsByTagName( 'head' )[ 0 ].appendChild( script_element );
				} else {
					callback && callback( true, script_element, path_to_script );
				}
			};

			manager.requireScripts = function ( list, callback ) {
				var counter = 0,
					max_count = list.length;

				var iterator = function() {
					manager.requireScript( list[counter], function( state ) {
						counter++;

						if ( counter === max_count ) {
							callback();
						} else {
							iterator();
						}
					} );
				};

				iterator();
			};

            /**
             * Load JavaScript or CSS file and return a Promise
             * @param {string} url        - file source
             * @returns {Promise<string>} - loaded file's URL
             * @todo prevent multiple CSS files appending with the same 'href'
             */
            manager.loadResource = function(url) {
                /**
                 * File Extension
                 * @type {string} 'js' or 'css'
                 */
                let type = url.split('.').pop();

                if (type.includes('?')){ // for support file.js?v=1234 endings
                    type = type.substring(0, type.indexOf('?'));
                }

                if (!['js', 'css'].includes(type)) {
                    return Promise.reject('Unsupported file extension: ' + type);
                }

                return new Promise((resolve, reject) => {
                    if (type === 'js') {
                        manager.requireScript(url, (state) => {
                            if (state) {
                                resolve(url);
                            } else {
                                reject('Failed to load resource: ' + url);
                            }
                        });
                    } else {
                        let linkEl = document.createElement('link');

                        linkEl.rel = 'stylesheet';
                        linkEl.href = url;

                        linkEl.onload = () => {
                            resolve(url);
                        };
                        linkEl.onerror = () => {
                            reject('Failed to load resource: ' + url);
                        };

                        document.getElementsByTagName('head')[0].appendChild(linkEl);
                    }
                });
            };

			/**
			  * Determines variable type.
			  * @param {*} testee - Arbitrary varible.
			  * @return {string} Variable type.
			  */
			manager.who = function( testee ) {
				var type;

				if ( testee instanceof Function ) {
					return 'function';
				} else if ( testee instanceof Array ) {
					return 'array';
				} else if ( testee instanceof Object ) {
					return 'object';
				} else {
					if ( testee === null ) {
						return 'null';
					} else {
						type = typeof testee;

						switch ( type ) {
							case 'number':
							case 'string':
							case 'boolean':
								return type;
								break;

							default:
								return 'unknown';
						}
					}
				}
			};

			/**
			  * Replaces markup variables.
			  * @param {string} str - Target string.
			  * @param {Object} variables - Variables to replace.
			  * @param {string} [s_1='%'] - Opening mark.
			  * @param {string} [s_2='%'] - Closing mark.
			  * @return {string} Replaced string.
			  */
			manager.replaceVars = function( str, variables, s_1, s_2 ) {
				var var_name;

				s_1 = s_1 || '%';
				s_2 = s_2 || s_1;

				s_1 = '\\' + s_1;
				s_2 = '\\' + s_2;

				for ( var_name in variables ) {
					str = str.replace( new RegExp( s_1 + var_name + s_2, 'g' ), variables[ var_name ] );
				}

				str = str.replace( new RegExp( s_1 + '[^' + s_1 + '|' + s_2 + ']*' + s_2, 'g' ), '' );

				return str;
			};

			/**
			  * Merges two JSON (not recursive!).
			  * @param {Object} a.
			  * @param {Object} b.
			  * @return {Object} Merged JSON.
			  */
			manager.mergeJSON = function( out ) {
				out = out || {};

		        for (var i = 1; i < arguments.length; i++) {
		            var obj = arguments[i];

		            if (!obj)
		                continue;

		            for (var key in obj) {
		                if (obj.hasOwnProperty(key)) {
		                    if (typeof obj[key] === 'object' && !(obj[key] instanceof Array)) {
                                out[key] = manager.mergeJSON(out[key], obj[key]);
							} else {
                                out[key] = obj[key];
							}
		                }
		            }
		        }

		        return out;
			};

			/**
			  * Splites path to components.
			  * @param {string} path - Path.
			  * @return {Array} Path components.
			  */
			manager.pathToComponents = function( path ) {
				return path.split( '/' ).filter( function( path_component ) {
					return path_component !== '';
				} );
			};

			/**
			  * Removes spaces from string.
			  * @param {string} str.
			  * @return {string}.
			  */
			manager.removeSpaces = function( str ) {
				return str.replace( /\s/g, '' );
			};

			/**
			  * Splits comma-separated list.
			  * @param {string} list.
			  * @return {Array}.
			  */
			manager.listToArray = function( list ) {
				return manager.removeSpaces( list || '' ).split( ',' ).filter( function( value ) {
					return value !== '';
				} );
			};

			/**
			  * Capitilizes first letter.
			  * @param {string} str.
			  * @return {string}.
			  */
			manager.capitilize = function( str ) {
				return str.charAt( 0 ).toUpperCase() + str.slice( 1 );
			};

			/**
			  * Returns diff between two arrays.
			  * @param {Array} first.
			  * @param {Array} second.
			  * @return {Array}.
			  */
			manager.diff = function( first, second ) {
				return first.filter( function( element ) {
					return second.indexOf( element ) < 0;
				} );
			};

			/**
			  * Returns intersection of two arrays.
			  * @param {Array} first.
			  * @param {Array} second.
			  * @return {Array}.
			  */
			manager.intersection = function( first, second ) {
				return first.filter( function( element ) {
					return second.indexOf( element ) >= 0;
				} );
			};

			/**
			  * Returns union of two arrays.
			  * @param {Array} first.
			  * @param {Array} second.
			  * @return {Array}.
			  */
			manager.union = function( first, second ) {
				return first.concat( second );
			};

			/**
			  * Removes repeating items from array.
			  * @param {Array} array.
			  * @return {Array}.
			  */
			manager.unique = function( array ) {
				var seen = {};

				return array.reduce( function( result, current ) {
					if ( seen[ current ] === undefined ) {
						seen[ current ] = true;
						return result.concat( current );
					} else {
						return result;
					}
				}, [] );
			};
		};

		/**
		 * Manager providing work with framework config.
		 */
		self.ConfigManager = new function() {
			var manager = this,
				page_masks = [];

			/**
			  * Replaces variables in config JSON that looks like {{...}}.
			  * @param {Object} config - Config JSON containing 'variables' field.
			  * @return {Object} Config JSON with replaced variables.
			  */
			manager.replaceConfigVars = function( config ) {
				var variables = self.utility.mergeJSON( manager.config.variables, config.variables );

				return JSON.parse( self.utility.replaceVars( JSON.stringify( config ).replace( /'/g, '"' ), variables, '{{', '}}' ) );
			};

			/**
			  * Initializes manager:
			  *   - replaces config variables;
			  *   - calculates weights for router routes;
			  *
			  * @params {Object} config - {
			  *   {Object} variables - "name -> value" map
			  *   {Object} router - "path mask -> modules list" map
			  *   {string} global - Comma-separated list of global modules
			  *   {Object} modules - "module name -> config" map of configs for each module
			  *   {Object} path  - "name -> value" map of system paths
			  * }
			  */
			manager.init = function( config ) {
				manager.config = config;

				manager.config = manager.replaceConfigVars( manager.config );

				var router = manager.config.router,
					route_modules,
					route_mask_list,
					route_mask_array,
					step_mult = 10,
					default_weight = 1,
					asterisk_weight = 20,//*
					cap_weight = 1000;//^

				for ( route_mask_list in router ) {
					route_modules = self.utility.listToArray( router[ route_mask_list ] );
					route_mask_array = self.utility.listToArray( route_mask_list );

					route_mask_array.forEach( function( mask ) {
						var mask_components = self.utility.pathToComponents( mask ),
							regexp = [],
							weight = 0;

						mask_components.forEach( function( mask_component, i ) {
							var current_weight = default_weight,
								current_regexp = '';

							switch ( mask_component ) {
								case '*':
									current_weight = asterisk_weight;
									current_regexp = '([^/])+';
								break;

								case '^':
									current_weight = cap_weight;
									current_regexp = '(.)*';
								break;

								default:
									current_weight = default_weight;
									current_regexp = mask_component;
							}

							current_weight *= ( i + 1 ) * step_mult;

							weight += current_weight;
							regexp.push( current_regexp );
						} );

						page_masks.push( {
							mask: mask,
							weight: weight,
							regexp: new RegExp( '^/' + regexp.join( '/' ) + '([/])?$' ),
							modules_list: route_modules
						} );
					} );
				}
			};

			/**
			  * Returns list of global modules.
			  * @param {Object} config - Config JSON containing 'variables' field.
			  * @return {Object} Config JSON with replaced variables.
			  */
			manager.getGlobalModules = function() {
				return self.utility.listToArray( manager.config.global );
			};

			/**
			  * Returns modules list by URL path.
			  * @param {string} path - URL path.
			  * @return {Array} Modules list.
			  */
			manager.getPageModules = function( path ) {
				var suitable_routes = {},
					route,
					weight,
					min_weight = Infinity,
					best_route;

				path = path || window.location.pathname;

				if( path !== '/' && path.substr( -1 ) === '/' ) {
			        path = path.substr( 0, path.length - 1 );
			    }

				page_masks.forEach( function( item ) {
					if ( item.regexp.test( path ) === true ) {
						suitable_routes[ item.mask ] = item;
					}
				} );

				for ( route in suitable_routes ) {
					weight = suitable_routes[ route ].weight;

					if ( min_weight > weight ) {
						min_weight = weight;
						best_route = route;
					}
				}

				return self.utility.unique( ( ( suitable_routes[ best_route ] || {} ).modules_list || [] ).concat( manager.getGlobalModules() ) );
			};

			/**
			  * Returns path to module.
			  * @param {String} name - Module name.
			  * @return {String}.
			  */
			manager.getPathToModule = function( name ) {
				var result;

				if ( name && manager.config.modules[ name ] && manager.config.modules[ name ].path ) {
					result = manager.config.modules[ name ].path;
				} else {
					result = manager.config.path.modules;
				}

				return result + '/' + name + '.js';
  			};

			/**
			  * Adds path to module.
			  * @param {String} name - Module name.
			  * @param {String} value - Path.
			  * @return {String}.
			  */
			manager.addPathToModule = function( name, value ) {
				if ( !manager.config.modules[ name ] ) {
					manager.config.modules[ name ] = {};
				}

				manager.config.modules[ name ].path = value;
  			};

			/**
			  * Returns specific module config.
			  * @return {Object}.
			  */
			manager.getModuleConfig = function( module_name ) {
				return manager.config.modules[ module_name ] || {};
			};
		};

		/**
		 * Manager engaged in work with modules
		 */
		self.ModuleManager = new function() {
			var manager = this,
				modules = [],
				modules_length = 0,
				min_weight,
				max_weight,
				modules_list_to_init = [],
				modules_list_to_refresh = [],
				modules_list_to_destroy = [];

			/**
			 * Class for custom events
			 */
			var Event = function( default_namespace ) {
				this.default_namespace = default_namespace;
				this.events = [];
				this.events_length = 0;
				this.events_buffer = {};
			};

			/**
			 * Returns true if event matches for this name and namespace.
			 */
			Event.prototype.isEventMatches = function( event, name, namespace ) {
				var chose_it = false;

				if ( namespace !== undefined ) {
					if ( name !== undefined ) {
						// if name and name space are defined
						if ( event.name === name && event.namespace === namespace ) {
							chose_it = true;
						}
					} else {
						// if defined only namespace
						if ( event.namespace === namespace ) {
							chose_it = true;
						}
					}
				} else {
					if ( name !== undefined ) {
						// if only name defined
						if ( event.name === name ) {
							chose_it = true;
						}
					} else {
						// if nothing defined
						chose_it = true;
					}
				}

				return chose_it;
			};

			/**
			  * Choses listeners indexes by name and namespace.
			  * @param {string} [name] - Event name (acts for all events if empty).
			  * @param {string} [namespace] - Event namespace.
			  * @return {Array} List of chosen listeners indexes.
			  */
			Event.prototype.get = function( name, namespace ) {
				var event,
					chosen_indexes = [],
					chosen_indexes_length = 0,
					i;

				name = name || undefined;
				namespace = namespace || this.default_namespace || undefined;

				for ( i = 0; i < this.events_length; i++ ) {
					if ( this.isEventMatches( this.events[ i ], name, namespace ) === true ) {
						chosen_indexes[ chosen_indexes_length++ ] = i;
					}
				}

				return chosen_indexes;
			};

			/**
			  * Adds listener.
			  * @param {string} name - Event name.
			  * @param {string} [namespace] - Event namespace.
			  * @param {function} callback - Callback function.
			  *
			  * @callback callback.
			  * @param {Object} Triggered data.
			  */
			Event.prototype.on = function( name, namespace, callback ) {
				var i,
					buffer_length;

				if ( callback === undefined ) {
					callback = namespace;
					namespace = undefined;
				}

				this.events[ this.events_length++ ] = {
					name: name,
					namespace: namespace || this.default_namespace,
					callback: callback
				};

				if ( this.events_buffer[ name ] !== undefined ) {
					buffer_length = this.events_buffer[ name ].length;

					for ( i = 0; i < buffer_length; i++ ) {
						callback( this.events_buffer[ name ][ i ] );
					}
				}
			};

			/**
			  * Choses listeners indexes by name and namespace.
			  * @param {string} [name] - Event name (acts for all events if empty).
			  * @param {string} [namespace] - Event namespace.
			  * @return {Array} List of chosen listeners indexes.
			  */

			/**
			  * Removes listener.
			  * @param {string} [name] - Event name (acts for all events if empty).
			  * @param {string} [namespace] - Event namespace.
			  */
			Event.prototype.off = function( name, namespace ) {
				var remove_indexes = this.get( name, namespace ),
					i;

				this.events = this.events.filter( function( event, i ) {
					return remove_indexes.indexOf( i ) < 0;
				} );

				this.events_length = this.events.length;
			};

			/**
			  * Adds disposable listener.
			  * @param {string} name - Event name.
			  * @param {string} [namespace] - Event namespace.
			  * @param {function} callback - Callback function.
			  *
			  * @callback callback.
			  * @param {Object} Triggered data.
			  */
			Event.prototype.one = function( name, namespace, callback ) {
				var that = this;

				if ( callback === undefined ) {
					callback = namespace;
					namespace = undefined;
				}

				namespace = namespace || this.default_namespace || undefined;

				this.on( name, namespace, function( data ) {
					that.off( name, namespace );
					callback( data );
				} );
			};

			/**
			  * Fires event.
			  * @param {string} [name] - Event name (fires all if empty).
			  * @param {Object} [data] - Transmitted data.
			  */
			Event.prototype.trigger = function( name, data, buffering_type ) {
				var name = name || undefined,
					event,
					i;

				for ( i = 0; i < this.events_length; i++ ) {
					event = this.events[ i ];

					if ( ( ( name !== undefined ) ? ( event.name === name ) : true ) ) {
						event.callback( data );
					}
				}

				switch ( buffering_type ) {
					case 'chain':
						if ( this.events_buffer[ name ] === undefined ) {
							this.events_buffer[ name ] = [];
						}

						this.events_buffer[ name ].push( data );
						break;

					case 'last':
						this.events_buffer[ name ] = [ data ];
						break;
				}

				event = null;
			};

			/**
			 * Cleares events buffer
			 */
			Event.prototype.clearBuffer = function() {
				this.events_buffer = {};
			};

			/**
			 * Iterates function for each module.
			 * @param {function} iterator.
			 *
			 * @callback iterator.
			 * @param {Object} Module.
			 * @param {number} Module index.
			 * @param {number} Modules number.
			 * @return {null|undefined} Null if need to break.
			 */
			var each = function( iterator ) {
				var i;

				for ( i = 0; i < modules_length; i++ ) {
					if ( iterator( modules[ i ], i, modules_length ) === null ) {
						break;
					}
				}
			};

			/**
			 * Returns module by name.
			 * @param {string} name - Module name.
			 * @return {Object|null} Null if module doesn't exists.
			 */
			var get = function( name ) {
				var i;

				for ( i = 0; i < modules_length; i++ ) {
					if ( modules[ i ].name === name ) {
						return modules[ i ];
					}
				}

				return null;
			};

			/**
			 * Checks if exists.
			 * @param {string} name - Module name.
			 * @return {boolean} True if exists.
			 */
			var isExists = function( name ) {
				return get( name ) !== null;
			};

			/**
			 * Returns array of modules filtered by sieving function.
			 * @param {function} sieve - Sieving function.
			 * @return {Array} Array of modules.
			 *
			 * @callback sieve
			 * @param {Object} Module.
			 * @param {number} Module index.
			 * @param {number} Modules number.
			 * @return {boolean} False to be scattered.
			 */
			var filter = function( sieve ) {
				var filtered = [],
					filtered_length = 0,
					i;

				for ( i = 0; i < modules_length; i++ ) {
					if ( sieve( modules[ i ], i, length ) === true ) {
						filtered[ filtered_length++ ] = modules[ i ];
					}
				}

				return filtered;
			};

			/**
			 * Recursively collects list of modules by the initial modules list.
			 * @param {Array|string} names_list - Module name or list of those.
			 * @return {Array}.
			 */
			var getRelevantNames = function( names_list ) {
				var result_list = [],
					names_list_length,
					i;

				if ( typeof names_list === 'string' ) {
					names_list = [ names_list ];
				}

				names_list_length = names_list.length;

				result_list = self.utility.union( result_list, names_list );

				for ( i = 0; i < names_list_length; i++ ) {
					result_list = self.utility.union( result_list, getRelevantNames( get( names_list[ i ] ).deps_list ) );
				}

				return self.utility.unique( result_list );
			};

			/**
			 * Makes set of utility methods for components.
			 * @return {Object} Set of methods.
			 * TODO: make single object.
			 */
			var makeUtil = function() {
				return {
					build: self.ModuleManager.build,
					delegateData: self.ModuleManager.delegateData,
					addPathToModule: self.ConfigManager.addPathToModule,
					error: self.utility.error,
					consoleMessage: self.utility.consoleMessage,
					warn: self.utility.warn,
					log: self.utility.log,
					uid: self.utility.uid,
					requireScript: self.utility.requireScript,
					requireScripts: self.utility.requireScripts,
					loadResource: self.utility.loadResource,
					Event: Event,
					unique: self.utility.unique,
					diff: self.utility.diff,
					intersection: self.utility.intersection,
					inherit: function( module ) {
						return self.ModuleManager.inherit( module.name );
					}
				};
			};

			/**
			 * Complements and returns module defined as class.
			 * Dependencies and utility added to class arguments.
			 * Нельзя вызывать класс без положенных ему аргументов.
			 * @param {Object} module - Module.
			 * @return {Object}.
			 */
			var classGenerator = function( module ) {
				if ( module.parameters.immediately_invoked !== false ) {
					return module.content.apply( null, module.deps_kit.concat( makeUtil() ) );
				} else {
					return function() {
						return new ( module.content.bind.apply( module.content, [ null ].concat( [].slice.call( arguments ) ).concat( module.deps_kit ).concat( makeUtil() ) ) );
					};
				}
			};

			/**
			 * Complements and returns module defined as function.
			 * Dependencies and utility added to function arguments.
			 * @param {Object} module - Module.
			 * @return {Object}.
			 */
			var fnGenerator = function( module ) {
				return module.content.apply( null, module.deps_kit.concat( makeUtil() ) );
			};

			/**
			 * Complements and returns module defined as library.
			 * Dependencies and utility added to function arguments.
			 * @param {Object} module - Module.
			 * @return {Object}.
			 */
			var libGenerator = function( module ) {
				if ( module.actual_type === 'function' ) {
					return module.content.apply( null, module.deps_kit.concat( makeUtil() ) );
				} else {
					return module.content;
				}
			};

			/**
			 * Complements and returns module defined as IRD-module.
			 * @param {Object} module - Module.
			 * @return {Object}.
			 */
			var BaseConstructor = function( module ) {
				this.uid = self.utility.uid( module.name );
				this.name = module.name;
				this.config = module.config;

				this.util = makeUtil();

				this.__event = new Event();

				this.delegateData = function( data, is_merge ) {
					if ( is_merge === true ) {
						this.delegated_data = self.utility.mergeJSON( this.delegated_data, data );
					} else {
						this.delegated_data = data;
					}
				};

				this.delegateElements = function( data ) {
					this.elements = data;
				};

				this.on = function( event_name, callback ) {
					this.__event.on( event_name, this.uid, callback );
				};

				this.one = function( event_name, callback ) {
					this.__event.one( event_name, this.uid, callback );
				};

				this.off = function( event_name ) {
					this.__event.off( event_name, this.uid );
				}

				this.trigger = function( event_name, data ) {
					this.__event.trigger( event_name, data );
				};

				this.triggerOnce = function( event_name, data ) {
					this.__event.trigger( event_name, data, 'last' );
				};

				this.triggerChain = function( event_name, data ) {
					this.__event.trigger( event_name, data, 'chain' );
				};

				this.__clearEventsBuffer = function() {
					this.__event.clearBuffer();
				};

				try {
					module.content.apply( this, module.deps_kit.concat( this.util ) );
				} catch( error ) {
					self.utility.error( 'Error while define "%s": %s', module.name, error.stack.split('at ')[0].trim() );

					if ( self.is_debug === true ) {
						throw error;
					}
				}

				this.delegateData( {} );
			};

			/**
			 * Creates communication interface between parent and child modules.
			 * @param {string} name - Name of child module.
			 * @return {Object} Communication interface of child module.
			 */
			manager.inherit = function( name ) {
				var module = get( name ),
					uid,
					result;

				switch ( module.type ) {
					case 'constructor':
						uid = self.utility.uid( name );

						result = Object.create( module.constructed, {
							uid: {
								value: uid
							},
							on: {
								value: function( event_name, callback ) {
									module.constructed.__event.on( event_name, uid, callback );
								}
							},
							one: {
								value: function( event_name, callback ) {
									module.constructed.__event.one( event_name, uid, callback );
								}
							},
							off: {
								value: function( event_name ) {
									module.constructed.__event.off( event_name, uid );
								}
							}
						} );
						break;

					default:
						result = module.constructed;
				}

				return result;
			};

			/**
			 * Delegates arbitary data to modules.
			 * @param {Object} data - "module name -> data" map.
			 */
			manager.delegateData = function( data, is_merge ) {
				var module_name,
					module;

				for ( module_name in data ) {
					module = get( module_name );

					if ( module !== null && module.prepared && module.constructed && module.constructed.delegateData ) {
						module.constructed.delegateData( data[ module_name ], is_merge );
					}
				}

				module = null;
			};

			/**
			 * Delegates used DOM-elements to modules.
			 * @param {Object} data - "module name -> elements list" map.
			 */
			manager.delegateElements = function( data ) {
				var module_name,
					module;

				for ( module_name in data ) {
					module = get( module_name );

					if ( module !== null && module.prepared && module.constructed && module.constructed.delegateElements ) {
						module.constructed.delegateElements( data[ module_name ] );
					}
				}

				module = null;
			};

			/**
			 * Defines module.
			 * @param {string} name - Unique module name.
			 * @param {string|Array} [deps_list] - List of module dependencies.
			 * @param {function|Object} content - Module content.
			 * @param {Object} [parameters] - Additional parameters.
			 * @return {boolean} True if module succesfully defined.
			 */
			manager.define = function( name, deps_list, content, parameters ) {
				var content_actual_type,
					content_defined_type,
					content_type,
					error;

				if ( name === undefined ) {
					error = 'Module can`t be defined without name';
				} else if ( isExists( name ) === true ) {
					self.utility.warn( 'Module "%s" redefined', name );
				}

				if ( deps_list === undefined ) {
					deps_list = [];
					content = null; // TODO: null
					parameters = {};
					self.utility.error( 'Module "%s" defined without content', name );
				} else {
					switch ( self.utility.who( deps_list ) ) {
						case 'function':
						case 'object':
						case 'null':
							if ( parameters !== undefined ) {
								if ( content !== undefined ) {
									self.utility.mergeJSON( parameters, content );
								} else {
									// parameters = parameters;
								}
							} else {
								parameters = content;
							}

							content = deps_list;
							deps_list = [];
							break;

						case 'string':
							deps_list = self.utility.listToArray( deps_list );
							break;

						case 'array':
							break;

						default:
							error = 'Module "%s" has invalid dependencies format';
					}

					deps_list = deps_list || [];
					content = content === undefined ? null : content;
					parameters = parameters || {};

					content_actual_type = self.utility.who( content );
					content_defined_type = parameters.type;

					switch ( content_actual_type ) {
						case 'function':
							switch ( content_defined_type ) {
								//стандартный модуль, работающий оп принципу init-refresh-destroy (назвать IRD?)
								case undefined:
								case 'constructor':
									content_type = 'constructor';
									break;

								//простая функция
								case 'function':
									content_type = 'function';
									break;

								//класс
								case 'class':
									content_type = 'class';
									break;

								//библиотека
								case 'lib':
									content_type = 'lib';
									break;

								default:
									error = 'Module "%s" is a function but using as "' + content_defined_type + '"';
									break;
							}
							break;

						case 'object':
							//объект
							switch ( content_defined_type ) {
								case undefined:
								case 'lib':
									content_type = 'lib';
									break;

								default:
									error = 'Module "%s" is an object but using as "' + content_defined_type + '"';
									break;
							}
							break;

						case 'null':
							content_type = 'null';
							break;

						default:
							error = 'Module "%s" has invalid type "' + content_actual_type + '" (using as "' + content_defined_type + '")';
					}
				}

				if ( error === undefined ) {
					modules[ modules_length++ ] = {
						uid: self.utility.uid( name ), // unique identifier
						name: name, // Name
						deps_list: self.utility.unique( deps_list ), // dependencies list
						deps_kit: null, // dependencies (will be set later)
						content: content, // content
						type: content_type, // type
						actual_type: content_actual_type, // content actual type
						parameters: parameters, // parameters
						weight: 0, // weight (will be set later)
						topological_color: 'white',  // mark for topological sorting
						config: null // config (will be set later)
					};

					return true;
				} else {
					self.utility.error( error, name );
					return false;
				}
			};

			/**
			 * Defines module with specific type.
			 * Uses "define" method.
			 */
			manager.defineWithType = function( type, name, deps_list, content, parameters ) {
				if ( parameters === undefined ) {
					parameters = {};
				}

				parameters.type = type;
				return manager.define( name, deps_list, content, parameters );
			};

			/**
			 * Defines module and detects type by name.
			 */
			manager.autoDefine = function( name, deps_list, content, parameters ) {
				var splited_name = name.split( '.' );

				if ( parameters === undefined ) {
					parameters = {};
				}

				switch ( splited_name[ 0 ] ) {
					case 'fn':
						parameters.type = 'function';
						break;

					case 'lib':
						parameters.type = 'lib';
						break;

					case 'class':
						parameters.type = 'class';
						break;

					case 'module':
						parameters.type = 'constructor';
						break;

					default:
						console.warn( 'Module "%s" has unknown type "%s"', name, splited_name[ 0 ] );
				}

				return manager.define( name, deps_list, content, parameters );
			};

			/**
			 * Defines module.
			 * Uses "defineWithType" method.
			 */
			manager.defineModule = function( name, deps_list, content, parameters ) {
				return manager.defineWithType( 'constructor', name, deps_list, content, parameters );
			};

			/**
			 * Defines function.
			 * Uses "defineWithType" method.
			 */
			manager.defineFn = function( name, deps_list, content, parameters ) {
				return manager.defineWithType( 'function', name, deps_list, content, parameters );
			};

			/**
			 * Defines class.
			 * Uses "defineWithType" method.
			 */
			manager.defineClass = function( name, deps_list, content, parameters ) {
				return manager.defineWithType( 'class', name, deps_list, content, parameters );
			};

			/**
			 * Defines object.
			 * Uses "defineWithType" method.
			 */
			manager.defineLib = function( name, deps_list, content, parameters ) {
				return manager.defineWithType( 'lib', name, deps_list, content, parameters );
			};

			/**
			 * Asynchronously hooks module from file by name.
			 * @param {string} name - Module name.
			 * @param {function} callback.
			 */
			var requireModule = function( name, callback ) {
				self.utility.requireScript( self.ConfigManager.getPathToModule( name ), callback );
			};

			/**
			 * Asynchronously prepare defined module by name:
			 *   - recursively preparing child modules;
			 *   - complements with utilities;
			 *   - transmits config;
			 *
			 * @param {string} name - Module name.
			 * @param {function} callback.
			 */
			var prepareDefinedModule = function( name, callback ) {
				var module = get( name );

				if ( module === null ) {
					self.utility.error( 'Module "%s" is not defined', name );
					manager.define( name );
					module = get( name );
				}

				multiUse( module.deps_list, function( deps_list ) {
					module.deps_kit = deps_list.map( function( dep_name ) {
						return manager.inherit( dep_name );
					} );

					module.config = self.ConfigManager.getModuleConfig( name );

					switch ( module.type ) {
						case 'constructor':
							module.constructed = new BaseConstructor( module );
							break;

						case 'class':
							module.constructed = classGenerator( module );
							break;

						case 'function':
							module.constructed = fnGenerator( module );
							break;

						case 'lib':
							module.constructed = libGenerator( module );
							break;

						case 'null':
							module.constructed = null;
							break;

						default:
							self.utility.warn( 'Module "%s" has invalid type "%s"', module.name, module.type );
					}

					module.prepared = true;

					callback && callback( module );

					module = null;
				} );
			};

			/**
			 * Gets, sets and promises modules statuses.
			 */
			var registry = new function() {
				var that = this,
					items = {},
					resolved = {},
					callbacks = {};

				/**
				 * Gets module status.
				 * @param {string} name - Module name.
				 * @return {string|null} Value if set, null if doesn't set.
				 */
				this.get = function( name ) {
					return items[ name ] || null;
				};

				/**
				 * Sets module status and resolves it callbacks.
				 * @param {string} name - Module name.
				 * @param {string} status - Module status.
				 */
				this.set = function( name, status ) {
					var full_name = name + ' ' + status;

					items[ name ] = status;

					resolved[ full_name ] = true;

		            if ( callbacks[ full_name ] ) {
		                callbacks[ full_name ].forEach( function( callback ) {
		                    callback();
		                } );

		                callbacks[ full_name ] = null;
		            }
				};

				/**
				 * Defers @callback until module @name will be @status.
				 * Or runs it if module already has this status.
				 * @param {string} name - Module name.
				 * @param {string} status - Module status.
				 */
				this.when = function( name, status, callback ) {
					var full_name = name + ' ' + status;

					if ( resolved[ full_name ] !== true ) {
		                if ( callbacks[ full_name ] === undefined ) {
		                    callbacks[ full_name ] = [];
		                }

		                callbacks[ full_name ].push( callback );
		            } else {
		                callback();
		            }
				};
			};

			/**
			 * Asynchronously and recursively checks and changes module statuses:
			 * null -> requiring -> required -> preparing -> prepared
			 *
			 * @param {string} name - Module name.
			 * @param {function} callback.
			 */
			var use = function( name, callback ) {
				var status = registry.get( name );

				switch ( status ) {
					// if module is not required or finished to require...
					case null:
					case 'required':
						if ( get( name ) === null ) {// ...and if module is not required...
							// ...require it

							// Раньше в этом случае модули запрашивались удаленно, теперь мы их игнорим.

							// self.utility.warn( 'Module "%s" ignored', name );

							registry.set( name, 'requiring' );
							registry.set( name, 'required' );
							manager.define( name, null );
							use( name, callback );

							// requireModule( name, function( require_status, script_element, src ) {
							// 	registry.set( name, 'required' );
							//
							// 	if ( require_status !== true ) {
							// 		self.utility.error( 'Couldn`t require "%s"', name );
							// 		manager.define( name, null );
							// 	}
							//
							// 	if ( get( name ) === null ) {
							// 		self.utility.error( 'Something wrong with "%s"', name );
							// 		manager.define( name, null );
							// 	}
							//
							// 	use( name, callback );
							// } );
						} else {// ...and module is required but not prepared...
							// ...prepare it
							registry.set( name, 'preparing' );
							prepareDefinedModule( name, function( module ) {
								registry.set( name, 'prepared' );
								callback && callback( module );
							} );
						}
						break;

					// if module is in process of requiring or preparing... or prepared...
					case 'requiring':
					case 'preparing':
					case 'prepared':
						// ...postpone callback until module will be prepared or call it
						registry.when( name, 'prepared', callback );
						break;
				}
			};

			/**
			 * Asynchronously calls "use" method for list of modules names with common callback:
			 *
			 * @param {Array} names_list - List of modules names.
			 * @param {function} callback.
			 */
			var multiUse = function( names_list, callback ) {
				var names_list_length = names_list.length,
					used_modules = [],
					use_counter = 0,
					i;

				var localUse = function( i ) {
					use( names_list[ i ], function( module ) {
						use_counter += 1;
						used_modules[ i ] = module;

						if ( use_counter === names_list_length ) {
							callback && callback( names_list, used_modules );
						}
					} );
				};

				if ( names_list_length > 0 ) {
					for ( i = 0; i < names_list_length; i++ ) {
						localUse( i );
					}
				} else {
					callback && callback( names_list );
				}
			};

			/**
			 * Calculates modules weight relatively on each other:
			 *   1) run for each module;
			 *   2) if module "A" depends on module "B", set weight(A)=max(weight(A), weight(B)+1);
			 *   3) if previous is true, return to step 1;
			 *   4) calculates min and max weight;
			 *
			 * @return {boolean} True if ok, false if modules are in loop.
			 */

			var visit = function( module, stack ) {

 				if ( module ) {
 					switch ( module.topological_color ) {
 						case 'white':
 							module.topological_color = 'grey';

 							module.deps_list.forEach( function( name ) {
 								visit( get( name ), stack );
 							} );

 							module.topological_color = 'black';
 							stack.push( module );
 							break;

 						case 'grey':
 							break;
 					}
 				}
 			};

			 var arrangeWeights = function() {

 				var result = [],
					is_loop_detected = false;

 				each( function( module ) {
 					if ( module.topological_color === 'white' ) {
 						visit( module, result );
 					}
 				} );

				if ( is_loop_detected === false ) {
					result[ 0 ].weight = 0;

					min_weight = Infinity;
					max_weight = -Infinity;

	 				result.forEach( function( module ) {
	 					var weight = 0;

	 					module.deps_list.forEach( function( name ) {
	 						var m = get( name );

	 						if ( m !== null && m.weight >= weight ) {
	 							weight = m.weight + 1;
	 						}
	 					} );

	 					module.weight = weight;
						module.topological_color = 'white';

						if ( min_weight > weight ) {
							min_weight = weight;
						}

						if ( max_weight < weight ) {
							max_weight = weight;
						}
	 				} );

					return true;
				} else {
					return false;
				}
 			};

			/**
			 * Asynchronously and recursively executes "init", "refresh" or "destroy" method for modules by names list:
			 *   1) defines start wight, finish weight and direction;
			 *   2) set current_weight = start_weight;
			 *   3) process modules with weight = current_weight;
			 *   4) then
			 *      if (current_weight < finish_weight) set current_weight += direction and repeat step 3
			 *      else calls callback
			 *
			 * @param {Array} names_list - List of modules names.
			 * @param {string} order - Cycle direction, "increase" or not.
			 * @param {string} method_name - Name of called method.
			 * @param {function} callback.
			 */
			manager.processModules = function( names_list, order, method_name, callback ) {
				var shift = order === 'increase' ? 1 : -1,
					start_weight = order === 'increase' ? min_weight : max_weight,
					finish_weight = order === 'increase' ? max_weight : min_weight,
					global_counter = 0;

				var runWithWeight = function( current_weight ) {
					var w_modules = filter( function( module ) {
							return module.weight === current_weight && ( names_list.indexOf( module.name ) >= 0 );
						} ),
						w_modules_length = w_modules.length,
						counter = 0,
						i,
						module,
						method,
						start_date;

					if ( w_modules_length ) {
						self.utility.info( 'Weight %s:', current_weight );
					}

					var check = function( method_name, module_name, duration ) {
						counter += 1;
						global_counter += 1;

						if ( duration > 0 ) {
							self.utility.log( '%s "%s" (%sms)', self.utility.capitilize( method_name ), module_name, duration );
						} else {
							self.utility.log( '%s "%s"', self.utility.capitilize( method_name ), module_name );
						}


						if ( counter === w_modules_length ) {
							if ( current_weight !== finish_weight ) {
								runWithWeight( current_weight + shift );
							} else {
								callback && callback( global_counter );
							}
						}
					};

					if ( w_modules_length > 0 ) {
						for ( i = 0; i < w_modules_length; i++ ) {
							module = w_modules[ i ];

							start_date = Date.now();

							if ( module.type === 'constructor' ) {
								method = module.constructed[ method_name ];

								if ( method_name === 'destroy' ) {
									module.constructed.__clearEventsBuffer();
								}

								if ( method !== undefined ) {
									try {
										if ( module.parameters.async === true ) {
											( function( method_name, module_name, start_date ) {
												method.call( module.constructed, function() {
													check( method_name, module_name, Date.now() - start_date );
												} );
											} )( method_name, module.name, start_date );
										} else {
											method.call( module.constructed );
											check( method_name, module.name, Date.now() - start_date );
										}
									} catch ( error ) {
										self.utility.error( 'Error while %s "%s": %s', method_name, module.name, error.stack.split('at ')[0].trim() );

										if ( self.is_debug === true ) {
											throw error;
										}

										check( method_name, module.name, Date.now() - start_date );
									}
								} else {
									check( method_name, module.name, Date.now() - start_date );
								}
							} else {
								if ( module.content === null ) {
									self.utility.warn( 'Ignore "%s"', module.name );
								}
								check( method_name, module.name, Date.now() - start_date );
							}
						}
					} else {
						if ( current_weight !== finish_weight ) {
							runWithWeight( current_weight + shift );
						} else {
							callback && callback( global_counter );
						}
					}
				};

				runWithWeight( start_weight );
			};

			/**
			 * Initializes modules with method "processModules".
			 */
			manager.initModules = function( callback ) {
				manager.processModules( modules_list_to_init, 'increase', 'init', callback );
			};

			/**
			 * Refreshes modules with method "processModules".
			 */
			manager.refreshModules = function( callback ) {
				manager.processModules( modules_list_to_refresh, 'increase', 'refresh', callback );
			};

			/**
			 * Destroys modules with method "processModules".
			 */
			manager.destroyModules = function( callback ) {
				manager.processModules( modules_list_to_destroy, 'decrease', 'destroy', callback );
			};

			/**
			 * Collects list of used modules from current HTML.
			 * @return {Object} {
			 *   {Array} list - List of used modules.
			 *   {Object} elements - "module name -> [{element => settings}]" map.
			 * }
			 */
			manager.getDOMModules = function() {
				var elements = document.querySelectorAll( 'air, [air-module]' ),
					length = elements.length,
					module_item_map = {},
					modules_list = [],
					i,
					j,
					element,
					settings,
					settings_element,
					module_name,
					module_names,
					module_names_length;

				for ( i = 0; i < length; i++ ) {
					element = elements[ i ];

					switch ( element.tagName.toLowerCase() ) {
						case 'air':
							module_names = element.getAttribute( 'module' );
							settings_element = element;
						break;

						default:
							module_names = element.getAttribute( 'air-module' );
							settings_element = element.querySelectorAll( 'air-settings' )[ 0 ];
					}

					module_names = self.utility.listToArray( module_names );
					module_names_length = module_names.length;

					if ( module_names_length > 0 ) {
						settings = settings_element ? settings_element.textContent.trim() || '{}' : '{}';

						try {
							settings = JSON.parse( settings );
						} catch(error) {
							settings = {};

							self.utility.error( 'Error while parsing DOM-modules "%s": "%s"', module_names.join( ', ' ), error.stack.split('at ')[0].trim() );

							if ( self.is_debug === true ) {
								throw error;
							}
						}

						for ( j = 0; j < module_names_length; j++ ) {
							module_name = module_names[ j ];

							if ( module_item_map[ module_name ] === undefined ) {
								module_item_map[ module_name ] = [];
							}

							module_item_map[ module_name ].push( {
								element: element,
								settings: settings
							} );

							if ( modules_list.indexOf( module_name ) < 0 ) {
								modules_list.push( module_name );
							}
						}
					}
				}

				return {
					map: module_item_map,
					list: modules_list
				};
			};

			/**
			 * Forms modules list for current session by URL and current HTML.
			 * Finds out which modules should be inited, refreshed or destroyed.
			 *
			 * @param {string} page_url - Current page URL.
			 * @param {function} callback.
			 */
			manager.session = function( root_modules_list, callback ) {
				multiUse( root_modules_list, function( page_modules_list, modules_list ) {
					var new_modules_list = getRelevantNames( page_modules_list ),
						current_modules_list;

					if ( arrangeWeights() === true ) {
						current_modules_list = self.utility.union( modules_list_to_init, modules_list_to_refresh );

						modules_list_to_init = self.utility.diff( new_modules_list, current_modules_list );
						modules_list_to_refresh = self.utility.intersection( new_modules_list, current_modules_list );
						modules_list_to_destroy = self.utility.diff( current_modules_list, new_modules_list );

						callback && callback( modules_list );
					} else {
						self.utility.error( 'Modules are in loop. Shutting down' );
					}
				} );
			};

			/**
			 * Using "session" method to init, refresh and destroy modules.
			 * Order: destroy -> refresh -> init.
			 *
			 * @param {string} page_url - Current page URL.
			 * @param {Object} callbacks {
			 *   {function} beforeDestroy - Calls before modules destroyed
			 *   {function} beforeRefresh - Calls after modules destroyed but before refreshed
			 *   {function} beforeInit - Calls after modules refreshed but before inited
			 *   {function} finish - Calls after modules inited
			 * }
			 */
			manager.build = function( page_url, callbacks ) {
				var start_time = Date.now(),
					group_name = 'Air "' + decodeURIComponent( page_url ) + '"',
					config_modules = self.ConfigManager.getPageModules( page_url ),
					DOM_modules = manager.getDOMModules(),
					root_modules_list = self.utility.unique( config_modules.concat( DOM_modules.list ) );

				callbacks = callbacks || {};

				console.groupCollapsed( group_name );

				manager.session( root_modules_list, function( result ) {
					callbacks.beforeDestroy && callbacks.beforeDestroy();

					manager.destroyModules( function( count_init ) {
						modules_list_to_refresh.forEach( function( refreshed_module_name ) {
							if ( DOM_modules.list.indexOf( refreshed_module_name ) < 0 ) {
								DOM_modules.list.push( refreshed_module_name );
								DOM_modules.map[ refreshed_module_name ] = [];
							}
						} );

						manager.delegateElements( DOM_modules.map );

						callbacks.beforeRefresh && callbacks.beforeRefresh();

						manager.refreshModules( function( count_refresh ) {
							callbacks.beforeInit && callbacks.beforeInit();

							manager.initModules( function( count_destroy ) {
								self.utility.info( 'Ready (%d+%d+%d=%d components in %dms)', count_init, count_refresh, count_destroy, count_init + count_refresh + count_destroy, Date.now() - start_time );

								console.groupEnd( group_name );

								callbacks.finish && callbacks.finish();

								if ( window.onAirReady ) {
									window.onAirReady();
								}
							} );
						} );
					} );
				} );
			};

			manager.run = function( deps_list, callback ) {
				var start_time = Date.now(),
					group_name = 'Air run';

				console.groupCollapsed( group_name );

				if ( callback === undefined ) {
					callback = dependencies;
				} else {
					switch ( self.utility.who( deps_list ) ) {
						case 'string':
							deps_list = self.utility.listToArray( deps_list );
							break;

						case 'array':
							break;

						default:
							error = 'Require has invalid dependencies format';
					}
				}

				deps_list = deps_list || [];

				manager.session( deps_list, function() {
					manager.initModules( function() {
						callback.apply( null, deps_list.map( function( dep_name ) {
							return manager.inherit( dep_name );
						} ) );

						self.utility.log( 'Ready (%dms)', Date.now() - start_time );

						console.groupEnd( group_name );
					} );
				} );
			};

			/**
			  * Initializes manager:
			  *   - begins processing current URL and HTML;
			  *   - delegates data rendered on server;
			  */
			manager.init = function() {
				self.ModuleManager.build( window.location.pathname, {
					beforeInit: function() {
						self.ModuleManager.delegateData( window.__delegated_data || {} );
					}
				} );
			};
		};

		self.config = function( config ) {
			self.ConfigManager.init( config );

			return self;
		};

		self.start = function( params = {} ) {
			self.is_debug = params.is_debug === true;

			if ( window.airBeforeInit ) {
				self.utility.requireScripts( window.airBeforeInit(), self.ModuleManager.init );
			} else {
				self.ModuleManager.init();
			}

			return self;
		};
	};

	/**
	 * Exporting framework methods.
	 */
	window.Air = {
		init: framework.init,
		config: framework.config,
		start: framework.start,
		run: framework.ModuleManager.run,
		define: framework.ModuleManager.autoDefine,
		defineModule: framework.ModuleManager.defineModule,
		defineClass: framework.ModuleManager.defineClass,
		defineFn: framework.ModuleManager.defineFn,
		defineLib: framework.ModuleManager.defineLib,
		delegateData: framework.ModuleManager.delegateData
	};
} )( window, document );

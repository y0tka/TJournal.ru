Air.defineLib('lib.DOM', 'fn.toArray', function( toArray, util ) {

    /**
     * @module libDom
     */
    return new function() {

        var self = this,
            dom_events_list = [];

            // window.__dom_events = dom_events_list;

            /**
             * Polyfills
             */

             (function(e){
                 e.matches || (e.matches=e.matchesSelector||function(selector){
                   var matches = document.querySelectorAll(selector), th = this;
                   return Array.prototype.some.call(matches, function(e){
                      return e === th;
                   });
                 });
             })(Element.prototype);

            // polyfill for closes method
            (function(e) {
                e.closest = e.closest || function(selector) {
                    var node = this;

                    while (node) {
                        if (node.matches(selector)) return node;
                        else node = node.parentElement;
                    }

                    return null;
                }
            })(Element.prototype);

            /*
             * DOM Manipulations
             */

            /**
             * Checks if element is instanceof HTMLElement
             * @param  {Object} el - DOM Element
             * @return {Boolean}
             */
            this.isHTMLElement = function(el) {
                return el instanceof HTMLElement;
            };

            /**
             * Checks if element is instanceof NodeList
             * @param  {Object} el - DOM Element
             * @return {Boolean}
             */
            this.isNodeList = function(el) {
                return el instanceof NodeList;
            };

            /**
             * Checks if element is instanceof HTMLCollection
             * @param  {Object} el - DOM Element
             * @return {Boolean}
             */
            this.isHTMLCollection = function(el) {
                return el instanceof HTMLCollection;
            };

            this.isArray = function(el) {
                return el instanceof Array;
            };

            this.dealWithArbitraryData = function(subject, callback) {
                var data_type,
                    is_string = typeof subject === 'string',
                    is_html = is_string && subject.trim()[0] === '<';

                if (is_string && is_html) {
                    data_type = 'html';
                } else if (is_string) {
                    data_type = 'selector';
                } else if (this.isHTMLElement(subject)) {
                    data_type = 'element';
                } else if (this.isNodeList(subject) || this.isHTMLCollection(subject) || this.isArray(subject)) {
                    data_type = 'elements';
                } else {
                    data_type = 'other';
                }

                callback && callback(data_type);

                return data_type;
            };

            /**
             * Each takes selector or html or elements and iterate resulting elements
             * @param  {string|NodeList|HTMLElement|HTMLCollection}   subject
             * @param  {Function} callback
             */
            this.each = function(subject, callback) {
                var is_string = typeof subject === 'string',
                    is_html = is_string && subject.trim()[0] === '<',
                    elements,
                    i,
                    length;

                if (is_string && is_html) {
                    // Create DOM Elements by html and selects it
                    elements = this.parseHTML(subject.trim(), true);
                } else if (is_string) {
                    // Selects DOM Elements by selector
                    elements = this.findAll(subject);
                } else if (this.isHTMLElement(subject)) {
                    // Select DOM Element
                    elements = [subject];
                } else if (this.isNodeList(subject) || this.isHTMLCollection(subject) || this.isArray(subject)) {
                    // Select few DOM Elements
                    elements = subject;
                } else {
                    console.warn('Subject has unknown type', subject);
                }

                if (elements !== undefined) {
                    for (i = 0, length = elements.length; i < length; i++) {
                        callback(elements[i], i, length);
                    }

                    elements = null;
                }

            };

            /**
             * If element matches selector (+polyfill).
             * @param  {Object} el - DOM-element.
             * @param  {string} selector - Tested selector.
             * @return {boolean} True if matches.
             */
            if (!Element.prototype.matches) {
                Element.prototype.matches =
                    Element.prototype.matchesSelector ||
                    Element.prototype.mozMatchesSelector ||
                    Element.prototype.msMatchesSelector ||
                    Element.prototype.oMatchesSelector ||
                    Element.prototype.webkitMatchesSelector ||
                    function(s) {
                        var matches = (this.document || this.ownerDocument).querySelectorAll(s),
                            i = matches.length;
                        while (--i >= 0 && matches.item(i) !== this) {}
                        return i > -1;
                    };
            }

            this.matches = function(el, selector) {
                return el.matches(selector);
            };

            /**
             * Checks if element has specified class
             * @param  {Object} el 			- DOM Element
             * @param  {string} class_name 	- Class name
             * @return {Boolean}
             */
            this.hasClass = function(el, class_name) {
                return el.classList.contains(class_name);
            };

            /**
             * Toggle element's specified class
             * @param  {Object} el 			- DOM Element
             * @param  {string} class_name 	- Class name
             * @param  {Boolean} state 		- State of remove or add class
             */
            this.toggleClass = function(el, class_name, state) {
                class_name.split(' ').forEach(function(cls) {
                    el.classList.toggle(cls, state);
                });
            };

            this.addClass = function(el, class_name) {
                this.toggleClass(el, class_name, true);
            };

            this.removeClass = function(el, class_name) {
                this.toggleClass(el, class_name, false);
            };

            this.getClasses = function(el) {
                return el.classList;
            };

            /**
             * Set or remove attribute of element
             * @param  {Object} el 			- DOM Element
             * @param  {string} attr_name 	- Attribute name
             * @param  {string} value 		- Value of attribute
             */
            this.attr = function(el, attr_name, value) {
                if (value === undefined) {
                    return el.getAttribute(attr_name) || undefined;
                } else if (value === null) {
                    el.removeAttribute(attr_name);
                } else {
                    el.setAttribute(attr_name, value);
                }
            };

            /**
             * Set or remove data-attribute of element
             * @param  {Object} el 			- DOM Element
             * @param  {string} attr_name 	- Attribute name
             * @param  {string} value 		- Value of attribute
             */
            this.data = function(el, attr_name, value) {
                return this.attr( el, 'data-' + attr_name, value );
            };

            /**
             * Returns all attrubutes started with "attr_begin"
             * @param  {Object} el 			- DOM Element
             * @param  {string} attr_begin 	- Attribute begining
             */
            this.attrs = function(el, attr_begin) {
                var attributes = el.attributes,
                    length = attributes.length,
                    i,
                    result = {};

                for ( i = 0; i < length; i++ ) {
                    if ( attributes[ i ].name.indexOf( attr_begin ) === 0 ) {
                        result[ attributes[ i ].name.split( attr_begin )[ 1 ] ] = attributes[ i ].value;
                    }
                }

                return result;
            };

            /**
             * Copies attributes from "source_element" to "element"
             * @param  {DOM-element} source_element
             * @param  {DOM-element} element
             * @param  {Array} names
             */
            this.copyAttrs = function( source_element, element, names ) {
                var names_length = names.length,
                    i;

                for ( i = 0; i < names_length; i++ ) {
                    this.attr( element, names[ i ], this.attr( source_element, names[ i ] ) );
                }
            };

            /**
             * Append child element in parent element
             * @param  {Object} parent_el 	- Parent element
             * @param  {Object} child_el 	- Child element
             */
            this.append = function(parent_el, child_el) {
                if ( this.lastChild( parent_el ) !== child_el ) {
                    parent_el.appendChild(child_el);
                }
            };

            /**
             * Prepend child element in parent element
             * @param  {Object} parent_el 	- Parent element
             * @param  {Object} child_el 	- Child element
             */
            this.prepend = function(parent_el, child_el) {
                if ( this.firstChild( parent_el ) !== child_el ) {
                    parent_el.insertBefore(child_el, parent_el.firstChild);
                }
            };

            /**
             * Insert new element before target element
             * @param  {Object} target_el 	- Target element
             * @param  {Object} el 	        - New element
             */
            this.before = function(target_el, el) {
                if ( this.next( el ) !== target_el ) {
                    target_el.parentElement.insertBefore(el, target_el);
                }
            };

            /**
             * Insert new element after target element
             * @param  {Object} target_el	- Target element
             * @param  {Object} el 	        - New element
             */
            this.after = function(target_el, el) {
                if ( this.prev( el ) !== target_el ) {
                    target_el.parentElement.insertBefore(el, target_el.nextSibling);
                }

            };

            /**
             * Replaces first DOM-element with the second
             * @param  {Object} first
             * @param  {Object} second
             */
            this.replace = function(first, second) {
                first.parentElement.replaceChild(second, first);
            };

            /**
             * Remove element from DOM
             * @param  {Object} el – Element to remove
             */
            this.remove = function(el) {
                if ( el.parentElement ) {
                    el.parentElement.removeChild(el);
                }
            };

            /**
             * Find selector in parent element and returns first element
             * @param  {Object} el       - Parent element
             * @param  {string} selector - Selector
             * @return {Object}          - Found element
             */
            this.findAll = function(el, selector) {
                if (selector === undefined) {
                    selector = el;
                    el = document;
                }

                return toArray( el.querySelectorAll(selector) );
            };

            this.find = function(el, selector) {
                if (selector === undefined) {
                    selector = el;
                    el = document;
                }

                return el.querySelector(selector);
            };

            /**
             * Parse html and return element
             * @param  {srting} html 	- Any html string
             * @return {array|Element}  - Element or Array of Elements
             */
            this.parseHTML = function(html, is_array) {
                var tmp = document.implementation.createHTMLDocument( '' );
                tmp.body.innerHTML = html;

                tmp = toArray(tmp.body.children);

                if (tmp.length === 1 && is_array !== true) {
                    tmp = tmp[0];
                }

                return tmp;
            };

            /**
             * Creates tag by tag name
             * @param {srting} name –-tag name.
             * @return {Object} - DOM-element;
             */
            this.create = function(name) {
                return document.createElement(name);
            };

            /**
             * Helper for making Elements with classname and attributes
             * @param  {String} tagName              - new Element tag name
             * @param  {array|string} [classNames]   - list of CSS classes
             * @param  {Object} [attributes]         - any attributes
             * @return {Element}
             */
            this.make = function make(tagName, classNames, attributes = {}) {

                var el = this.create(tagName);

                if ( classNames ) {
                    if (this.isArray(classNames)){
                        el.classList.add(...classNames);
                    } else {
                        el.classList.add(classNames);
                    }
                }

                if (attributes) {
                    for (let attrName in attributes) {
                        el[attrName] = attributes[attrName];
                    }
                }

                return el;

            };

            /**
             * Helper for making Document fragment
             * @returns {DocumentFragment} - empty fragment
             */
            this.fragment = function() {
                return document.createDocumentFragment();
            };

            /**
             * Returns node copy.
             */
            this.clone = function( node, is_deep ) {
                if ( is_deep === undefined ) {
                    is_deep = false;
                }

                return node.cloneNode( is_deep );
            };

            /**
             * Makes text Node
             * @param {String} content
             * @returns {Text}
             */
            this.textNode = function(content) {
                return document.createTextNode(content);
            };

            /**
             * Replace or return inner html of element
             * @param  {Object} el   	- Element
             * @param  {string} [html] 	- Any html string
             * @return {string}      	- If {html} is undefined, than return inner html
             */
            this.html = function(el, html) {
                if (html === undefined) {
                    return el.innerHTML;
                } else {
                    el.innerHTML = html;
                }
            };

            /**
             * Appends HTML to element
             * @param  {Object} el   	- Element
             * @param  {string} [html] 	- Any html string
             */
            this.appendHTML = function(el, html) {
                el.innerHTML += html;
            };

            /**
             * Replace or return outer html of element
             * @param  {Object} el   	- Element
             * @param  {string} [html] 	- Any html string
             * @return {string}      	- If {html} is undefined, than return inner html
             */
            this.outerHtml = function(el, html) {
                if (html === undefined) {
                    return el.outerHTML;
                } else {
                    el.outerHTML = html;
                }
            };

            /**
             * Replace or return text content of element
             * @param  {Object} el   	- Element
             * @param  {string} [text] 	- Any text string
             * @return {string}      	- If {text} is undefined, than return text content
             */
            this.text = function(el, text) {
                if (text === undefined) {
                    return el.textContent;
                } else {
                    el.textContent = text;
                }
            };

            /**
             * Get children elements from parent element
             * @param  {Object} el - Parent element
             * @param  {String} selector - Selector
             * @return {Object}
             */
            this.children = function(el, selector) {
                var that = this,
                    children = toArray(el.children);

                if (selector !== undefined) {
                    children = children.filter(function(el) {
                        return that.matches(el, selector);
                    });
                }

                return children;
            };

            /**
             * Returns element first child.
             * @param  {Object} el - Parent element.
             * @return {Object}
             */
            this.firstChild = function(el) {
                return el.firstElementChild;
            };

            /**
             * Returns element last child.
             * @param  {Object} el - Parent element.
             * @return {Object}
             */
            this.lastChild = function(el) {
                return el.lastElementChild;
            };

            /**
             * Get element parent
             * @param  {Object} el
             * @return {Object}
             */
            this.parent = function(el) {
                return el.parentElement;
            };

            /**
             * Iterates all parents up to document root.
             * @param  {Object} el
             * @param {Function} callback
             */
            this.eachParent = function(el, callback) {
                var current_parent;

                if (el !== document.documentElement) {
                    current_parent = el;

                    // Простите, если break, вдруг, не сработает (ভ_ভ)
                    while (true) {
                        current_parent = current_parent.parentElement;

                        if (current_parent === null || callback( current_parent ) === null) {
                            break;
                        }
                    }
                } else {
                    callback( document.documentElement );
                }
            };

            /**
             * Iterates all the elements down to the tree, matched with "selector".
             */
             this.walk = function( root_element, iterator, selector, from_bottom ) {
                 var children_length = root_element.children.length,
                     i;

 				if (from_bottom === true) {
 					for ( i = 0; i < children_length; i++ ) {
 					    if ( this.walk( root_element.children[ i ], iterator, selector ) === null ) {
 					        return null;
 					    }
 					}
 				}

                 if ( selector === undefined || ( this.matches( root_element, selector ) === true ) ) {
                     if ( iterator( root_element ) === null ) {
                         return null;
                     }
                 }

                 if (from_bottom !== true) {
                 	for ( i = 0; i < children_length; i++ ) {
                 	    if ( this.walk( root_element.children[ i ], iterator, selector ) === null ) {
                 	        return null;
                 	    }
                 	}
                 }
             };

            this.isElementHidden = function(el) {
                return getComputedStyle(el).display === 'none' && el.hidden === true;
            };

            this.isHidden = function(el) {
                var that = this,
                    result = false;

                if ( this.isElementHidden(el) ) {
                    result = true;
                } else {
                    this.eachParent(el, function(current_parent) {
                        if ( that.isElementHidden(current_parent) ) {
                            result = true;
                            return null;
                        }
                    });
                }

                return result;
            };

            /**
             * Removes parent without removing childen.
             */
            this.unwrap = function(wrapper) {
            	var docFrag = document.createDocumentFragment(),
                    child;

            	while (wrapper.firstChild) {
            		child = wrapper.removeChild(wrapper.firstChild);
            		docFrag.appendChild(child);
            	}

            	wrapper.parentNode.replaceChild(docFrag, wrapper);
            };

            /**
             * Get element parent recoursive
             * @param  {Object} element
             * @param  {string} selector
             * @return {Object}
             */
            this.parents = function(element, selector) {
                var that = this,
                    parent;

                this.eachParent( element, function( current_parent ) {
                    if ( that.matches(current_parent, selector) === true ) {
                        parent = current_parent;
                        return null;
                    }
                } );

                return parent;
            };

            /**
             * Checks if element or its parent matches with selector.
             * @param  {Object} element
             * @param  {string} selector
             * @return {boolean}
             */
            this.belong = function(element, selector) {
                var result = false;

                if (this.matches(element, selector) || this.parents(element, selector)) {
                    result = true;
                }

                return result;
            };

            this.belongToElement = function(target_element, parent_element) {
                var result = false;

                if (target_element === parent_element) {
                    result = true;
                } else {
                    this.eachParent( target_element, function( current_parent ) {
                        if ( current_parent === parent_element ) {
                            result = true;
                            return null;
                        }
                    } );
                }

                return result;
            };

            /**
             * Get next sibling element
             * @param  {Object}   el - Element
             * @return {Object}
             */
            this.next = function(el) {
                return el.nextElementSibling;
            };

            /**
             * Get prev sibling element
             * @param  {Object}   el - Element
             * @return {Object}
             */
            this.prev = function(el) {
                return el.previousElementSibling;
            };

            /*
             * Events
             */

            /**
             * Delegate event from parent element to element from selector
             * @param  {Object}   parent_el     	- Parent element
             * @param  {string}   target_selector 	- Target selector
             * @param  {string}   event_name      	- Event name
             * @param  {Function} callback        	- Event handler
             */
            this.delegateEvent = function(parent_el, target_selector, event_name, callback) {
                this.addEvent(parent_el, event_name, function(event) {
                    var el = event.target,
                        matched;

                    while (el && el.matches && !matched) {
                        matched = el.matches(target_selector);

                        if (!matched) {
                            el = el.parentElement;
                        }
                    }

                    if (matched) {
                        callback.call(el, event, el);
                    }
                });
            };

            /**
             * Add event listener to an element
             * @param {Object}   el         - Element
             * @param {string}   event_name - Event name
             * @param {Function} callback   - Event handler
             */
            this.addEvent = this.on = function(el, event_name, callback) {
                var el_event_name = filterEventClass(event_name);

                el.addEventListener(el_event_name, callback);

                // console.count('addEvent')

                dom_events_list.push({
                    el: el,
                    event_string: event_name,
                    event_name: el_event_name,
                    event_class: getEventClass(event_name),
                    callback: callback
                });
            };

            this.outclick = function(element, callback, uid) {
                var that = this;

                if (uid === undefined) {
                    uid = 'outclick_' + util.uid();
                }

                this.one(document, 'click.' + uid, function(event) {
                    if (!that.belongToElement(event.target, element)) {
                        callback();
                    }
                });
            };

            this.click = function(element, callback) {
                this.on(element, 'click', callback);
            };

            this.enter = function(element, callback) {
                this.on(element, 'keydown', function(event) {
                    if (event.keyCode === 13) {
                        callback();
                    }
                });
            };

            this.one = function(el, event_name, callback) {
                var that = this;

                this.on(el, event_name, function() {
                    that.off(el, event_name);
                    callback.apply( this, Array.prototype.slice.call( arguments ) )
                });
            };

            /**
             * Remove event listener from an element
             * @param {Object}   el         - Element
             * @param {string}   event_name - Event name
             * @param {Function} callback   - Event handler
             */
            this.removeEvent = this.off = function(el, event_name) {
                var events_list = searchEvent(el, event_name, true);

                events_list.forEach(function(event_obj) {
                    el.removeEventListener(event_obj.event_name, event_obj.callback);
                    dom_events_list.splice(dom_events_list.indexOf(event_obj), 1);
                });
            };

            /**
             * Get array of events
             * @return {Array}
             */
            this.getEvents = function() {
                return dom_events_list;
            };

            /**
             * Search event in array
             * @example
             * // searchEvent(el)
             * // searchEvent(el, 'scroll')
             * // searchEvent(el, 'scroll.some_class')
             * // searchEvent(el, '.some_class')
             * @param  {Object} el
             * @param  {string} [event_name]	- Event with class '.some_class'
             * @return {Array}             		- Array of event list items
             */
            var searchEvent = function(el, event_name) {
                var filtered_events,
                    el_event_name = filterEventClass(event_name),
                    el_event_class = getEventClass(event_name),
                    is_class_only = el_event_name === '' && el_event_class !== undefined;

                filtered_events = dom_events_list.filter(function(event_obj, i) {
                    if (el === event_obj.el) {

                        if (el_event_name === undefined) {
                            return true;
                        } else if (is_class_only && el_event_class === event_obj.event_class) {
                            return true;
                        } else if (el_event_class === undefined && el_event_name === event_obj.event_name) {
                            return true;
                        } else if (el_event_class && event_name === event_obj.event_string) {
                            return true;
                        } else {
                            return false;
                        }

                    } else {
                        return false;
                    }
                });

                return filtered_events;
            };

            var removeEvent = function(el, event_name) {
                var filtered_events,
                    el_event_name = filterEventClass(event_name),
                    el_event_class = getEventClass(event_name),
                    is_class_only = el_event_name === '' && el_event_class !== undefined;

                filtered_events = dom_events_list.filter(function(event_obj, i) {
                    if (el === event_obj.el) {

                        if (el_event_name === undefined) {
                            return true;
                        } else if (is_class_only && el_event_class === event_obj.event_class) {
                            return true;
                        } else if (el_event_class === undefined && el_event_name === event_obj.event_name) {
                            return true;
                        } else if (el_event_class && event_name === event_obj.event_string) {
                            return true;
                        } else {
                            return false;
                        }

                    } else {
                        return false;
                    }
                });

                return filtered_events;
            };

            /**
             * Removes class from event name
             * @param  {string} event_string 	- Event name
             * @return {string}					- Event name without class
             */
            var filterEventClass = function(event_string) {
                return event_string && event_string.split('.')[0];
            };

            /**
             * Removes real event name from event name
             * @param  {string} event_string 	- Event name
             * @return {string}					- Event class
             */
            var getEventClass = function(event_string) {
                return event_string && event_string.split('.')[1];
            };

            /*
             * Styles & Position
             */

            /**
             * Собственная ширина (всегда в px).
             */
            this.clientWidth = function(el) {
                return el.clientWidth;
            };

            /**
             * Ширина с учетом отступов и рамок (всегда в px).
             */
            this.offsetWidth = function(el) {
                return el.offsetWidth;
            };

            /**
             * Ширина с учетом контента, скрытого за скролом (всегда в px).
             */
            this.scrollWidth = function(el) {
                return el.scrollWidth;
            };

            /**
             * Ширина указанная в стилях вместе с единицей.
             */
            this.styleWidth = function(el) {
                return el.style.width || '100%';
            };

            /**
             * Gets or sets element width.
             * @param {Object} el - DOM-element.
             * @param {number|string} [value] - Returns width if empty.
             * @param {Boolean} [is_check_unit=true] – Is need to check unit. False to skip for performance boost.
             * @return {number}
             */
            this.width = function(el, value, is_check_unit) {
                var unit = 'px';

                if (value !== undefined) {
                    value = value + '';

                    if (is_check_unit !== false && /px|%/.test(value)) {
                        unit = '';
                    }

                    el.style.width = value + unit;
                } else {
                    return this.clientWidth(el);
                }
            };

            this.clientHeight = function(el) {
                return el.clientHeight;
            };

            this.offsetHeight = function(el) {
                return el.offsetHeight;
            };

            this.scrollHeight = function(el) {
                return el.scrollHeight;
            };

            this.styleHeight = function(el) {
                return el.style.height || '100%';
            };

            /**
             * Gets or sets element height.
             * @param {Object} el - DOM-element.
             * @param {number|string} [value] - Returns width if empty.
             * @param {Boolean} [is_check_unit=true] – Is need to check unit. False to skip for performance boost.
             * @return {number}
             */
            this.height = function(el, value, is_check_unit) {
                var unit = 'px';

                if (value !== undefined) {
                    value = value + '';

                    if (is_check_unit !== false && /px|%/.test(value)) {
                        unit = '';
                    }

                    el.style.height = value + unit;
                } else {
                    return this.clientHeight(el);
                }
            };

            /**
             * Returns bounding client rect.
             * @param {Object} el.
             * @return {Object} Top and left.
             */
            this.rect = function(el) {
                // _log('bcr');
                // console.trace();
                return el.getBoundingClientRect();
            };

            /**
             * Returns element offset.
             * @param {Object} el.
             * @return {Object} Top and left.
             */
            this.offset = function(el) {
                var body_offset = this.rect( document.documentElement ),
                    el_offset = this.rect( el );

                return {
                    top: el_offset.top - body_offset.top,
                    left: el_offset.left - body_offset.left
                };
            };

            /**
             * Sets or gets element position.
             * @param {Object} - DOM-element.
             * @param {Object} value - Top and left.
             * @return {Object} Top and left.
             */
            this.position = function(el, value) {
                var el_offset,
                    parent,
                    parent_offset,
                    current_parent;

                if (value !== undefined) {
                    if (value.top !== undefined) {
                        this.cssSingle(el, 'top', value.top);
                    }

                    if (value.left !== undefined) {
                        this.cssSingle(el, 'left', value.left);
                    }
                } else {

                    this.eachParent( el, function( current_parent ) {
                        if ( getComputedStyle(current_parent).position !== 'static' || current_parent === document.documentElement ) {
                            parent = current_parent;
                            return null;
                        }
                    } );

                    el_offset = this.rect( el );
                    parent_offset = this.rect( parent );

                    return {
                        top: el_offset.top - parent_offset.top,
                        left: el_offset.left - parent_offset.left
                    };
                }
            };

            /**
             * Returns window top
             */
            this.windowTop = function() {
                return (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;
            };

            /**
             * Returns window left
             */
            this.windowLeft = function() {
                return (window.pageXOffset !== undefined) ? window.pageXOffset : (document.documentElement || document.body.parentNode || document.body).scrollLeft;
            };

            /**
             * Returns window width
             */
            this.windowWidth = function() {
                return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
            };

            /**
             * Returns window height
             */
            this.windowHeight = function() {
                return window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
            };

            /**
             * Returns prefix if property supported.
             * @param  {string} name - Property name.
             * @return {string|boolean} - Prefix or false.
             */
            this.supportCSS = function(name) {
                var prefixes = ['webkit', 'moz', 'o', 'ms'],
                    el = document.createElement('div'),
                    result = false,
                    i;

                if (name in el.style) {
                    result = '';
                } else {
                    for (i = 0; i < 4; i++) {
                        if (('-' + prefixes[i] + '-' + name) in el.style) {
                            result = prefixes[i];
                            break;
                        }
                    }
                }

                return result;
            };

            /**
             * Sets or gets element CSS-style.
             * @param {Object} el - DOM-element.
             * @param  {string} name - Property name.
             * @param  {number|string} [value]  - Property value.
             * @return {string} - Property value.
             */
            this.cssSingle = function(el, name, value) {
                var prefixes,
                    prefix,
                    computed_style,
                    real_name;

                /**
                 * Для определенных свойств проверяем, нужен ли префикс.
                 */
                switch (name) {
                    case 'transform':
                    case 'transition':
                    case 'animation':
                    case 'font-smoothing':
                        prefix = this.supportCSS(name);
                        break;
                }

                if (prefix !== false) {
                    real_name = (prefix ? ('-' + prefix + '-') : '') + name;

                    if (value !== undefined) {
                        el.style[real_name] = value;
                    } else {
                        return getComputedStyle(el).getPropertyValue(real_name);
                    }
                }
            };

            /**
             * Sets or gets element single or set CSS-styles.
             * @param {Object} el - DOM-element.
             * @param  {string|Object|Array} name - Property name or properties names array or "name->value" map.
             * @param  {number|string} [value]  - Property value.
             * @return {string|Array} - Property value or array of values.
             */
            this.css = function(el, subject, value) {
                var result,
                    key,
                    length;

                if (subject instanceof Array) {
                    result = {};
                    length = subject.length;

                    for (key = 0; key < length; key++) {
                        result[subject[key]] = self.cssSingle(el, subject[key]);
                    }

                    return result;

                } else if (typeof subject === 'object') {
                    for (key in subject) {
                        this.cssSingle(el, key, subject[key]);
                    }
                } else {
                    return this.cssSingle(el, subject, value);
                }
            };

            this.animateY = function( element, up, to, time, callback ) {
                var time_start = Date.now();

                var easeInOutCubic = function ( t ) {
                    return ( t < 0.5 ) ? ( 4 * t * t * t ) : ( ( t - 1 ) * ( 2 * t - 2 ) * ( 2 * t - 2 ) + 1 );
                };

                var iterator = ( function() {
                    var time_passed = Date.now() - time_start,
                        p = 0;

                    if ( time_passed < time ) {
                        p = easeInOutCubic( time_passed / time );
                    } else {
                        p = 1;
                    }
                    // _log(p);
                    this.cssSingle( element, 'transform', 'translateY(' + ( up + ( to - up ) * p ) + 'px)' );

                    if ( time_passed < time ) {
                        requestAnimationFrame( iterator );
                    } else {
                        if ( callback ) {
                            callback();
                        }
                    }
                } ).bind( this );

                iterator();
            };

            /**
             * Returns input value depended on the input type
             * @param {Element} input
             * @return {*}
             */
            function getInputValue(input) {

                var tag = input.tagName.toLowerCase();

                if (tag === 'select') {
                    return input.options[input.selectedIndex].value;
                } else if (input.type === 'checkbox') {
                    return input.checked ? ( input.getAttribute('value') || true ) : false;
                } else if (input.type === 'image') {
                    return input.getAttribute('value');
                } else if (input.type === 'radio') {

                    let sameRadios = document.getElementsByName(input.name),
                        value;

                    for (let i = sameRadios.length - 1; i >= 0; i--) {
                        if (sameRadios[i].checked){
                            value = sameRadios[i].value;
                        }
                    }

                    return value;

                } else {
                    return input.value;
                }

            }

            /**
             * Sets or gets input/textarea/select/radio value.
             * @param  {Element} el - DOM-element.
             * @param  {string|number} [value].
             * @return {string}
             */
            this.val = function(el, value) {
                var tag_name = el.tagName.toLowerCase();

                /**
                 * Getter
                 */
                if (value === undefined) {
                    return getInputValue(el);
                }

                /**
                 * Setter
                 */
                switch (tag_name) {
                    case 'select':
                        let option_el = $.find(el, 'option[value="' + value + '"]');

                        if (option_el) {
                            el.selectedIndex = option_el.index;
                        }
                        break;
                    case 'input':
                    case 'textarea':
                    case 'select':

                        if (el.getAttribute('type') === 'checkbox') {
                            el.checked = value;
                        } else if (el.getAttribute('type') === 'radio') {

                            let sameRadios = document.getElementsByName(el.name);

                            for (let i = sameRadios.length - 1; i >= 0; i--) {
                                el.checked = el.value == value;
                            }
                        } else {

                            el.value = value;

                            /**
                             * Trigger 'input' event to handle value change
                             * with modules such as LimitedInputs etc
                             */
                            el.dispatchEvent(new Event('input'));
                        }
                        break;
                }
            };

            /**
             * Returns if element exists on the page.
             * @param  {Object} el - DOM-element.
             * @return {boolean} True if exists.
             */
            this.isExists = function(element) {
                return document.body.contains(element);
            };

            /**
             * Returns if element contains element.
             */
            this.contains = function(parent_el, child_el) {
                return parent_el.contains(child_el);
            };

            /**
             * Returns index of element in its parent.
             * @param  {Object} el - DOM-element.
             * @return {number}
             */
            this.index = function(element) {
                var index = -1;

                if ( this.isExists( element ) ) {
                    index = 0;

                    while ( element = element.previousElementSibling ) {
                        index++;
                    }
                }

                return index;
            };

            this.onResize = function(element, callback) {
                return;
                var sensor = document.createElement('div'),
                    style = 'position: absolute; left: 0; top: 0; right: 0; bottom: 0; overflow: hidden; z-index: -1; visibility: hidden;',
                    style_child = 'position: absolute; left: 0; top: 0; transition: 0s;',
                    sensor_expand,
                    sensor_expand_child,
                    sensor_shrink,
                    sensor_shrink_child;

                sensor.innerHTML = '<div style="' + style + '">' +
                    '<div style="' + style_child + '"></div>' +
                    '</div>' +
                    '<div style="' + style + '">' +
                    '<div style="' + style_child + ' width: 200%; height: 200%"></div>' +
                    '</div>';

                if (getComputedStyle(element)['position'] === 'static') {
                    element.style.position = 'relative';
                }

                element.appendChild(sensor);

                sensor_expand = sensor.childNodes[0];
                sensor_expand_child = sensor_expand.childNodes[0];
                sensor_shrink = sensor.childNodes[1];
                sensor_shrink_child = sensor_shrink.childNodes[0];

                var reset = function() {
                    sensor_expand_child.style.width = '100000px';
                    sensor_expand_child.style.height = '100000px';

                    sensor_expand.scrollLeft = 100000;
                    sensor_expand.scrollTop = 100000;

                    sensor_shrink.scrollLeft = 100000;
                    sensor_shrink.scrollTop = 100000;
                };

                reset();

                this.addEvent(sensor_expand, 'scroll', function() {
                    console.log('sensor_expand scroll');
                    reset();
                });

                this.addEvent(sensor_shrink, 'scroll', function() {
                    console.log('sensor_shrink scroll');
                    reset();
                });
            };

            this.focus = function(element, value) {
                if (value !== undefined) {
                    if (value !== false) {
                        element.focus();
                    } else {
                        element.blur();
                    }
                } else {
                    return element === document.activeElement;
                }
            };

            this.bindTextareaAutoResize = function( textarea, state ) {
                if ( state !== false ) {

                    if (textarea.scrollHeight > 0) {
                        this.css( textarea, {
                            'height': textarea.scrollHeight + 'px',
                            'overflow-y': 'hidden'
                        } );
                    }

                    this.on( textarea, 'input', function() {
                        textarea.style.height = '1px';
                        textarea.style.height = textarea.scrollHeight + 'px';
                    } );
                } else {
                    this.off( textarea, 'input' );
                }
            };

            /**
             * Detach element, do some staff, and attach again
             * https://gist.github.com/cowboy/938767
             */
            this.detach = function (node, async, fn) {
                var parent = node.parentNode;
                var next = node.nextSibling;
                // No parent node? Abort!
                if (!parent) {
                    return;
                }
                // Detach node from DOM.
                parent.removeChild(node);
                // Handle case where optional `async` argument is omitted.
                if (typeof async !== "boolean") {
                    fn = async;
                    async = false;
                }
                // Note that if a function wasn't passed, the node won't be re-attached!
                if (fn && async) {
                    // If async == true, reattach must be called manually.
                    fn.call(node, reattach);
                } else if (fn) {
                    // If async != true, reattach will happen automatically.
                    fn.call(node);
                    reattach();
                }
                // Re-attach node to DOM.
                function reattach() {
                    parent.insertBefore(node, next);
                }
            }

            /**
             * BEM methods
             */
            this.bem = {
                child_sep: '__',
                mod_sep: '--',
                getMainClass: function( element ) {
                    return element.classList[ 0 ];
                },
                toggle: function( element, modifier, state ) {
                    self.toggleClass( element, this.getMainClass( element ) + this.mod_sep + modifier, state );
                },
                add: function( element, modifier ) {
                    this.toggle( element, modifier, true );
                },
                remove: function( element, modifier ) {
                    this.toggle( element, modifier, false );
                },
                find: function( element, name ) {
                    return self.find( element, '.' + this.getMainClass( element ) + this.child_sep + name );
                },
                findAll: function( element, name ) {
                    return self.findAll( element, '.' + this.getMainClass( element ) + this.child_sep + name );
                },
                hasMod: function( element, name ) {
                    return self.hasClass( element, this.getMainClass( element ) + this.mod_sep + name );
                }
            };

            /**
             * Prevents and stops event.
             */
            this.cancelEvent = function( event ) {
                event.preventDefault();
                event.stopPropagation();

                return false;
            };

            /**
             * Makes SVG symbol
             * It must be in sprite, so place it to the /images/ folder and refresh bundle
             * @param  {String} name   - icon file name
             * @param  {String} width  - icon width. '100%' by default.
             * @param  {String} height - icon height. '100%' by default.
             * @return {Element} SVG element
             */
            this.svg = function svg (name, width = '100%', height = '100%') {

                let icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

                icon.classList.add('icon', 'icon--' + name );

                icon.setAttribute('width', width);
                icon.setAttribute('height', height);

                icon.innerHTML = `<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#${name}"></use>`

                return icon;

            };

            this.svgHtml = function( name, width, height ) {
                if (height === undefined) {
                    height = width;
                }

                return `<svg class="icon icon--${name}" width="${width}" height="${height}"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#${name}"></use></svg>`;
            };

            /**
             * Calculate reflows
             */

            var ReflowInspector = new function() {
                var ref = this,
                    storage = [],
                    override_methods = ["toggleClass", "addClass", "removeClass", "attr", "append", "prepend", "before", "after", "remove", "html", "outerHtml", "text", "clientWidth", "offsetWidth", "scrollWidth", "styleWidth", "width", "clientHeight", "offsetHeight", "scrollHeight", "styleHeight", "height", "offset", "position", "supportCSS", "cssSingle", "val", "focus"];

                var override = function(object, method, func) {
                    var original = object[method];

                    object[method] = function() {
                        var return_value = original.apply(this, arguments);

                        func(method, arguments);

                        return return_value;
                    };
                };

                var store = function(method, args) {
                    var current_timestamp = Date.now(),
                        first_timestamp = (storage[0] || {
                            timestamp: current_timestamp
                        }).timestamp,
                        timestamp_diff = current_timestamp - first_timestamp,
                        storage_length = storage.length,
                        do_not_store = false,
                        store_obj = {
                            method: '',
                            element: '',
                            arg_1: '',
                            arg_2: '',
                            caller: '',
                            timestamp: ''
                        };

                    if (timestamp_diff > 10000) {

                        if (storage_length > 10) {
                            console.log('%c Too many Reflows in 1 second', 'background: #FFF0F0; color: #333; padding: 3px 0px;');
                            console.groupCollapsed('Reflow trace: ' + storage_length);
                            console.table(storage);
                            console.groupEnd('Reflow trace: ' + storage_length);
                        }

                        storage = [];
                        storage_length = 0;
                    }

                    switch (method) {
                        case 'attr':
                        case 'cssSingle':
                            do_not_store = args[2] == undefined;

                            store_obj.arg_1 = args[1];
                            store_obj.arg_2 = args[2];
                            break;
                    }

                    if (do_not_store === false) {
                        store_obj.method = method;
                        store_obj.element = args[0];
                        store_obj.timestamp = current_timestamp;

                        // store_obj.caller = args.callee.caller.toString();

                        storage.push(store_obj);
                    }

                    // _log(method, storage_length, timestamp_diff);
                };

                // override_methods.forEach(function(method) {
                //     override(self, method, store);
                // });

                // console.log(Object.keys(self));

                // select the target node
                // var target = document.body;
                //
                // // create an observer instance
                // var observer = new MutationObserver(function(mutations) {
                //     mutations.forEach(function(mutation) {
                //         console.log(mutation.type);
                //     });
                // });
                //
                // // configuration of the observer:
                // var config = {
                //     attributes: true,
                //     childList: true,
                //     characterData: true,
        		// 	subtree: true
                // };

                // pass in the target node, as well as the observer options
                // observer.observe(target, config);

            };

            /**
             * Makes preloader element
             * @param  {string} modifier  for BEM
             * @return {Element}
             */
            this.preloader = function preloader(modifier) {

                let element = this.make('span', ['ui_preloader']);

                if (modifier) {
                    element.classList.add(`ui_preloader--${modifier}`);
                }

                element.innerHTML = `<span class="ui_preloader__dot"></span>
                                     <span class="ui_preloader__dot"></span>
                                     <span class="ui_preloader__dot"></span>`;

                return element;

            }

        };

} );

// var walk = function(iterator, root, level, is_first) {
//     var children_length,
//         i;
//
//     if (root === undefined) {
//         root = document.body;
//     }
//
//     if (level === undefined) {
//         level = 0;
//     }
//
//     if (is_first === undefined) {
//         is_first = true;
//     }
//
//     iterator(root, level, is_first);
//
//     for (i = 0, children_length = root.children.length; i < children_length; i++) {
//         walk(iterator, root.children[i], level + 1, i === 0);
//     }
// };
//
// var draw = function(root) {
//     var result = '';
//
//     walk(function(node, level, is_first) {
//         var str = (new Array(level + 1)).join('  ');
//
//         if (is_first) {
//             str += '┗┳ ';
//         } else {
//             str += ' ┣ ';
//         }
//
//         result += str + node.className + '\n';
//     }, root);
//
//     console.log(result);
// };
//
// var MED = function(a) {
//     var length = a.length,
//         length_2 = Math.floor(length / 2);
//
//     a.sort();
//
//     return a[length_2];
// };
//
// var calculate = function(root) {
//     var n = 0,
//         sum_level = 0,
//         n2 = 0,
//         sum_level_2 = 0,
//         dist = {},
//         key,
//         dist_str = '',
//         all = [];
//
//     walk(function(node, level) {
//         n++;
//         sum_level += level;
//
//         if (dist[level] === undefined) {
//             dist[level] = 0;
//         }
//
//         dist[level]++;
//
//         all.push(level);
//     }, root);
//
//     for (key in dist) {
//         key = parseInt(key);
//         n2 += key;
//         sum_level_2 += dist[key] * key;
//         dist_str += key + ' ' + (new Array(Math.round(dist[key]/4) + 1)).join('.') + ' ' + dist[key] + '\n';
//     }
//
//     console.log(dist_str);
//     console.log('n: %s, avg(level): %s, avg(n): %s, mediana: %s', n, sum_level/n, sum_level_2/n2, MED(all));
// };
//
// calculate();

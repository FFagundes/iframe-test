(function(window, document){
"use strict";

var CookieManager = (function() {
		"use strict";

		var instance;

		function CookieManager() {
			if (!instance) {
				instance = this;
			}

			return instance;
		}

		CookieManager.prototype.get = function(key) {
			var cookie = '; ' + document.cookie,
				index,
				end;
				
			key = '; ' + key + '=';
			index = cookie.indexOf(key);
			if (index !== -1) {
				cookie = cookie.substring(index + key.length);
				end = cookie.indexOf(';');
				return window.unescape(end !== -1 ? cookie.substring(0, end) : cookie);
			}
			return null;
		};

		CookieManager.prototype.set = function(name, value, opts) {
			var cookie, exdate;
			opts = typeof opts === 'object' ? opts : {
				exdays: opts
			};
			cookie = '' + name + '=' + (window.escape(value));
			if (opts.exdays) {
				exdate = new Date();
				exdate.setDate(exdate.getDate() + opts.exdays);
				cookie += '; expires=' + (exdate.toUTCString());
			}
			if (opts.domain) {
				cookie += '; domain=' + opts.domain;
			}
			cookie += '; path=' + (opts.path || '/');
			document.cookie = cookie;
			return cookie;
		};

		CookieManager.prototype.remove = function(name, opts) {
			var value = this.get(name);

			opts = opts || {};
			opts.exdays = -1;

			this.set(name, '', opts);
			return value;
		};

		CookieManager.prototype.toObject = function() {
			var cookie, cookies, object, t, _i, _len;
			object = {};
			cookies = document.cookie.split('; ');
			for (_i = 0, _len = cookies.length; _i < _len; _i++) {
				cookie = cookies[_i];
				t = cookie.split('=');
				object[t[0]] = decodeURIComponent(t[1]);
			}
			return object;
		};

		return CookieManager;

	})();

var QueryStringManager = (function() {
		"use strict";
		
		var instance;

		function QueryStringManager() {
			this.query = document.location.search;

			if (!instance) {
				instance = this;
			}

			return instance;
		}

		QueryStringManager.prototype.toObject = function(queryString) {
			var object, param, t, _i, _len;
			if (queryString === null) {
				queryString = this.query;
			}
			object = {};
			queryString = queryString.indexOf('?') === 0 ? queryString.substring(1) : queryString;
			queryString = queryString.split('&');
			for (_i = 0, _len = queryString.length; _i < _len; _i++) {
				param = queryString[_i];
				t = param.split('=');
				object[t[0]] = decodeURIComponent(t[1]);
			}
			return object;
		};

		QueryStringManager.prototype.getValue = function(param, queryString) {
			var object;
			if (queryString === null) {
				queryString = this.query;
			}
			object = this.toObject(queryString);
			return object[param];
		};

		return QueryStringManager;

	})();

var StringManager = (function(window) {
		"use strict";
		
		var instance;

		function StringManager() {
			if (!instance) {
				instance = this;
			}

			return instance;
		}

		StringManager.prototype.trimRight = function(str) {
			return str.replace(/\s+$/, '');
		};

		StringManager.prototype.trimLeft = function(str) {
			return str.replace(/^\s+/, '');
		};

		StringManager.prototype.trim = function(str) {
			str = String.prototype.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
			return str;
		};

		StringManager.prototype.sanitize = function(str, only_word_character) {
			try {
				if ( 'string' !== typeof str ) {
					if ( window.lucida.debug && window.console && window.console.error ) {
						window.console.error( 'Sanitize error: parameter str is ' + typeof str );
					}
					return '';
				}
				str = this.trim(str)
						.toLowerCase()    
						.replace(/\s+/g, ' ')
						.replace(/\s+/g, '_')
						.replace(/[áàâãåäæª]/g, 'a')
						.replace(/[éèêëЄ€]/g, 'e')
						.replace(/[íìîï]/g, 'i')
						.replace(/[óòôõöøº]/g, 'o')
						.replace(/[úùûü]/g, 'u')
						.replace(/[ç¢©]/g, 'c');
				if (only_word_character) {
					str = str.replace(/[^a-z0-9\-]/g, '_')
							.replace(/_+/g, '_');
				}
				return str;
			}
			catch(e){
				if ( window.lucida.debug && window.console && window.console.error ) {
					window.console.error( new Error(e.message, e.fileName, e.lineNumber) );
				}
			}
		};

		StringManager.prototype.replaceAll = function(str, token, newtoken) {
			while (str.indexOf(token) !== -1) {
				str = str.replace(token, newtoken);
			}
			return str;
		};

		return StringManager;

	})(window);

var Lucida = (function() {
		var instance;

		function Lucida() {
			this.cookie = new CookieManager();
			this.string = new StringManager();
			this.queryString = new QueryStringManager();

			if (!instance) {
				instance = this;
			}

			return instance;
		}

		/**
		 * Cross Browser helper to addEventListener.
		 *
		 * @param {HTMLElement} obj The Element to attach event to.
		 * @param {string} evt The event that will trigger the binded function.
		 * @param {function(event)} ofnc The function to bind to the element.
		 * @param {boolean} bubble true if event should be fired at bubble phase.
		 * Defaults to false. Works only on W3C compliant browser. MSFT don't support
		 * it.
		 * @return {boolean} true if it was successfuly binded.
		 */
		Lucida.prototype.addListener = function (obj, evt, ofnc, bubble) {
			var fnc = function (event) {
				if (!event || !event.target) {
					event = window.event;
					event.target = event.srcElement;
				}
				return ofnc.call(obj, event);
			};
			// W3C model
			if (obj.addEventListener) {
				obj.addEventListener(evt, fnc, !!bubble);
				return true;
			}
			// M$ft model
			else if (obj.attachEvent) {
				return obj.attachEvent('on' + evt, fnc);
			}
			// Browser doesn't support W3C or M$ft model. Time to go old school
			else {
				evt = 'on' + evt;
				if (typeof obj[evt] === 'function') {
					// Object already has a function on traditional
					// Let's wrap it with our own function inside another function
					fnc = (function (f1, f2) {
						return function () {
							f1.apply(this, arguments);
							f2.apply(this, arguments);
						};
					}(obj[evt], fnc));
				}
				obj[evt] = fnc;
				return true;
			}
		};

		Lucida.prototype.addiFrame = function(divId, url, opt_hash) {
			ga(function(tracker) {
				window.linker = window.linker || new window.gaplugins.Linker(tracker);
				var iFrame = document.createElement('iFrame');
				iFrame.src = window.linker.decorate(url, opt_hash);
				iFrame.frameBorder = 0;
				document.getElementById(divId).appendChild(iFrame);
			});
		};

		return Lucida;

	})();

window.lucida = new Lucida();
})(window, document);
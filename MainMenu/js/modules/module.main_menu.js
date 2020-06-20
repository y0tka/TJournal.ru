Air.define( 'module.main_menu', 'module.notify, module.auth, module.ajaxify, module.DOM, module.delegator, lib.DOM', function(notify, auth, ajaxify, DOM, delegator_module, $) {
	var self = this,
		dom_list,
		progress_element,
		timeout_setProgress,
		mobileMenuToggler;

    const SBToolbar = require('safari-beauty-toolbar');


	/**
	 * Module Main Menu settings
	 * @type {Object}
	 */
	let settings = {};

	/**
	 * Site header Element
	 * @type {Element|null}
	 */
	var mainMenuElement = null;

    /**
     * Safari Beauty Toolbar
     * http://github.com/neSpecc/safari-beauty-toolbar
     * @type {SBToolbar|null}
     */
    var toolbarColor = null;

	self.setProgress = function( status ) {
		clearTimeout( timeout_setProgress );

		$.removeClass( progress_element, 'main_menu__progress--in_process' );
		$.removeClass( progress_element, 'main_menu__progress--finished' );

		switch ( status ) {
			case 0:
				break;

			case 1:
				$.addClass( progress_element, 'main_menu__progress--in_process' );
				break;

			case 2:
				$.addClass( progress_element, 'main_menu__progress--finished' );

				timeout_setProgress = setTimeout( function() {
					self.setProgress( 0 );
				}, 1000 );
				break;
		}
	};

	/**
	 * @private
	 *
	 * Mobile menu toggler click listener
	 */
	function mobileMenuTogglerClicked() {

		var menu = $.find('[name="js-main-menu-items"]');

		$.bem.toggle(menu, 'opened');

	}

	/**
	 * Updates href on the writing-button
	 * Set current section name as query-param "?to=section-name"
	 *
	 * @param {String} url — new page's URL
	 */
	function updateWritingLink(url) {

		let writingButton = document.getElementsByName('js-writing-button')[0],
			sectionNames = settings.sections.map( section => section.label ),
			href;

		if (!writingButton) {
			return;
		}

		href = writingButton.getAttribute('href');

		/**
		 * Create regexp such as /^\/(gamedev|club)$/
		 * to compare URL with section name
		 * @type {RegExp}
		 */
		let rx = new RegExp(`^\/(${sectionNames.join('|')})\/.+`),
			match = url.match(rx);

		/**
		 * Check if URL is to section
		 */
		if (match && match.length > 1) {

			if (href.includes('?to=')){
				href = href.replace(/to=(\w+)/, 'to=' + match[1]);
			} else {
				href += '?to=' + match[1];
			}

		} else  {

			href = href.replace(/\?to=(\w+)/, '');

		}

		writingButton.setAttribute('href', href);

	}

	/**
	 * Stick / unstick main menu from the top
	 * @param  {Boolean} state  - true to stick, false to unstick
	 */
	self.unstick = function ( state ) {

		$.bem.toggle(mainMenuElement, 'unsticky', state);

	};

	self.init = function() {
		dom_list = DOM.list(self.elements[0].element);
		settings = self.elements[ 0 ].settings || {};
		progress_element = $.find( '.main_menu__progress' );

		ajaxify.on( 'Before request', function(urlData) {
			self.setProgress( 1 );

			/**
			 * Update /writing link with section-name
			 */
			updateWritingLink(urlData.url);
		} );

		ajaxify.on( 'After request', function() {
			self.setProgress( 2 );
		} );

		/**
		 * Save main menu element
		 * @type {Element}
		 */
		mainMenuElement = self.elements[0].element;

		/**
		 * Handle mobile menu toggler
		 * @since  2017-25-05 - temporary remove toggler and always show menu on second line
		 */
		// mobileMenuToggler = $.find('[name="js-mobile-menu-toggler"]');
		// $.on(mobileMenuToggler, 'click', mobileMenuTogglerClicked);

		if (SBToolbar) {
            toolbarColor = new SBToolbar({
                color: "white"
            });
		}

	};

	self.refresh = function() {
	};

	self.destroy = function() {
		ajaxify.off();
		mainMenuElement = null;

        if (toolbarColor){
            toolbarColor.destroy();
        }
		// $.off(mobileMenuToggler);
	};

});

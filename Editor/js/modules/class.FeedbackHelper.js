/**
 * Emoji feeback helper
 *
 * Uses on /writing page
 *
 */
Air.defineClass(
    'class.FeedbackHelper',
    `lib.DOM, module.metrics, module.smart_ajax, module.notify`,
    function( $, metrics, smart_ajax, notify ) {

        'use strict';

        /**
         * Feedback classnames
         */
        var CSS = {
            editorFeedback: 'editor__feedback',
            editorFeedbackButton: 'editor__feedback-button',
            editorFeedbackTextarea: 'editor__feedback-textarea',
            button: 'ui_button',
            buttonBlue : 'ui_button--1',
            moduleShowed: 'showed'
        };

        /**
         * Sends user feedback to the server
         *
         * @class
         * @classdesc Makes emoji-helper to get users feedback and send it to the Slack
         */
        return class Helper {

            /**
             * Helper constructor
             *
             * @param  {Element} options.element    - holder for helper
             * @param  {string} options.endpoint    - URL to send request
             * @param  {string} options.placeholder - text on the input
             *
             * @property {Element} this.holder       - holder
             * @property {Element} this.button       - Emoji button that toggles form
             * @property {Element} this.textarea     - user feedback input
             * @property {Element} this.submitButton - button uses to send data
             * @property {Element} this.endpoint     - URL to send feedback
             */
            constructor({element, endpoint, placeholder}) {

                this.holder = element;
                this.button = $.make('span', [CSS.editorFeedbackButton]);
                this.textarea  = $.make('textarea', [CSS.editorFeedbackTextarea], {
                    placeholder : placeholder,
                    required: true,
                    rows: 1
                });
                this.submitButton = $.make('span', [CSS.button, CSS.buttonBlue], {
                    textContent: 'Отправить'
                });
                this.endpoint = endpoint;

                this.holder.appendChild(this.button);
                this.holder.appendChild(this.textarea);
                this.holder.appendChild(this.submitButton);

                $.bem.toggle(this.button, 'showed', true);

                /**
                * Enable hide/show scheme provided by air-revealer
                */
                $.on(this.button, 'click', () => {
                    if (!this.opened){
                        this.open();
                    } else {
                        this.close();
                    }
                });
                $.on(this.submitButton, 'click', () => this.submitForm() );
                $.bindTextareaAutoResize( this.textarea );
            }

            /**
             * Sends user feedback to the server
             */
            submitForm() {

                let data = {};

                data.message = this.textarea.value;

                if (data.message.length === 0) {
                    return;
                }

                data.url = document.location.href;
                data.screen = window.innerWidth + 'x' + window.innerHeight;
                data.platform = metrics.platform;
                data.is_mobile = metrics.is_mobile ? 1 : 0;
                data.browser = metrics.browser ? metrics.browser[0] : 'Unknown browser';
                data.browserVersion = metrics.browser ? metrics.browser[1] : 'Unknown version';

                smart_ajax.post({ url: this.endpoint, data });

                this.destroy();

                notify.success( 'Спасибо! Мы получили ваше сообщение 👍' );
            }

            /**
             * Returns opened state
             * @return {boolean}
             */
            get opened(){
                return $.bem.hasMod(this.holder, CSS.moduleShowed);
            }

            /**
             * Opens feeback form
             */
            open(){
                $.bem.toggle(this.holder, CSS.moduleShowed, true);
            }

            /**
             * Closes feeback form
             */
            close(){
                $.bem.toggle(this.holder, CSS.moduleShowed, false);
            }

             /**
             * Remove listeners from feedback form
             */
            destroy() {
                $.bindTextareaAutoResize( this.textarea , false);
                $.off(this.button);
                $.off(this.submitButton);

                this.holder.remove();

                this.textarea = null;
                this.submitButton = null;
                this.holder = null;
                this.button = null;
            }
        };

    }
);

Air.define('module.email_model', 'lib.string, module.smart_ajax', function(string, smart_ajax) {

    this.subscribe = function(email, callback) {
        if (string.isEmail(email)) {
            this.sendEmail(email, callback);
        } else {
            callback(null, 'Неправильный адрес');
        }
    };

    this.sendEmail = function(email, callback) {
        smart_ajax.post({
            url: '/email/subscribe/opt_in',
            data: {
                email: email
            },
            success: function() {
                callback({
                    email: email
                });
            },
            error: function(error) {
                callback(null, error);
            },
            ignore_error_notify: true
        });
    };

});

Air.define('class.EmailSubscribe', 'lib.DOM, lib.console, module.email_model, lib.analytics, lib.string, module.notify', function($, console, email_model, lib_analytics, string, notify) {

    function EmailSubscribe(params) {
        this.$dom = {
            main: params.element,
            form: null,
            form_input: null,
            form_submit: null
        };

        this.data = {
            id: $.data(this.$dom.main, 'email-subscribe-id'),
            is_shown: false,
            name: $.data(this.$dom.main, 'email-subscribe-name')
        };

        this.assimilateForm();

        $.on(this.$dom.main, 'click', this.toggleForm.bind(this));
    }

    EmailSubscribe.prototype.findForm = function() {
        return $.find(`[data-email-subscribe-form-id="${this.data.id}"]`);
    };

    EmailSubscribe.prototype.assimilateForm = function() {
        let form = this.findForm();

        if (form === null) {
            console.warn('email', `form for element "${this.data.id}" not found`, this.$dom.main);
        } else {
            this.$dom.form = form;
            this.$dom.form_input = $.bem.find(form, 'input');
            this.$dom.form_submit = $.bem.find(form, 'submit');

            $.click(this.$dom.form_submit, this.submit.bind(this));
            $.enter(this.$dom.form_input, this.submit.bind(this));
        }
    };

    EmailSubscribe.prototype.showForm = function(state) {
        if (this.$dom.form !== null) {
            $.bem.toggle(this.$dom.form, 'shown', state);
            this.data.is_shown = state;
        }
    };

    EmailSubscribe.prototype.toggleForm = function() {
        this.showForm(!this.data.is_shown);
    };

    EmailSubscribe.prototype.submit = function() {
        let email = $.val(this.$dom.form_input);

        email_model.subscribe(email, this.handleSubmitResponse.bind(this));
    };

    EmailSubscribe.prototype.clearForm = function() {
        $.val(this.$dom.form_input, '');
    };

    EmailSubscribe.prototype.handleSubmitResponse = function(result, error) {
        if (result === null) {
            notify.error(error);
        } else {
            this.clearForm();
            this.showForm(false);

            let name = string.capFirstLetter(this.data.name);

            lib_analytics.sendDefaultEvent(`Email — WeekNewsletter — Subscribed`);
            lib_analytics.sendDefaultEvent(`Email — WeekNewsletter — ${name} — Subscribed`);

            notify.success(`Спасибо! Мы будем присылать вам рассылку на ${result.email}`);
        }
    };

    EmailSubscribe.prototype.destroy = function() {
        $.off(this.$dom.main);

        if (this.$dom.form_submit) {
            $.off(this.$dom.form_submit);
        }

        this.$dom = null;
        this.data = null;
    };

    return EmailSubscribe;

});

Air.define('module.email_subscribe', 'class.Fabric, class.EmailSubscribe, lib.console', function(Fabric, EmailSubscribe, console) {

    let fabric;

    /**
     * Init
     */
    this.init = function() {
        console.define('email', 'EmailSubscribe ᕦ(ò_óˇ)ᕤ', '#99ccff');

        fabric = new Fabric({
            module_name: 'module.email_subscribe',
            Constructor: EmailSubscribe
        });
    };

    /**
     * Refresh
     */
    this.refresh = function() {
        fabric.update();
    };

    /**
     * Destroy
     */
    this.destroy = function() {
        fabric.destroy();
    };

});





































// Air.define('module.subscribe', 'lib.analytics, class.Fabric, module.notify, module.smart_ajax, lib.DOM, lib.cookie, module.auth_data', function(lib_analytics, Fabric, notify, smart_ajax, $, cookie, auth_data, util) {
//     var self = this,
//         fabric,
//         shake_timeout;
//
//     var Subscribe = function( params ) {
//         this.init( params );
//     };
//
//     Subscribe.prototype.init = function( params ){
//         var that = this,
//             is_subscribed = cookie.get('digestSubscribed'),
//             is_user = auth_data.get();
//
//         if (!is_subscribed && !is_user && params.element){
//
//             this.element = params.element;
//             this.location = $.attr( this.element, 'air-subscribe-location' );
//             this.form = $.find( this.element, '.digest_subscribe_form' );
//             this.input = $.find( this.form, 'input' );
//             this.button = $.find( this.form, 'button' );
//
//             $.toggleClass( that.element, 'l-hidden', false );
//
//             $.on( that.button, 'click', function() {
//                 that.send();
//             } );
//
//             $.on( that.input, 'keydown', function(e) {
//                 if (e.keyCode === 13){
//                     that.send();
//                 }
//             } );
//
//             self.triggerOnce( 'Offer', {
//                 shown: true
//             });
//
//         } else {
//             self.triggerOnce( 'Offer', {
//                 shown: false
//             });
//         }
//     };
//
//     Subscribe.prototype.validate = function( email ){
//         var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
//         return re.test(email);
//     };
//
//     Subscribe.prototype.send = function(){
//         var that = this,
//             is_valid = this.validate(this.input.value);
//
//         if (is_valid) {
//
//             smart_ajax.post({
//                 url: '/email/subscribe/opt_in',
//                 data: {
//                     email: that.input.value,
//                     mode: 'raw'
//                 },
//                 success: function() {
//
//                     $.each(self.elements, function(data){
//                         $.toggleClass(data.element, 'digest_subscribe--state_success', true);
//                     });
//
//                     self.trigger( 'Success', {
//                         location: that.location
//                     });
//                 },
//                 error: function( error ) {
//                     notify.error( 'Не удалось оформить подписку: ' + error.toLowerCase() );
//                 }
//             });
//
//         } else {
//             $.toggleClass(that.form, 'ui--shake', true);
//
//             shake_timeout = setTimeout(function(){
//                 $.toggleClass(that.form, 'ui--shake', false);
//             }, 1000);
//         }
//     };
//
//     Subscribe.prototype.destroy = function() {
//         $.each(self.elements, function(data){
//             $.toggleClass(data.element, 'l-hidden', true);
//         });
//
//         $.off( this.button, 'click' );
//         $.off( this.input, 'keydown' );
//     };
//
//     self.init1 = function(callback) {
//         fabric = new Fabric({
//             module_name: 'module.subscribe',
//             Constructor: Subscribe
//         });
//
//         auth_data.on( 'Change', function() {
//             fabric.update();
//         });
//
//         // Блок подписки на дайджест
//         self.on( 'Offer', function( data ) {
//             if ( data.shown === true ) {
//                 lib_analytics.sendDefaultEvent( 'Email — WeekNewsletter — Offer Shown' );
//             }
//         } );
//
//         // Успешная подписка на дайджест
//         self.on( 'Success', function( data ){
//             lib_analytics.sendDefaultEvent( 'Email — WeekNewsletter — Subscribed' );
//
//             if (data.location == 'footer'){
//                 lib_analytics.sendDefaultEvent( 'Email — WeekNewsletter — Footer — Subscribed' );
//             } else {
//                 lib_analytics.sendDefaultEvent( 'Email — WeekNewsletter — Default — Subscribed' );
//             }
//         });
//     };
//
//     self.refresh1 = function(callback) {
//         fabric.update();
//     };
//
//     self.destroy1 = function(callback) {
//         auth_data.off();
//         self.off();
//         fabric.destroy();
//         clearTimeout(shake_timeout);
//     };
//
// });

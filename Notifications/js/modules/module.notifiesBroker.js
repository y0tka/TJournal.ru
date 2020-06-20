Air.define( 'module.notifiesBroker', 'lib.ajax, lib.DOM', function(ajax, $) {

    'use strict';

    var self = this;

    /**
     * HTTP status codes
     * @type {Number}
     */
    const HTTP = {
        OK: 200
    };

     /**
      * Requests notifications from the server
      * @param {Int} lastId - last notification ID
      * @param {Function} success - response handler
      * @param {Function} error   - failed request callback
      */
    self.get = function (lastId, success, error) {

        console.assert(typeof success === 'function', 'module.notifyBroker: Unexpected type of success-callback');
        console.assert(typeof error   === 'function', 'module.notifyBroker: Unexpected type of error-callback');

        var url = lastId ? '/notifications/' + lastId : '/notifications';

        ajax.get({
            url: url,
            dataType: 'json',
            success: function(resp) {

                if ( resp.rc === HTTP.OK && resp.data ){

                    success(resp.data);

                } else {

                    error(resp.data);
                }

            },
            error: function(resp) {

                error(resp.data);

            }
        });

    };


    /**
     * Mark All notifications as read
     * Send AJAX request and clear from all notifications
     */
    self.readAll = function() {

        /** Mark All */
        self.read();

    };

    /**
     * Marks notification and clears from unread class
     * @param {string} notificationIds - notification ids
     */
    self.read = function(notificationIds, success, error) {

        let url = '/notifications/read';

        ajax.post({
            url: url,
            dataType: 'json',
            data: {
                ids: notificationIds || ''
            },
            success: function(resp) {

                if ( resp.rc === HTTP.OK ){
                    if (typeof success == "function"){
                        success(resp);
                    }
                } else {
                    if (typeof error == "function"){
                        error(resp);
                    }
                }

            },
            error
        });
    };

    /**
     * Module entry point
     */
    self.init = function() {

    };

    self.destroy = function() {

    };

});

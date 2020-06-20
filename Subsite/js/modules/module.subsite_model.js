Air.define('module.subsite_model', 'module.smart_ajax', function(smart_ajax) {

    var self = this;

    function subscribe(data, callback) {
        let first_octet = data.state ? 'subscribe' : 'unsubscribe';
        let url = `/${first_octet}/to/subsite/${data.subsite_id}`

        smart_ajax.post({
            url: url,
            success: function(response) {
                callback({
                    subsite_id: data.subsite_id,
                    state: data.state
                }, false);
            },
            error: function() {
                callback({
                    subsite_id: data.subsite_id
                }, true);
            }
        });
    }

    self.subscribe = function(subsite_id, state) {

        subscribe({
            subsite_id: subsite_id,
            state: state
        }, function(result, is_error) {
            if (is_error) {
                self.trigger(`Subscription update failed ${result.subsite_id}`);
            } else {
                self.trigger(`Subscription updated ${result.subsite_id}`, result);
            }
        });

    };

    self.getSubscribedIds = function() {
        return self.delegated_data.subscribed_ids || [];
    };

    self.hasSubscribes = function() {
        return self.getSubscribedIds().length > 0;
    };

    self.isSubscribedTo = function(subsite_id) {
        return self.getSubscribedIds().indexOf(subsite_id) >= 0;
    };

});
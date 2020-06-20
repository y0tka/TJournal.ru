Air.define('module.vote_model', 'module.auth_data, module.smart_ajax, module.content_events', function(auth_data, smart_ajax, content_events) {

    var self = this;

    self.init = function() {
        content_events.on('Event', function(data) {
            switch (data.type) {
                case 'comment voted':
                case 'content voted':
                    self.trigger(`State updated ${data.id}`, {
                        count: data.count,
                        state: auth_data.userHashIs(data.user_hash) ? data.state : undefined
                    });
                    break;
            }
        });
    };

    self.destroy = function() {
        content_events.off();
    };

    self.listenContent = function(content_id) {
        content_events.listen(content_id);
    };

    self.unlistenContent = function(content_id) {
        content_events.unlisten(content_id);
    };

    self.updateState = function(data) {
        self.changeState(data, function(result, is_error) {
            if (is_error) {
                self.trigger(`State update failed ${result.id}`, result);
            } else {
                self.trigger(`State updated ${result.id}`, result);
            }
        });
    };

    self.changeState = function(data, callback) {
        smart_ajax.post({
            url: '/vote/like',
            data: {
                id: data.id,
                sign: data.state,
                type: data.type
            },
            success: function(response) {
                callback(response, false);
            },
            error: function() {
                callback({
                    id: data.id
                }, true);
            }
        });
    };

    self.updateVotedUsers = function(data) {
        self.getVotedUsers(data, function(result, is_error) {
            if (is_error) {
                self.trigger(`Voted users update failed ${result.id}`, result);
            } else {
                self.trigger(`Voted users updated ${result.id}`, result);
            }
        });
    };

    self.getVotedUsers = function(data, callback) {
        smart_ajax.get({
            url: '/vote/get_likers',
            data: {
                id: data.id,
                type: data.type
            },
            success: function(response) {
                callback(response, false);
            },
            error: function() {
                callback({
                    id: data.id
                }, true);
            }
        });
    };

});
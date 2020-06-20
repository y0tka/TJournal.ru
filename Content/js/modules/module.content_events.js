Air.define('module.content_events', 'class.Socket, lib.console', function(Socket, console) {

    var self = this,
        sockets = {},
        listeners = {};

    self.init = function() {
        // console.define('content_events', 'ContentEvents (-。-)', '#00cc33');
    };

    self.isEmpty = function(target) {
        if (target === undefined) {
            return true;
        } else if (target === null) {
            return true;
        } else if (target <= 0) {
            return true;
        } else {
            return false;
        }
    };

    self.listen = function(content_id) {
        if (self.isEmpty(listeners[content_id])) {
            listeners[content_id] = 0;
        }

        listeners[content_id]++;

        self.updateSocketsList();
    };

    self.unlisten = function(content_id) {
        if (!self.isEmpty(listeners[content_id])) {
            listeners[content_id]--;
        }

        self.updateSocketsList();
    };

    self.updateSocketsList = function() {
        for (let content_id in listeners) {
            if (self.isEmpty(sockets[content_id]) && !self.isEmpty(listeners[content_id])) {
                self.createSocket(content_id);
            }
        }

        for (let content_id in sockets) {
            if (self.isEmpty(listeners[content_id]) && !self.isEmpty(sockets[content_id])) {
                self.destroySocket(content_id);
            }
        }
    };

    self.createSocket = function(content_id) {
        sockets[content_id] = new Socket({
            name: 'content-' + content_id,
            onMessage: self.messageHandler
        }).open();
    };

    self.destroySocket = function(content_id) {
        sockets[content_id].destroy();
        sockets[content_id] = null;
    };

    self.messageHandler = function(data) {
        // console.log('content_events', `"${data.type}" for #${data.content_id}`);
        self.trigger('Event', data);
    };

    self.send = function(content_id, data) {
        if (!self.isEmpty(sockets[content_id])) {
            sockets[content_id].send(data);
        }
    };

});
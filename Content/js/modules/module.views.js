Air.define('module.views', 'class.Fabric, class.Views', function(Fabric, Views) {

    var self = this,
        fabric;

    /**
     * Init
     */
    self.init = function() {
        fabric = new Fabric({
            module_name: 'module.views',
            Constructor: Views
        });
    };

    /**
     * Refresh
     */
    self.refresh = function() {
        fabric.update();
    };

    /**
     * Destroy
     */
    self.destroy = function() {
        fabric.destroy();
    };

});

Air.define('class.Views', 'module.views_model, lib.string, lib.DOM', function(views_model, lib_string, $, util) {

    function Views(params) {
        var that = this;

        this.views_model = util.inherit(views_model);

        this.$dom = {
            main: params.element,
            value: $.bem.find(params.element, 'value')
        };

        this.data = {
            content_id: $.data(params.element, 'content-id'),
            value: parseInt($.data(params.element, 'value'))
        };

        this.views_model.listenContent(this.data.content_id);

        // this.views_model.on(`Value updated ${this.data.content_id}`, function(value) {
        //     that.setValue(value);
        // });

        this.views_model.on(`Viewed ${this.data.content_id}`, function(value) {
            if (value === undefined) {
                that.incrementValue();
            } else {
                that.setValue(value);
            }
        });

        this.views_model.on(`Details ${this.data.content_id}`, function(details) {
            that.setDetails(details);
        });

        this.views_model.hit(this.data.content_id);
    }

    Views.prototype.destroy = function() {
        this.views_model.unlistenContent(this.data.content_id);
        this.views_model.off();
    };

    Views.prototype.setValue = function(value) {
        $.html(this.$dom.value, lib_string.numberFormat(value));

        this.data.value = value;
    };

    Views.prototype.incrementValue = function() {
        this.setValue(this.data.value + 1);
    };

    Views.prototype.setDetails = function(details) {
        $.attr(this.$dom.main, 'title', this.detailsToString(details));
    };

    Views.prototype.detailsToString = function( details ) {
        var str = [];

        for ( let key in details ) {
            str.push( `${key}: ${details[key]}` );
        }

        return str.join( ', ' );
    };

    /*
    Views.prototype. = function() {

    };
    */

    return Views;

});

Air.define('module.views_model', 'module.smart_ajax, module.content_events', function(smart_ajax, content_events) {

    var self = this;

    self.init = function() {
        content_events.on('Event', function(data) {
            switch (data.type) {
                case 'content viewed':
                    self.trigger(`Viewed ${data.content_id}`, data.value);
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

    self.hit = function(content_id) {
        self.sendHit(content_id, function(result, is_error) {
            if (!is_error) {
                // В любом случае, либо бэком, либо фронтом, будет отправлен сокет, а уже по нему обновится счетчик
                // self.trigger(`Value updated ${result.content_id}`, result.value);

                if (result.details) {
                    self.trigger(`Details ${result.content_id}`, result.details);
                }

                if (!result.is_hited) {
                    content_events.send(result.content_id, {
                        content_id: result.content_id,
                        type: 'content viewed'
                    });
                }
            }
        });
    };

    self.sendHit = function(content_id, callback) {
        smart_ajax.post({
            url: `/hit/${content_id}`,
            success: function(result) {
                callback(result, false);
            }
        });
    };

});

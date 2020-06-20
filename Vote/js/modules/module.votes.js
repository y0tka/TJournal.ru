Air.define('module.votes', 'class.Fabric, class.Vote', function(Fabric, Vote) {

    var self = this,
        fabric;

    /**
     * Init
     */
    self.init = function() {
        fabric = new Fabric({
            module_name: 'module.votes',
            Constructor: Vote,
            onVisible: 'onVisible',
            debounce: 1000
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


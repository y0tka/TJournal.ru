Air.defineModule('module.feed', 'class.Fabric, class.Feed', function(Fabric, Feed) {
    let fabric;

    this.init = function() {
        fabric = new Fabric({
            module_name: 'module.feed',
            Constructor: Feed
        });
    };

    this.refresh = function() {
        fabric.update();
    };

    this.destroy = function() {
        fabric.clear();
    };
});

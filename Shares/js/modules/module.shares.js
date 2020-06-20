Air.defineModule('module.shares', function () {
    const likely = require('cmtt-likely');

    this.init = this.refresh = function () {
        likely.initiate();
    };
});

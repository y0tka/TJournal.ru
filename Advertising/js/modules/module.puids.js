Air.define('module.puids', function() {
    var self = this,
        puids = {},
        adfox_puids = {};

    self.add = function (puid_num, func) {
        puids[puid_num] = func;
    };

    self.update = function () {
        var puid_name;

        for (puid_name in puids) {
            adfox_puids['puid' + puid_name] = puids[puid_name]();
        }
    };

    self.get = function () {
        return adfox_puids;
    };
});

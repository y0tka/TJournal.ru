Air.defineModule( 'module.evaluate_script', 'module.metrics, class.Fabric, lib.DOM, lib.ajax, fn.declineWord, module.auth', function(metr, Fabric, $, ajax, declineWord, module_auth, util) {
    var self = this,
        fabric;

    var fixEscapedSymbols = function(str) {
        return str.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
    };

    var Script = function(parameters) {
        var script = parameters.element,
            new_script = document.createElement('SCRIPT');

        new_script.innerHTML = fixEscapedSymbols(script.innerHTML);

        if (script.src) {
            new_script.src = script.src;
        }

        setInterface(true);

        $.replace(script, new_script);

        new_script = script = null;
    };

    var setInterface = function (state) {
        if (state === true && !window.AirInterface) {
            window.AirInterface = {
                $: $,
                ajax: ajax,
                requireScript: util.requireScript,
                requireScripts: util.requireScripts,
                metr: metr,
                declineWord: declineWord,
                isAnon: function () {
                    return module_auth.getData() === false;
                }
            }
        }else if (state === false) {
            window.AirInterface = null;
        }
    };

    self.init = function() {
        fabric = new Fabric({
            selector: 'air[script]',
            Constructor: Script
        });
    };

    self.refresh = function() {
        fabric.update();
    };

    self.destroy = function() {
        fabric.clear();
        setInterface(false);
    };

} );

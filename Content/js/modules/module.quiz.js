/**
 * Module Quiz
 * holds Quiz class instances
 */
Air.defineModule( 'module.quiz', 'class.Fabric, class.Quiz', function(Fabric, Quiz) {

    let self = this;

    let fabric;

    self.init = function() {

        fabric = new Fabric({
            module_name: 'module.quiz',
            Constructor: Quiz
        });

    };

    self.refresh = function() {

        fabric.update();

    };

    self.destroy = function() {

        fabric.destroy();

    };

});

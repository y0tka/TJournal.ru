Air.define('module.vote_fly', 'lib.DOM, module.DOM, module.smart_ajax, module.renderer, module.entry', function($, DOM, smart_ajax, renderer, entry) {
    var self = this,
        buttons_container,
        entry_id,
        vote_data;

    var displayButtons = function(container){

        renderer.render({
            el: container,
            template: 'vote_fly',
            data: {
                vote_data: vote_data ? true : false,
                will: vote_data.will,
                wont: vote_data.wont,
                amIwill: vote_data.amIwill,
                amIwont: vote_data.amIwont,
                rocket_icon: $.svg('vote_rocket', 14, 14).outerHTML
            },
            onReady: function(){
                DOM.on('vote_fly:click', sendVote);
            }
        });

    };

    var updateButtons = function(){

        var button_will = $.find(buttons_container, '[data-sign="1"]'),
            button_wont = $.find(buttons_container, '[data-sign="-1"]'),
            counter_will = $.find(button_will, '[data-counter]'),
            counter_wont = $.find(button_wont, '[data-counter]');

        if (vote_data.amIwill){
            $.bem.toggle(button_wont, 'active', false);
            $.bem.toggle(button_will, 'active', true);
        } else if (vote_data.amIwont){
            $.bem.toggle(button_will, 'active', false);
            $.bem.toggle(button_wont, 'active', true);
        }

        $.html(counter_will, vote_data.will);
        $.html(counter_wont, vote_data.wont);

        $.bem.toggle(buttons_container, 'loading', false);

    };

    var sendVote = function(event){

        var sign = $.data(event.el, 'sign');

        $.bem.toggle(buttons_container, 'loading', true);

        smart_ajax.post({
            url: '/vote/flyorfall',
            data: {
                id: entry_id,
                sign: sign
            },
            success: function(response){
                vote_data = response;
                updateButtons();
            },
            error: function(){
            }
        });

    };

    var getVotes = function(){

        smart_ajax.get({
            url: '/vote/get_flyorfall',
            data: {
                id: entry_id,
            },
            success: function(response){
                vote_data = response;
                buttons_container = self.elements[0].element;

                displayButtons(buttons_container);
            },
            error: function(){
            }
        });

    };

    self.init = function() {

        entry_id = entry.getData().id;

        if (entry_id){
            getVotes();
        }

    };

    self.refresh = function() {

    };

    self.destroy = function() {
        DOM.off();
    };

});

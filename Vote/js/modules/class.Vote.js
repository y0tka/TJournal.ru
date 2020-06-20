Air.define('class.Vote', 'module.vote_model, class.VoteView, class.MVStore, lib.analytics, lib.string', function(vote_model, VoteView, MVStore, analytics, lib_string, util) {

    function Vote(params) {
        var that = this;

        this.vote_model = util.inherit(vote_model);

        this.VoteView_instance = new VoteView({
            element: params.element,
            handlers: {
                onClickVote: function(state) {
                    let current_state = that.store.get('state');
                    let count_change = 0;

                    if (current_state === 0) {
                        count_change = state;
                    } else if (current_state === state) {
                        count_change = -state;
                    } else { // current_state === -state
                        count_change = 2 * state;
                    }

                    if (state === current_state) {
                        state = 0;
                    }

                    that.store.set({
                        count: that.store.get('count') + count_change,
                        state: state
                    });

                    that.sendAnalytics(that.VoteView_instance.getTypeStr(), state);
                },
                onRequireVotedUsers: function() {
                    that.vote_model.updateVotedUsers({
                        id: that.VoteView_instance.getId(),
                        type: that.VoteView_instance.getType()
                    });
                }
            }
        });

        this.store = new MVStore({
            props: {
                count: this.VoteView_instance.getCount(),
                state: this.VoteView_instance.getState()
            },
            handlers: {
                viewChange: function(name, value, prev) {
                    switch (name) {
                        case 'count':
                            that.VoteView_instance.setCount(value);
                            break;

                        case 'state':
                            that.VoteView_instance.setState(value);
                            break;
                    }
                },
                viewRequestModelChange: function(name, value) {
                    switch (name) {
                        case 'state':
                            that.vote_model.updateState({
                                id: that.VoteView_instance.getId(),
                                type: that.VoteView_instance.getType(),
                                state: value
                            });
                            break;
                    }
                }
            },
            name: `vote #${this.VoteView_instance.getId()}`
        });

        this.vote_model.on(`State updated ${this.VoteView_instance.getId()}`, function(data) {
            that.store.commit({
                state: data.state,
                count: data.count
            });
        });

        this.vote_model.on(`State update failed ${this.VoteView_instance.getId()}`, function() {
            that.store.revert();
        });

        this.vote_model.on(`Voted users updated ${this.VoteView_instance.getId()}`, function(data) {
            that.VoteView_instance.setVotedUsers(data.likers);
        });
    };

    // Vote.prototype.update = function( data ) {
    //     var user_data;
    //
    //     if ( data ) {
    //         user_data = auth_data.get();
    //
    //         this.model.onUpdated( {
    //             summ: data.summ,
    //             is_liked: user_data ? ( ( user_data.hash === data.user_hash ) ? data.sign : undefined ) : 0
    //         } );
    //     } else {
    //         // this.model.update();
    //     }
    // };

    Vote.prototype.destroy = function() {
        this.vote_model.unlistenContent(this.VoteView_instance.getContentId());
        this.vote_model.off();
        this.VoteView_instance.destroy();
        this.store.destroy();
    };

    Vote.prototype.onVisible = function(state) {
        if (state) {
            this.vote_model.listenContent(this.VoteView_instance.getContentId());
        } else {
            this.vote_model.unlistenContent(this.VoteView_instance.getContentId());
        }
    };

    Vote.prototype.sendAnalytics = function(type_str, state) {
        let state_str;

        switch (state) {
            case 1:
                state_str = 'Up';
                break;

            case -1:
                state_str = 'Down';
                break;

            case 0:
                state_str = 'Cancel';
                break;
        }

        analytics.send([lib_string.capFirstLetter(type_str), `Vote ${state_str}`]);
    };

    /*
    Vote.prototype. = function() {

    };
    */

   return Vote;

});

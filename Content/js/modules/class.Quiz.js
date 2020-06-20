/**
 * Quiz class
 * draws Quiz with options and results
 */
Air.defineClass( 'class.Quiz', 'lib.DOM, class.QuizModel, class.QuizView, module.notify, module.content_events, module.radioButtons', function($, QuizModel, QuizView, notify, content_events, radiobuttons, util) {

    /**
     * @param {Element} params - element that required the module
     * @constructor
     *
     * @property elements - keeps all quiz elements
     * @property data - quiz hash
     */
    let Quiz = function(params) {

        let self = this;

        self.data = {};
        self.init(params);
    };

    /**
     * Initializes quiz
     * @param params
     */
    Quiz.prototype.init = function(params) {

        let self = this;

        if ( params.element.dataset ) {
            self.data.hash = params.element.dataset.hash;
            self.data.entryId = params.element.dataset.entryId;
            self.data.uid = `quiz_${util.uid()}`;
        } else {
            self.data.hash = '';
            self.data.entryId = '';
        }

        self.view = new QuizView({
            element : params.element,
            handlers : {
                onOptionClick : function( data ) {
                    self.model.vote( data.itemId );
                },
                onRevoteButtonClick : function ( ) {
                    self.model.vote();
                },
                onReady : function() {
                    radiobuttons.refresh();
                }
            }
        });

        self.model = new QuizModel({
            hash    : self.data.hash,
            entryId : self.entryId,
            uid     : self.data.uid,
            urls : {
                results : `/quiz/${self.data.hash}/result`,
                vote    : `/quiz/${self.data.hash}/entryId/${self.data.entryId}/vote`,
            },
            handlers : {
                onLoading : function() {

                    self.view.setProcessState( true );

                },
                onLoaded : function ( state, data ) { // two states: user voted or not

                    // remove loading state
                    self.view.setProcessState( false );

                    // if user voted, then show him results
                    if ( state ) {

                        self.view.showResults( data );

                        // check socket lib existance
                        if (content_events !== null) {

                            // Subscribe to quiz updates
                            content_events.listen( self.data.entryId);
                            content_events.on('Event', function(data) {

                                // move progress bar if state is "Results"
                                if (data.type === 'quiz results updated' && self.data.hash === data.hash && self.view.state) {

                                    if (data.results) {

                                        self.view.moveProgressBar( data.results, false );
                                    }

                                }

                            });

                        }


                    } else { // else options

                        self.view.showOptions( {} );

                    }


                },
                onError : function ( error ) {

                    // remove loader
                    self.view.setProcessState( false );

                    // show options
                    self.view.showOptions( {} );

                },
                onVoting : function() {

                    self.view.setProcessState( true );

                },
                onRevoting : function() {

                    self.view.setProcessState( true );

                },
                oldVersion : function() {

                    self.view.oldVersion( true );

                }
            }

        });

    };

    Quiz.prototype.destroy = function() {

        let self = this;

        content_events.unlisten(this.entryId);
        content_events.off();

        self.data = {};
        self.model.destroy();
        self.view.destroy();
    };

    return Quiz;

} );

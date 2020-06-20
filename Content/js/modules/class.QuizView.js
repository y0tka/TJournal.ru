Air.defineClass('class.QuizView', 'lib.DOM', function($) {

    let CSS = {
        quizHolder          : 'quiz',
        quizHided           : 'quiz--hided',
        loading             : 'quiz--loading',
        quizItems           : 'quiz__items',
        quizItemButton      : 'quiz__items-checkbox',
        quizItemProgressBar : 'quiz__items-progress-bar',
        quizResults         : 'quiz__items--results',
        winnerItem          : 'quiz__items--winner',

        quizOptions         : 'quiz__items-option',
        quizOptionName      : 'quiz__items-name',
        quizOptionResults   : 'quiz__items-name--results',
        quizOptionVoted     : 'quiz__items-name--voted',
        revoteButton        : 'quiz__revote-button',

        oldAppVersion       : 'quiz--old-version'

    };

    let state = {
        OPTIONS : 0,
        RESULTS : 1
    };

    /**
     * @param {Object} params - outside parameters
     *        {Element} params.element - quiz holder
     *
     *
     * @property {Function} init
     * @constructor
     */
    let QuizView = function(params) {

        this.quiz = params.element;
        this.handlers = params.handlers;

        this.quizElements = {};
        this.state = 0;

        this.init();

        this.handlers.onReady();
    };

    /**
     * Bind on options handlers
     */
    QuizView.prototype.init = function() {

        this.quizElements.holder = this.quiz;
        this.quizElements.items  = $.find(this.quiz, `.${CSS.quizItems}`);
        this.quizElements.revoteButton = $.find(this.quiz, `.${CSS.revoteButton}`);

        $.delegateEvent( this.quiz, `.${CSS.quizOptions}`, 'click', this.onOptionClick.bind(this) );
        $.delegateEvent( this.quiz, `.${CSS.revoteButton}`, 'click', this.handlers.onRevoteButtonClick );

    };

    /**
     * Destroy class
     */
    QuizView.prototype.destroy = function () {

        this.quizElements = {};
        this.quiz = null;
        this.handlers = null;
        this.state = null;

        $.off( self.quiz );

    };

    /**
     * Option click handler
     */
    QuizView.prototype.onOptionClick = function(event) {
        let clickedItem = event.target;

        // if quiz state is results
        if (this.state === state.RESULTS) {
            return;
        }

        // for custom radio buttons
        if ( clickedItem.classList.contains('ui-radio-button') ) {
            clickedItem = clickedItem.firstChild;
        }

        if ( !clickedItem || clickedItem.tagName != 'INPUT') {
            return;
        }

        this.handlers.onOptionClick( {
            itemId: clickedItem.value
        } );
    };

    /**
     * show loader
     * @param {Boolean} state - loading state
     */
    QuizView.prototype.setProcessState = function ( state ) {

        let self = this;

        if ( state ) {
            this.quizElements.holder.classList.add(CSS.loading);
        } else {
            this.quizElements.holder.classList.remove(CSS.loading);

            window.setTimeout(function() {
                self.quizElements.holder.classList.add('quiz--appeared');
            }, 100);
        }

    };

    /**
     * Show options
     * @param {Object} data - state with results
     */
    QuizView.prototype.showOptions = function( data ) {

        // save quiz state
        this.state = state.OPTIONS;

        this.quizElements.items.classList.remove(CSS.quizResults);
        this.clearResults();

        // hide revoting button
        this.quizElements.revoteButton.style.display = 'none';

    };

    /**
     * Show results
     * @param {Object} results - state with results
     */
    QuizView.prototype.showResults = function( results ) {

        // save quiz state
        this.state = state.RESULTS;

        this.quizElements.items.classList.add(CSS.quizResults);
        this.moveProgressBar( results, true );

        // unbind clicks
        $.off( this.quiz, `.${CSS.quizOptions}` );

        // show revoting button
        this.quizElements.revoteButton.style.display = 'block';

    };

    /**
     * Shows result block with filled bars
     * @param {Object} results
     * @param {Boolean} isCurrentUserVoting - current user voted and need to highlight the option
     */
    QuizView.prototype.moveProgressBar = function (results, isCurrentUserVoting) {

        let option,
            optionName,
            userVoted = results.userVoted,
            resultsItems = results.items,
            winner = results.winner,
            progressBar;

        for (let itemId in resultsItems) {

            option = $.find(this.quizElements.items, `.item-${itemId}`);

            // if quiz option not found, ignore progress because results can contain wrong item hash
            if (!option) {
                continue;
            }

            optionName = $.find(option, `.${CSS.quizOptionName}`);

            // show percentage and count only when state is Results
            if (this.state === state.RESULTS) {
                optionName.classList.add(CSS.quizOptionResults);
            }

            // highlight voted option
            if (itemId === userVoted && isCurrentUserVoting) {
                optionName.classList.add(CSS.quizOptionVoted);
            }

            // clear winner item
            if (optionName.classList.contains(CSS.winnerItem) && itemId !== winner) {
                optionName.classList.remove(CSS.winnerItem);
            }

            // highlight winner
            if (itemId === winner) {
                optionName.classList.add(CSS.winnerItem);
            }

            let percentage = resultsItems[itemId].percentage,
                fractional = Math.abs( percentage - Math.floor(percentage) ) * 100,
                fixedPercentage = percentage;

            if (fractional === 0) {

                fixedPercentage = percentage.toFixed(0);

            } else {

                fixedPercentage = percentage.toFixed(1);
                fixedPercentage = fixedPercentage.toString().replace('.', ',');

            }

            optionName.dataset.percentage = fixedPercentage + '%';
            optionName.dataset.count = resultsItems[itemId].count;

            // move progress bar
            progressBar = $.find(optionName, `.${CSS.quizItemProgressBar}`);
            progressBar.style.width = resultsItems[itemId].percentage + '%';
        }

    };

    QuizView.prototype.clearResults = function() {

        let allItems = this.quizElements.items.childNodes;
        for(let i = 0; i < allItems.length; i++) {

            let option = allItems[i],
                optionName,
                checkbox;

            // get option option
            if (option.nodeType == 1 && option.classList.contains(CSS.quizOptions)) {
                optionName = $.find(option, `.${CSS.quizOptionName}`);
                checkbox = $.find(option, `.${CSS.quizItemButton}`);

                // clear radio buttons
                if (checkbox) {
                    let radioButton = checkbox.firstElementChild;
                    if (radioButton && radioButton.classList.contains('ui-radio-button')) {
                        radioButton.classList.remove('ui-radio-button--checked');
                    }
                }

                optionName.classList.remove(CSS.quizOptionResults);
                optionName.classList.remove(CSS.quizOptionVoted);
                optionName.classList.remove(CSS.winnerItem);

                optionName.dataset.percentage = '0%';
                optionName.dataset.count = '0';

            }

        }

    };

    QuizView.prototype.oldVersion = function ( state = true ) {

        this.quizElements.holder.classList.remove(CSS.loading);
        this.quizElements.holder.classList.add(CSS.oldAppVersion);

    };

    return QuizView;

});

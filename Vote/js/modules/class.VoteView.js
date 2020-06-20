Air.defineClass('class.VoteView', 'lib.DOM, lib.andropov', function($, lib_andropov) {

    function VoteView(params) {
        this.$dom = {
            main: params.element,
            count_real: $.bem.find(params.element, 'value__v--real'),
            count_current: null,
            count_next: null,
            count_container: $.bem.find(params.element, 'value'),
            button_minus: $.bem.find(params.element, 'button--minus'),
            button_plus: $.bem.find(params.element, 'button--plus'),
            users: null,
            users_content: null
        };

        this.data = {
            id: $.data(params.element, 'id'),
            content_id: $.data(params.element, 'content-id'),
            type: parseInt($.data(params.element, 'type')),
            type_str: $.data(params.element, 'type-str'),
            symbols: $.data(this.$dom.main, 'symbols').split('|'),
            last_count: this.getCount(),
            animation_duration: 200,
            animation_in_progress: false,
            with_users: $.data(this.$dom.main, 'with-users') === '1',
            set_count_last_date: 0,
            update_users_last_date: -1
        };

        this.handlers = params.handlers;

        $.on(this.$dom.button_minus, 'click', this.onButtonClick.bind(this, -1));
        $.on(this.$dom.button_plus, 'click', this.onButtonClick.bind(this, 1));

        if (this.data.with_users) {
            $.on(this.$dom.count_container, 'mouseenter', this.onValueHover.bind(this));
            // $.on(this.$dom.count_container, 'mouseleave', this.onValueHover.bind(this, false));
        }
    };

    VoteView.prototype.getId = function() {
        return this.data.id;
    };

    VoteView.prototype.getContentId = function() {
        return this.data.content_id;
    };

    VoteView.prototype.getType = function() {
        return this.data.type;
    };

    VoteView.prototype.getTypeStr = function() {
        return this.data.type_str;
    };

    VoteView.prototype.destroy = function() {
        $.off(this.$dom.button_minus);
        $.off(this.$dom.button_plus);
        $.off(this.$dom.count_container);

        this.$dom = null;
        this.data = null;
        this.handlers = null;
    };

    VoteView.prototype.handle = function(name, args) {
        if (this.handlers[name] !== undefined) {
            this.handlers[name].apply(this, args);
        }
    };

    VoteView.prototype.onValueHover = function() {
        if (this.data.set_count_last_date > this.data.update_users_last_date) {
            this.handle('onRequireVotedUsers');
        }
    };

    VoteView.prototype.onButtonClick = function(state) {
        this.handle('onClickVote', [state]);
    };

    VoteView.prototype.toggleMod = function(mod, state) {
        $.bem.toggle(this.$dom.main, mod, state);
    };

    VoteView.prototype.toTextValue = function(count) {
        if (count === null) { // скрытое значение
            return this.data.symbols[0];
        } else if (count >= 0) { // положительное значение
            return count;
        } else { // отрицательное значение
            return this.data.symbols[1] + (-count);
        }
    };

    VoteView.prototype.isHidden = function(count) {
        return count === null;
    };

    VoteView.prototype.isUp = function(next, prev) {
        if (this.isHidden(next) || this.isHidden(prev)) {
            return true;
        } else {
            return next > prev;
        }
    };

    VoteView.prototype.positiveOrNegative = function(count) {
        if (this.isHidden(count) || count === 0) {
            return 0;
        } else {
            return count > 0 ? 1 : -1;
        }
    };

    VoteView.prototype.createVirtualValue = function(count) {
        return $.parseHTML( `<span class="vote__value__v vote__value__v--virtual">${count}</span>` );
    };

    VoteView.prototype.getCount = function() {
        var count = $.data(this.$dom.main, 'count');

        if (count === undefined) {
            return null;
        } else {
            return parseInt(count);
        }
    };

    VoteView.prototype.animate = function(count, last_count, callback) {
        var that = this,
            positive_or_negative = this.positiveOrNegative(count),
            new_text_value = this.toTextValue(count),
            new_is_bigger = new_text_value.length > $.text(this.$dom.count_real).length;

        /* Если результат голосования скрыт или нейтрален, то не отмечаем как позитивный или негативный */
        if (positive_or_negative === 0) {
            this.toggleMod('sum-positive', false);
            this.toggleMod('sum-negative', false);
        } else {
            this.toggleMod('sum-positive', positive_or_negative === 1 );
            this.toggleMod('sum-negative', positive_or_negative === -1 );
        }

        if (new_is_bigger) {
            $.text(this.$dom.count_real, new_text_value);
        }

        this.runAnimation(this.toTextValue(count), this.toTextValue(last_count), this.isUp(count, last_count), this.data.animation_duration, function() {
            if (!new_is_bigger) {
                $.text(that.$dom.count_real, new_text_value);
            }

            if (callback !== undefined) {
                callback();
            }
        });
    };

    VoteView.prototype.setCount = function(count) {
        var that = this;

        // _log('View -> setCount', count);

        if (this.data.animation_in_progress === false) {
            if (count !== this.data.last_count) {
                // _log('View -> animation in progress...');
                this.data.animation_in_progress = true;

                this.animate(count, this.data.last_count, function() {
                    // _log('View -> animation finished');
                    that.data.animation_in_progress = false;
                });

                this.data.last_count = count;
            } else {
                // _log('View -> don\'t animate: same count');
            }
        } else {
            // _log('View -> debounce animation');
            setTimeout(this.setCount.bind(this, count), this.data.animation_duration);
        }

        this.data.set_count_last_date = Date.now();
    };

    VoteView.prototype.runAnimation = function(next, current, is_up, duration, callback) {
        var that = this;

        /* Делаем настоящий элемент невидимым */
        this.toggleMod('animation_in_progress', true);

        /* Создаем виртуальные элементы "A" и "B" и/или проставляем их значения */
        if (this.$dom.count_current === null) {
            this.$dom.count_current = this.createVirtualValue(current);
            /* Ставим "A" на место настоящего */
            $.bem.add(this.$dom.count_current, 'current');
        } else {
            $.text(this.$dom.count_current, current);
        }

        if (this.$dom.count_next === null) {
            this.$dom.count_next = this.createVirtualValue(next);
        } else {
            $.text(this.$dom.count_next, next);
        }

        if (is_up) {
            /* Если голосов стало больше, то ставим виртуальный элемент "B" ниже */
            $.bem.add(this.$dom.count_next, 'next');
        } else {
            /* Если голосов стало меньше, то ставим виртуальный элемент "B" выше */
            $.bem.add(this.$dom.count_next, 'prev');
        }

        /* Добавляем виртуальные элементы в DOM */
        $.append(this.$dom.count_container, this.$dom.count_current);
        $.append(this.$dom.count_container, this.$dom.count_next);

        if (is_up) {
            /* Двигаем виртуальный элемент "A" выше, а снизу на его место приезжает "B" */
            $.bem.add( this.$dom.count_current, 'current_prev' );
            $.bem.add( this.$dom.count_next, 'next_current' );
        } else {
            /* Двигаем виртуальный элемент "A" ниже, а сверху на его место приезжает "B" */
            $.bem.add( this.$dom.count_current, 'current_next' );
            $.bem.add( this.$dom.count_next, 'prev_current' );
        }

        /* Ждем указанное время */
        setTimeout( function() {
            /* Удаляем виртуальные элементы */
            $.remove(that.$dom.count_current);
            $.remove(that.$dom.count_next);

            /* Убираем у виртуальных элементов излишние классы */
            $.bem.remove(that.$dom.count_current, 'current_prev');
            $.bem.remove(that.$dom.count_current, 'current_next');
            $.bem.remove(that.$dom.count_next, 'next');
            $.bem.remove(that.$dom.count_next, 'prev');
            $.bem.remove(that.$dom.count_next, 'next_current');
            $.bem.remove(that.$dom.count_next, 'prev_current');

            /* Делаем настоящий элемент снова видимым */
            that.toggleMod('animation_in_progress', false);

            if (callback !== undefined) {
                callback();
            }
        }, duration);
    };

    VoteView.prototype.setState = function(state) {
        // _log('View -> setState', state);
        this.toggleMod( 'voted-positive', state === 1 );
        this.toggleMod( 'voted-negative', state === -1 );
    };

    VoteView.prototype.getState = function() {
        return parseInt($.data(this.$dom.main, 'state'));
    };

    VoteView.prototype.setVotedUsers = function(data) {
        var html = '',
            id,
            counter_plus = 0,
            counter_minus = 0,
            counter = 0;

        if (this.$dom.users === null) {
            this.$dom.users = $.parseHTML( `<div class="vote__users lm-hidden lt-hidden">
                ${$.svgHtml('vote_triangle', 16, 8)}
                <div class="vote__users__content_wrapper">
                    <div class="vote__users__content"></div>
                </div>
            </div>` );

            this.$dom.users_content = $.bem.find(this.$dom.users, 'content');

            $.append(this.$dom.count_container, this.$dom.users);
        }

        for (id in data) {
            if (data[id].user_url) {
                if (data[id].sign === 1) {
                    counter_plus++;
                } else {
                    counter_minus++;
                }

                counter++;

                html += `<a href="${data[id].user_url}" class="vote__users__item vote__users__item--${data[id].sign === 1 ? 'plus' : 'minus'}"><img class="vote__users__item__image" src="${lib_andropov.formImageUrl(data[id].avatar_url, 16)}"><p class="vote__users__item__name">${data[id].user_name}</p></a>`;
            }
        }

        $.bem.toggle(this.$dom.users, 'not-empty', counter_plus + counter_minus > 0 );
        $.bem.toggle(this.$dom.users, 'with-counter', counter_plus > 0 && counter_minus > 0 );
        $.bem.toggle(this.$dom.users, 'overflowed', counter > 6 );

        $.html(this.$dom.users_content, html);

        this.data.update_users_last_date = Date.now();
    };

    /*
    VoteView.prototype. = function() {

    };
    */

    return VoteView;

});

/**
 * Создается для каждой кнопки сворачивания
 */
Air.define('class.CommentsFoldingItem', 'lib.DOM, fn.declineWord', function($, declineWord, util) {

    function CommentsFoldingItem(element) {
        this.$dom = {
            main: element,
            count: $.bem.find(element, 'count'),
            preloader: null
        };

        this.is_root = $.bem.hasMod(this.$dom.main, 'root');

        this.ids = $.data(element, 'ids').split(',');

        this.words = $.data(element, 'words').split('|');

        this.parent_id = $.data(element, 'parent-id');

        this.with_subtree = $.data(element, 'with-subtree') === '1';
    };

    CommentsFoldingItem.prototype.setWait = function(state) {
        if (!this.is_root && state !== false && this.$dom.preloader === null) {
            this.$dom.preloader = $.preloader();

            $.append(this.$dom.main, this.$dom.preloader);
        }

        $.bem.toggle(this.$dom.main, 'waiting', state !== false);
    };

    CommentsFoldingItem.prototype.getIds = function() {
        return this.ids;
    };

    CommentsFoldingItem.prototype.isWithSubtree = function() {
        return this.with_subtree;
    };

    CommentsFoldingItem.prototype.getParentId = function() {
        return this.parent_id;
    };

    CommentsFoldingItem.prototype.setCount = function(count) {
        if (count > 0) {
            $.text(this.$dom.count, `${count} ${declineWord(count, this.words)}`);
        } else {
            $.remove(this.$dom.main);
        }

    };

    CommentsFoldingItem.prototype.substract = function(ids) {
        this.ids = util.diff(this.ids, ids);
    };

    CommentsFoldingItem.prototype.destroy = function() {
        this.$dom = null;
        this.ids = null;
        this.parent_id = null;
        this.with_subtree = null;
    };

    return CommentsFoldingItem;

});

/**
 * Создается раз для инстанса комментов, плодит инстансы CommentsFoldingItem
 */
Air.define('class.CommentsFolding', 'class.Collection, class.CommentsFoldingItem', function(Collection, CommentsFoldingItem) {

    function CommentsFolding() {
        this.collection = new Collection({
            create: function(element) {
                return new CommentsFoldingItem(element);
            },
            destroy: function( element, created ) {
                created.destroy();
            }
        });
    };

    CommentsFolding.prototype.add = function(element) {
        this.collection.addElement(element);
    };

    CommentsFolding.prototype.get = function(element) {
        return this.collection.getByElement(element);
    };

    CommentsFolding.prototype.destroy = function() {
        this.collection.clear();
    };

    return CommentsFolding;

});

/**
 * Принимает значение, выдавая взнамен "бирку".
 * По "бирке" можно получить данные обратно.
 */
Air.define('lib.cloakroom', {

    hanger: {},

    generate: function() {
        return Math.round(Math.random() * 999999999) + '';
    },

    put: function(coat) {
        let tag = this.generate();

        this.hanger[tag] = coat;

        return tag;
    },

    get: function(tag) {
        let coat = this.hanger[tag];

        if (coat === undefined) {
            return null;
        } else {
            return coat;
        }
    },

    use: function(tag, callback) {
        let coat = this.hanger[tag];

        if (coat !== undefined) {
            callback(coat);
        }
    }

});
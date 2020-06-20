Air.define('module.targeting_methods', 'lib.DOM, lib.string', function($, string_lib) {
    var self = this;

    /** Get hashtags from entry */
    self.getArticleHashtags = function () {
        var entry_data = $.find('.entry_data'),
            json;

        if (entry_data) {

            json = $.html(entry_data);

            json = JSON.parse(json || {});

            entry_data = null;

            if (json) {
                // return json.tags.map(function (item) {
                //     return item.name.toLowerCase();
                // });
                return json.tags;
            } else {
                return  false;
            }

        }else{
            return false;
        }
    };

    /** Get hashtags from page */
    self.getPageHashtags = function () {
        var hashtag_title = $.find('.ui-page-header__title--hashtag'),
            hashtag;

        if (hashtag_title) {

            hashtag = $.html(hashtag_title);

            hashtag_title = null;

            return [hashtag.toLowerCase()];

        }else{
            return false;
        }
    };

    /** Get puid value provided by hashtag_data */
    self.getHashtagPuidValue = function (type, hashtag_data) {
        var ids = [],
            hashtag_data_key,
            hashtags;

        hashtags = self['get' + string_lib.capFirstLetter(type) + 'Hashtags']();

        if (hashtags) {

            hashtags.forEach(function (hashtag) {

                for (hashtag_data_key in hashtag_data[type]) {

                    if (hashtag_data[type][hashtag_data_key] === hashtag) {

                        ids.push(hashtag_data_key);

                    }

                }

            });

            if (ids.length > 0) {
                return ids.join(':');
            }else{
                return false;
            }

        } else{

            return false;

        }

    };

});

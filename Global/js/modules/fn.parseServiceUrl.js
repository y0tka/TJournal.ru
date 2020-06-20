/**
 * @module parseServiceUrl - Extracts service data by URL
 **
 * @typedef {object} module:parseServiceUrl.ServiceData
 * @property  {string} id       - video id: "Syw8q4vgc3A"
 * @property  {string} name     - service name: "youtube"
 * @property  {string} type     - media type: "video|gif"
 * @property  {number} uid      - random generated id
 * @property  {string} origin   - original pasted URL
 */
/**
 * @param  {String} url
 * @param {boolean} is_first_only - True to use only first match.
 * @return {ServiceData|ServiceData[]}
 *
 * TODO:
 * ଽ( – ௦ – )৴
 * youku
 * iqiyi
 */
Air.defineFn( 'fn.parseServiceUrl', function() {
    return function( url, is_first_only ) {
        var url = url.replace( /\r?\n|\r/g, ' ' ),
            services = [
                {
                    name: 'youtube',
                    type: 'video',
                    regex: /(?:https?:\/\/)?(?:youtu\.be\/|(?:www\.)?youtube\.com\/watch(?:\.php)?\?[^ ]*v=)([a-zA-Z0-9\-_]+)/g
                },
                {
                    name: 'vimeo',
                    type: 'video',
                    regex: /(?:https?:\/\/)(?:(?:www\.)?)vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)([\d]{6,})/g
                },
                {
                    name: 'gfycat',
                    type: 'gif',
                    regex: /(?:https?:\/\/)(?:(?:www\.)?)gfycat\.com(?:(?:\/ru)?\/gifs\/detail|\/ifr)?\/(\w+)/g
                },
                {
                    name: 'coub',
                    type: 'video',
                    regex: /(?:https?:\/\/)(?:(?:www\.)?)coub\.com\/(?:view\/|embed\/)([a-zA-Z0-9]{5,7})/g
                },
                {
                    name: 'imgur',
                    type: 'gif',
                    regex: /https?:\/\/imgur\.com\/(?:gallery\/)?(?!gallery)([a-zA-Z0-9]+)\/?$/g
                },
                {
                    name: 'giphy',
                    type: 'gif',
                    regex: /(?:https?:\/\/)(?:(?:www\.)?)giphy\.com\/(?:embed|gifs|media)\/(?:(?:[^\/]+)-)?(\w+)/g
                },
                {
                    name: 'vk',
                    type: 'video',
                    regex: /https?:\/\/(?:vk\.com|tjournal\.ru\/proxy)\/.*(?:video)([-0-9]+_[0-9]+)/g
                },
                {
                    name: 'twitch_channel',
                    type: 'video',
                    regex: /(?:https?:\/\/)(?:(?:www\.)?)(?:(?:go\.)?)twitch\.tv\/(?!videos|directory|download|p|jobs|store)([a-zA-Z0-9_]+)/g
                },
                {
                    name: 'twitch_video',
                    type: 'video',
                    regex: /(?:https?:\/\/)(?:(?:www\.)?)(?:(?:go\.)?)twitch\.tv\/videos\/(\d+)/g
                },
                {
                    name: 'ok',
                    type: 'video',
                    regex: /(?:https?:\/\/)(?:odnoklassniki|ok)\.ru\/(?:video|live|videoembed)\/(\d+)/g
                }
            ],
            services_length = services.length,
            i,
            match,
            result;

        for ( i = 0; i < services_length; i++ ) {

            while ((match = services[ i ].regex.exec(url)) !== null) {
                // This is necessary to avoid infinite loops with zero-width matches
                if (match.index === services[ i ].regex.lastIndex) {
                    services[ i ].regex.lastIndex++;
                }

                if ( result === undefined ) {
                    result = [];
                }

                result.push( {
                    name: services[ i ].name,
                    type: services[ i ].type,
                    id: match[ 1 ],
                    uid: Math.round( Math.random() * 1000000 ),
                    origin: url
                } );

                if ( is_first_only === true ) {
                    break;
                }
            }
        }

        if ( result !== undefined && is_first_only === true ) {
            return result[ 0 ];
        } else {
            return result;
        }
    };
} );

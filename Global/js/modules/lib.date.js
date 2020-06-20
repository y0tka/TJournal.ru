/**
 * @module date
 */
Air.defineLib( 'lib.date', 'lib.string, fn.declineWord', function( lib_string, declineWord ) {

    return {

        /**
         * @typedef {Function} module:date.timestampToDate
         */
        timestampToDate: function( timestamp ) {
            return new Date( timestamp * 1000 );
        },

        /**
         * @typedef {Function} module:date.getMonthName
         */
        getMonthName: function( date, is_short ) {
            var result;

            switch ( date.getMonth() ) {
                case 0:
                    result = is_short ? 'янв' : 'января';
                break;

                case 1:
                    result = is_short ? 'фев' : 'февраля';
                break;

                case 2:
                    result = is_short ? 'мар' : 'марта';
                break;

                case 3:
                    result = is_short ? 'апр' : 'апреля';
                break;

                case 4:
                    result = is_short ? 'мая' : 'мая';
                break;

                case 5:
                    result = is_short ? 'июня' : 'июня';
                break;

                case 6:
                    result = is_short ? 'июля' : 'июля';
                break;

                case 7:
                    result = is_short ? 'авг' : 'августа';
                break;

                case 8:
                    result = is_short ? 'сен' : 'сентября';
                break;

                case 9:
                    result = is_short ? 'окт' : 'октября';
                break;

                case 10:
                    result = is_short ? 'ноя' : 'ноября';
                break;

                case 11:
                    result = is_short ? 'дек' : 'декабря';
                break;
            }

            return result;
        },

        /**
         * @typedef {Function} module:date.leadingZero
         */
        leadingZero: function( value ) {
            if ( value < 10 ) {
                value = '0' + value;
            }

            return value;
        },

        /**
         * @typedef {Function} module:date.getPassedTime
         */
        getPassedTime: function( date, is_short ) {
            var current_date = new Date(),
                date_string,
                diff_seconds = Math.floor( ( current_date.getTime() - date.getTime() ) / 1000 ),
                diff_minutes,
                diff_hours,
                yesterday_date,
                time_string,
                result = '';

            if ( diff_seconds < 60 ) {
                result = 'только что';
            } else {
                diff_minutes = Math.floor( diff_seconds / 60 );

                if ( diff_minutes < 60 ) {
                    // if (is_short === true) {
                    //     result = diff_minutes + ' мин';
                    // } else {
                        result = ( diff_minutes === 1 ? '' : diff_minutes + ' ' ) + declineWord( diff_minutes, [ 'минут', 'минуту', 'минуты' ] ) + ' назад';
                    // }
                } else {
                    diff_hours = Math.floor( diff_minutes / 60 );

                    if ( diff_hours < 4 ) {
                        // if (is_short === true) {
                        //     result = diff_hours + 'ч';
                        // } else {
                            result = ( diff_hours === 1 ? '' : diff_hours + ' ' ) + declineWord( diff_hours, [ 'часов', 'час', 'часа' ] ) + ' назад';
                        // }
                    } else {
                        time_string = this.leadingZero( date.getHours() ) + ':' + this.leadingZero( date.getMinutes() );

                        date_string = date.toDateString();

                        if ( date_string === current_date.toDateString() ) {
                            if (!is_short) {
                                result = 'сегодня в ';
                            }

                            result += time_string;
                        } else {
                            yesterday_date = new Date();
                            yesterday_date.setDate( current_date.getDate() - 1 );

                            if ( date_string === yesterday_date.toDateString() ) {
                                result = 'вчера';

                                // if (!is_short) {
                                    result += ' в ' + time_string;
                                // }
                            } else {
                                date_string = date.getDate() + ' ' + this.getMonthName( date, true );

                                if ( date.getFullYear() === current_date.getFullYear() ) {
                                    result = date_string;

                                    // if (!is_short) {
                                        result += ' в ' + time_string
                                    // }
                                } else {
                                    result = date_string + ' ' + date.getFullYear();
                                }
                            }
                        }
                    }
                }
            }

            return lib_string.capFirstLetter( result );
        },

        /**
         * Coverts date string from DD-MM-YYYYTMM:SS(:sss) to YYYY-MM-DDTMM:SS(:sss) format
         *
         * @param {String} littleEndian   - "22-04-2017 15:23"
         * @param {String} delimiter      - symbol between date and time
         * @return {String} big-endian date "2017-04-22"
         * @typedef {Function} module:date.littleToBigEndian
         */
        littleToBigEndian(littleEndian, delimiter = ' '){

            let [date, time] = littleEndian.split(delimiter),
                [days, month, year] = date.split('-');

            return `${year}-${month}-${days}${delimiter}${time}`;
        },

        /**
         * Coverts date string from YYYY-MM-DDTMM:SS(:sss) to DD-MM-YYYYTMM:SS(:sss)  format
         *
         * @param {String} bigEndian   - "2017-04-22 15:23"
         * @param {String} delimiter      - symbol between date and time (in orignal big-endian date)
         * @return {String} little-endian date "22-04-2017 15:23"
         * @typedef {Function} module:date.bigToLittleEndian
         */
        bigToLittleEndian(bigEndian, delimiter = ' '){

            let [date, time] = bigEndian.split(delimiter),
                [year, month, days] = date.split('-');

            return `${days}-${month}-${year} ${time}`;
        }


    };

} );

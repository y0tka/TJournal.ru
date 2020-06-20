/**
 * Copy text data to clipboard
 * @param {String} text
 * @param {Function} callback - fired after copy attempt
 */
Air.defineFn('fn.copyToClipboard', function () {
    return function (text, callback) {

        let input = document.createElement('input'),
            is_success = false;

        Object.assign(input.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            opacity: '0'
        });

        input.value = text;

        document.body.appendChild(input);

        input.select();

        try {
            let copy = document.execCommand('copy');
            success = true;
        } catch (e) { }

        document.body.removeChild(input);

        callback(success);

    };
});

Air.defineFn('fn.openWindow', function() {
    return function(url, callback) {
        var left = (screen.width / 2) - (720 / 2),
            top = (screen.height / 2) - (440 / 2),
            new_window;

        new_window = window.open(url, 'displayWindow', 'width=720,height=440,left=' + left + ',top=' + top + ',location=no, directories=no,status=no,toolbar=no,menubar=no');

        new_window.onbeforeunload = function() {
            callback && callback();
        };

        return new_window;
    };
});

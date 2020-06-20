Air.defineFn('fn.mobileAppSend', function() {
    return function(key, value) {
        var userAgent = navigator.userAgent || navigator.vendor || window.opera;

        if (/android/i.test(userAgent)) {
            try {
                Android.postMessage(key, value)
            } catch (err) {
                console.log('Android app interface failed');
            }
        }

        if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
            try {
                webkit.messageHandlers[key].postMessage(value);
            } catch (err) {
                console.log('The native context does not exist yet');
            }
        }

    };
});

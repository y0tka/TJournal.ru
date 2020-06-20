Air.defineFn( 'fn.validateCommentText', function() {
    return function( text ) {
        var result = {},
            length = text.trim().length,
            max = 5000;

        if (length <= 0) {
            result.error_msg = `Нужно хоть ��то-то написать`;
            result.error_code = 1;
        } else if (length > max) {
            result.error_msg = `Очень длинный комментарий, не больше ${max} символов, пожалуйста`;
            result.error_code = 2;
        } else {
            result.error_msg = null;
            result.error_code = null;
        }

        result.text = text;

        return result;
    };
} );

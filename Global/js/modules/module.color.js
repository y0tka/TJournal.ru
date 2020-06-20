Air.define('lib.color', {
    /** From https://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors#answer-13542669 */
    shadeBlend: function shadeBlend(p, c0, c1) {
        var n = p < 0 ? p * -1 : p,
            u = Math.round,
            w = parseInt;
        if (c0.length > 7) {
            var f = c0.split(","),
                t = (c1 ? c1 : p < 0 ? "rgb(0,0,0)" : "rgb(255,255,255)").split(","),
                R = w(f[0].slice(4)),
                G = w(f[1]),
                B = w(f[2]);
            return "rgb(" + (u((w(t[0].slice(4)) - R) * n) + R) + "," + (u((w(t[1]) - G) * n) + G) + "," + (u((w(t[2]) - B) * n) + B) + ")"
        } else {
            var f = w(c0.slice(1), 16),
                t = w((c1 ? c1 : p < 0 ? "#000000" : "#FFFFFF").slice(1), 16),
                R1 = f >> 16,
                G1 = f >> 8 & 0x00FF,
                B1 = f & 0x0000FF;
            return "#" + (0x1000000 + (u(((t >> 16) - R1) * n) + R1) * 0x10000 + (u(((t >> 8 & 0x00FF) - G1) * n) + G1) * 0x100 + (u(((t & 0x0000FF) - B1) * n) + B1)).toString(16).slice(1)
        }
    },

    hexToRgb: function(hex) {
        if (hex.charAt(0) === '#') {
            hex = hex.substr(1);
        }

        let bigint = parseInt(hex, 16);
        let r = (bigint >> 16) & 255;
        let g = (bigint >> 8) & 255;
        let b = bigint & 255;

        return [r, g, b];
    },

    normalizeRgbComponent: function(value) {
        return value / 255;
    },

    getContrast: function(hex) {
        let rgb = this.hexToRgb(hex).map(this.normalizeRgbComponent);

        return 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2];
    },

    getContrastColor: function(hex) {
        return this.getContrast(hex) > 0.5 ? '#000000' : '#ffffff';
    }

});

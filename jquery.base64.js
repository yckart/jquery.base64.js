/*!
 * jquery.base64.js 0.1 - https://github.com/yckart/jquery.base64.js
 * Base64 en & -decoding
 *
 * Copyright (c) 2012 Yannick Albert (http://yckart.com)
 * Licensed under the MIT license (http://www.opensource.org/licenses/mit-license.php).
 * 2013/02/10
 **/

;(function ($) {
    var config = $.base64 = $.fn.base64 = function (dir, input, encode) {

        var self = this,
            b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

        var UTF8 = {

            /**
             * Encode multi-byte Unicode string into utf-8 multiple single-byte characters
             * (BMP / basic multilingual plane only)
             *
             * Chars in range U+0080 - U+07FF are encoded in 2 chars, U+0800 - U+FFFF in 3 chars
             *
             * @author Chris Veness
             * @param {String} strUni Unicode string to be encoded as UTF-8
             * @returns {String} encoded string
             */
            encode: function (strUni) {
                // use regular expressions & String.replace callback function for better efficiency
                // than procedural approaches
                var strUtf = strUni.replace(
                    /[\u0080-\u07ff]/g, // U+0080 - U+07FF => 2 bytes 110yyyyy, 10zzzzzz
                function (c) {
                    var cc = c.charCodeAt(0);
                    return String.fromCharCode(0xc0 | cc >> 6, 0x80 | cc & 0x3f);
                });
                strUtf = strUtf.replace(
                    /[\u0800-\uffff]/g, // U+0800 - U+FFFF => 3 bytes 1110xxxx, 10yyyyyy, 10zzzzzz
                function (c) {
                    var cc = c.charCodeAt(0);
                    return String.fromCharCode(0xe0 | cc >> 12, 0x80 | cc >> 6 & 0x3F, 0x80 | cc & 0x3f);
                });
                return strUtf;
            },

            /**
             * Decode utf-8 encoded string back into multi-byte Unicode characters
             *
             * @author Chris Veness
             * @param {String} strUtf UTF-8 string to be decoded back to Unicode
             * @returns {String} decoded string
             */
            decode: function (strUtf) {
                // note: decode 3-byte chars first as decoded 2-byte strings could appear to be 3-byte char!
                var strUni = strUtf.replace(
                    /[\u00e0-\u00ef][\u0080-\u00bf][\u0080-\u00bf]/g, // 3-byte chars
                function (c) { // (note parentheses for precence)
                    var cc = ((c.charCodeAt(0) & 0x0f) << 12) | ((c.charCodeAt(1) & 0x3f) << 6) | (c.charCodeAt(2) & 0x3f);
                    return String.fromCharCode(cc);
                });
                strUni = strUni.replace(
                    /[\u00c0-\u00df][\u0080-\u00bf]/g, // 2-byte chars
                function (c) { // (note parentheses for precence)
                    var cc = (c.charCodeAt(0) & 0x1f) << 6 | c.charCodeAt(1) & 0x3f;
                    return String.fromCharCode(cc);
                });
                return strUni;
            }
        };

        /**
         * Encode string into Base64, as defined by RFC 4648 [http://tools.ietf.org/html/rfc4648]
         * (instance method extending String object). As per RFC 4648, no newlines are added.
         *
         * @author Chris Veness
         * @param {String} str The string to be encoded as base-64
         * @param {Boolean} [utf8encode=false] Flag to indicate whether str is Unicode string to be encoded
         *   to UTF8 before conversion to base64; otherwise string is assumed to be 8-bit characters
         * @returns {String} Base64-encoded string
         */
        this.encode = function (plain, utf8encode) { // http://tools.ietf.org/html/rfc4648
            plain = !(self instanceof $) ? plain : self.is(':input') ? self.val() : self.text();
            plain = config.raw === false || config.utf8encode || utf8encode ? UTF8.encode(plain) : plain;

            var o1, o2, o3, bits, h1, h2, h3, h4, e = [],
                pad = '',
                coded;

            var c = plain.length % 3; // pad string to length of multiple of 3
            if (c > 0) {
                while (c++ < 3) {
                    pad += '=';
                    plain += '\0';
                }
            }
            // note: doing padding here saves us doing special-case packing for trailing 1 or 2 chars

            for (c = 0; c < plain.length; c += 3) { // pack three octets into four hexets
                o1 = plain.charCodeAt(c);
                o2 = plain.charCodeAt(c + 1);
                o3 = plain.charCodeAt(c + 2);

                bits = o1 << 16 | o2 << 8 | o3;

                h1 = bits >> 18 & 0x3f;
                h2 = bits >> 12 & 0x3f;
                h3 = bits >> 6 & 0x3f;
                h4 = bits & 0x3f;

                // use hextets to index into code string
                e[c / 3] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
            }
            coded = e.join(''); // join() is far faster than repeated string concatenation in IE

            // replace 'A's from padded nulls with '='s
            coded = coded.slice(0, coded.length - pad.length) + pad;

            return coded;
        };

        /**
         * Decode string from Base64, as defined by RFC 4648 [http://tools.ietf.org/html/rfc4648]
         * (instance method extending String object). As per RFC 4648, newlines are not catered for.
         *
         * @author Chris Veness
         * @param {String} str The string to be decoded from base-64
         * @param {Boolean} [utf8decode=false] Flag to indicate whether str is Unicode string to be decoded
         *   from UTF8 after conversion from base64
         * @returns {String} decoded string
         */
        this.decode = function (coded, utf8decode) {
            coded = !(self instanceof $) ? coded : self.is(':input') ? self.val() : self.text();
            coded = config.raw === false || config.utf8decode || utf8decode ? UTF8.decode(coded) : coded;

            var o1, o2, o3, h1, h2, h3, h4, bits, d = [],
                plain;

            for (var c = 0; c < coded.length; c += 4) { // unpack four hexets into three octets
                h1 = b64.indexOf(coded.charAt(c));
                h2 = b64.indexOf(coded.charAt(c + 1));
                h3 = b64.indexOf(coded.charAt(c + 2));
                h4 = b64.indexOf(coded.charAt(c + 3));

                bits = h1 << 18 | h2 << 12 | h3 << 6 | h4;

                o1 = bits >>> 16 & 0xff;
                o2 = bits >>> 8 & 0xff;
                o3 = bits & 0xff;

                d[c / 4] = String.fromCharCode(o1, o2, o3);
                // check for padding
                if (h4 == 0x40) d[c / 4] = String.fromCharCode(o1, o2);
                if (h3 == 0x40) d[c / 4] = String.fromCharCode(o1);
            }
            plain = d.join(''); // join() is far faster than repeated string concatenation in IE

            // return utf8decode ? decodeURIComponent(escape( plain )) : plain;
            return config.raw === false || config.utf8decode || utf8decode ? UTF8.decode(plain) : plain;
        };
        return input ? this[dir](input, encode) : dir ? null : this;
    };
}(jQuery));
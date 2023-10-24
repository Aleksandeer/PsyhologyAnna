;(function($){

    $.dsPhoneFormatInput = function (el) {

        var element = el;

        var dsPFI = {
            init: function () {
               // console.log('init');
                dsPFI.event();
            },
            getVal:function(){
                return $(element).val();
            },
            setVal:function(value){
                $(element).val(value);
            },
            event:function(){
               // console.log(element);

                //  $( 'input[name="phone"]' ).keyup(function() {
                //       console.log( "Handler for .keyup() called." );
                //   });


                $(element).keyup(function(event){

                    if (event.keyCode !== 13) {
                       //console.log('999');
                        dsPFI.phoneFormat(event);
                        //this.autoLogin(event);

                    };
                });


            },

            phoneFormat: function (event) {
                var pattern,
                    value = dsPFI.getVal();

                if ((/^\+?7/i).test(value)) {
                    pattern = '+{{d}} ({{ddd}}) {{ddd}} {{dd}} {{dd}}';
                } else if ((/^\+?3/i).test(value)) {
                    pattern = '+{{dd}} ({{ddd}}) {{ddd}} {{dd}} {{dd}}';
                } else {
                    pattern = '+{{ddd}} {{ddd}} {{ddd}} {{ddd}} {{ddd}}';
                }

                //В Android-браузере проблемы со сменой клавиатуры при вводе форматированного текста
                if (pattern && !userAgent.os.isAndroid) {
                    dsPFI.setVal(dsPFI.formatter(value, pattern));
                }
                // if (pattern) {
                //     dsPFI.setVal(dsPFI.formatter(value, pattern));
                // }

            },
            formatter: function (string, format) {
                string = (string === undefined || string === null) ? '' : String(string);

                if (!format) return string;

                var i = 0,
                    len = format.length,
                    j = 0,
                    result = '',
                    pattern,
                    subject,
                    enterReplace = /[\{\{]/i,
                    exitReplace = /[}}]/i,
                    digitTest = /^[0-9]$/,
                    replacementMode = false;

                for (i; i < len; i++) {
                    pattern = format[i];
                    subject = string[j];

                    if (!subject) {
                        break;
                    }

                    if (enterReplace.test(pattern)) {
                        replacementMode = true;
                        continue;
                    }

                    if (exitReplace.test(pattern)) {
                        replacementMode = false;
                        continue;
                    }

                    // start listening for keywords (d | w)
                    if (replacementMode) {
                        if (pattern === 'd' && digitTest.test(subject)) {
                            result += subject;
                            j++;
                        } else if (pattern === 'w') {
                            result += subject;
                            j++;
                        }
                    } else {
                        // if we have already formatted part outside of replacement zone
                        if (pattern === subject) {
                            result += subject;
                            j++;

                        } else {
                            result += pattern;
                        }
                    }
                }

                return result.trim();
            }


        };

        return {
            init: dsPFI.init
        };
    };

})(jQuery);



/*!
 * v0.0.9
 * Copyright (c) 2013 First Opinion
 * formatter.js is open sourced under the MIT license.
 *
 * thanks to digitalBush/jquery.maskedinput for some of the trickier
 * keycode handling
 */

;(function ($, window, document, undefined) {

// Defaults
    var defaults = {
        persistent: false,
        repeat: false,
        placeholder: ' '
    };

// Regexs for input validation
    var inptRegs = {
        '9': /[0-9]/,
        'a': /[A-Za-z]/,
        '*': /[A-Za-z0-9]/
    };

//
// Class Constructor - Called with new Formatter(el, opts)
// Responsible for setting up required instance variables, and
// attaching the event listener to the element.
//
    function Formatter(el, opts) {
        // Cache this
        var self = this;

        // Make sure we have an element. Make accesible to instance
        self.el = el;
        if (!self.el) {
            throw new TypeError('Must provide an existing element');
        }

        // Merge opts with defaults
        self.opts = utils.extend({}, defaults, opts);

        // Make sure we have valid opts
        if (typeof self.opts.pattern === 'undefined') {
            throw new TypeError('Must provide a pattern');
        }

        // Get info about the given pattern
        var parsed   = pattern.parse(self.opts.pattern);
        self.mLength = parsed.mLength;
        self.chars   = parsed.chars;
        self.inpts   = parsed.inpts;

        // Init values
        self.hldrs = {};
        self.focus = 0;

        // Add Listeners
        utils.addListener(self.el, 'keydown', function (evt) {
            self._keyDown(evt);
        });
        utils.addListener(self.el, 'keypress', function (evt) {
            self._keyPress(evt);
        });
        utils.addListener(self.el, 'paste', function (evt) {
            self._paste(evt);
        });

        // Persistence
        if (self.opts.persistent) {
            // Format on start
            self._processKey('', false);
            self.el.blur();

            // Add Listeners
            utils.addListener(self.el, 'focus', function (evt) {
                self._focus(evt);
            });
            utils.addListener(self.el, 'click', function (evt) {
                self._focus(evt);
            });
            utils.addListener(self.el, 'touchstart', function (evt) {
                self._focus(evt);
            });
        }
    }

//
// @public
// Add new char
//
    Formatter.addInptType = function (char, reg) {
        inptRegs[char] = reg;
    };

//
// @public
// Handler called on all keyDown strokes. All keys trigger
// this handler. Only process delete keys.
//
    Formatter.prototype.resetPattern = function (str) {
        // Update opts to hold new pattern
        this.opts.pattern = str;

        // Get current state
        this.sel = inptSel.get(this.el);
        this.val = this.el.value;

        // Init values
        this.delta = 0;

        // Remove all formatted chars from val
        this._removeChars();

        // Update pattern
        var parsed   = pattern.parse(str);
        this.mLength = parsed.mLength;
        this.chars   = parsed.chars;
        this.inpts   = parsed.inpts;

        // Format on start
        this._processKey('', false);
    };

//
// @private
// Handler called on all keyDown strokes. All keys trigger
// this handler. Only process delete keys.
//
    Formatter.prototype._keyDown = function (evt) {
        // The first thing we need is the character code
        var k = evt.which || evt.keyCode;

        // If delete key
        if (k && utils.isDelKey(k)) {
            // Process the keyCode and prevent default
            this._processKey(null, k);
            return utils.preventDefault(evt);
        }
    };

//
// @private
// Handler called on all keyPress strokes. Only processes
// character keys (as long as no modifier key is in use).
//
    Formatter.prototype._keyPress = function (evt) {
        // The first thing we need is the character code
        var k, isSpecial, char;
        // Mozilla will trigger on special keys and assign the the value 0
        // We want to use that 0 rather than the keyCode it assigns.
        k = evt.keyCode || evt.which;
        char = String.fromCharCode(k);

        // Process the keyCode and prevent default
        if (char) {
            this._processKey(char, false);
            return utils.preventDefault(evt);
        }
    };

//
// @private
// Handler called on paste event.
//
    Formatter.prototype._paste = function (evt) {
        // Process the clipboard paste and prevent default
        this._processKey(utils.getClip(evt), false);
        return utils.preventDefault(evt);
    };

//
// @private
// Handle called on focus event.
//
    Formatter.prototype._focus = function (evt) {
        // Wrapped in timeout so that we can grab input selection
        var self = this;
        setTimeout(function () {
            // Grab selection
            var selection = inptSel.get(self.el);
            // Char check
            var isAfterStart = selection.end > self.focus;
            isFirstChar  = selection.end === 0;
            // If clicked in front of start, refocus to start
            if (isAfterStart || isFirstChar) {
                inptSel.set(self.el, self.focus);
            }
        }, 0);
    };

//
// @private
// Using the provided key information, alter el value.
//
    Formatter.prototype._processKey = function (chars, delKey) {
        // Get current state
        this.sel = inptSel.get(this.el);
        this.val = this.el.value;

        // Init values
        this.delta = 0;

        // If chars were highlighted, we need to remove them
        if (this.sel.begin !== this.sel.end) {
            this.delta = (-1) * Math.abs(this.sel.begin - this.sel.end);
            this.val   = utils.removeChars(this.val, this.sel.begin, this.sel.end);
        }

        // Delete key (moves opposite direction)
        else if (delKey && delKey == 46) {
            this._delete();

            // or Backspace and not at start
        } else if (delKey && this.sel.begin - 1 >= 0) {
            this.val = utils.removeChars(this.val, this.sel.end -1, this.sel.end);
            this.delta = -1;

            // or Backspace and at start - exit
        } else if (delKey) {
            return true;
        }

        // If the key is not a del key, it should convert to a str
        if (!delKey) {
            // Add char at position and increment delta
            this.val = utils.addChars(this.val, chars, this.sel.begin);
            this.delta += chars.length;
        }

        // Format el.value (also handles updating caret position)
        this._formatValue();
    };

//
// @private
// Deletes the character in front of it
//
    Formatter.prototype._delete = function () {
        // Adjust focus to make sure its not on a formatted char
        while (this.chars[this.sel.begin]) {
            this._nextPos();
        }

        // As long as we are not at the end
        if (this.sel.begin < this.val.length) {
            // We will simulate a delete by moving the caret to the next char
            // and then deleting
            this._nextPos();
            this.val = utils.removeChars(this.val, this.sel.end -1, this.sel.end);
            this.delta = -1;
        }
    };

//
// @private
// Quick helper method to move the caret to the next pos
//
    Formatter.prototype._nextPos = function () {
        this.sel.end ++;
        this.sel.begin ++;
    };

//
// @private
// Alter element value to display characters matching the provided
// instance pattern. Also responsible for updatin
//
    Formatter.prototype._formatValue = function () {
        // Set caret pos
        this.newPos = this.sel.end + this.delta;

        // Remove all formatted chars from val
        this._removeChars();
        // Validate inpts
        this._validateInpts();
        // Add formatted characters
        this._addChars();

        // Set vakye and adhere to maxLength
        this.el.value = this.val.substr(0, this.mLength);

        // Set new caret position
        inptSel.set(this.el, this.newPos);
    };

//
// @private
// Remove all formatted before and after a specified pos
//
    Formatter.prototype._removeChars = function () {
        // Delta shouldn't include placeholders
        if (this.sel.end > this.focus) {
            this.delta += this.sel.end - this.focus;
        }

        // Account for shifts during removal
        var shift = 0;

        // Loop through all possible char positions
        for (var i = 0; i <= this.mLength; i++) {
            // Get transformed position
            var curChar = this.chars[i],
                curHldr = this.hldrs[i],
                pos = i + shift,
                val;

            // If after selection we need to account for delta
            pos = (i >= this.sel.begin) ? pos + this.delta : pos;
            val = this.val.charAt(pos);
            // Remove char and account for shift
            if (curChar && curChar == val || curHldr && curHldr == val) {
                this.val = utils.removeChars(this.val, pos, pos + 1);
                shift--;
            }
        }

        // All hldrs should be removed now
        this.hldrs = {};

        // Set focus to last character
        this.focus = this.val.length;
    };

//
// @private
// Make sure all inpts are valid, else remove and update delta
//
    Formatter.prototype._validateInpts = function () {
        // Loop over each char and validate
        for (var i = 0; i < this.val.length; i++) {
            // Get char inpt type
            var inptType = this.inpts[i];

            // Checks
            var isBadType = !inptRegs[inptType],
                isInvalid = !isBadType && !inptRegs[inptType].test(this.val.charAt(i)),
                inBounds  = this.inpts[i];

            // Remove if incorrect and inbounds
            if ((isBadType || isInvalid) && inBounds) {
                this.val = utils.removeChars(this.val, i, i + 1);
                this.focusStart--;
                this.newPos--;
                this.delta--;
                i--;
            }
        }
    };

//
// @private
// Loop over val and add formatted chars as necessary
//
    Formatter.prototype._addChars = function () {
        if (this.opts.persistent) {
            // Loop over all possible characters
            for (var i = 0; i <= this.mLength; i++) {
                if (!this.val.charAt(i)) {
                    // Add placeholder at pos
                    this.val = utils.addChars(this.val, this.opts.placeholder, i);
                    this.hldrs[i] = this.opts.placeholder;
                }
                this._addChar(i);
            }

            // Adjust focus to make sure its not on a formatted char
            while (this.chars[this.focus]) {
                this.focus++;
            }
        } else {
            // Avoid caching val.length, as it changes during manipulations
            for (var j = 0; j <= this.val.length; j++) {
                // When moving backwards there are some race conditions where we
                // dont want to add the character
                if (this.delta <= 0 && (j == this.focus)) { return true; }
                this._addChar(j);
            }
        }
    };

//
// @private
// Add formattted char at position
//
    Formatter.prototype._addChar = function (i) {
        // If char exists at position
        var char = this.chars[i];
        if (!char) { return true; }

        // If chars are added in between the old pos and new pos
        // we need to increment pos and delta
        if (utils.isBetween(i, [this.sel.begin -1, this.newPos +1])) {
            this.newPos ++;
            this.delta ++;
        }

        // If character added before focus, incr
        if (i <= this.focus) {
            this.focus++;
        }

        // Updateholder
        if (this.hldrs[i]) {
            delete this.hldrs[i];
            this.hldrs[i + 1] = this.opts.placeholder;
        }

        // Update value
        this.val = utils.addChars(this.val, char, i);
    };

// Define module
    var pattern = {};

// Match information
    var DELIM_SIZE = 4;

// Our regex used to parse
    var regexp  = new RegExp('{{([^}]+)}}', 'g');

//
// Helper method to parse pattern str
//
    var getMatches = function (pattern) {
        // Populate array of matches
        var matches = [],
            match;
        while(match = regexp.exec(pattern)) {
            matches.push(match);
        }

        return matches;
    };

//
// Create an object holding all formatted characters
// with corresponding positions
//
    pattern.parse = function (pattern) {
        // Our obj to populate
        var info = { inpts: {}, chars: {} };

        // Pattern information
        var matches = getMatches(pattern),
            pLength = pattern.length;

        // Counters
        var mCount = 0,
            iCount = 0,
            i = 0;

        // Add inpts, move to end of match, and process
        var processMatch = function (val) {
            var valLength = val.length;
            for (var j = 0; j < valLength; j++) {
                info.inpts[iCount] = val.charAt(j);
                iCount++;
            }
            mCount ++;
            i += (val.length + DELIM_SIZE - 1);
        };

        // Process match or add chars
        for (i; i < pLength; i++) {
            if (i == matches[mCount].index) {
                processMatch(matches[mCount][1]);
            } else {
                info.chars[i - (mCount * DELIM_SIZE)] = pattern.charAt(i);
            }
        }

        // Set mLength and return
        info.mLength = i - (mCount * DELIM_SIZE);
        return info;
    };
// Define module
    var inptSel = {};

//
// Get begin and end positions of selected input. Return 0's
// if there is no selectiion data
//
    inptSel.get = function (el) {
        // If normal browser return with result
        if (typeof el.selectionStart == "number") {
            return {
                begin: el.selectionStart,
                end: el.selectionEnd
            };
        }

        // Uh-Oh. We must be IE. Fun with TextRange!!
        var range = document.selection.createRange();
        // Determine if there is a selection
        if (range && range.parentElement() == el) {
            var inputRange = el.createTextRange(),
                endRange   = el.createTextRange(),
                length     = el.value.length;

            // Create a working TextRange for the input selection
            inputRange.moveToBookmark(range.getBookmark());

            // Move endRange begin pos to end pos (hence endRange)
            endRange.collapse(false);

            // If we are at the very end of the input, begin and end
            // must both be the length of the el.value
            if (inputRange.compareEndPoints("StartToEnd", endRange) > -1) {
                return { begin: length, end: length };
            }

            // Note: moveStart usually returns the units moved, which
            // one may think is -length, however, it will stop when it
            // gets to the begin of the range, thus giving us the
            // negative value of the pos.
            return {
                begin: -inputRange.moveStart("character", -length),
                end: -inputRange.moveEnd("character", -length)
            };
        }

        //Return 0's on no selection data
        return { begin: 0, end: 0 };
    };

//
// Set the caret position at a specified location
//
    inptSel.set = function (el, pos) {
        // If normal browser
        if (el.setSelectionRange) {
            el.focus();
            el.setSelectionRange(pos,pos);

            // IE = TextRange fun
        } else if (el.createTextRange) {
            var range = el.createTextRange();
            range.collapse(true);
            range.moveEnd('character', pos);
            range.moveStart('character', pos);
            range.select();
        }
    };
// Define module
    var utils = {};

// Useragent info for keycode handling
    var uAgent = (typeof navigator !== 'undefined') ? navigator.userAgent : null,
        iPhone = /iphone/i.test(uAgent);

//
// Shallow copy properties from n objects to destObj
//
    utils.extend = function (destObj) {
        for (var i = 1; i < arguments.length; i++) {
            for (var key in arguments[i]) {
                destObj[key] = arguments[i][key];
            }
        }
        return destObj;
    };

//
// Add a given character to a string at a defined pos
//
    utils.addChars = function (str, chars, pos) {
        return str.substr(0, pos) + chars + str.substr(pos, str.length);
    };

//
// Remove a span of characters
//
    utils.removeChars = function (str, start, end) {
        return str.substr(0, start) + str.substr(end, str.length);
    };

//
// Return true/false is num false between bounds
//
    utils.isBetween = function (num, bounds) {
        bounds.sort(function(a,b) { return a-b; });
        return (num > bounds[0] && num < bounds[1]);
    };

//
// Helper method for cross browser event listeners
//
    utils.addListener = function (el, evt, handler) {
        return (typeof el.addEventListener != "undefined")
            ? el.addEventListener(evt, handler, false)
            : el.attachEvent('on' + evt, handler);
    };

//
// Helper method for cross browser implementation of preventDefault
//
    utils.preventDefault = function (evt) {
        return (evt.preventDefault) ? evt.preventDefault() : (evt.returnValue = false);
    };

//
// Helper method for cross browser implementation for grabbing
// clipboard data
//
    utils.getClip = function (evt) {
        if (evt.clipboardData) { return evt.clipboardData.getData('Text'); }
        if (window.clipboardData) { return window.clipboardData.getData('Text'); }
    };

//
// Returns true/false if k is a del key
//
    utils.isDelKey = function (k) {
        return k === 8 || k === 46 || (iPhone && k === 127);
    };

//
// Returns true/false if k is an arrow key
//
    utils.isSpecialKey = function (k) {
        var codes = {
            '9' : 'tab',
            '13': 'enter',
            '35': 'end',
            '36': 'home',
            '37': 'leftarrow',
            '38': 'uparrow',
            '39': 'rightarrow',
            '40': 'downarrow',
            '116': 'F5'
        };
        // If del or special key
        return codes[k];
    };

//
// Returns true/false if modifier key is held down
//
    utils.isModifier = function (evt) {
        return evt.ctrlKey || evt.altKey || evt.metaKey;
    };
// A really lightweight plugin wrapper around the constructor,
// preventing against multiple instantiations
    var pluginName = 'formatter';

    $.fn[pluginName] = function (options) {

        // Initiate plugin if options passed
        if (typeof options == 'object') {
            this.each(function () {
                if (!$.data(this, 'plugin_' + pluginName)) {
                    $.data(this, 'plugin_' + pluginName,
                        new Formatter(this, options));
                }
            });
        }

        // Add resetPattern method to plugin
        this.resetPattern = function (str) {
            this.each(function () {
                var formatted = $.data(this, 'plugin_' + pluginName);
                // resetPattern for instance
                if (formatted) { formatted.resetPattern(str); }
            });
            // Chainable please
            return this
        };

        // Chainable please
        return this;
    };

    $.fn[pluginName].addInptType = function (char, regexp) {
        Formatter.addInptType(char, regexp);
    };


})( jQuery, window, document);




(function (root) {
    /**
     * @constructor
     * @param number
     */
    var IPhone = function (number, options) {
        this._parse(number, options);
    };

    IPhone.prototype = {
        /**
         * операторы и их коды
         */
        _operators: {
            mts:           [(/^\+380(50|66|95|99)\d{7}$/)],
            kyivstar:      [(/^\+380(67|96|97|98)\d{7}$/)],
            peoplenet:     [(/^\+380(92)\d{7}$/)],
            beeline:       [(/^\+380(68)\d{7}$/)],
            life:          [(/^\+380(63|93)\d{7}$/)],
            utel:          [(/^\+380(91)\d{7}$/)],
            intertelecom:  [
                (/^\+?38094/),
                (/^31244/), (/^31246/), (/^3199/), (/^32253/), (/^32257/), (/^3299/), (/^33229/), (/^3399/), (/^3427/),
                (/^3499/), (/^35242/), (/^35244/), (/^3599/), (/^36240/), (/^36243/), (/^3699/), (/^37290/), (/^37299/),
                (/^3799/), (/^3899/), (/^41246/), (/^41252/), (/^4199/), (/^43269/), (/^4399/), (/^44360/), (/^44361/),
                (/^44362/), (/^44383/), (/^44384/), (/^4499/), (/^45/), (/^46292/), (/^46293/), (/^4699/), (/^47250/), (/^47256/),
                (/^4799/), (/^482309/), (/^48743/), (/^48787/), (/^48794/), (/^48795/), (/^48798/), (/^48799/), (/^4899/),
                (/^51271/), (/^51279/), (/^5199/), (/^52221/), (/^52227/), (/^5299/), (/^532540/), (/^53265/), (/^5399/),
                (/^54279/), (/^5499/), (/^55239/), (/^55275/), (/^5599/), (/^5699/), (/^5799/), (/^6199/), (/^62213/),
                (/^62219/), (/^6299/), (/^64272/), (/^64275/), (/^64276/), (/^6499/), (/^65264/), (/^65270/), (/^6599/),
                (/^69294/), (/^6999/), (/^322542/), (/^322543/), (/^322544/), (/^322545/), (/^322547/), (/^322548/),
                (/^322566/), (/^322567/), (/^322568/), (/^332203/), (/^332207/), (/^342540/), (/^342541/), (/^342542/),
                (/^342543/), (/^342544/), (/^382705/), (/^382706/), (/^382707/), (/^382708/), (/^382709/), (/^382777/),
                (/^382778/), (/^382779/), (/^382780/), (/^382781/), (/^413349/), (/^414253/), (/^432526/), (/^432527/),
                (/^432528/), (/^432529/), (/^48700/), (/^48701/), (/^48702/), (/^48703/), (/^48704/), (/^48770/), (/^322549/),
                (/^48771/), (/^62218/), (/^48772/), (/^545860/), (/^56767/), (/^56768/), (/^56769/), (/^57780/),
                (/^57781/), (/^57782/), (/^61707/), (/^61708/), (/^61709/), (/^692956/), (/^692957/), (/^692962/),
                (/^692963/), (/^692964/), (/^692965/), (/^692966/), (/^692967/), (/^692968/), (/^692969/), (/^1399[1-9][0-9]{4}/),
                (/(384549)[0-9]{3}/), (/^\+?38(094)\d{7}$/), (/^\+?38033/), (/^\+?38046/), (/^\+?38043/),
                (/^\+?38038/), (/^\+?380443[68]/), (/^\+?3804499/), (/^\+?3806199/), (/^\+?3806170/),
                (/^\+?38041434[7000-9999]/), (/^\+?38045633[2000-3999]/), (/^\+?38043257[2000-3999]/), (/^\+?38043250[2000-2999]/),
                (/^\+?38043257[5000-9999]/), (/^\+?3805678[40000-59999]/), (/^\+?38062345[8000-9999]/), (/^\+?380623480[000-999]/),
                (/^\+?38062349[0000-2999]/), (/^\+?38062205[0000-4999]/), (/^\+?38062205[0000-4999]/), (/^\+?38062207[3000-4999]/),
                (/^\+?38062208[1000-1999]/), (/^\+?38062348[2000-2999]/), (/^\+?38062349[5000-9999]/), (/^\+?38062208[3000-3999]/),
                (/^\+?38062949[9000-9999]/), (/^\+?38062208[9000-9999]/), (/^\+?38062348[5000-7999]/), (/^\+?38041244[5000-9999]/),
                (/^\+?38041255[0000-7999]/), (/^\+?38041259[3000-9999]/), (/^\+?38061701[0000-6999]/), (/^\+?38061220[1000-3999]/),
                (/^\+?38061270[0000-1999]/), (/^\+?38061220[7000-8999]/), (/^\+?38061270[4000-9999]/), (/^\+?38034274[0000-4999]/),
                (/^\+?38044222[5000-9999]/), (/^\+?38044221[0000-9999]/), (/^\+?3804433[10000-29999]/), (/^\+?38044353[0000-9999]/),
                (/^\+?38044451[5000-7999]/), (/^\+?38044587[5000-9999]/), (/^\+?38044592[0000-9999]/), (/^\+?38020[0000000-9999999]/),
                (/^\+?38020[0000000-9999999]/), (/^\+?38011[0000000-9999999]/), (/^\+?38044537[1000-1999]/),
                (/^\+?38044223[0000-9999]/), (/^\+?3804435[50000-89999]/), (/^\+?38044599[0000-9999]/), (/^\+?38052259[5000-9999]/),
                (/^\+?380536700[000-999]/), (/^\+?3805367608[00-99]/), (/^\+?3805367617[00-99]/), (/^\+?380536764[400-999]/),
                (/^\+?3805367655[00-99]/), (/^\+?38053678[2000-2999]/), (/^\+?38053679[4000-5999]/), (/^\+?380532614[000-999]/),
                (/^\+?38053267[0000-2999]/), (/^\+?38053269[0000-4999]/), (/^\+?38053269[0000-4999]/), (/^\+?380532617[000-999]/),
                (/^\+?380564430[000-999]/), (/^\+?38056443[5000-9999]/), (/^\+?38064271[0000-1999]/), (/^\+?38064274[2000-6999]/),
                (/^\+?38033228[5000-7999]/), (/^\+?38033220[0000-1999]/), (/^\+?380322201[000-999]/), (/^\+?38032243[0000-9999]/),
                (/^\+?38032243[0000-9999]/), (/^\+?38032246[5000-9999]/), (/^\+?38032298[0000-5999]/), (/^\+?38032299[0000-8999]/),
                (/^\+?38032247[0000-9999]/), (/^\+?38062948[2000-6999]/), (/^\+?38062949[1000-3999]/), (/^\+?38051259[0000-9999]/),
                (/^\+?38051272[0000-9999]/), (/^\+?38051275[0000-9999]/), (/^\+?38041413[0000-1999]/), (/^\+?380482390[500-699]/),
                (/^\+?380482399[000-999]/), (/^\+?38048788[0000-3999]/), (/^\+?38048793[0000-9999]/), (/^\+?38036245[0000-4999]/),
                (/^\+?38069293[0000-9999]/), (/^\+?38069297[0000-7999]/), (/^\+?380652751[000-999]/), (/^\+?38054270[5000-6999]/),
                (/^\+?38054270[5000-6999]/), (/^\+?38054278[3000-4999]/), (/^\+?38035240[0000-4999]/), (/^\+?38035240[0000-4999]/),
                (/^\+?38031245[0000-4999]/), (/^\+?38031245[0000-4999]/), (/^\+?38057750[6000-9999]/), (/^\+?38057751[0000-7999]/),
                (/^\+?38057752[6000-9999]/), (/^\+?38057754[7000-9999]/), (/^\+?38057755[0000-9999]/), (/^\+?38057756[0000-2999]/),
                (/^\+?38057757[2000-3999]/), (/^\+?38057758[2000-4999]/), (/^\+?38057759[4000-8999]/), (/^\+?38057762[3000-3999]/),
                (/^\+?38057764[0000-9999]/), (/^\+?38057768[2000-4999]/), (/^\+?38057756[4000-9999]/), (/^\+?38057756[4000-9999]/),
                (/^\+?38057757[6000-6999]/), (/^\+?38057757[6000-6999]/), (/^\+?38057758[9000-9999]/), (/^\+?38057762[6000-9999]/),
                (/^\+?38057768[9000-9999]/), (/^\+?38055244[0000-4999]/), (/^\+?38055279[7000-9999]/), (/^\+?38038273[3000-4999]/),
                (/^\+?38055244[9000-9999]/), (/^\+?38038273[0000-2999]/), (/^\+?38047238[2000-6999]/), (/^\+?38047251[0000-4999]/),
                (/^\+?38037294[0000-4999]/), (/^\+?38046261[0000-4999]/), (/^\+?38046297[0000-4999]/), (/^\+?38046291[5000-9999]/),
                (/^\+?38048499[8000-9999]/), (/^\+?38048499[8000-9999]/), (/^\+?380474447[000-999]/), (/^\+?38054270[7000-9999]/),
                (/^\+?3804422[70000-99999]/), (/^\+?380343370[000-999]/), (/^\+?380577579[000-999]/), (/^\+?380536702[000-999]/),
                (/^\+?38053670[12][000-999]/), (/^\+?38013[0000000-9999999]/)
            ],
            ukrTelecom:    [/^(\+38)?(044|061)\d{7}$/],
            vegaTelecom:   [/^(\+38)?(056371)\d{4}$/],
            veltonTelecom: [/^(\+38)?057/],
            goldenTelecom: [(/^\+380(39)\d{7}$/)],
            ukrainianTowns: [
                (/^(\+38)?06560/), (/^(\+38)?06442/), (/^(\+38)?06259/), (/^(\+38)?04863/), (/^(\+38)?04136/), (/^(\+38)?06431/),
                (/^(\+38)?05132/), (/^(\+38)?04845/), (/^(\+38)?04866/), (/^(\+38)?04341/), (/^(\+38)?04144/), (/^(\+38)?05757/),
                (/^(\+38)?04576/), (/^(\+38)?04635/), (/^(\+38)?06554/), (/^(\+38)?05158/), (/^(\+38)?04143/), (/^(\+38)?06153/),
                (/^(\+38)?03141/), (/^(\+38)?03548/), (/^(\+38)?05153/), (/^(\+38)?03653/), (/^(\+38)?05546/), (/^(\+38)?04352/),
                (/^(\+38)?04563/), (/^(\+38)?06466/), (/^(\+38)?06559/), (/^(\+38)?03841/), (/^(\+38)?05547/), (/^(\+38)?06462/),
                (/^(\+38)?05443/), (/^(\+38)?04852/), (/^(\+38)?05754/), (/^(\+38)?05257/), (/^(\+38)?04632/), (/^(\+38)?05758/),
                (/^(\+38)?03471/), (/^(\+38)?04561/), (/^(\+38)?04846/), (/^(\+38)?04653/), (/^(\+38)?03248/), (/^(\+38)?04595/),
                (/^(\+38)?04577/), (/^(\+38)?03541/), (/^(\+38)?04598/), (/^(\+38)?05131/), (/^(\+38)?04594/), (/^(\+38)?03266/),
                (/^(\+38)?04162/), (/^(\+38)?05345/), (/^(\+38)?05752/), (/^(\+38)?03342/), (/^(\+38)?05543/), (/^(\+38)?04859/),
                (/^(\+38)?05545/), (/^(\+38)?05753/), (/^(\+38)?04350/), (/^(\+38)?04636/), (/^(\+38)?04571/), (/^(\+38)?06136/),
                (/^(\+38)?05163/), (/^(\+38)?03730/), (/^(\+38)?03143/), (/^(\+38)?05535/), (/^(\+38)?04596/), (/^(\+38)?04598/),
                (/^(\+38)?06143/), (/^(\+38)?043/), (/^(\+38)?03846/), (/^(\+38)?05741/), (/^(\+38)?05134/), (/^(\+38)?06244/),
                (/^(\+38)?03136/), (/^(\+38)?04569/), (/^(\+38)?06246/), (/^(\+38)?03634/), (/^(\+38)?03845/), (/^(\+38)?04597/),
                (/^(\+38)?05135/), (/^(\+38)?04845/), (/^(\+38)?05254/), (/^(\+38)?04334/), (/^(\+38)?03431/), (/^(\+38)?05534/),
                (/^(\+38)?03734/), (/^(\+38)?04635/), (/^(\+38)?05252/), (/^(\+38)?05544/), (/^(\+38)?03430/), (/^(\+38)?04645/),
                (/^(\+38)?03231/), (/^(\+38)?03379/), (/^(\+38)?03557/), (/^(\+38)?05750/), (/^(\+38)?06249/), (/^(\+38)?05763/),
                (/^(\+38)?06564/), (/^(\+38)?06247/), (/^(\+38)?05351/), (/^(\+38)?05692/), (/^(\+38)?056/), (/^(\+38)?06277/),
                (/^(\+38)?03477/), (/^(\+38)?05152/), (/^(\+38)?062/), (/^(\+38)?04738/), (/^(\+38)?03244/), (/^(\+38)?06267/),
                (/^(\+38)?03656/), (/^(\+38)?03858/), (/^(\+38)?06569/), (/^(\+38)?04149/), (/^(\+38)?06252/), (/^(\+38)?04747/),
                (/^(\+38)?03239/), (/^(\+38)?041/), (/^(\+38)?04332/), (/^(\+38)?05652/), (/^(\+38)?03554/), (/^(\+38)?061/),
                (/^(\+38)?03632/), (/^(\+38)?03737/), (/^(\+38)?05761/), (/^(\+38)?03550/), (/^(\+38)?03540/), (/^(\+38)?04740/),
                (/^(\+38)?04570/), (/^(\+38)?05353/), (/^(\+38)?05233/), (/^(\+38)?04737/), (/^(\+38)?03265/), (/^(\+38)?04854/),
                (/^(\+38)?05531/), (/^(\+38)?04591/), (/^(\+38)?034/), (/^(\+38)?04841/), (/^(\+38)?05743/), (/^(\+38)?03852/),
                (/^(\+38)?04597/), (/^(\+38)?04633/), (/^(\+38)?045473/), (/^(\+38)?04333/), (/^(\+38)?03472/), (/^(\+38)?03849/),
                (/^(\+38)?04732/), (/^(\+38)?04736/), (/^(\+38)?04742/), (/^(\+38)?05536/), (/^(\+38)?044/), (/^(\+38)?04843/),
                (/^(\+38)?052/), (/^(\+38)?06446/), (/^(\+38)?06555/), (/^(\+38)?05343/), (/^(\+38)?03352/), (/^(\+38)?04646/),
                (/^(\+38)?04342/), (/^(\+38)?03433/), (/^(\+38)?04855/), (/^(\+38)?05348/), (/^(\+38)?05447/), (/^(\+38)?03651/),
                (/^(\+38)?04656/), (/^(\+38)?04142/), (/^(\+38)?04130/), (/^(\+38)?04735/), (/^(\+38)?04657/), (/^(\+38)?04862/),
                (/^(\+38)?062/), (/^(\+38)?03855/), (/^(\+38)?06239/), (/^(\+38)?06435/), (/^(\+38)?03546/), (/^(\+38)?053/),
                (/^(\+38)?05133/), (/^(\+38)?0564/), (/^(\+38)?04340/), (/^(\+38)?05453/), (/^(\+38)?04643/), (/^(\+38)?03549/),
                (/^(\+38)?05445/), (/^(\+38)?04358/), (/^(\+38)?06451/), (/^(\+38)?05361/), (/^(\+38)?064/), (/^(\+38)?06436/),
                (/^(\+38)?033/), (/^(\+38)?032/), (/^(\+38)?03377/), (/^(\+38)?06232/), (/^(\+38)?04578/), (/^(\+38)?04133/),
                (/^(\+38)?05665/), (/^(\+38)?0629/), (/^(\+38)?06192/), (/^(\+38)?04644/), (/^(\+38)?051/), (/^(\+38)?03241/),
                (/^(\+38)?04857/), (/^(\+38)?05355/), (/^(\+38)?04574/), (/^(\+38)?04337/), (/^(\+38)?03245/), (/^(\+38)?03131/),
                (/^(\+38)?04331/), (/^(\+38)?04631/), (/^(\+38)?05662/), (/^(\+38)?05549/), (/^(\+38)?04658/), (/^(\+38)?06296/),
                (/^(\+38)?04141/), (/^(\+38)?05693/), (/^(\+38)?03733/), (/^(\+38)?04642/), (/^(\+38)?04572/), (/^(\+38)?04851/),
                (/^(\+38)?04148/), (/^(\+38)?048/), (/^(\+38)?06269/), (/^(\+38)?05235/), (/^(\+38)?05667/), (/^(\+38)?05357/),
                (/^(\+38)?03654/), (/^(\+38)?05154/), (/^(\+38)?05632/), (/^(\+38)?05161/), (/^(\+38)?06441/), (/^(\+38)?03145/),
                (/^(\+38)?04567/), (/^(\+38)?05358/), (/^(\+38)?03542/), (/^(\+38)?04346/), (/^(\+38)?04492/), (/^(\+38)?053/),
                (/^(\+38)?04137/), (/^(\+38)?06133/), (/^(\+38)?04637/), (/^(\+38)?06137/), (/^(\+38)?05442/), (/^(\+38)?04132/),
                (/^(\+38)?03132/), (/^(\+38)?036/), (/^(\+38)?04641/), (/^(\+38)?03435/), (/^(\+38)?03635/), (/^(\+38)?04562/),
                (/^(\+38)?05448/), (/^(\+38)?04138/), (/^(\+38)?06563/), (/^(\+38)?04848/), (/^(\+38)?03133/), (/^(\+38)?06434/),
                (/^(\+38)?05236/), (/^(\+38)?069/), (/^(\+38)?04659/), (/^(\+38)?06452/), (/^(\+38)?065/), (/^(\+38)?05537/),
                (/^(\+38)?04568/), (/^(\+38)?03842/), (/^(\+38)?04579/), (/^(\+38)?05159/), (/^(\+38)?04733/), (/^(\+38)?04655/),
                (/^(\+38)?04639/), (/^(\+38)?04564/), (/^(\+38)?03238/), (/^(\+38)?06444/), (/^(\+38)?06566/), (/^(\+38)?054/),
                (/^(\+38)?04731/), (/^(\+38)?04566/), (/^(\+38)?04844/), (/^(\+38)?04353/), (/^(\+38)?03551/), (/^(\+38)?035/),
                (/^(\+38)?04560/), (/^(\+38)?04355/), (/^(\+38)?06178/), (/^(\+38)?04348/), (/^(\+38)?06254/), (/^(\+38)?04343/),
                (/^(\+38)?05458/), (/^(\+38)?03247/), (/^(\+38)?04335/), (/^(\+38)?03134/), (/^(\+38)?0З12/), (/^(\+38)?05259/),
                (/^(\+38)?04744/), (/^(\+38)?04565/), (/^(\+38)?06562/), (/^(\+38)?057/), (/^(\+38)?055/), (/^(\+38)?038/),
                (/^(\+38)?043388/), (/^(\+38)?037312/), (/^(\+38)?04745/), (/^(\+38)?03142/), (/^(\+38)?05542/), (/^(\+38)?05538/),
                (/^(\+38)?03859/), (/^(\+38)?04131/), (/^(\+38)?03249/), (/^(\+38)?047/), (/^(\+38)?037/), (/^(\+38)?046/),
                (/^(\+38)?06140/), (/^(\+38)?04134/), (/^(\+38)?04730/), (/^(\+38)?0312/), (/^(\+38)?04739/), (/^(\+38)?03552/),
                (/^(\+38)?057/), (/^(\+38)?05347/), (/^(\+38)?04344/), (/^(\+38)?06255/), (/^(\+38)?05751/), (/^(\+38)?03840/),
                (/^(\+38)?05657/), (/^(\+38)?05449/), (/^(\+38)?04741/), (/^(\+38)?03558/), (/^(\+38)?04654/), (/^(\+38)?03259/),
                (/^(\+38)?04575/), (/^(\+38)?06131/), (/^(\+38)?0654/), (/^(\+38)?04336/), (/^(\+38)?03434/), (/^(\+38)?06236/)
            ],
            test: [/^(\+38)?0001111111/]
        },

        /**
         *
         */
        _masks: {
            fullFormat:    (/^(\+[0-9]{12})$/), // +00 (000) 000 00 00 (только на Украину)
            shortFormat:   (/^[0-9]{10}$/), // (000) 000 00 00,

            fullAllFormat: (/^(\+[0-9]{7,13})$/)
        },

        /**
         *
         * @private
         */
        _toDefaults: function () {
            this._phone = "";
            this.value = "";
            this._isDefault = true;
        },

        /**
         * @description Formats of number: +380112223344
         * @param number
         * @return {*}
         */
        _parse: function (number, options) {
            this._phone = "";
            this._isDefault = !number;
            options = options || {};

            if (number instanceof IPhone) {
                this._phone = number._phone;
                this.value = number.value;
            } else {
                /**
                 * Для украинских телефонов
                 */
                if (number && number[0] == "0" && number.length == 10) {
                    number = "+38" + number;
                }

                number = this._normalizeNumber(number || '');

                if (this._masks.fullAllFormat.test(number)) {
                    this._phone = number;
                    this.value = number;

                    /**
                     * Если указан телефон +380..., но нет действующего оператора, то телефон невалидный
                     */
                    if (this.isUkrPhone() && !this.getUkrPhoneOperator()) {
                        this._toDefaults();
                    }
                }
            }

            return this;
        },

        /**
         * @description Если не хватает для международного формата +, то добавим его
         * @param number
         * @returns {string}
         * @private
         */
        _normalizeNumber: function (number) {
            if (!number) {
                return "";
            }

            return "+" + number.replace(/^\+/, '').replace(/[\s\-\(\)]+/g, '');
        },

        /**
         *
         * @param list
         * @returns {boolean}
         * @private
         */
        _isFoundInOperatorsList: function (list) {
            var result = false;
            if (this._phone && list) {
                var i;
                var len = list.length;
                var number = this.toFullFormat();

                for (i = len - 1; i >= 0; i--) {
                    if (
                        list[i].test(number) || list[i].test(number.replace(/\+/, '')) || list[i].test(number.substring(4))
                    ) {
                        result = true;
                        break;
                    }
                }
            }

            return result;
        },

        /**
         *
         * @return {Boolean}
         */
        isUkrTelecomPhone: function () {
            return this._isFoundInOperatorsList(this._operators.ukrTelecom) && !this.isInterTelecom();
        },

        /**
         *
         * @return {Boolean}
         */
        isUkrainianTownPhone: function () {
            return this._isFoundInOperatorsList(this._operators.ukrainianTowns) && !this.isInterTelecom();
        },

        /**
         *
         * @return {Boolean}
         */
        isMobile:   function () {
            return !this.isUkrTelecomPhone() && !this.isUkrainianTownPhone();
        },

        /**
         * Проверка формата телефона на соответствие +380******
         * @returns {boolean}
         */
        isUkrPhone: function () {

            var reg = /^\+380/;

            return reg.test(this._phone);
        },

        /**
         *
         * @returns {boolean}
         */
        isMtsPhone: function () {
            return this._isFoundInOperatorsList(this._operators.mts);
        },

        /**
         *
         * @returns {boolean|*}
         */
        isKyivStarPhone: function () {
            return this._isFoundInOperatorsList(this._operators.kyivstar) || this.isBeelinePhone() || this.isGoldenTelecom();
        },

        /**
         *
         * @returns {boolean}
         */
        isPeopleNetPhone: function () {
            return this._isFoundInOperatorsList(this._operators.peoplenet);
        },

        /**
         *
         * @returns {boolean}
         */
        isBeelinePhone: function () {
            return this._isFoundInOperatorsList(this._operators.beeline);
        },

        /**
         *
         * @returns {boolean}
         */
        isLifePhone: function () {
            return this._isFoundInOperatorsList(this._operators.life);
        },

        /**
         *
         * @returns {boolean}
         */
        isUtelPhone: function () {
            return this._isFoundInOperatorsList(this._operators.utel);
        },

        /**
         *
         * @returns {boolean}
         */
        isInterTelecom: function () {
            return this._isFoundInOperatorsList(this._operators.intertelecom);
        },

        /**
         *
         * @returns {boolean}
         */
        isVeltonTelecom: function () {
            return this._isFoundInOperatorsList(this._operators.veltonTelecom);
        },

        /**
         *
         * @returns {boolean}
         */
        isGoldenTelecom: function () {
            return this._isFoundInOperatorsList(this._operators.goldenTelecom);
        },

        /**
         * @description For ex. +38097
         * @returns {string}
         */
        getPhonePrefix: function () {
            return (this.isMobile()) ? this.toFullFormat().substring(0, 6) : '';
        },

        /**
         * Проверка формата телефона (Украина) на соответствие +*********
         */
        isFullFormat: function () {
            return this._phone && (this._masks.fullFormat.test(this._phone) || this.isUkrPhone());
        },

        /**
         * Проверка формата телефона (Украина, Россия, США) на соответствие +*********
         * @return {*}
         */
        isFullFormatAll: function () {
            return this._phone && this._masks.fullAllFormat.test(this._phone);
        },

        /**
         * Check this._phone (0931112233)
         */
        isShortFormat: function () {
            var reg = /^\d{10}$/;

            return reg.test(this._phone);
        },

        /**
         * Is default value
         */
        isDefault: function () {
            return !!this._isDefault;
        },

        /**
         * @format - full(+38 000 111 22 33)
         *         - short (+38 000 111 22 33)
         *         - full-all - полный формат, любые номера (Украина, Россия, Америка)
         */
        validate: function (format) {
            if (format === 'full') {
                return this.isFullFormat();
            }

            if (format === 'short') {
                return this.isShortFormat();
            }

            if (format === 'full-all') {
                return this._masks.fullAllFormat.test(this._phone);
            }

            return (this._phone != '');
        },

        /**
         * For example, +380931112233, this function return 1112233
         * @return {*}
         */
        getPhoneNumber:   function () {
            return (this.isMobile()) ? this.toFullFormat().substring(6) : this._phone;
        },

        /**
         * For example, +380931112233, this function return 0931112233
         * @returns {string}
         */
        toShortFormat:    function () {
            return this.toFullFormat().substring(3);
        },

        /**
         * For example, +380931112233, this function return 093
         * @returns {string}
         */
        getPhoneOperator: function () {
            return this.toFullFormat().substring(3, 6);
        },

        /**
         * Возвращает полный номер без знака +
         */
        getOnlyNumber: function () {
            return this.toFullFormat().replace(/^[^0-9]/, '');
        },

        /**
         * @description найдем заданное значение в веденном номере телефона
         * @param str
         * @returns {boolean}
         */
        find:          function (str) {
            if (str == null) {
                return false;
            }

            str += '';

            return (this._phone.indexOf(str) >= 0);
        },

        /**
         *
         * @returns {*}
         */
        getUkrPhoneOperator: function () {

            if (this._phone != '') {
                // проверка по кодам интертеллеком
                if (this.isInterTelecom()) {
                    return 'intertelecom';
                }

                var i;
                var j;
                var len;
                var number = this.toFullFormat();

                // переберем всех операторов
                for (i in this._operators) {
                    // вернем название оператора в случае совпадения кода
                    if (this._operators.hasOwnProperty(i)) {
                        len = this._operators[i].length;
                        for (j = len - 1; j >= 0; j--) {
                            if (this._operators[i][j].test(number)) {
                                return i;
                            }
                        }
                    }
                }
            }

            return '';
        },

        /**
         * return phone in format +380931112233, +79015010000
         * @returns {string}
         */
        toFullFormat:        function () {
            if (this._phone == '' || this.isFullFormat() || this.isFullFormatAll()) {
                return this._phone;
            }

            // извлечем часть номера без кода, например, (093) 111 22 33
            var number = /[0-9]{10}$/.exec(this._phone);
            if (number && number[0]) {
                return '+38' + number[0];
            }

            return this._phone;
        },

        /**
         *
         * @param format
         * @returns {string}
         */
        toString: function (format) {
            if (format === 'short') {
                return this.toShortFormat();
            }

            return this.toFullFormat();
        },

        /**
         *
         * @param format
         */
        toHtml: function (format) {
            var number = this.toString.apply(this, arguments),
                html,
                substr;

            if (!number) {
                html = "<span></span>";
            } else if (format === 'short') {
                html = "<span>" + number + "</span>";
            } else {
                html = "";
                substr = number.substr(1, 2);
                html += substr ? ("<span>+</span>" + substr) : "";
                substr = number.substr(3, 3);
                html += substr ? ("&nbsp;(" + substr + ")&nbsp;") : "";
                substr = number.substr(6, 3);
                html += substr ? ("<span>" + substr + "&nbsp;</span>") : "";
                substr = number.substr(9, 2);
                html += (substr ? ("<span>" + substr + "&nbsp;</span>") : "") +
                    "<span>" + number.substr(11, number.length) + "</span>";
            }

            return html;
        },

        /**
         *
         * @param value
         * @returns {boolean}
         */
        is: function (value) {
            var obj = new IPhone(value);

            return this.value === obj.value;
        }
    };

    if (typeof module !== "undefined" && module.exports) {
        module.exports = IPhone;
    } else {
        root.IPhone = IPhone;
    }
}(this));


//var IPhone =new IPhone("+ 63 60 456 78").validate();
//console.log(IPhone);

$( document ).ready(function() {


    // console.log(IPhone);

    // var el = 'input[name="phone"]';
    // console.log($(el).val());
    // dsPhoneFormatInput = new $.dsPhoneFormatInput(el);
    // dsPhoneFormatInput.init();

});
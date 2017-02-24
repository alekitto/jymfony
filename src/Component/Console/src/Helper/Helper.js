const HelperInterface = Jymfony.Component.Console.Helper.HelperInterface;

/**
 * @memberOf Jymfony.Component.Console.Helper
 * @type Helper
 */
module.exports = class Helper extends implementationOf(HelperInterface) {
    /**
     * @inheritDoc
     */
    set helperSet(helperSet) {
        this._helperSet = helperSet;
    }

    /**
     * @inheritDoc
     */
    get helperSet() {
        return this._helperSet;
    }

    static formatTime(secs) {
        const timeFormats = [
            [ 0, '< 1 sec' ],
            [ 1, '1 sec' ],
            [ 2, 'secs', 1 ],
            [ 60, '1 min' ],
            [ 120, 'mins', 60 ],
            [ 3600, '1 hr' ],
            [ 7200, 'hrs', 3600 ],
            [ 86400, '1 day' ],
            [ 172800, 'days', 86400 ],
        ];

        for (let [ index, format ] of __jymfony.getEntries(timeFormats)) {
            if (secs >= format[0]) {
                if (timeFormats[index + 1] && secs < timeFormats[index + 1][0]
                    || index == timeFormats.length - 1
                ) {
                    if (2 == format.length) {
                        return format[1];
                    }

                    return Math.floor(secs / format[2]) + ' ' + format[1];
                }
            }
        }
    }

    static formatMemory(memory) {
        if (memory >= 1024 * 1024 * 1024) {
            return `${(memory / 1024 / 1024 / 1024).toFixed(1)} GiB`;
        }

        if (memory >= 1024 * 1024) {
            return `${(memory / 1024 / 1024).toFixed(1)} MiB`;
        }

        if (1024 <= memory) {
            return `${Math.floor(memory / 1024)} KiB`;
        }

        return `${memory} B`;
    }

    static strlenWithoutDecoration(formatter, string) {
        let isDecorated = formatter.decorated;
        formatter.decorated = false;

        // Remove <...> formatting
        string = formatter.format(string);

        // Remove already formatted characters
        string = string.replace(/\x1B\[[^m]*m/g, '');
        formatter.decorated(isDecorated);
    
        return string.length;
    }
};

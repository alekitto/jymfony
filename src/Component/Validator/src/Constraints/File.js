const Constraint = Jymfony.Component.Validator.Constraint;
const ConstraintDefinitionException = Jymfony.Component.Validator.Exception.ConstraintDefinitionException;

/**
 * @memberOf Jymfony.Component.Validator.Constraints
 */
export default class File extends Constraint {
    /**
     * @inheritdoc
     */
    static getErrorName(errorCode) {
        switch (errorCode) {
            case __self.NOT_FOUND_ERROR: return 'NOT_FOUND_ERROR';
            case __self.NOT_READABLE_ERROR: return 'NOT_READABLE_ERROR';
            case __self.EMPTY_ERROR: return 'EMPTY_ERROR';
            case __self.TOO_LARGE_ERROR: return 'TOO_LARGE_ERROR';
            case __self.INVALID_MIME_TYPE_ERROR: return 'INVALID_MIME_TYPE_ERROR';
        }

        return Constraint.getErrorName(errorCode);
    }

    /**
     * @inheritdoc
     */
    __construct(options = null) {
        this.mimeTypes = [];
        this.notFoundMessage = 'The file could not be found.';
        this.notReadableMessage = 'The file is not readable.';
        this.maxSizeMessage = 'The file is too large ({{ size }} {{ suffix }}). Allowed maximum size is {{ limit }} {{ suffix }}.';
        this.mimeTypesMessage = 'The mime type of the file is invalid ({{ type }}). Allowed mime types are {{ types }}.';
        this.disallowEmptyMessage = 'An empty file is not allowed.';

        this.uploadIniSizeErrorMessage = 'The file is too large. Allowed maximum size is {{ limit }} {{ suffix }}.';
        this.uploadFormSizeErrorMessage = 'The file is too large.';
        this.uploadPartialErrorMessage = 'The file was only partially uploaded.';
        this.uploadNoFileErrorMessage = 'No file was uploaded.';
        this.uploadNoTmpDirErrorMessage = 'No temporary folder was configured in php.ini.';
        this.uploadCantWriteErrorMessage = 'Cannot write temporary file to disk.';
        this.uploadExtensionErrorMessage = 'A PHP extension caused the upload to fail.';
        this.uploadErrorMessage = 'The file could not be uploaded.';

        this._maxSize = undefined;
        this.binaryFormat = undefined;

        this._initialized = false;
        const ret = super.__construct(options);
        this._initialized = true;

        if (this._maxSize !== undefined) {
            this._normalizeBinaryFormat(this._maxSize);
        }

        return ret;
    }

    get maxSize() {
        return this._maxSize;
    }

    set maxSize(maxSize) {
        if (! this._initialized) {
            this._maxSize = maxSize;
            return;
        }

        if (null !== maxSize && undefined !== maxSize) {
            this._normalizeBinaryFormat(maxSize);
        }
    }

    _normalizeBinaryFormat(maxSize) {
        const factors = {
            'k': 1000,
            'ki': 1 << 10,
            'm': 1000 * 1000,
            'mi': 1 << 20,
            'g': 1000 * 1000 * 1000,
            'gi': 1 << 30,
        };

        if (String(maxSize).match(/^\d+$/)) {
            this._maxSize = ~~maxSize;
            this.binaryFormat = undefined === this.binaryFormat ? false : this.binaryFormat;
        } else {
            const matches = String(maxSize).match(new RegExp('^(\\d+)(' + Object.keys(factors).join('|') + ')$', 'i'));
            if (matches) {
                const unit = matches[2].toLowerCase();
                this._maxSize = matches[1] * factors[unit];
                this.binaryFormat = undefined === this.binaryFormat ? 2 === unit.length : this.binaryFormat;
            } else {
                throw new ConstraintDefinitionException(__jymfony.sprintf('"%s" is not a valid maximum size.', this._maxSize));
            }
        }
    }
}

Object.defineProperties(File, {
    NOT_FOUND_ERROR: { value: 'd2a3fb6e-7ddc-4210-8fbf-2ab345ce1998', writable: false },
    NOT_READABLE_ERROR: { value: 'c20c92a4-5bfa-4202-9477-28e800e0f6ff', writable: false },
    EMPTY_ERROR: { value: '5d743385-9775-4aa5-8ff5-495fb1e60137', writable: false },
    TOO_LARGE_ERROR: { value: 'df8637af-d466-48c6-a59d-e7126250a654', writable: false },
    INVALID_MIME_TYPE_ERROR: { value: '744f00bc-4389-4c74-92de-9a43cde55534', writable: false },
});

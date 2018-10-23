const AbstractToken = Jymfony.Component.Security.Authentication.Token.AbstractToken;

/**
 * Authentication Token for "Remember-Me".
 *
 * @memberOf Jymfony.Component.Security.Authentication.Token
 */
class RememberMeToken extends AbstractToken {
    /**
     * Constructor.
     *
     * @param {Jymfony.Component.Security.User.UserInterface} user
     * @param {string} providerKey
     * @param {string} secret
     */
    __construct(user, providerKey, secret) {
        super.__construct(user.roles);

        if (! secret) {
            throw new InvalidArgumentException('secret must not be empty.');
        }

        if (! providerKey) {
            throw new InvalidArgumentException('providerKey must not be empty.');
        }

        /**
         * The provider key used to authenticate the user.
         *
         * @type {string}
         *
         * @private
         */
        this._providerKey = providerKey;

        /**
         * The secret to make sure this token has been generated by this application.
         *
         * @type {string}
         *
         * @private
         */
        this._secret = secret;
        this.user = user;
        super.authenticated = true;
    }

    /**
     * @inheritdoc
     */
    get authenticated() {
        return super.authenticated;
    }

    /**
     * @inheritdoc
     */
    set authenticated(isAuthenticated) {
        if (isAuthenticated) {
            throw new LogicException('You cannot set this token to authenticated after creation.');
        }

        super.authenticated = false;
    }

    /**
     * @inheritdoc
     */
    get credentials() {
        return null;
    }

    /**
     * Gets the provider key.
     *
     * @returns {string}
     */
    get providerKey() {
        return this._providerKey;
    }

    /**
     * Gets the token' secret.
     *
     * @returns {string}
     */
    get secret() {
        return this._secret;
    }

    /**
     * @inheritdoc
     */
    __sleep() {
        const fields = super.__sleep();
        fields.push('_secret', '_providerKey');

        return fields;
    }
}

module.exports = RememberMeToken;
const AcceptHeader = Jymfony.Component.HttpFoundation.Negotiation.AcceptHeader;
const BaseAccept = Jymfony.Component.HttpFoundation.Negotiation.BaseAccept;

/**
 * AcceptCharset header
 *
 * @memberOf Jymfony.Component.HttpFoundation.Negotiation
 * @final
 */
class AcceptEncoding extends mix(BaseAccept, AcceptHeader) {
}

module.exports = AcceptEncoding;
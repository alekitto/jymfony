declare namespace Jymfony.Component.Metadata {
    import MetadataInterface = Jymfony.Contracts.Metadata.MetadataInterface;

    /**
     * Represents metadata for getter/setter.
     */
    export class PropertyMetadata extends implementationOf(MetadataInterface, MetadataPropertiesTrait) {
        public className: string;

        private _name: string;
        private _reflection: ReflectionProperty;
        private kind: 'get' | 'set';

        /**
         * Constructor.
         */
        __construct(className: string, name: string, kind: 'get' | 'set'): void;
        constructor(className: string, name: string, kind: 'get' | 'set');

        __sleep(): string[];

        public readonly reflection: ReflectionProperty;

        /**
         * @inheritdoc
         */
        merge(): void;

        /**
         * @inheritdoc
         */
        public readonly name: string;
    }
}

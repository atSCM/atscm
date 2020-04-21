declare namespace NodeStream {
    type BrowseResult = {
        /**
         * The discovered node's id.
         */
        nodeId: any;
        /**
         * -opcua~NodeClass} nodeClass The discovered node's class.
         */
        (Missing): any;
        /**
         * An object holding arrays of references from the
         * discovered node to others, mapped by {@link node-opcua~ReferenceTypeId} keys.
         */
        references: Map<string, any[]>;
    };
}
declare namespace ReadStream {
    type ReadResult = {
        /**
         * The discovered node's id.
         */
        nodeId: any;
        /**
         * -opcua~NodeClass} nodeClass The discovered node's class.
         */
        (Missing): any;
        /**
         * An object holding arrays of references from the
         * discovered node to others, mapped by {@link node-opcua~ReferenceTypeId} keys.
         */
        references: Map<string, any[]>;
    };
}

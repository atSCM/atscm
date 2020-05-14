import PartialTransformer from '../lib/transform/PartialTransformer';
import Node from '../lib/model/Node';
/**
 * A transformer ensuring no invalid alarm condition filter nodes are pulled.
 */
export default class LintTransformer extends PartialTransformer {
    /**
     * Returns `true` for all alarm condition filter nodes.
     * @param node The node to check.
     */
    shouldBeTransformed(node: Node): boolean;
    /**
     * Removes filter alarm condition filter nodes that have an invalid dataType.
     * @param node The node to transform.
     * @param context The transform context.
     */
    transformFromDB(node: Node, { remove }: {
        remove: () => void;
    }): Promise<void>;
    /** Does nothing. */
    transformFromFilesystem(): Promise<void>;
}

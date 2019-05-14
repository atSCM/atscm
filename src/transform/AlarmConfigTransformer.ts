import { DataType } from 'node-opcua/lib/datamodel/variant';
import { ItemOf } from 'node-opcua/lib/misc/enum.js';
import PartialTransformer from '../lib/transform/PartialTransformer';
import Node from '../lib/model/Node';

const limitNodeNameRegExp = /\.(upper|lower)_limit(_deadband)?$/;

/**
 * Returns an alarm limit's trigger / source node's data type.
 * Assuming a regular project structure this is the third parent node:
 * **Source** > AlarmConfiguration > AlarmCondition > FilterNode.
 * @param node The limit node to check.
 */
function getLimitTriggerType(node: Node): (ItemOf<typeof DataType> | undefined) {
  return node && node.parent && node.parent.parent &&
    node.parent.parent.parent && node.parent.parent.parent.dataType;
}

/**
 * A transformer ensuring no invalid alarm condition filter nodes are pulled.
 */
export default class LintTransformer extends PartialTransformer {

  /**
   * Returns `true` for all alarm condition filter nodes.
   * @param node The node to check.
   */
  public shouldBeTransformed(node: Node): boolean {
    return Boolean(
      node.parent &&
      node.parent.hasTypeDefinition('ObjectTypes.ATVISE.AlarmConditionControl.Limit') &&
      node.nodeId.match(limitNodeNameRegExp)
    );
  }

  /**
   * Removes filter alarm condition filter nodes that have an invalid dataType.
   * @param node The node to transform.
   * @param context The transform context.
   */
  public async transformFromDB(node: Node, { remove }: { remove: () => void }): Promise<void> {
    if (!this.shouldBeTransformed(node)) return;

    const triggerDataType = getLimitTriggerType(node);

    // NOTE: When no trigger node was found, the node is ignored as well
    // This means that during incomplete pulls (e.g. in response to a watch event) these nodes are
    // not updated.
    if (node.dataType !== triggerDataType) {
      remove();
    }
  }

  /** Does nothing. */
  public async transformFromFilesystem(): Promise<void> { return; }

}

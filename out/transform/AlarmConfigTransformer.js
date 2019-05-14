"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _PartialTransformer = _interopRequireDefault(require("../lib/transform/PartialTransformer"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const limitNodeNameRegExp = /\.(upper|lower)_limit(_deadband)?$/;
/**
 * Returns an alarm limit's trigger / source node's data type.
 * Assuming a regular project structure this is the third parent node:
 * **Source** > AlarmConfiguration > AlarmCondition > FilterNode.
 * @param node The limit node to check.
 */

function getLimitTriggerType(node) {
  return node && node.parent && node.parent.parent && node.parent.parent.parent && node.parent.parent.parent.dataType;
}
/**
 * A transformer ensuring no invalid alarm condition filter nodes are pulled.
 */


class LintTransformer extends _PartialTransformer.default {
  /**
   * Returns `true` for all alarm condition filter nodes.
   * @param node The node to check.
   */
  shouldBeTransformed(node) {
    return Boolean(node.parent && node.parent.hasTypeDefinition('ObjectTypes.ATVISE.AlarmConditionControl.Limit') && node.nodeId.match(limitNodeNameRegExp));
  }
  /**
   * Removes filter alarm condition filter nodes that have an invalid dataType.
   * @param node The node to transform.
   * @param context The transform context.
   */


  async transformFromDB(node, {
    remove
  }) {
    if (!this.shouldBeTransformed(node)) return;
    const triggerDataType = getLimitTriggerType(node); // NOTE: When no trigger node was found, the node is ignored as well
    // This means that during incomplete pulls (e.g. in response to a watch event) these nodes are
    // not updated.

    if (node.dataType !== triggerDataType) {
      remove();
    }
  }
  /** Does nothing. */


  async transformFromFilesystem() {
    return;
  }

}

exports.default = LintTransformer;
//# sourceMappingURL=AlarmConfigTransformer.js.map
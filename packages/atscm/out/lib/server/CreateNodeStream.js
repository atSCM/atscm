"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _opcua_status_code = require("node-opcua/lib/datamodel/opcua_status_code");

var _variant = require("node-opcua/lib/datamodel/variant");

var _nodeclass = require("node-opcua/lib/datamodel/nodeclass");

var _gulplog = _interopRequireDefault(require("gulplog"));

var _NodeId = _interopRequireDefault(require("../model/opcua/NodeId"));

var _Node = require("../model/Node");

var _CallScriptStream = _interopRequireDefault(require("./scripts/CallScriptStream"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A stream that creates OPC-UA nodes for the passed {@link AtviseFiles}s.
 */
class CreateNodeStream extends _CallScriptStream.default {
  /**
   * Id of the *CreateNode* script added with `atscm import`.
   * @type {NodeId}
   */
  get scriptId() {
    return new _NodeId.default(_NodeId.default.NodeIdType.STRING, 'SYSTEM.LIBRARY.ATVISE.SERVERSCRIPTS.atscm.CreateNode', 1);
  }
  /**
   * The options required to create a node for the given file.
   * @param {AtviseFile} file The processed file.
   * @return {Object} The options passed to the *CreateNode* script.
   */


  scriptParameters(file) {
    const options = {
      nodeId: file.nodeId,
      parentNodeId: file.parent ? file.parent.nodeId : 85,
      nodeClass: file.nodeClass.value,
      typeDefinition: file.typeDefinition,
      browseName: file.idName
    };
    const toParentRefs = file.references.get(_Node.ReferenceTypeIds.toParent);

    if (toParentRefs) {
      options.reference = _Node.ReferenceTypeNames[[...toParentRefs][0]];
    }

    const rules = file.references.get(_Node.ReferenceTypeIds.HasModellingRule);

    if (rules) {
      options.modellingRule = [...rules][0];
    }

    if (file.nodeClass.value === _nodeclass.NodeClass.Variable.value) {
      options.dataType = file.variantValue.dataType.value;
      options.valueRank = file.variantValue.arrayType.value;
      options.value = file.variantValue.value;
    }

    return {
      paramObjString: {
        dataType: _variant.DataType.String,
        value: JSON.stringify(options)
      }
    };
  }
  /**
   * Prints an error message telling that creating a node failed.
   * @param {AtviseFile} file The file who's node could not be created.
   * @return {string} The resulting error message.
   */


  processErrorMessage(file) {
    return `Error creating node ${file.nodeId}`;
  }
  /**
   * Handles the results of a script call.
   * @param {AtviseFile} file The file the script was called with.
   * @param {node-opcua~Variant[]} outArgs The raw method results.
   * @param {function(err: Error)} callback Called once finished.
   */


  handleOutputArguments(file, outArgs, callback) {
    if (outArgs[0].value !== _opcua_status_code.StatusCodes.Good) {
      callback(new Error(outArgs[1].value));
    } else {
      const [{
        value: createdNode
      }, {
        value: createFailed
      }] = outArgs[3].value;

      if (createFailed) {
        _gulplog.default.warn('Failed to create node', file.nodeId.toString());
      } else if (createdNode) {
        _gulplog.default.debug('Created node', file.nodeId.toString());

        this.push(file);
      } else {
        _gulplog.default.debug('Node', file.nodeId.toString(), 'already exists');

        this.push(file);
      }

      callback(null);
    }
  }

}

exports.default = CreateNodeStream;
//# sourceMappingURL=CreateNodeStream.js.map
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _gulplog = require('gulplog');

var _gulplog2 = _interopRequireDefault(_gulplog);

var _nodeOpcua = require('node-opcua');

var _CallScriptStream = require('../script/CallScriptStream');

var _CallScriptStream2 = _interopRequireDefault(_CallScriptStream);

var _NodeId = require('../ua/NodeId');

var _NodeId2 = _interopRequireDefault(_NodeId);

var _ReverseReferenceTypeIds = require('../ua/ReverseReferenceTypeIds');

var _ReverseReferenceTypeIds2 = _interopRequireDefault(_ReverseReferenceTypeIds);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Type definition key for type definition files
 * @type {String}
 */
const TypeDefinitionKey = _ReverseReferenceTypeIds2.default[_nodeOpcua.ReferenceTypeIds.HasTypeDefinition];

/**
 * Modelling rule key for type definition files
 * @type {String}
 */
const ModellingRuleKey = _ReverseReferenceTypeIds2.default[_nodeOpcua.ReferenceTypeIds.HasModellingRule];

/**
 * Definition for the parameter name of the CreateNode script
 * @type {Array}
 */
const CreateNodeScriptParameterName = 'paramObjString';

/**
 * A stream that creates atvise server nodes for the given{@link CombinedNodeFiles}s
 */
class CreateNodeStream extends _CallScriptStream2.default {

  /**
   * Creates a new CreateNodeStream
   */
  constructor() {
    super(new _NodeId2.default('ns=1;s=SYSTEM.LIBRARY.ATVISE.SERVERSCRIPTS.atscm.CreateNode'));
  }

  /**
   * Returns an error message specifically for the given combined file.
   * @param {CombinedNodeFile} combinedNodeFile The combined file to process
   * the error message for.
   * @return {String} The specific error message.
   */
  processErrorMessage(combinedNodeFile) {
    return `Error creating node:  ${combinedNodeFile.typeDefinitionFile.nodeId.toString()}`;
  }

  /**
   * Creates the parameter object for creating nodes
   * @param {CombinedNodeFile} combinedNodeFile The combined node file to process
   * the error message for.
   * @return {Object} The resulting parameter object.
   */
  createParameters(combinedNodeFile) {
    const typeDefinitionFile = combinedNodeFile.typeDefinitionFile;
    const nodeId = typeDefinitionFile.nodeId;
    const typeDefinitionConfig = JSON.parse(typeDefinitionFile.value);
    const paramObjString = new _nodeOpcua.Variant({ dataType: _nodeOpcua.DataType.String, value: '' });
    let typeDefinition = {};
    let modellingRuleRefs;

    if (typeDefinitionFile.isBaseTypeDefinition) {
      typeDefinition = typeDefinitionConfig;
    } else {
      typeDefinition = typeDefinitionConfig[TypeDefinitionKey].items[0];
      modellingRuleRefs = typeDefinitionConfig[ModellingRuleKey];
    }

    const configObj = {
      nodeId: nodeId.value,
      parentNodeId: nodeId.parentNodeId.value,
      browseName: nodeId.browseName,
      nodeClass: _nodeOpcua.NodeClass[typeDefinition.nodeClass].value,
      typeDefinition: new _NodeId2.default(typeDefinition.refNodeId).value,
      modellingRule: modellingRuleRefs ? new _NodeId2.default(modellingRuleRefs.items[0].refNodeId).value : null
    };

    if (!combinedNodeFile.isTypeDefOnlyFile) {
      const contentFile = combinedNodeFile.contentFile;
      const dataType = contentFile.dataType.value;

      configObj.dataType = dataType;
      configObj.valueRank = contentFile.arrayType.value;
      configObj.value = contentFile.createNodeValue;
    }

    paramObjString.value = JSON.stringify(configObj);

    return { paramNames: [CreateNodeScriptParameterName], paramValues: [paramObjString] };
  }

  /**
   * Handles the call script methods callback
   * @param {Array} results The result of the call
   * @param {CombinedNodeFile} combinedNodeFile The combined file to process
   * @param {function(err: Error, statusCode: node-opcua~StatusCodes, onSuccess: function)}
   * handleErrors The error handler to call. See {@link QueueStream#processChunk} for details.
   */
  handleCallback(results, combinedNodeFile, handleErrors) {
    const outputArguments = results[0].outputArguments;

    if (outputArguments[0].value.value !== _nodeOpcua.StatusCodes.Good.value) {
      handleErrors(new Error(outputArguments[1].value));
    } else {
      const createdNode = outputArguments[3].value[0].value;
      const creatingNodeFailed = outputArguments[3].value[1].value;

      if (creatingNodeFailed) {
        _gulplog2.default.error(`Node ${combinedNodeFile.typeDefinitionFile.nodeId.toString()}: Creating node failed`);
      } else if (createdNode) {
        _gulplog2.default.info(`Created node:  ${combinedNodeFile.typeDefinitionFile.nodeId.toString()}`);
      }
      handleErrors(null, _nodeOpcua.StatusCodes.Good, done => done());
    }
  }
}
exports.default = CreateNodeStream;
//# sourceMappingURL=CreateNodeStream.js.map
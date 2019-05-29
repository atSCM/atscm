"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.readNode = readNode;
exports.writeNode = writeNode;
exports.callMethod = callMethod;
exports.callScript = callScript;
exports.createNode = createNode;
exports.addReferences = addReferences;

var _nodeclass = require("node-opcua/lib/datamodel/nodeclass");

var _variant = require("node-opcua/lib/datamodel/variant");

var _opcua_status_code = require("node-opcua/lib/datamodel/opcua_status_code");

var _Session = _interopRequireDefault(require("./lib/server/Session"));

var _NodeId = _interopRequireDefault(require("./lib/model/opcua/NodeId"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Helpers

/**
 * Creates a callback that calls `resolve` on success and `reject` on error.
 * @param {function(result: any): void} resolve The resolve callback.
 * @param {function(error: Error): void} reject The reject callback.
 * @example
 * // `aCallbackFn` is a function that accepts a node-style callback as the last argument
 * const promise = new Promise(
 *   (resolve, reject) => aCallbackFn('other', 'args', promisifiedCallback(resolve, reject)
 * );
 */
function promisifiedCallback(resolve, reject) {
  return (err, result) => {
    if (err) {
      return reject(err);
    }

    return resolve(result);
  };
}
/**
 * Promisifies a async function that would otherwise require a callback.
 * @param {function(cb: function(error: Error, result: any)):Promise<any>} call A function that
 * accepts a callback and performs the async action to wrap.
 */


function promisified(call) {
  return new Promise((resolve, reject) => call(promisifiedCallback(resolve, reject)));
}
/**
 * Creates a session, runs `action` and closes the session.
 * @param {function(session: Session): Promise<any>} action The action to run a session.
 */


async function withSession(action) {
  const session = await _Session.default.create();
  let result = null;
  let error = null;

  try {
    result = await action(session);
  } catch (e) {
    error = e;
  }

  await _Session.default.close(session);

  if (error) {
    throw error;
  }

  return result;
} // Reading/Writing

/**
 * Reads a single node's value.
 * @param {NodeId} nodeId The node to read.
 * @return {Promise<any>} The read value.
 */


async function readNode(nodeId) {
  return withSession(session => promisified(cb => session.readVariableValue(nodeId, cb))).then(({
    value,
    statusCode
  }) => {
    if (statusCode !== _opcua_status_code.StatusCodes.Good) {
      throw Object.assign(new Error(statusCode.description), {
        nodeId,
        statusCode
      });
    }

    return value;
  });
}
/**
 * Writes a single node's value.
 * @param {NodeId} nodeId The node to write.
 * @param {Variant} value The value to write.
 * @return {Promise<node-opcua~StatusCodes} The operation status result.
 */


function writeNode(nodeId, value) {
  return withSession(session => promisified(cb => session.writeSingleNode(nodeId, value, cb))).then(statusCode => {
    if (statusCode !== _opcua_status_code.StatusCodes.Good) {
      throw Object.assign(new Error(statusCode.description), {
        nodeId,
        statusCode
      });
    }

    return statusCode;
  });
} // Methods / Scripts

/**
 * Calls an OPC-UA method on the server.
 * @param {NodeId} methodId The method's id.
 * @param {Array<Variant>} args The arguments to pass.
 */


function callMethod(methodId, args = []) {
  return withSession(session => promisified(cb => session.call([{
    objectId: methodId.parent,
    methodId,
    inputArguments: args
  }], cb))).then(([result] = []) => {
    if (result.statusCode.value) {
      throw Object.assign(new Error(result.statusCode.description), {
        methodId,
        inputArguments: args
      });
    }

    return result;
  });
}
/**
 * Calls a server script on the server.
 * @param {NodeId} scriptId The script's id.
 * @param {Object} parameters The parameters to pass, given as a map of Variants, like
 * `{ name: { ... } }`.
 */


function callScript(scriptId, parameters = {}) {
  return callMethod(new _NodeId.default('AGENT.SCRIPT.METHODS.callScript'), [{
    dataType: _variant.DataType.NodeId,
    value: scriptId
  }, {
    dataType: _variant.DataType.NodeId,
    value: scriptId.parent
  }, {
    dataType: _variant.DataType.String,
    arrayType: _variant.VariantArrayType.Array,
    value: Object.keys(parameters)
  }, {
    dataType: _variant.DataType.Variant,
    arrayType: _variant.VariantArrayType.Array,
    value: Object.values(parameters)
  }]).then(result => {
    const statusCode = result.outputArguments[0].value;

    if (statusCode.value) {
      throw Object.assign(new Error(`Script failed: ${statusCode.description}
${result.outputArguments[1].value}`), {
        scriptId,
        parameters
      });
    }

    return result;
  });
}
/**
 * Creates a new Node on the server.
 * @param {NodeId} nodeId The new node's id.
 * @param {Object} options The options to use.
 * @param {string} options.name The node's name.
 * @param {NodeId} [options.parentNodeId] The node's parent, defaults to the calculated parent
 * (`Test` for `Test.Child`).
 * @param {node-opcua~NodeClass} [options.nodeClass] The node's class, defaults so
 * `node-opcua~NodeClass.Variable`.
 * @param {NodeId} [options.typeDefinition] The node's type definition, must be provided for
 * non-variable nodes.
 * @param {NodeId} [options.modellingRule] The node's modelling rule.
 * @param {string} [options.reference] Name of the type of the node's reference to it's parent.
 * @param {node-opcua~Variant} [options.value] The node's value, required for all variable nodes.
 */


function createNode(nodeId, {
  name,
  parentNodeId = nodeId.parent,
  nodeClass = _nodeclass.NodeClass.Variable,
  typeDefinition = new _NodeId.default('ns=0;i=62'),
  modellingRule,
  reference,
  value
}) {
  const variableOptions = nodeClass === _nodeclass.NodeClass.Variable ? {
    dataType: value.dataType.value,
    valueRank: value.arrayType ? value.arrayType.value : _variant.VariantArrayType.Scalar.value,
    value: value.arrayType && value.arrayType !== _variant.VariantArrayType.Scalar ? Array.from(value.value) : value.value
  } : {};
  const is64Bit = value.dataType === _variant.DataType.Int64 || value.dataType === _variant.DataType.UInt64;

  if (is64Bit) {
    variableOptions.value = 0;
  }

  return callScript(new _NodeId.default('SYSTEM.LIBRARY.ATVISE.SERVERSCRIPTS.atscm.CreateNode'), {
    paramObjString: {
      dataType: _variant.DataType.String,
      value: JSON.stringify(Object.assign({
        nodeId,
        browseName: name,
        parentNodeId: parentNodeId || nodeId.parent,
        nodeClass: nodeClass.value,
        typeDefinition,
        modellingRule,
        reference
      }, variableOptions))
    }
  }).then(async result => {
    const [{
      value: createdNode
    }] = result.outputArguments[3].value;

    if (createdNode && is64Bit) {
      await writeNode(nodeId, value);
    }

    return result;
  });
}
/**
 * Adds references to a node.
 * @param {NodeId} nodeId The node to add the references to.
 * @param {Object} references The references to add.
 * @return {Promise} Resolved once the references were added.
 * @example <caption>Add a simple reference</caption>
 * import { ReferenceTypeIds } from 'node-opcua/lib/opcua_node_ids';
 *
 * addReferences('AGENT.DISPLAYS.Main', {
 *   [47]: ['VariableTypes.ATVISE.Display'],
 *   // equals:
 *   [ReferenceTypeIds.HasTypeDefinition]: ['VariableTypes.ATVISE.Display'],
 * })
 *   .then(() => console.log('Done!'))
 *   .catch(console.error);
 */


function addReferences(nodeId, references) {
  return callScript(new _NodeId.default('SYSTEM.LIBRARY.ATVISE.SERVERSCRIPTS.atscm.AddReferences'), {
    paramObjString: {
      dataType: _variant.DataType.String,
      value: JSON.stringify({
        nodeId,
        references: Object.entries(references).map(([type, items]) => ({
          referenceIdValue: parseInt(type, 10),
          items
        }))
      })
    }
  });
}
//# sourceMappingURL=api.js.map
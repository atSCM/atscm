/**
 * Reads a single node's value.
 * @param {NodeId} nodeId The node to read.
 * @return {Promise<any>} The read value.
 */
export function readNode(nodeId: NodeId): Promise<any>;
/**
 * Writes a single node's value.
 * @param {NodeId} nodeId The node to write.
 * @param {Variant} value The value to write.
 * @return {Promise<node-opcua~StatusCodes} The operation status result.
 */
export function writeNode(nodeId: NodeId, value: any): Promise<any>;
/**
 * Calls an OPC-UA method on the server.
 * @param {NodeId} methodId The method's id.
 * @param {Array<Variant>} args The arguments to pass.
 */
export function callMethod(methodId: NodeId, args?: Array<any>): Promise<any>;
/**
 * Calls a server script on the server.
 * @param {NodeId} scriptId The script's id.
 * @param {Object} parameters The parameters to pass, given as a map of Variants, like
 * `{ name: { ... } }`.
 */
export function callScript(scriptId: NodeId, parameters?: any): Promise<any>;
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
export function createNode(nodeId: NodeId, { name, parentNodeId, nodeClass, typeDefinition, modellingRule, reference, value, }: {
    name: string;
    parentNodeId: NodeId;
}): Promise<any>;
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
export function addReferences(nodeId: NodeId, references: any): Promise<any>;
import NodeId from "./lib/model/opcua/NodeId";

import QueueStream from './QueueStream';
import {NodeClass, VariantArrayType} from 'node-opcua';
import AtviseFile from './AtviseFile'

const TypeDefResourceType = AtviseFile.getAtviseTypesByValue()["Custom.TypeDefinition"];

/**
 * A stream that adds a typedefinition item for the {@link node-opcua~ReferenceDescription}s passed.
 */
export default class TypeDefStream extends QueueStream {

  /**
   * Returns type info for the given {node-opcua~ReferenceDescription}.
   * @param {node-opcua~ReferenceDescription} referenceDescription The reference description to process
   * @return {String} The JSON string containing the type definition.
   */
  createTypeInfo(referenceDescription) {
    let nodeId = referenceDescription.nodeId,
        referenceType = referenceDescription.referenceTypeId,
        typeDefinition = referenceDescription.typeDefinition;

    return JSON.stringify({
      nodeClass: referenceDescription.nodeClass.key,
      nodeId: {
        identifierType: nodeId.identifierType.key,
        namespaceIndex: nodeId.namespace,
        value: nodeId.value
      },
      referenceType: {
        identifierType: referenceType.identifierType.key,
        value: referenceType.value
      },
      typeDefinition: {
        identifierType: typeDefinition.identifierType.key,
        value: typeDefinition.value
      }
    });
  }


  /**
   * Creates type definition object.
   * @param {node-opcua~ReferenceDescription} referenceDescription The reference description to process
   * @return {Object} Type definition object.
   */
  createTypeDef(referenceDescription) {
    return {
      isTypeDef: true,
      value: this.createTypeInfo(referenceDescription),
      nodeId: referenceDescription.nodeId,
      browseName: referenceDescription.browseName.name,
      arrayType: VariantArrayType.Scalar,
      typeDefinition: TypeDefResourceType.typeDefinition
    };
  }

  /**
   * Adds typedefinition for all readable nodes and object nodes
   * @param {node-opcua~ReferenceDescription} referenceDescription The reference description to read
   * the atvise server node for.
   * @param {function(err: Error, statusCode: node-opcua~StatusCodes, onSuccess: function)}
   * handleErrors The error handler to call. See {@link QueueStream#processChunk} for details.
   */
  _processChunk(referenceDescription) {
    this._processed++;

    if (!referenceDescription.isTypeDef) {
      this.push(referenceDescription);
    }

    this.push(this.createTypeDef(referenceDescription));
    this._processNextChunk(referenceDescription);
  }
}
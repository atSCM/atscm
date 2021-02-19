/**
 * Returns a buffer containing a {@link node-opcua~Variant}s encoded value.
 * @param {node-opcua~Variant} variant The variant to encode.
 * @return {Buffer} A buffer containing the encoded value.
 */
export function encodeVariant({ value, dataType, arrayType }: any): Buffer;
/**
 * Returns a {@link node-opcua~Variant} from a Buffer with the given *dataType* and *arrayType*.
 * @param {Buffer} buffer The buffer to decode from.
 * @param {Object} options The options to use.
 * @param {node-opcua~DataType} options.dataType The data type to decode to.
 * @param {node-opcua~VariantArrayType} options.arrayType The array type to decode to.
 */
export function decodeVariant(buffer: Buffer, { dataType, arrayType }: any): any;

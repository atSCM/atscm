import File from 'vinyl';

/**
 * An extension to {@link vinyl~File} providing some additional, atvise-related properties.
 * @property {NodeOpcua.DataType} AtviseFile#dataType The {@link NodeOpcua.DataType} the node is
 * stored against on atvise server.
 * @property {NodeId} typeDefinition The file's type definition on atvise server.
 * FIXME: Additional properties not showing in API docs.
 */
export default class AtviseFile extends File {

}

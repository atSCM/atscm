import checkType from '../../util/validation';
import AtviseFile from '../mapping/AtviseFile';
import {ReferenceTypeIds, NodeClass} from 'node-opcua';
import NodeId from '../ua/NodeId';
import ReverseReferenceTypeIds from '../ua/ReverseReferenceTypeIds';

/**
 * Type definition key for type definition files
 * @type {String}
 */
const TypeDefinitionKey = ReverseReferenceTypeIds[ReferenceTypeIds.HasTypeDefinition];


export default class CombinedNodeFile {

  /**
   * Creates a new CombinedNodeFile based on given atvise File.
   * @param {AtviseFile} file The file to add in first place
   */
  constructor(file, createNodes) {
    if (!checkType(file, AtviseFile) || !checkType(createNodes, Boolean)) {
      throw new Error("Class CombinedNodeFile: Can not parse given argument!");
    } else if (!CombinedNodeFile.hasValidType(file)) {
      throw new Error("Class CombinedNodeFile: File has wrong type!");
    }

    /**
     * The content atvise file
     * @type {AtviseFile}
     */
    this.contentFile = {};


    /**
     * Defines wether the stream works with {CombinedNodeFiles} or {AtviseFile}s.
     * @type {Boolean}
     */
    this.createNodes = createNodes;


    /**
     * The type definition atvise file
     * @type {AtviseFile}
     */
    this.typeDefinitionFile = {};

    if (file.isTypeDefinition) {
      this.typeDefinitionFile = file;
    } else {
      this.contentFile = file;
    }
  }

  /**
   * Checks if the given file has a valid type for combined files
   * @param {AtviseFile} file The file to check
   * @return {Boolean} file has valid type(=true) or not(=false)
   */
  static hasValidType(file) {
    return !file.isAtviseReferenceConfig && !file.isDirectory();
  }

  /**
   * `true` for files that already contain necessary information.
   * @type {Boolean}
   */
  get isComplete() {
    let typeDefFileComplete = checkType(this.typeDefinitionFile, AtviseFile);

    if (this.createNodes) {
      if (!typeDefFileComplete) {
        return false;
      }

      return this.isTypeDefOnlyFile ? typeDefFileComplete :
        checkType(this.contentFile, AtviseFile) && typeDefFileComplete;
    } else {
      return checkType(this.contentFile, AtviseFile);
    }
  }

  /**
   * `true` for files that contain type definitions.
   * @type {Boolean}
   */
  get isTypeDefOnlyFile() {
    let typeDefinitionContent = JSON.parse(this.typeDefinitionFile.value)
    let typeDefinition = {};

    if (this.typeDefinitionFile.isBaseTypeDefinition) {
      typeDefinition = typeDefinitionContent;
    } else {
      typeDefinition = typeDefinitionContent[TypeDefinitionKey].items[0];
    }

    return NodeClass[typeDefinition.nodeClass].value != NodeClass.Variable.value;
  }

  /**
   * Adds the given file to the combined file
   * @param{AtviseFile} file The file to add
   * @return {Bool} file type was already added(=true) or not(=false)
   */
  addFile(file) {
    if (this.fileTypeWasAlreadyAdded(file)) {
      return false;
    }

    file.isTypeDefinition ? this.typeDefinitionFile = file :
      this.contentFile = file;

    return true;
  }

  /**
   * checks if the given file type was already added
   * @param{AtviseFile} file The file to add
   * @return {Bool} file type was already added(=true) or not(=false)
   */
  fileTypeWasAlreadyAdded(file) {
    return file.isTypeDefinition ? checkType(this.typeDefinitionFile, AtviseFile) :
      checkType(this.contentFile, AtviseFile);
  }
}
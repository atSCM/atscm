import checkType from '../../util/validation';
import AtviseFile from './AtviseFile';

export default class CombinedNodeFile {

  /**
   * Creates a new CombinedNodeFile based on given atvise File.
   * @param {AtviseFile} file The file to add in first place
   */
  constructor(file) {
    if (!checkType(file, AtviseFile)) {
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
   * `true` for files that already contain a content file and a type definition file.
   * @type {Boolean}
   */
  get isComplete() {
    return checkType(this.contentFile, AtviseFile) &&
      checkType(this.typeDefinitionFile, AtviseFile);
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
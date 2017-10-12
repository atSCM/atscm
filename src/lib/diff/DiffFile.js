import checkType from '../../util/validation';
import AtviseFile from '../mapping/AtviseFile';
/**
 * An Object that creates diff items for the given {AtviseFiles}
 */
export default class DiffFile {

  /**
   * Creates a new DiffFile based on given {AtviseFile} and file type.
   * @param {AtviseFile} file The file to add in first place
   */
  constructor(file, fileType) {

    if (!checkType(file, AtviseFile) || !checkType(fileType, String)) {
      throw new Error("DiffFile#constructor: Can not parse given argument!");
    } else if (!DiffFile.isValidFileType(fileType)) {
      throw new Error("DiffFile#constructor: File has wrong item type!");
    }

    /**
     * Defines wether the given file is a fs resource or a atvise server resource.
     * @type {DiffFile.ItemType}
     */
    this.fileType = fileType;

    /**
     * The resource file
     * @type {AtviseFile}
     */
    this.value = file.value.toString();

    /**
     * The files's nodeId
     * @type {NodeId}
     */
    this.nodeId = file.nodeId;

    /**
     * The files relative path
     * @type {vinyl~path}
     */
    this.path = file.relativeFilePath;

  }

  /**
   * The directions a transformer can be run in.
   * @type {{DBToServer: String, ServerToDB: String}}
   */
  static get FileType () {
    return {
      ServerFile: 'ServerFile',
      FsFile: 'FsFile',
    }
  };


  /**
   * 'true' for {AtviseFiles}'s created from atvise server resources
   * @type {Bool}
   */
   get isServerFile () {
     return this.fileType == DiffFile.FileType.ServerFile;
   }

  /**
   * 'true' for {AtviseFiles}'s created from file system resources
   * @type {Bool}
   */
  get isFsFile () {
    return this.fileType == DiffFile.FileType.FsFile;
  }


  /**
   * Returns an error message specifically for the given mapping item.
   * @param {DiffFile.ItemType} fileType The fileType to check
   * @return {Bool} 'true' for valid item types.
   */
  static isValidFileType(fileType) {
    return [
      DiffFile.FileType.ServerFile,
      DiffFile.FileType.FsFile,
    ].includes(fileType);
  }
}
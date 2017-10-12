import checkType from '../../util/validation';
import DiffFile from '../diff/DiffFile';
import AtviseFile from '../mapping/AtviseFile';


export default class DiffItem {

  /**
   * Creates a new CombinedNodeFile based on given atvise File.
   * @param {DiffFile} file The file to add in first place
   */
  constructor(file) {
    if (!checkType(file, DiffFile)) {
      throw new Error("DiffItem#constructor: Can not parse given argument!");
    }

    /**
     * The server resource file
     * @type {DiffFile}
     */
    this.serverFile = {};

    /**
     * The file system resource file
     * @type {DiffFile}
     */
    this.fsFile = {};

    /**
     * The file's path
     * @type {vinyl~path}
     */
    this.path = file.path;

    if (file.isServerFile) {
      this.serverFile = file;
    } else {
      this.fsFile = file;
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
   * The possible diff states
   * @type {{Equal:Object, Added: Object, Modified: Object, Deleted: Object}}
   */
  static get DiffStates () {
    return {
      Equal: {text: 'Equ', value: 0},
      Added: {text: 'Add', value: 1},
      Modified: {text: 'Mod', value: 2},
      Deleted: {text: 'Del', value: 3}
    }
  };

  /**
   * `true` for diff items that already contain an file system and an server resource.
   * @type {Boolean}
   */
  get isComplete() {
    return checkType(this.fsFile, DiffFile) && checkType(this.serverFile, DiffFile);
  }

  /**
   * `true` if the server resource file and the mapped fs file are equal.
   * @type {Boolean}
   */
  get filesAreEqual() {
    if (!this.isComplete) {
      return false;
    }

    return this.fsFile.value == this.serverFile.value;
  }


  /**
   * The diff items state
   * @type {DiffItem.DiffStates}
   */
  get state() {
    const states = DiffItem.DiffStates;
    let state;

    if (this.filesAreEqual) {
      state = states.Equal;
    } else if (this.isComplete) {
      state = states.Modified;
    } else if (!checkType(this.serverFile, DiffFile)) {
      state = states.Deleted;
    } else if (!checkType(this.fsFile, DiffFile)) {
      state = states.Added;
    }

    return state;
  }

  /**
   * Adds the given file
   * @param{DiffFile} file The file to add
   * @return {Bool} file type was already added(=true) or not(=false)
   */
  addFile(file) {
    if (this.fileTypeWasAlreadyAdded(file)) {
      throw new Error(`DiffItem#addFile: File ${file.path} was already added`);
    }

    file.isServerFile ? this.serverFile = file : this.fsFile = file;
  }

  /**
   * checks if the given file type was already added
   * @param{DiffFile} file The file to add
   * @return {Bool} file type was already added(=true) or not(=false)
   */
  fileTypeWasAlreadyAdded(file) {
    return file.isServerFile ? checkType(this.serverFile, DiffFile) :
      checkType(this.fsFile, DiffFile);
  }
}
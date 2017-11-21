'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _nodeOpcua = require('node-opcua');

var _validation = require('../../util/validation');

var _validation2 = _interopRequireDefault(_validation);

var _AtviseFile = require('../mapping/AtviseFile');

var _AtviseFile2 = _interopRequireDefault(_AtviseFile);

var _ReverseReferenceTypeIds = require('../ua/ReverseReferenceTypeIds');

var _ReverseReferenceTypeIds2 = _interopRequireDefault(_ReverseReferenceTypeIds);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Type definition key for type definition files
 * @type {String}
 */
const TypeDefinitionKey = _ReverseReferenceTypeIds2.default[_nodeOpcua.ReferenceTypeIds.HasTypeDefinition];

class CombinedNodeFile {

  /**
   * Creates a new CombinedNodeFile based on given atvise File.
   * @param {AtviseFile} file The file to add in first place
   */
  constructor(file, createNodes) {
    if (!(0, _validation2.default)(file, _AtviseFile2.default) || !(0, _validation2.default)(createNodes, Boolean)) {
      throw new Error('Class CombinedNodeFile: Can not parse given argument!');
    } else if (!CombinedNodeFile.hasValidType(file)) {
      throw new Error('Class CombinedNodeFile: File has wrong type!');
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
    const typeDefFileComplete = (0, _validation2.default)(this.typeDefinitionFile, _AtviseFile2.default);

    if (this.createNodes) {
      if (!typeDefFileComplete) {
        return false;
      }

      return this.isTypeDefOnlyFile ? typeDefFileComplete : (0, _validation2.default)(this.contentFile, _AtviseFile2.default) && typeDefFileComplete;
    }

    return (0, _validation2.default)(this.contentFile, _AtviseFile2.default);
  }

  /**
   * `true` for files that contain type definitions.
   * @type {Boolean}
   */
  get isTypeDefOnlyFile() {
    const typeDefinitionContent = JSON.parse(this.typeDefinitionFile.value);
    let typeDefinition = {};

    if (this.typeDefinitionFile.isBaseTypeDefinition) {
      typeDefinition = typeDefinitionContent;
    } else {
      typeDefinition = typeDefinitionContent[TypeDefinitionKey].items[0];
    }

    return _nodeOpcua.NodeClass[typeDefinition.nodeClass].value !== _nodeOpcua.NodeClass.Variable.value;
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

    if (file.isTypeDefinition) {
      this.typeDefinitionFile = file;
    } else {
      this.contentFile = file;
    }

    return true;
  }

  /**
   * checks if the given file type was already added
   * @param{AtviseFile} file The file to add
   * @return {Bool} file type was already added(=true) or not(=false)
   */
  fileTypeWasAlreadyAdded(file) {
    return file.isTypeDefinition ? (0, _validation2.default)(this.typeDefinitionFile, _AtviseFile2.default) : (0, _validation2.default)(this.contentFile, _AtviseFile2.default);
  }
}
exports.default = CombinedNodeFile;
//# sourceMappingURL=CombinedNodeFile.js.map
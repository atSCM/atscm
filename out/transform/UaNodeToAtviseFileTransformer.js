'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _ProjectConfig = require('../config/ProjectConfig');

var _ProjectConfig2 = _interopRequireDefault(_ProjectConfig);

var _Transformer = require('../lib/transform/Transformer');

var _Transformer2 = _interopRequireDefault(_Transformer);

var _Mapping = require('./Mapping');

var _Mapping2 = _interopRequireDefault(_Mapping);

var _BrowseStream = require('../lib/pull/BrowseStream');

var _BrowseStream2 = _interopRequireDefault(_BrowseStream);

var _ReadStream = require('../lib/pull/ReadStream');

var _ReadStream2 = _interopRequireDefault(_ReadStream);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A transformer that transforms mapped file system files to {@link AtviseFiles}'s
 */
class UaNodeToAtviseFileTransformer {
  /**
   * Creates a new FileToAtviseFileTransformer
   * @param {Object} options The options to use. See
   * {@link FileToAtviseFileTransformer#constructor} for available options.
   * @param {NodeId[]} [options.nodesToTransform] The nodes to transform.
   * @param {Boolean} [options.useInputStream] Defines if the given input stream should be
   * used for mapping.
   * @param {Stream} [options.inputStream] The input stream to use.
   */
  constructor(options = {}) {
    /**
     * Stream containing all type definition files.
     * @type {NodeId[]}
     */
    const nodesToTransform = options.nodesToTransform || [];

    /**
     * Stream that creates atvise files.
     * @type {MappingTransformer}
     */
    const mappingStream = new _Mapping2.default({ direction: _Transformer.TransformDirection.FromDB });

    /**
     * Defines if the given input stream should be used for mapping
     * @type {MappingTransformer}
     */
    const useInputStream = options.useInputStream || false;

    /**
     * Stream to use as input for mapping stream.
     * @type {Stream}
     */
    let inputStream = null;

    /**
     * Stream that reads atvise server nodes.
     * @type {ReadStream}
     */
    this.readStream = new _ReadStream2.default();

    if (useInputStream) {
      if (!options.inputStream) {
        throw new Error('UaNodeToAtviseFileTransformer#constructor: Input stream is missing');
      } else {
        inputStream = options.inputStream;
      }
    } else {
      inputStream = new _BrowseStream2.default(nodesToTransform).pipe(this.readStream);
    }

    /**
     * Stream that creates {AtviseFiles} from browses {node-opcua~ReferenceDescriptions}.
     * @type {Stream}
     */
    this.stream = _Transformer2.default.applyTransformers(inputStream.pipe(mappingStream), _ProjectConfig2.default.useTransformers, _Transformer.TransformDirection.FromDB);
  }
}
exports.default = UaNodeToAtviseFileTransformer;
//# sourceMappingURL=UaNodeToAtviseFileTransformer.js.map
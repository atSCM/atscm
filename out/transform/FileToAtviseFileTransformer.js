'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _gulp = require('gulp');

var _combinedStream = require('combined-stream');

var _combinedStream2 = _interopRequireDefault(_combinedStream);

var _ProjectConfig = require('../config/ProjectConfig');

var _ProjectConfig2 = _interopRequireDefault(_ProjectConfig);

var _Transformer = require('../lib/transform/Transformer');

var _Transformer2 = _interopRequireDefault(_Transformer);

var _Mapping = require('./Mapping');

var _Mapping2 = _interopRequireDefault(_Mapping);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A transformer that transforms mapped file system files to {@link AtviseFiles}'s
 */
class FileToAtviseFileTransformer {

  /**
   * Creates a new FileToAtviseFileTransformer
   * @param {Object} options The options to use. See
   * {@link FileToAtviseFileTransformer#constructor} for available
   * options.
   * @param {Boolean} [options.applyTransformers] Defines whether transformer
   * should be applied or not
   * @param {NodeId[]} [options.nodesToTransform] The nodes to transform.
   */
  constructor(options = {}) {
    /**
     * Combined stream instance.
     * @type {CombinedStream}
     */
    const combinedSrcStream = _combinedStream2.default.create();

    /**
     * Stream that creates atvise files.
     * @type {MappingTransformer}
     */
    const mappingStream = new _Mapping2.default({ direction: _Transformer.TransformDirection.FromFilesystem });

    /**
     * Stream containing all type definition files.
     * @type {NodeId[]}
     */
    const nodesToTransform = options.nodesToTransform || [];

    nodesToTransform.map(nodeId => combinedSrcStream.append((0, _gulp.src)(`./src/${nodeId.filePath}/**/*.*`)));

    if (options.applyTransformers !== undefined && options.applyTransformers === false) {
      return combinedSrcStream.pipe(mappingStream);
    }

    return _Transformer2.default.applyTransformers(combinedSrcStream.pipe(mappingStream), _ProjectConfig2.default.useTransformers, _Transformer.TransformDirection.FromFilesystem);
  }
}
exports.default = FileToAtviseFileTransformer;
//# sourceMappingURL=FileToAtviseFileTransformer.js.map
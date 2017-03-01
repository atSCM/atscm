'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = pull;

var _gulp = require('gulp');

var _ProjectConfig = require('../config/ProjectConfig');

var _ProjectConfig2 = _interopRequireDefault(_ProjectConfig);

var _NodeStream = require('../lib/server/NodeStream');

var _NodeStream2 = _interopRequireDefault(_NodeStream);

var _ReadStream = require('../lib/server/ReadStream');

var _ReadStream2 = _interopRequireDefault(_ReadStream);

var _Transformer = require('../lib/transform/Transformer');

var _Transformer2 = _interopRequireDefault(_Transformer);

var _Mapping = require('../transform/Mapping');

var _Mapping2 = _interopRequireDefault(_Mapping);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Pulls all nodes from atvise server.
 */
function pull() {
  let found = 0;
  let pulled = 0;
  let stored = 0;
  const nodeStream = new _NodeStream2.default(_ProjectConfig2.default.nodes, { read: true }).on('data', () => found++);
  const readStream = new _ReadStream2.default().on('data', () => pulled++);
  const mappingStream = new _Mapping2.default({ direction: _Transformer.TransformDirection.FromDB });
  const storeStream = (0, _gulp.dest)('./src').on('data', () => stored++);

  const printProgress = setInterval(() => {
    process.stdout.write(`\rFound: ${found}, pulled: ${pulled}, stored: ${stored}`);
  }, 1000);

  return nodeStream.pipe(readStream).pipe(mappingStream).pipe(_Transformer2.default.applyTransformers(_ProjectConfig2.default.useTransformers, _Transformer.TransformDirection.FromDB)).pipe(storeStream).on('end', () => {
    process.stdout.clearLine();
    process.stdout.write('\r');
    clearInterval(printProgress);
  });
}

pull.description = 'Pull all nodes from atvise server';
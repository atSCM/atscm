'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = push;

var _gulp = require('gulp');

var _ProjectConfig = require('../config/ProjectConfig');

var _ProjectConfig2 = _interopRequireDefault(_ProjectConfig);

var _Transformer = require('../lib/transform/Transformer');

var _Transformer2 = _interopRequireDefault(_Transformer);

var _Mapping = require('../transform/Mapping');

var _Mapping2 = _interopRequireDefault(_Mapping);

var _WriteStream = require('../lib/server/WriteStream');

var _WriteStream2 = _interopRequireDefault(_WriteStream);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function push() {
  let uploaded = 0;

  const mappingStream = new _Mapping2.default({ direction: _Transformer.TransformDirection.FromFilesystem });
  const writeStream = new _WriteStream2.default().on('data', () => uploaded++);

  const printProgress = setInterval(() => {
    process.stdout.write(`\rUploaded: ${uploaded}`);
  }, 1000);

  return (0, _gulp.src)('./src/**/*.*').pipe(mappingStream).pipe(_Transformer2.default.applyTransformers(_ProjectConfig2.default.useTransformers, _Transformer.TransformDirection.FromFilesystem)).pipe(writeStream).on('end', () => {
    process.stdout.clearLine();
    process.stdout.write('\r');
    clearInterval(printProgress);
  });
}

push.description = 'Push all stored nodes to atvise server';
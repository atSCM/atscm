'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Transformer = require('./Transformer');

var _Transformer2 = _interopRequireDefault(_Transformer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class DisplayTransformer extends _Transformer2.default {

  transformFromDB(file, enc, callback) {
    console.log('Transform display', file.nodeId.toString());

    callback(null, file);
  }

  transformFromFilesystem(file, enc, callback) {
    console.log('Transform display', file.nodeId.toString());

    callback(null, file);
  }

}
exports.default = DisplayTransformer;
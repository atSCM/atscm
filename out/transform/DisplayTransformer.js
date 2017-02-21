'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _buffer = require('buffer');

var _XMLTransformer = require('../lib/transform/XMLTransformer');

var _XMLTransformer2 = _interopRequireDefault(_XMLTransformer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class DisplayTransformer extends _XMLTransformer2.default {

  transformFromDB(file, enc, callback) {
    if (file.isDisplay) {
      // console.log('Transform display', file.relative);

      this.decodeContents(file, (err, xml) => {
        if (err) {
          callback(err);
        } else {
          file.contents = _buffer.Buffer.from(JSON.stringify(xml));

          callback(null, file);
        }
      });
    } else {
      callback(null, file);
    }
  }

  transformFromFilesystem(file, enc, callback) {
    if (file.isDisplay) {
      console.log('Transform display', file.relative);
      callback(null, file);
    } else {
      callback(null, file);
    }
  }

}
exports.default = DisplayTransformer;
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _nodeOpcua = require('node-opcua');

var _Stream = require('./Stream');

var _Stream2 = _interopRequireDefault(_Stream);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const Encoder = {
  [_nodeOpcua.DataType.Boolean]: stringValue => stringValue === 'true',
  [_nodeOpcua.DataType.String]: stringValue => stringValue,
  [_nodeOpcua.DataType.NodeId]: stringValue => (0, _nodeOpcua.resolveNodeId)(stringValue),
  [_nodeOpcua.DataType.DateTime]: stringValue => new Date(stringValue)
};

class WriteStream extends _Stream2.default {

  /* static encoderFor(dataType) {
    if (Encoder[dataType]) {
      return Encoder[dataType];
    }
     if (dataType.match(/^u?int/i)) {
      return value => Number.parseInt(value, 10) || null;
    }
     return false;
  }
   static encodedValue(value, dataType) {
    const stringValue = value.toString().trim();
     const encoder = WriteStream.encoderFor(dataType);
     if (encoder) {
      return encoder(stringValue);
    }
     return value;
  }
   static encodedContents(file) {
    const contents = file.contents;
     // FIXME: Need special handling for arrays
    return WriteStream.encodedValue(contents, file.dataType);
  } */

  writeFile(file, callback) {
    this.session.writeSingleNode(file.nodeId.toString(), {
      dataType: file.dataType,
      value: file.value
    }, callback);
  }

  _transform(file, enc, callback) {
    if (this.session) {
      this.writeFile(file, callback);
    } else {
      this.once('session-open', () => this.writeFile(file, callback));
    }
  }

}
exports.default = WriteStream;
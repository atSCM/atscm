'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _nodeOpcua = require('node-opcua');

class DataType extends Number {

  constructor(name, value) {
    super(value);

    this.key = name;
    this.value = value;
  }

}

exports.default = Object.assign({
  Display: new DataType('')
}, DataType);
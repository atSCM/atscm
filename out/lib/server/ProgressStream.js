'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _through = require('through2');

class ProgressStream extends (0, _through.ctor)({ objectMode: true }) {

  constructor() {
    super();

    this.processed = 0;
  }

}
exports.default = ProgressStream;
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Session = require('./Session');

var _Session2 = _interopRequireDefault(_Session);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Queue {

  constructor(options) {
    this._processing = 0;
    this._queued = [];
    this._maxParallel = options.maxParallel || 150;
    this._maxRetries = options.maxRetries || 3;

    _Session2.default.create().then(session => this.session = session);
  }

  add(task, retry) {}

  static get shared() {
    return this._sharedInstance || (this._sharedInstance = new this());
  }

}
exports.default = Queue;
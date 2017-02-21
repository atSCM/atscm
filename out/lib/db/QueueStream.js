'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Stream = require('./Stream');

var _Stream2 = _interopRequireDefault(_Stream);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class QueueStream extends _Stream2.default {

  constructor(queueSize = 100) {
    super();

    this._queueSize = queueSize;

    this.queue = [];
    this.processing = 0;
    this.processed = 0;

    this.on('finished-chunk', () => {
      if (this.queue.length > 0) {
        this.processing++;
        this.transformChunk(this.queue.shift(), this._boundFinished);
      }
    });

    this._boundFinished = this._finished.bind(this);
  }

  transformChunk(chunk, callback) {
    callback(null);
  }

  _finished(err) {
    this.processing--;
    this.processed++;

    if (err) {
      this.emit('error', err);
    }

    this.emit('finished-chunk');
  }

  enqueue(chunk) {
    if (this.processing >= this._queueSize) {
      this.queue.push(chunk);
      return false;
    } else {
      this.processing++;
      this.transformChunk(chunk, this._boundFinished);
      return true;
    }
  }

  transformWithSession(chunk, enc, callback) {
    if (this.enqueue(chunk)) {
      callback();
    } else {
      this.once('finished-chunk', callback);
    }
  }

  _isFinished() {
    return this.processing <= 0 && this.queue.length <= 0;
  }

  _flush(callback) {
    if (this._isFinished()) {
      callback();
    } else {
      this.on('finished-chunk', () => {
        if (this._isFinished()) {
          callback();
        }
      });
    }
  }

}
exports.default = QueueStream;
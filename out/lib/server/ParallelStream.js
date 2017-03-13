'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Stream = require('./Stream');

var _Stream2 = _interopRequireDefault(_Stream);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class ParallelStream extends _Stream2.default {

  constructor(options) {
    super();

    this._processing = 0;
    this._queued = [];
    this._maxParallel = 150;
    this._maxRetries = 3;

    this.on('finished-file', () => {
      if (this._queued.length > 0) {
        this._processFile(this._queued.shift());
      }
    });
  }

  parallelTransform(chunk, callback) {
    throw new Error('ParallelStream#_parallelTransform must be implemented by all subclasses');
  }

  _processFile(chunk, retryNo = 0) {
    this.parallelTransform(chunk, (err, data) => {
      if (err) {
        console.log('GOT ERROR');
        if (err.message !== 'Transaction has timed out' || retryNo === this._maxRetries) {
          this.emit(err);
        } else {
          this._processFile(chunk, retryNo + 1);
        }
      } else {
        if (data) {
          this.push(data);
        }

        this.emit('finished-file');
      }
    });
  }

  get hasPending() {
    return this._processing > 0 || this._queued.length > 0;
  }

  queueChunk(chunk, callback) {
    if (this._processing < this._maxParallel) {
      this._processing++;
      this._processFile(chunk);
    } else {
      this._queued.push(chunk);
    }

    callback();
  }

  _transform(chunk, enc, callback) {
    if (this.session) {
      this.queueChunk(chunk, callback);
    } else {
      this.once('session-open', () => this.queueChunk(chunk, callback));
    }
  }

  _flush(callback) {
    console.log('FINISHING');
    if (!this.hasPending) {
      console.log('FINISHED');
      super._flush(callback);
    } else {
      this.on('finished-file', () => {
        if (!this.hasPending) {
          console.log('FINISHED');
          super._flush(callback);
        }
      });
    }
  }

}
exports.default = ParallelStream;
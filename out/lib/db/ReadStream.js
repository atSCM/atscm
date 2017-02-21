'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _QueueStream = require('./QueueStream');

var _QueueStream2 = _interopRequireDefault(_QueueStream);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class ReadStream extends _QueueStream2.default {

  /* constructor() {
    super(10);
     /* this.processing = 0;
    this.processed = 0;
    this.pending = [];
     this.on('finished-reading', () => {
      if (this.pending.length > 0) {
        this.processing++;
        this.readNode(this.pending.shift());
      }
    }); *
  } */

  /* runWithSession(session) {
    session.requestedMaxReferencesPerNode = 1000000;
  } */

  /* withOpenSession(run, ...args) {
    if (this.session) {
      run(...args);
    } else {
      this.once('session-open', () => {
        run(...args);
      });
    }
  } */

  transformChunk(nodeId, callback) {
    this.session.read([{
      nodeId
    }], (err, nodesToRead, results) => {
      if (err) {
        callback(err);
      } else if (!results || results.length === 0) {
        callback(new Error(`No results reading ${nodeId.toString()}`));
      } else {
        this.push({
          nodeId,
          value: results[0].value
        });
        callback();
      }
      /*
       this.processing--;
      this.processed++;
      this.emit('finished-reading'); */
    });
  }

  /* readNext(nodeId) {
    // Queue a maximum of 100 read operations
    if (this.processing > 100) {
      this.pending.push(nodeId);
    } else {
      this.processing++;
      this.readNode(nodeId);
    }
  } */

  /* transformWithSession(nodeId, enc, callback) {
    this.readNext(nodeId);
     callback();
  } */

  /* _transform(nodeId, enc, callback) {
     /* this.readNode(nodeId, callback); *
    // this.pending++;
    this.withOpenSession(id => this.readNext(id), nodeId);
     callback();
  } */

  /* _flush(callback) {
    // console.log('Pending:', this.pending.length, 'processing:', this.processing);
     if (this.processing <= 0 && this.pending.length <= 0) {
      callback();
    }
     this.on('finished-reading', () => {
      // process.stdout.write(`\rPending downloads: ${this.pending.length + this.processing}    `);
       if (this.processing <= 0 && this.pending.length <= 0) {
        callback();
      }
    });
  } */

}
exports.default = ReadStream;
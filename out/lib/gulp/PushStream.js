'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _readline = require('readline');

var _readline2 = _interopRequireDefault(_readline);

var _gulplog = require('gulplog');

var _gulplog2 = _interopRequireDefault(_gulplog);

var _gulpFilter = require('gulp-filter');

var _gulpFilter2 = _interopRequireDefault(_gulpFilter);

var _FileToAtviseFileTransformer = require('../../transform/FileToAtviseFileTransformer');

var _FileToAtviseFileTransformer2 = _interopRequireDefault(_FileToAtviseFileTransformer);

var _NodeFileStream = require('../push/NodeFileStream');

var _NodeFileStream2 = _interopRequireDefault(_NodeFileStream);

var _WriteStream = require('../push/WriteStream');

var _WriteStream2 = _interopRequireDefault(_WriteStream);

var _CreateNodeStream = require('../push/CreateNodeStream');

var _CreateNodeStream2 = _interopRequireDefault(_CreateNodeStream);

var _AddReferenceStream = require('../push/AddReferenceStream');

var _AddReferenceStream2 = _interopRequireDefault(_AddReferenceStream);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A stream that transforms read {@link vinyl~File}s and pushes them to atvise server.
 */
class PushStream {

  /**
   * Creates a new PushSteam based on the given options.
   * @param {Object} options The stream configuration options.
   * @param {NodeId[]} [options.nodesToPush] The nodes to push.
   * @param {Boolean} [options.createNodes] Defines if nodes shall be created or not.
   */
  constructor(options = {}) {
    /**
     * Defines shall be created or not.
     * @type {Boolean}
     */
    const createNodesOnPush = options.createNodes || false;

    /**
     * The nodes to push
     * @type {NodeId[]}
     */
    const nodesToPush = options.nodesToPush || [];

    const fileTransformer = new _FileToAtviseFileTransformer2.default({ nodesToTransform: nodesToPush });
    const atvReferenceFilter = (0, _gulpFilter2.default)(file => !file.isAtviseReferenceConfig, { restore: true });
    const nodeFileStream = new _NodeFileStream2.default({ createNodes: createNodesOnPush });
    const createNodeStream = new _CreateNodeStream2.default();
    const writeStream = new _WriteStream2.default({ createNodes: createNodesOnPush });

    this.printProgress = setInterval(() => {
      _gulplog2.default.info(`Pushed: ${writeStream._processed} (${writeStream.opsPerSecond.toFixed(1)} ops/s)`);

      if (_gulplog2.default.listenerCount('info') > 0) {
        _readline2.default.cursorTo(process.stdout, 0);
        _readline2.default.moveCursor(process.stdout, 0, -1);
      }
    }, 1000);

    this.pushStream = fileTransformer.pipe(atvReferenceFilter).pipe(nodeFileStream).pipe(writeStream);

    if (createNodesOnPush) {
      this.pushStream.pipe(createNodeStream);
    }

    this.pushStream.once('finish', () => {
      _gulplog2.default.debug('Writing and creating nodes finished. Adding references...');

      if (createNodesOnPush && atvReferenceFilter.restore._readableState.buffer.length > 0) {
        const addReferenceStream = new _AddReferenceStream2.default();

        this.pushStream.pipe(atvReferenceFilter.restore).pipe(addReferenceStream).on('finish', () => this.endStream());
      } else {
        this.endStream();
      }
    });

    return this.pushStream;
  }

  /**
   * Stops the print progress when push stream has finished and stops the push task process
   */
  endStream() {
    if (_gulplog2.default.listenerCount('info') > 0) {
      _readline2.default.cursorTo(process.stdout, 0);
      _readline2.default.clearLine(process.stdout);
    }

    clearInterval(this.printProgress);
  }
}
exports.default = PushStream;
//# sourceMappingURL=PushStream.js.map
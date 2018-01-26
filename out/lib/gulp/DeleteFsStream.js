'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _readline = require('readline');

var _readline2 = _interopRequireDefault(_readline);

var _gulplog = require('gulplog');

var _gulplog2 = _interopRequireDefault(_gulplog);

var _path = require('path');

var _fsExtra = require('fs-extra');

var _ProjectConfig = require('../../config/ProjectConfig');

var _ProjectConfig2 = _interopRequireDefault(_ProjectConfig);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A stream that deletes listed nodes on the filesystem
 */
class DeleteFsStream {

  /**
   * Creates a new DeleteFsStream based on the given options.
   * @param {Object} options The stream configuration options.
   * @param {String} [options.deleteFileName] The delete file name.
   */
  constructor(options = {}) {
    /**
     * The delete file name
     * @type {String}
     */
    const deleteFileName = options.deleteFileName || 'deleteFs.txt';

    let processed = 0;
    const base = (0, _path.join)(process.cwd(), _ProjectConfig2.default.RelativeSourceDirectoryPath);

    const lineReader = _readline2.default.createInterface({
      input: (0, _fsExtra.createReadStream)(deleteFileName)
    });

    const printProgress = setInterval(() => {
      _gulplog2.default.info(`Deleted: ${processed}`);

      if (_gulplog2.default.listenerCount('info') > 0) {
        _readline2.default.cursorTo(process.stdout, 0);
        _readline2.default.moveCursor(process.stdout, 0, -1);
      }
    }, 1000);

    lineReader.on('line', line => {
      const trimmedLine = line.trim();
      const lineArray = trimmedLine.split('nodeFilePath=');
      let filePath = '';

      if (lineArray.length > 1) {
        filePath = lineArray[1];

        if (filePath.indexOf(', nodeId=') > -1) {
          filePath = filePath.split(', nodeId=')[0];
        }
      } else {
        filePath = trimmedLine;
      }

      processed++;

      if (filePath) {
        const path = (0, _path.join)(base, filePath);

        if ((0, _fsExtra.existsSync)(path)) {
          (0, _fsExtra.remove)(path).catch(err => _gulplog2.default.error(`Error removing file: '${path}', message: ${err.message}`));
        }
      }
    });

    lineReader.on('close', () => {
      clearInterval(printProgress);
    });

    return lineReader;
  }
}
exports.default = DeleteFsStream;
//# sourceMappingURL=DeleteFsStream.js.map
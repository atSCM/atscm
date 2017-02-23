'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var cov_2dxwc6zt4h = function () {
  var path = '/home/ubuntu/atscm/src/transform/Mapping.js',
      hash = 'd36fa2ff0c3f6a745827f18d8fea31b11f874633',
      global = new Function('return this')(),
      gcv = '__coverage__',
      coverageData = {
    path: '/home/ubuntu/atscm/src/transform/Mapping.js',
    statementMap: {
      '0': {
        start: {
          line: 18,
          column: 4
        },
        end: {
          line: 23,
          column: 5
        }
      },
      '1': {
        start: {
          line: 19,
          column: 6
        },
        end: {
          line: 19,
          column: 60
        }
      },
      '2': {
        start: {
          line: 21,
          column: 6
        },
        end: {
          line: 21,
          column: 78
        }
      },
      '3': {
        start: {
          line: 22,
          column: 6
        },
        end: {
          line: 22,
          column: 21
        }
      },
      '4': {
        start: {
          line: 34,
          column: 4
        },
        end: {
          line: 39,
          column: 8
        }
      }
    },
    fnMap: {
      '0': {
        name: '(anonymous_0)',
        decl: {
          start: {
            line: 17,
            column: 2
          },
          end: {
            line: 17,
            column: 3
          }
        },
        loc: {
          start: {
            line: 17,
            column: 50
          },
          end: {
            line: 24,
            column: 3
          }
        }
      },
      '1': {
        name: '(anonymous_1)',
        decl: {
          start: {
            line: 33,
            column: 2
          },
          end: {
            line: 33,
            column: 3
          }
        },
        loc: {
          start: {
            line: 33,
            column: 52
          },
          end: {
            line: 40,
            column: 3
          }
        }
      }
    },
    branchMap: {},
    s: {
      '0': 0,
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0
    },
    f: {
      '0': 0,
      '1': 0
    },
    b: {},
    _coverageSchema: '332fd63041d2c1bcb487cc26dd0d5f7d97098a6c'
  },
      coverage = global[gcv] || (global[gcv] = {});

  if (coverage[path] && coverage[path].hash === hash) {
    return coverage[path];
  }

  coverageData.hash = hash;
  return coverage[path] = coverageData;
}();

var _gulplog = require('gulplog');

var _gulplog2 = _interopRequireDefault(_gulplog);

var _Transformer = require('../lib/transform/Transformer');

var _Transformer2 = _interopRequireDefault(_Transformer);

var _AtviseFile = require('../lib/server/AtviseFile');

var _AtviseFile2 = _interopRequireDefault(_AtviseFile);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A Transformer that maps {@link ReadStream.ReadResult}s to {@link AtviseFile}s.
 */
class MappingTransformer extends _Transformer2.default {

  /**
   * Writes an {@link AtviseFile} for each {@link ReadStream.ReadResult} read.
   * @param {ReadStream.ReadResult} readResult The read result to create the file for.
   * @param {String} encoding The encoding used.
   * @param {function(err: ?Error, data: ?AtviseFile)} callback Called with the error that occurred
   * while transforming the read result or the resulting file.
   */
  transformFromDB(readResult, encoding, callback) {
    ++cov_2dxwc6zt4h.f[0];
    ++cov_2dxwc6zt4h.s[0];

    try {
      ++cov_2dxwc6zt4h.s[1];

      callback(null, _AtviseFile2.default.fromReadResult(readResult));
    } catch (e) {
      ++cov_2dxwc6zt4h.s[2];

      _gulplog2.default.warn(`Unable to map ${readResult.nodeId.toString()}`, e.message);
      ++cov_2dxwc6zt4h.s[3];
      callback(null);
    }
  }

  /**
   * Writes an {@link AtviseFile} for each {@link vinyl~File} read.
   * @param {vinyl~File} file The raw file.
   * @param {String} encoding The encoding used.
   * @param {function(err: ?Error, data: ?AtviseFile)} callback Called with the error that occurred
   * while transforming the read result or the resulting file.
   */
  transformFromFilesystem(file, encoding, callback) {
    ++cov_2dxwc6zt4h.f[1];
    ++cov_2dxwc6zt4h.s[4];

    callback(null, new _AtviseFile2.default({
      cwd: file.cwd,
      base: file.base,
      path: file.path,
      contents: file.contents
    }));
  }

}
exports.default = MappingTransformer;
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var cov_awntw9xuk = function () {
  var path = '/home/ubuntu/atscm/src/lib/server/WriteStream.js',
      hash = 'd0cad8d740c708d570b7cc9d8aefce865374451b',
      global = new Function('return this')(),
      gcv = '__coverage__',
      coverageData = {
    path: '/home/ubuntu/atscm/src/lib/server/WriteStream.js',
    statementMap: {
      '0': {
        start: {
          line: 15,
          column: 4
        },
        end: {
          line: 21,
          column: 7
        }
      },
      '1': {
        start: {
          line: 20,
          column: 6
        },
        end: {
          line: 20,
          column: 26
        }
      },
      '2': {
        start: {
          line: 33,
          column: 4
        },
        end: {
          line: 37,
          column: 5
        }
      },
      '3': {
        start: {
          line: 34,
          column: 6
        },
        end: {
          line: 34,
          column: 37
        }
      },
      '4': {
        start: {
          line: 36,
          column: 6
        },
        end: {
          line: 36,
          column: 70
        }
      },
      '5': {
        start: {
          line: 36,
          column: 38
        },
        end: {
          line: 36,
          column: 68
        }
      }
    },
    fnMap: {
      '0': {
        name: '(anonymous_0)',
        decl: {
          start: {
            line: 14,
            column: 2
          },
          end: {
            line: 14,
            column: 3
          }
        },
        loc: {
          start: {
            line: 14,
            column: 28
          },
          end: {
            line: 22,
            column: 3
          }
        }
      },
      '1': {
        name: '(anonymous_1)',
        decl: {
          start: {
            line: 19,
            column: 7
          },
          end: {
            line: 19,
            column: 8
          }
        },
        loc: {
          start: {
            line: 19,
            column: 14
          },
          end: {
            line: 21,
            column: 5
          }
        }
      },
      '2': {
        name: '(anonymous_2)',
        decl: {
          start: {
            line: 32,
            column: 2
          },
          end: {
            line: 32,
            column: 3
          }
        },
        loc: {
          start: {
            line: 32,
            column: 34
          },
          end: {
            line: 38,
            column: 3
          }
        }
      },
      '3': {
        name: '(anonymous_3)',
        decl: {
          start: {
            line: 36,
            column: 32
          },
          end: {
            line: 36,
            column: 33
          }
        },
        loc: {
          start: {
            line: 36,
            column: 38
          },
          end: {
            line: 36,
            column: 68
          }
        }
      }
    },
    branchMap: {
      '0': {
        loc: {
          start: {
            line: 33,
            column: 4
          },
          end: {
            line: 37,
            column: 5
          }
        },
        type: 'if',
        locations: [{
          start: {
            line: 33,
            column: 4
          },
          end: {
            line: 37,
            column: 5
          }
        }, {
          start: {
            line: 33,
            column: 4
          },
          end: {
            line: 37,
            column: 5
          }
        }]
      }
    },
    s: {
      '0': 0,
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0
    },
    f: {
      '0': 0,
      '1': 0,
      '2': 0,
      '3': 0
    },
    b: {
      '0': [0, 0]
    },
    _coverageSchema: '332fd63041d2c1bcb487cc26dd0d5f7d97098a6c'
  },
      coverage = global[gcv] || (global[gcv] = {});

  if (coverage[path] && coverage[path].hash === hash) {
    return coverage[path];
  }

  coverageData.hash = hash;
  return coverage[path] = coverageData;
}();

var _Stream = require('./Stream');

var _Stream2 = _interopRequireDefault(_Stream);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A stream that writes all read {@link AtviseFile}s to atvise server.
 */
class WriteStream extends _Stream2.default {

  /**
   * Writes a file to atvise server.
   * @param {AtviseFile} file The file to write.
   * @param {function(err: ?Error, file: ?AtviseFile)} callback Called with the error that occurred
   * or the successfully written file.
   */
  writeFile(file, callback) {
    ++cov_awntw9xuk.f[0];
    ++cov_awntw9xuk.s[0];

    this.session.writeSingleNode(file.nodeId.toString(), {
      dataType: file.dataType,
      arrayType: file.arrayType,
      value: file.value
    }, err => {
      ++cov_awntw9xuk.f[1];
      ++cov_awntw9xuk.s[1];

      callback(err, file);
    });
  }

  /**
   * Calls {@link WriteStream#writeFile} once the session is open.
   * @param {AtviseFile} file The file to write.
   * @param {String} enc The encoding used.
   * @param {function(err: ?Error, file: ?AtviseFile)} callback Called with the error that occurred
   * or the successfully written file.
   * @listens {Session} Listens to the `session-open`-event if the session is not open yet.
   */
  _transform(file, enc, callback) {
    ++cov_awntw9xuk.f[2];
    ++cov_awntw9xuk.s[2];

    if (this.session) {
      ++cov_awntw9xuk.b[0][0];
      ++cov_awntw9xuk.s[3];

      this.writeFile(file, callback);
    } else {
      ++cov_awntw9xuk.b[0][1];
      ++cov_awntw9xuk.s[4];

      this.once('session-open', () => {
        ++cov_awntw9xuk.f[3];
        ++cov_awntw9xuk.s[5];
        return this.writeFile(file, callback);
      });
    }
  }

}
exports.default = WriteStream;
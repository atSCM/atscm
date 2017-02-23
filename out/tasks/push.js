'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var cov_1u1ru78iew = function () {
  var path = '/home/ubuntu/atscm/src/tasks/push.js',
      hash = 'be5ec499a1a9d1a975d5d303ce40347fed6d4955',
      global = new Function('return this')(),
      gcv = '__coverage__',
      coverageData = {
    path: '/home/ubuntu/atscm/src/tasks/push.js',
    statementMap: {
      '0': {
        start: {
          line: 10,
          column: 17
        },
        end: {
          line: 10,
          column: 18
        }
      },
      '1': {
        start: {
          line: 12,
          column: 24
        },
        end: {
          line: 12,
          column: 96
        }
      },
      '2': {
        start: {
          line: 13,
          column: 22
        },
        end: {
          line: 14,
          column: 33
        }
      },
      '3': {
        start: {
          line: 14,
          column: 22
        },
        end: {
          line: 14,
          column: 32
        }
      },
      '4': {
        start: {
          line: 16,
          column: 24
        },
        end: {
          line: 18,
          column: 10
        }
      },
      '5': {
        start: {
          line: 17,
          column: 4
        },
        end: {
          line: 17,
          column: 52
        }
      },
      '6': {
        start: {
          line: 20,
          column: 2
        },
        end: {
          line: 27,
          column: 7
        }
      },
      '7': {
        start: {
          line: 24,
          column: 6
        },
        end: {
          line: 24,
          column: 33
        }
      },
      '8': {
        start: {
          line: 25,
          column: 6
        },
        end: {
          line: 25,
          column: 33
        }
      },
      '9': {
        start: {
          line: 26,
          column: 6
        },
        end: {
          line: 26,
          column: 35
        }
      },
      '10': {
        start: {
          line: 30,
          column: 0
        },
        end: {
          line: 30,
          column: 60
        }
      }
    },
    fnMap: {
      '0': {
        name: 'push',
        decl: {
          start: {
            line: 9,
            column: 24
          },
          end: {
            line: 9,
            column: 28
          }
        },
        loc: {
          start: {
            line: 9,
            column: 31
          },
          end: {
            line: 28,
            column: 1
          }
        }
      },
      '1': {
        name: '(anonymous_1)',
        decl: {
          start: {
            line: 14,
            column: 16
          },
          end: {
            line: 14,
            column: 17
          }
        },
        loc: {
          start: {
            line: 14,
            column: 22
          },
          end: {
            line: 14,
            column: 32
          }
        }
      },
      '2': {
        name: '(anonymous_2)',
        decl: {
          start: {
            line: 16,
            column: 36
          },
          end: {
            line: 16,
            column: 37
          }
        },
        loc: {
          start: {
            line: 16,
            column: 42
          },
          end: {
            line: 18,
            column: 3
          }
        }
      },
      '3': {
        name: '(anonymous_3)',
        decl: {
          start: {
            line: 23,
            column: 15
          },
          end: {
            line: 23,
            column: 16
          }
        },
        loc: {
          start: {
            line: 23,
            column: 21
          },
          end: {
            line: 27,
            column: 5
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
      '4': 0,
      '5': 0,
      '6': 0,
      '7': 0,
      '8': 0,
      '9': 0,
      '10': 0
    },
    f: {
      '0': 0,
      '1': 0,
      '2': 0,
      '3': 0
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

exports.default = push;

var _gulp = require('gulp');

var _Transformer = require('../lib/transform/Transformer');

var _Mapping = require('../transform/Mapping');

var _Mapping2 = _interopRequireDefault(_Mapping);

var _WriteStream = require('../lib/server/WriteStream');

var _WriteStream2 = _interopRequireDefault(_WriteStream);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Pushes {@link AtviseFile}s to atvise server.
 */
function push() {
  ++cov_1u1ru78iew.f[0];

  let uploaded = (++cov_1u1ru78iew.s[0], 0);

  const mappingStream = (++cov_1u1ru78iew.s[1], new _Mapping2.default({ direction: _Transformer.TransformDirection.FromFilesystem }));
  const writeStream = (++cov_1u1ru78iew.s[2], new _WriteStream2.default().on('data', () => {
    ++cov_1u1ru78iew.f[1];
    ++cov_1u1ru78iew.s[3];
    return uploaded++;
  }));

  const printProgress = (++cov_1u1ru78iew.s[4], setInterval(() => {
    ++cov_1u1ru78iew.f[2];
    ++cov_1u1ru78iew.s[5];

    process.stdout.write(`\rUploaded: ${uploaded}`);
  }, 1000));

  ++cov_1u1ru78iew.s[6];
  return (0, _gulp.src)('./src/**/*.*').pipe(mappingStream).pipe(writeStream).on('end', () => {
    ++cov_1u1ru78iew.f[3];
    ++cov_1u1ru78iew.s[7];

    process.stdout.clearLine();
    ++cov_1u1ru78iew.s[8];
    process.stdout.write('\r');
    ++cov_1u1ru78iew.s[9];
    clearInterval(printProgress);
  });
}

++cov_1u1ru78iew.s[10];
push.description = 'Push all stored nodes to atvise server';
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var cov_1e3p3si87i = function () {
  var path = '/home/ubuntu/atscm/src/lib/server/Stream.js',
      hash = '805ec7eb871338962875a800de7bfd622c537474',
      global = new Function('return this')(),
      gcv = '__coverage__',
      coverageData = {
    path: '/home/ubuntu/atscm/src/lib/server/Stream.js',
    statementMap: {
      '0': {
        start: {
          line: 15,
          column: 4
        },
        end: {
          line: 15,
          column: 12
        }
      },
      '1': {
        start: {
          line: 17,
          column: 4
        },
        end: {
          line: 20,
          column: 45
        }
      },
      '2': {
        start: {
          line: 18,
          column: 24
        },
        end: {
          line: 18,
          column: 46
        }
      },
      '3': {
        start: {
          line: 19,
          column: 23
        },
        end: {
          line: 19,
          column: 57
        }
      },
      '4': {
        start: {
          line: 20,
          column: 20
        },
        end: {
          line: 20,
          column: 43
        }
      },
      '5': {
        start: {
          line: 28,
          column: 4
        },
        end: {
          line: 34,
          column: 5
        }
      },
      '6': {
        start: {
          line: 29,
          column: 6
        },
        end: {
          line: 31,
          column: 37
        }
      },
      '7': {
        start: {
          line: 30,
          column: 20
        },
        end: {
          line: 30,
          column: 30
        }
      },
      '8': {
        start: {
          line: 31,
          column: 22
        },
        end: {
          line: 31,
          column: 35
        }
      },
      '9': {
        start: {
          line: 33,
          column: 6
        },
        end: {
          line: 33,
          column: 17
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
            column: 16
          },
          end: {
            line: 21,
            column: 3
          }
        }
      },
      '1': {
        name: '(anonymous_1)',
        decl: {
          start: {
            line: 18,
            column: 12
          },
          end: {
            line: 18,
            column: 13
          }
        },
        loc: {
          start: {
            line: 18,
            column: 24
          },
          end: {
            line: 18,
            column: 46
          }
        }
      },
      '2': {
        name: '(anonymous_2)',
        decl: {
          start: {
            line: 19,
            column: 12
          },
          end: {
            line: 19,
            column: 13
          }
        },
        loc: {
          start: {
            line: 19,
            column: 23
          },
          end: {
            line: 19,
            column: 57
          }
        }
      },
      '3': {
        name: '(anonymous_3)',
        decl: {
          start: {
            line: 20,
            column: 13
          },
          end: {
            line: 20,
            column: 14
          }
        },
        loc: {
          start: {
            line: 20,
            column: 20
          },
          end: {
            line: 20,
            column: 43
          }
        }
      },
      '4': {
        name: '(anonymous_4)',
        decl: {
          start: {
            line: 27,
            column: 2
          },
          end: {
            line: 27,
            column: 3
          }
        },
        loc: {
          start: {
            line: 27,
            column: 19
          },
          end: {
            line: 35,
            column: 3
          }
        }
      },
      '5': {
        name: '(anonymous_5)',
        decl: {
          start: {
            line: 30,
            column: 14
          },
          end: {
            line: 30,
            column: 15
          }
        },
        loc: {
          start: {
            line: 30,
            column: 20
          },
          end: {
            line: 30,
            column: 30
          }
        }
      },
      '6': {
        name: '(anonymous_6)',
        decl: {
          start: {
            line: 31,
            column: 15
          },
          end: {
            line: 31,
            column: 16
          }
        },
        loc: {
          start: {
            line: 31,
            column: 22
          },
          end: {
            line: 31,
            column: 35
          }
        }
      }
    },
    branchMap: {
      '0': {
        loc: {
          start: {
            line: 28,
            column: 4
          },
          end: {
            line: 34,
            column: 5
          }
        },
        type: 'if',
        locations: [{
          start: {
            line: 28,
            column: 4
          },
          end: {
            line: 34,
            column: 5
          }
        }, {
          start: {
            line: 28,
            column: 4
          },
          end: {
            line: 34,
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
      '5': 0,
      '6': 0,
      '7': 0,
      '8': 0,
      '9': 0
    },
    f: {
      '0': 0,
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0,
      '6': 0
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

var _through = require('through2');

var _Session = require('./Session');

var _Session2 = _interopRequireDefault(_Session);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * An object transform stream connected to atvise server.
 */
class Stream extends (0, _through.ctor)({ objectMode: true }) {

  /**
   * Creates a new Stream and starts opening a new session to atvise server.
   * @emits {Session} Emits an `session-open` event once the session is open, passing the Session
   * instance.
   */
  constructor() {
    ++cov_1e3p3si87i.f[0];
    ++cov_1e3p3si87i.s[0];

    super();

    ++cov_1e3p3si87i.s[1];
    _Session2.default.create().then(session => {
      ++cov_1e3p3si87i.f[1];
      ++cov_1e3p3si87i.s[2];
      return this.session = session;
    }).then(session => {
      ++cov_1e3p3si87i.f[2];
      ++cov_1e3p3si87i.s[3];
      return this.emit('session-open', session);
    }).catch(err => {
      ++cov_1e3p3si87i.f[3];
      ++cov_1e3p3si87i.s[4];
      return this.emit('error', err);
    });
  }

  /**
   * Called just before the stream is closed: Closes the open session.
   * @param {function(err: ?Error, data: Object)} callback Called once the session is closed.
   */
  _flush(callback) {
    ++cov_1e3p3si87i.f[4];
    ++cov_1e3p3si87i.s[5];

    if (this.session) {
      ++cov_1e3p3si87i.b[0][0];
      ++cov_1e3p3si87i.s[6];

      _Session2.default.close(this.session).then(() => {
        ++cov_1e3p3si87i.f[5];
        ++cov_1e3p3si87i.s[7];
        return callback();
      }).catch(err => {
        ++cov_1e3p3si87i.f[6];
        ++cov_1e3p3si87i.s[8];
        return callback(err);
      });
    } else {
      ++cov_1e3p3si87i.b[0][1];
      ++cov_1e3p3si87i.s[9];

      callback();
    }
  }

}
exports.default = Stream;
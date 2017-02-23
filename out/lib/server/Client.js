'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var cov_28kd9sq43w = function () {
  var path = '/home/ubuntu/atscm/src/lib/server/Client.js',
      hash = '04aff437798c2328482efb0d81edaff135b126b7',
      global = new Function('return this')(),
      gcv = '__coverage__',
      coverageData = {
    path: '/home/ubuntu/atscm/src/lib/server/Client.js',
    statementMap: {
      '0': {
        start: {
          line: 15,
          column: 19
        },
        end: {
          line: 18,
          column: 6
        }
      },
      '1': {
        start: {
          line: 20,
          column: 4
        },
        end: {
          line: 34,
          column: 7
        }
      },
      '2': {
        start: {
          line: 21,
          column: 23
        },
        end: {
          line: 21,
          column: 82
        }
      },
      '3': {
        start: {
          line: 23,
          column: 6
        },
        end: {
          line: 25,
          column: 15
        }
      },
      '4': {
        start: {
          line: 23,
          column: 23
        },
        end: {
          line: 25,
          column: 7
        }
      },
      '5': {
        start: {
          line: 27,
          column: 6
        },
        end: {
          line: 33,
          column: 9
        }
      },
      '6': {
        start: {
          line: 28,
          column: 8
        },
        end: {
          line: 32,
          column: 9
        }
      },
      '7': {
        start: {
          line: 29,
          column: 10
        },
        end: {
          line: 29,
          column: 69
        }
      },
      '8': {
        start: {
          line: 31,
          column: 10
        },
        end: {
          line: 31,
          column: 26
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
            column: 18
          },
          end: {
            line: 35,
            column: 3
          }
        }
      },
      '1': {
        name: '(anonymous_1)',
        decl: {
          start: {
            line: 20,
            column: 23
          },
          end: {
            line: 20,
            column: 24
          }
        },
        loc: {
          start: {
            line: 20,
            column: 44
          },
          end: {
            line: 34,
            column: 5
          }
        }
      },
      '2': {
        name: '(anonymous_2)',
        decl: {
          start: {
            line: 23,
            column: 17
          },
          end: {
            line: 23,
            column: 18
          }
        },
        loc: {
          start: {
            line: 23,
            column: 23
          },
          end: {
            line: 25,
            column: 7
          }
        }
      },
      '3': {
        name: '(anonymous_3)',
        decl: {
          start: {
            line: 27,
            column: 31
          },
          end: {
            line: 27,
            column: 32
          }
        },
        loc: {
          start: {
            line: 27,
            column: 38
          },
          end: {
            line: 33,
            column: 7
          }
        }
      }
    },
    branchMap: {
      '0': {
        loc: {
          start: {
            line: 28,
            column: 8
          },
          end: {
            line: 32,
            column: 9
          }
        },
        type: 'if',
        locations: [{
          start: {
            line: 28,
            column: 8
          },
          end: {
            line: 32,
            column: 9
          }
        }, {
          start: {
            line: 28,
            column: 8
          },
          end: {
            line: 32,
            column: 9
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
      '8': 0
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

var _nodeOpcua = require('node-opcua');

var _ProjectConfig = require('../../config/ProjectConfig');

var _ProjectConfig2 = _interopRequireDefault(_ProjectConfig);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A wrapper around {@link node-opcua~OPCUAClient} used to connect to atvise server.
 */
class Client {

  /**
   * Creates and connects a new instance of {@link node-opcua~OPCUAClient}.
   * @return {Promise<node-opcua~OPCUAClient, Error>} Fulfilled with an already connected
   * {@link node-opcua~OPCUAClient} instance, rejected if an error occured.
   */
  static create() {
    ++cov_28kd9sq43w.f[0];

    const client = (++cov_28kd9sq43w.s[0], new _nodeOpcua.OPCUAClient({
      requestedSessionTimeout: 600000,
      keepSessionAlive: true
    }));

    ++cov_28kd9sq43w.s[1];
    return new Promise((resolve, reject) => {
      ++cov_28kd9sq43w.f[1];

      const endpoint = (++cov_28kd9sq43w.s[2], `opc.tcp://${_ProjectConfig2.default.host}:${_ProjectConfig2.default.port.opc}`);

      ++cov_28kd9sq43w.s[3];
      setTimeout(() => {
        ++cov_28kd9sq43w.f[2];
        ++cov_28kd9sq43w.s[4];
        return reject(new Error(`Unable to connect to ${endpoint}: Connection timed out`));
      }, 3000);

      ++cov_28kd9sq43w.s[5];
      client.connect(endpoint, err => {
        ++cov_28kd9sq43w.f[3];
        ++cov_28kd9sq43w.s[6];

        if (err) {
          ++cov_28kd9sq43w.b[0][0];
          ++cov_28kd9sq43w.s[7];

          reject(`Unable to connect to ${endpoint}: ${err.message}`);
        } else {
          ++cov_28kd9sq43w.b[0][1];
          ++cov_28kd9sq43w.s[8];

          resolve(client);
        }
      });
    });
  }

}
exports.default = Client;
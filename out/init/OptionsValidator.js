'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var cov_15ujojiueq = function () {
  var path = '/home/ubuntu/atscm/src/init/OptionsValidator.js',
      hash = 'b326eb2df996c6fad90f0001094ee595d9003078',
      global = new Function('return this')(),
      gcv = '__coverage__',
      coverageData = {
    path: '/home/ubuntu/atscm/src/init/OptionsValidator.js',
    statementMap: {
      '0': {
        start: {
          line: 15,
          column: 19
        },
        end: {
          line: 15,
          column: 45
        }
      },
      '1': {
        start: {
          line: 17,
          column: 4
        },
        end: {
          line: 17,
          column: 52
        }
      },
      '2': {
        start: {
          line: 17,
          column: 38
        },
        end: {
          line: 17,
          column: 50
        }
      },
      '3': {
        start: {
          line: 19,
          column: 4
        },
        end: {
          line: 19,
          column: 51
        }
      },
      '4': {
        start: {
          line: 19,
          column: 25
        },
        end: {
          line: 19,
          column: 49
        }
      },
      '5': {
        start: {
          line: 21,
          column: 4
        },
        end: {
          line: 21,
          column: 30
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
            column: 21
          },
          end: {
            line: 22,
            column: 3
          }
        }
      }
    },
    branchMap: {
      '0': {
        loc: {
          start: {
            line: 17,
            column: 4
          },
          end: {
            line: 17,
            column: 52
          }
        },
        type: 'if',
        locations: [{
          start: {
            line: 17,
            column: 4
          },
          end: {
            line: 17,
            column: 52
          }
        }, {
          start: {
            line: 17,
            column: 4
          },
          end: {
            line: 17,
            column: 52
          }
        }]
      },
      '1': {
        loc: {
          start: {
            line: 19,
            column: 4
          },
          end: {
            line: 19,
            column: 51
          }
        },
        type: 'if',
        locations: [{
          start: {
            line: 19,
            column: 4
          },
          end: {
            line: 19,
            column: 51
          }
        }, {
          start: {
            line: 19,
            column: 4
          },
          end: {
            line: 19,
            column: 51
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
      '0': 0
    },
    b: {
      '0': [0, 0],
      '1': [0, 0]
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

var _validateNpmPackageName = require('validate-npm-package-name');

var _validateNpmPackageName2 = _interopRequireDefault(_validateNpmPackageName);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A static class containing validators for the options used when running "atscm init".
 */
class InitOptionsValidator {

  /**
   * Validates a project name to be a valid npm package name.
   * @param {String} value The name to validate.
   * @return {Boolean|String} Returns true if `value` is a valid npm package name, or an error
   * message otherwise.
   */
  static name(value) {
    ++cov_15ujojiueq.f[0];

    const result = (++cov_15ujojiueq.s[0], (0, _validateNpmPackageName2.default)(value));

    ++cov_15ujojiueq.s[1];
    if (result.validForNewPackages) {
      ++cov_15ujojiueq.b[0][0];
      ++cov_15ujojiueq.s[2];
      return true;
    } else {
      ++cov_15ujojiueq.b[0][1];
    }

    ++cov_15ujojiueq.s[3];
    if (result.errors) {
      ++cov_15ujojiueq.b[1][0];
      ++cov_15ujojiueq.s[4];
      return result.errors[0];
    } else {
      ++cov_15ujojiueq.b[1][1];
    }

    ++cov_15ujojiueq.s[5];
    return result.warnings[0];
  }

}
exports.default = InitOptionsValidator;
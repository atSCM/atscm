'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var cov_2oe60p33ul = function () {
  var path = '/home/ubuntu/atscm/src/init/InitTask.js',
      hash = '9e7067c2c97c4a9bbf36d213b8e86d9cdf366b12',
      global = new Function('return this')(),
      gcv = '__coverage__',
      coverageData = {
    path: '/home/ubuntu/atscm/src/init/InitTask.js',
    statementMap: {
      '0': {
        start: {
          line: 19,
          column: 4
        },
        end: {
          line: 24,
          column: 63
        }
      },
      '1': {
        start: {
          line: 24,
          column: 15
        },
        end: {
          line: 24,
          column: 61
        }
      },
      '2': {
        start: {
          line: 34,
          column: 19
        },
        end: {
          line: 34,
          column: 37
        }
      },
      '3': {
        start: {
          line: 36,
          column: 20
        },
        end: {
          line: 36,
          column: 37
        }
      },
      '4': {
        start: {
          line: 38,
          column: 19
        },
        end: {
          line: 42,
          column: 23
        }
      },
      '5': {
        start: {
          line: 44,
          column: 4
        },
        end: {
          line: 45,
          column: 33
        }
      },
      '6': {
        start: {
          line: 45,
          column: 19
        },
        end: {
          line: 45,
          column: 30
        }
      }
    },
    fnMap: {
      '0': {
        name: '(anonymous_0)',
        decl: {
          start: {
            line: 18,
            column: 2
          },
          end: {
            line: 18,
            column: 3
          }
        },
        loc: {
          start: {
            line: 18,
            column: 31
          },
          end: {
            line: 25,
            column: 3
          }
        }
      },
      '1': {
        name: '(anonymous_1)',
        decl: {
          start: {
            line: 24,
            column: 10
          },
          end: {
            line: 24,
            column: 11
          }
        },
        loc: {
          start: {
            line: 24,
            column: 15
          },
          end: {
            line: 24,
            column: 61
          }
        }
      },
      '2': {
        name: '(anonymous_2)',
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
            column: 22
          },
          end: {
            line: 46,
            column: 3
          }
        }
      },
      '3': {
        name: '(anonymous_3)',
        decl: {
          start: {
            line: 45,
            column: 12
          },
          end: {
            line: 45,
            column: 13
          }
        },
        loc: {
          start: {
            line: 45,
            column: 19
          },
          end: {
            line: 45,
            column: 30
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
      '6': 0
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

var _path = require('path');

var _gulp = require('gulp');

var _gulpCompileHandlebars = require('gulp-compile-handlebars');

var _gulpCompileHandlebars2 = _interopRequireDefault(_gulpCompileHandlebars);

var _handlebarsHelpers = require('handlebars-helpers');

var _handlebarsHelpers2 = _interopRequireDefault(_handlebarsHelpers);

var _streamToPromise = require('stream-to-promise');

var _streamToPromise2 = _interopRequireDefault(_streamToPromise);

var _dependencies = require('../../res/init/templates/dependencies.json');

var _dependencies2 = _interopRequireDefault(_dependencies);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * The action run when running "atscm init".
 */
class InitTask {

  /**
   * Returns the globs of the processed files for the given config lanugage.
   * @param {String} langId The configuration language used.
   * @return {String[]} Globs of the files to handle.
   */
  static filesToHandle(langId) {
    ++cov_2oe60p33ul.f[0];
    ++cov_2oe60p33ul.s[0];

    return ['./general/**/*', './general/**/.*', `./lang/${langId}/**/*.*`, `./lang/${langId}/**/.*`].map(p => {
      ++cov_2oe60p33ul.f[1];
      ++cov_2oe60p33ul.s[1];
      return (0, _path.join)(__dirname, '../../res/init/templates', p);
    });
  }

  /**
   * Runs the task with the given options.
   * @param {Object} options The options to use.
   * @return {Promise<{ install: String[] }, Error>} Resolved with information on further actions
   * to run or rejected if the task failed.
   */
  static run(options) {
    ++cov_2oe60p33ul.f[2];

    const langId = (++cov_2oe60p33ul.s[2], options.configLang);

    const install = (++cov_2oe60p33ul.s[3], _dependencies2.default.lang[langId]);

    const stream = (++cov_2oe60p33ul.s[4], (0, _gulp.src)(this.filesToHandle(langId)).pipe((0, _gulpCompileHandlebars2.default)(options, {
      helpers: (0, _handlebarsHelpers2.default)()
    })).pipe((0, _gulp.dest)('./')));

    ++cov_2oe60p33ul.s[5];
    return (0, _streamToPromise2.default)(stream).then(() => {
      ++cov_2oe60p33ul.f[3];
      ++cov_2oe60p33ul.s[6];
      return { install };
    });
  }

}
exports.default = InitTask;
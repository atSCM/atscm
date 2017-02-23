'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.InitOptions = exports.ConfigLangs = undefined;

var cov_a895rhmtm = function () {
  var path = '/home/ubuntu/atscm/src/init/Options.js',
      hash = '09603ee5172b2d09985e7e32a1fd1b906cbb5421',
      global = new Function('return this')(),
      gcv = '__coverage__',
      coverageData = {
    path: '/home/ubuntu/atscm/src/init/Options.js',
    statementMap: {
      '0': {
        start: {
          line: 10,
          column: 27
        },
        end: {
          line: 15,
          column: 1
        }
      },
      '1': {
        start: {
          line: 31,
          column: 27
        },
        end: {
          line: 60,
          column: 1
        }
      },
      '2': {
        start: {
          line: 49,
          column: 21
        },
        end: {
          line: 49,
          column: 37
        }
      },
      '3': {
        start: {
          line: 53,
          column: 21
        },
        end: {
          line: 53,
          column: 37
        }
      },
      '4': {
        start: {
          line: 58,
          column: 51
        },
        end: {
          line: 58,
          column: 85
        }
      },
      '5': {
        start: {
          line: 66,
          column: 27
        },
        end: {
          line: 67,
          column: 58
        }
      },
      '6': {
        start: {
          line: 67,
          column: 15
        },
        end: {
          line: 67,
          column: 57
        }
      }
    },
    fnMap: {
      '0': {
        name: '(anonymous_0)',
        decl: {
          start: {
            line: 49,
            column: 10
          },
          end: {
            line: 49,
            column: 11
          }
        },
        loc: {
          start: {
            line: 49,
            column: 21
          },
          end: {
            line: 49,
            column: 37
          }
        }
      },
      '1': {
        name: '(anonymous_1)',
        decl: {
          start: {
            line: 53,
            column: 10
          },
          end: {
            line: 53,
            column: 11
          }
        },
        loc: {
          start: {
            line: 53,
            column: 21
          },
          end: {
            line: 53,
            column: 37
          }
        }
      },
      '2': {
        name: '(anonymous_2)',
        decl: {
          start: {
            line: 58,
            column: 42
          },
          end: {
            line: 58,
            column: 43
          }
        },
        loc: {
          start: {
            line: 58,
            column: 51
          },
          end: {
            line: 58,
            column: 85
          }
        }
      },
      '3': {
        name: '(anonymous_3)',
        decl: {
          start: {
            line: 67,
            column: 7
          },
          end: {
            line: 67,
            column: 8
          }
        },
        loc: {
          start: {
            line: 67,
            column: 15
          },
          end: {
            line: 67,
            column: 57
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

var _Option = require('../lib/init/Option');

var _Option2 = _interopRequireDefault(_Option);

var _Atviseproject = require('../lib/config/Atviseproject');

var _Atviseproject2 = _interopRequireDefault(_Atviseproject);

var _OptionsValidator = require('./OptionsValidator');

var _OptionsValidator2 = _interopRequireDefault(_OptionsValidator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * A map providing dirnames for config langs
 * @type {Map<String, String>}
 */
const ConfigLangs = exports.ConfigLangs = (++cov_a895rhmtm.s[0], {
  'ES2015 JavaScript': 'es2015',
  'Regular JavaScript': 'es5',
  TypeScript: 'ts',
  'CoffeeScript (alpha)': 'coffee'
});

/**
 * Options available for the "atscm init" command.
 * @type {Object}
 * @property {InitOption<input>} name The new project's name.
 * @property {InitOption<input>} description The new project's description.
 * @property {InitOption<input>} author The new project's author.
 * @property {InitOption<input>} atviseHost The new project's atvise server host.
 * @property {InitOption<input>} atvisePortOpc The new project's atvise server OPC port.
 * @property {InitOption<input>} atvisePortHttp The new project's atvise server HTTP port.
 * @property {InitOption<confirm>} useLogin If the new porject's atvise server requires login.
 * @property {InitOption<input>} atviseUsername The new project's atvise server login name.
 * @property {InitOption<input>} atvisePassword The new project's atvise server login password.
 * @property {InitOption<list>} configLang The language to use for the new project's configuration.
 */
const InitOptions = exports.InitOptions = (++cov_a895rhmtm.s[1], {
  name: new _Option2.default({
    message: 'Project name',
    default: (0, _path.basename)(process.cwd()),
    validate: _OptionsValidator2.default.name
  }),
  description: new _Option2.default('Project description'),
  author: new _Option2.default('Project author'),
  atviseHost: new _Option2.default('Atvise server host', _Atviseproject2.default.host),
  atvisePortOpc: new _Option2.default('Atvise OPC port', _Atviseproject2.default.port.opc),
  atvisePortHttp: new _Option2.default('Atvise HTTP port', _Atviseproject2.default.port.http),
  useLogin: new _Option2.default({
    message: 'Does your atvise server require login',
    type: 'confirm',
    default: false
  }),
  atviseUser: new _Option2.default({
    message: ' - Username',
    when: answers => {
      ++cov_a895rhmtm.f[0];
      ++cov_a895rhmtm.s[2];
      return answers.useLogin;
    }
  }),
  atvisePassword: new _Option2.default({
    message: ' - Password',
    when: answers => {
      ++cov_a895rhmtm.f[1];
      ++cov_a895rhmtm.s[3];
      return answers.useLogin;
    }
  }),
  configLang: new _Option2.default({
    type: 'list',
    message: 'Configuration language to use',
    choices: Object.keys(ConfigLangs).map(name => {
      ++cov_a895rhmtm.f[2];
      ++cov_a895rhmtm.s[4];
      return { name, value: ConfigLangs[name] };
    })
  })
});

/**
 * {@link InitOptions}, exported as an array. Required to run {@link Inquirer}.
 * @type {InitOption[]}
 */
const InitOptionsAsArray = (++cov_a895rhmtm.s[5], Object.keys(InitOptions).map(name => {
  ++cov_a895rhmtm.f[3];
  ++cov_a895rhmtm.s[6];
  return Object.assign({ name }, InitOptions[name]);
}));

exports.default = InitOptionsAsArray;
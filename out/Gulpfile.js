'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var cov_vf01rx69a = function () {
  var path = '/home/ubuntu/atscm/src/Gulpfile.js',
      hash = 'aaac1473fc93be1bb4c77e121a8642a61e55e83c',
      global = new Function('return this')(),
      gcv = '__coverage__',
      coverageData = {
    path: '/home/ubuntu/atscm/src/Gulpfile.js',
    statementMap: {},
    fnMap: {},
    branchMap: {},
    s: {},
    f: {},
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

var _pull = require('./tasks/pull');

Object.defineProperty(exports, 'pull', {
  enumerable: true,
  get: function () {
    return _interopRequireDefault(_pull).default;
  }
});

var _push = require('./tasks/push');

Object.defineProperty(exports, 'push', {
  enumerable: true,
  get: function () {
    return _interopRequireDefault(_push).default;
  }
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
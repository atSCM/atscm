'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var cov_2qfz4wui59 = function () {
  var path = '/home/ubuntu/atscm/src/init/init.js',
      hash = 'd6fb7d460e959985411b0dd4783d5f9e7447d705',
      global = new Function('return this')(),
      gcv = '__coverage__',
      coverageData = {
    path: '/home/ubuntu/atscm/src/init/init.js',
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

var _InitTask = require('./InitTask');

var _InitTask2 = _interopRequireDefault(_InitTask);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = _InitTask2.default.run.bind(_InitTask2.default);
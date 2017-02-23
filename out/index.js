'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var cov_t6rczzbxn = function () {
  var path = '/home/ubuntu/atscm/src/index.js',
      hash = '71f0c507258c086f9f3f9c9c23de1b8db101f42e',
      global = new Function('return this')(),
      gcv = '__coverage__',
      coverageData = {
    path: '/home/ubuntu/atscm/src/index.js',
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

var _Atviseproject = require('./lib/config/Atviseproject');

Object.defineProperty(exports, 'Atviseproject', {
  enumerable: true,
  get: function () {
    return _interopRequireDefault(_Atviseproject).default;
  }
});

var _NodeId = require('./lib/server/NodeId');

Object.defineProperty(exports, 'NodeId', {
  enumerable: true,
  get: function () {
    return _interopRequireDefault(_NodeId).default;
  }
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
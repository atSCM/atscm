"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var cov_2njbrp5a3g = function () {
  var path = "/home/ubuntu/atscm/src/config/ProjectConfig.js",
      hash = "ee123d9a8d4615c9fb89b5a44ece581bdfef6e69",
      global = new Function('return this')(),
      gcv = "__coverage__",
      coverageData = {
    path: "/home/ubuntu/atscm/src/config/ProjectConfig.js",
    statementMap: {
      "0": {
        start: {
          line: 4,
          column: 20
        },
        end: {
          line: 4,
          column: 49
        }
      },
      "1": {
        start: {
          line: 10,
          column: 15
        },
        end: {
          line: 10,
          column: 36
        }
      }
    },
    fnMap: {},
    branchMap: {},
    s: {
      "0": 0,
      "1": 0
    },
    f: {},
    b: {},
    _coverageSchema: "332fd63041d2c1bcb487cc26dd0d5f7d97098a6c"
  },
      coverage = global[gcv] || (global[gcv] = {});

  if (coverage[path] && coverage[path].hash === hash) {
    return coverage[path];
  }

  coverageData.hash = hash;
  return coverage[path] = coverageData;
}();

/**
 * The path to the project's configuration file.
 */
const path = exports.path = (++cov_2njbrp5a3g.s[0], process.env.ATSCM_CONFIG_PATH);

/**
 * The current project's configuration.
 * @type {Atviseproject}
 */
const config = (++cov_2njbrp5a3g.s[1], require(path).default);

exports.default = config;
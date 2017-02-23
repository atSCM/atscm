/**
 * @external {vinyl~File} https://github.com/gulpjs/vinyl#new-vinyloptions
 */
"use strict";

var cov_1xsmrjbvbc = function () {
  var path = "/home/ubuntu/atscm/src/typedef/external/vinyl.js",
      hash = "d2d459e8f1164ed3270a1676f1792f0e52762a69",
      global = new Function('return this')(),
      gcv = "__coverage__",
      coverageData = {
    path: "/home/ubuntu/atscm/src/typedef/external/vinyl.js",
    statementMap: {},
    fnMap: {},
    branchMap: {},
    s: {},
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
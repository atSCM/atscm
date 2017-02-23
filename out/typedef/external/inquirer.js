/**
 * @external {Inquirer} https://github.com/sboudrias/Inquirer.js
 */

/**
 * Must be one of: 'list', 'rawlist', 'expand', 'checkbox', 'confirm', 'input', 'password',
 * 'editor'.
 * @typedef {String} inquirer~PromptType
 * @see https://github.com/sboudrias/Inquirer.js#prompt-types
 */

/**
 * A function that, when called with a value, validates this value and either retunrs `true` if
 * validation succeeded or an error message.
 * @typedef {function(value: String): Boolean|String} inquirer~Validator
 */
"use strict";

var cov_2c7xc931gh = function () {
  var path = "/home/ubuntu/atscm/src/typedef/external/inquirer.js",
      hash = "df000ae43f465f0abec0d73c1a4f66d2498842c0",
      global = new Function('return this')(),
      gcv = "__coverage__",
      coverageData = {
    path: "/home/ubuntu/atscm/src/typedef/external/inquirer.js",
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
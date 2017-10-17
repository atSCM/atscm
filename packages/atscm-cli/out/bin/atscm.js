#!/usr/bin/env node
'use strict';

var _updateNotifier = require('update-notifier');

var _updateNotifier2 = _interopRequireDefault(_updateNotifier);

var _package = require('../../package.json');

var _package2 = _interopRequireDefault(_package);

var _AtSCMCli = require('../AtSCMCli');

var _AtSCMCli2 = _interopRequireDefault(_AtSCMCli);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(0, _updateNotifier2.default)({ pkg: _package2.default }).notify();

new _AtSCMCli2.default(process.argv.slice(2)).launch();
//# sourceMappingURL=atscm.js.map
#!/usr/bin/env node
'use strict';

var _AtSCMCli = require('../AtSCMCli');

var _AtSCMCli2 = _interopRequireDefault(_AtSCMCli);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

new _AtSCMCli2.default(process.argv.slice(2)).launch();
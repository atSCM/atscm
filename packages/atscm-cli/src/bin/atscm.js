#!/usr/bin/env node

import updateNotifier from 'update-notifier';
import pkg from '../../package.json';
import AtscmCli from '../AtSCMCli';

updateNotifier({ pkg }).notify();

new AtscmCli(process.argv.slice(2)).launch();

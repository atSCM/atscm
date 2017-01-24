#!/usr/bin/env node

import AtscmCli from '../AtSCMCli';

(new AtscmCli(process.argv.slice(2))).launch();

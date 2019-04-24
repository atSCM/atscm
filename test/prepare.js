/* eslint-disable @typescript-eslint/no-var-requires,import/no-commonjs */

require('@babel/register')({ extensions: ['.js', '.ts'] });
const { join } = require('path');

process.env.ATSCM_CONFIG_PATH = join(__dirname, './fixtures/Atviseproject.babel.js');

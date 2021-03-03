/* eslint-disable import/no-commonjs */

const { promises: fsp } = require('fs');
const { dirname } = require('path');

function pnpmOnly() {
  if (!process.env.npm_config_user_agent.startsWith('pnpm/')) {
    throw new Error('Use `pnpm install` to install dependencies in this repository');
  }
}

const bins = ['packages/reload/out/bin.js'];

async function ensureBins() {
  for (const bin of bins) {
    await fsp.mkdir(dirname(bin), { recursive: true });
    await fsp.stat(bin).catch(async (error) => {
      if (error.code === 'ENOENT') {
        await fsp.writeFile(bin, '', { encoding: 'utf8' });
        console.log(`Created file '${bin}'`);
      } else {
        throw error;
      }
    });
  }
}

async function preinstall() {
  pnpmOnly();
  await ensureBins();
}

module.exports = { pnpmOnly, ensureBins, preinstall };

if (require.main === module) {
  preinstall().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}

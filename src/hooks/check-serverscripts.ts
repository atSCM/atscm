import Logger from 'gulplog';
import { satisfies as validVersion } from 'semver';
import { readNode } from '../api';
import { versionNode } from '../lib/server/scripts/version';
import { dependencies } from '../../package.json';

interface Options {
  log: typeof Logger;
}

export default async function checkServerscripts({ log }: Options): Promise<void> {
  log.debug('Checking installed serverscripts');

  const required = dependencies['@atscm/server-scripts'];
  let version;

  try {
    version = (await readNode(versionNode)).value;

    const [release] = version.split('-beta');
    const valid = validVersion(release, required);

    if (!valid) throw new Error('Invalid version');

    log.debug(`Serverscripts ${version} installed (${required} required)`);
  } catch (error) {
    throw Object.assign(
      new Error(`Invalid server script version: ${version || 'not installed'} (${required} required)
- Please run 'atscm import' again to update`),
      { originalError: error }
    );
  }
}

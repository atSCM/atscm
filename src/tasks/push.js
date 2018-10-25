import toPromise from 'stream-to-promise';
import { satisfies as validVersion } from 'semver';
import Logger from 'gulplog';
import { StatusCodes } from 'node-opcua/lib/datamodel/opcua_status_code';
import src from '../lib/gulp/src';
import PushStream from '../lib/gulp/PushStream';
import { readNode } from '../api';
import { versionNode } from '../lib/server/scripts/version';
import { dependencies } from '../../package.json';


/**
 * Pushes {@link AtviseFile}s to atvise server.
 */
export default function push() {
  Logger.debug('Checking server setup');

  return readNode(versionNode)
    .catch(err => {
      if (err.statusCode && err.statusCode === StatusCodes.BadNodeIdUnknown) {
        throw Object.assign(new Error(`Invalid server scripts version
- Please run 'atscm import' again to update`), { originalError: err });
      }

      throw err;
    })
    .then(({ value: version }) => {
      const required = dependencies['@atscm/server-scripts'];
      Logger.debug(`Found server scripts version: ${version}`);

      try {
        const valid = validVersion(version.split('-beta')[0], required);

        return { version, valid, required };
      } catch (err) {
        throw Object.assign(new Error(`Invalid server scripts version
- Please run 'atscm import' again to update`), { originalError: err });
      }
    })
    .then(({ valid, version, required }) => {
      if (!valid) {
        throw new Error(`Invalid server scripts version: ${version} (${required} required)
- Please run 'atscm import' again to update`);
      }
    })
    .then(() => toPromise(new PushStream(src('./src/'))));
}

push.description = 'Push all stored nodes to atvise server';

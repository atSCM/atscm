import { src } from 'gulp';
import scripts from '@atscm/server-scripts';
import { version } from '@atscm/server-scripts/package.json';
import toPromise from 'stream-to-promise';
import { DataType } from 'node-opcua/lib/datamodel/variant';
import { StatusCodes } from 'node-opcua/lib/datamodel/opcua_status_code';
import Logger from 'gulplog';
import ImportStream from '../lib/gulp/ImportStream';
import { writeNode, createNode } from '../api';
import { versionNode } from '../lib/server/scripts/version';
import { delay } from '../lib/helpers/async';
import { handleTaskError, finishTask } from '../lib/helpers/tasks';
import Session from '../lib/server/Session';
import { setupContext } from '../hooks/hooks';
import checkAtserver from '../hooks/check-atserver';

/**
 * Imports all xml files needed for atscm usage.
 * @return {Promise<void>} The running task.
 */
export default async function importTask() {
  const srcStream = src(scripts);
  const versionVariant = { dataType: DataType.String, value: version };

  Session.pool();

  const context = setupContext();
  await checkAtserver(context);

  return toPromise(srcStream.pipe(new ImportStream()))
    .then(() => writeNode(versionNode, versionVariant))
    .catch((err) => {
      if (err.statusCode === StatusCodes.BadNodeIdUnknown) {
        const maxTries = 20;
        const retryDelay = 100;

        let tryNo = 0;
        const tryToCreate = () => {
          tryNo++;

          return createNode(versionNode, {
            name: 'version',
            value: versionVariant,
          }).then(async ({ outputArguments }) => {
            if (outputArguments[3].value.length < 2) {
              if (tryNo < maxTries) {
                Logger.debug(`Create script is not ready yet. Retrying after ${retryDelay}ms`);

                await delay(retryDelay);
                return tryToCreate();
              }

              throw new Error('CreateNode script is not ready yet. Try again later');
            }

            return true;
          });
        };

        return tryToCreate().then(() => Logger.debug(`Import worked on attempt # ${tryNo}`));
      }

      throw err;
    })
    .then(finishTask, handleTaskError);
}

importTask.description = 'Imports all xml resources needed for atscm usage';

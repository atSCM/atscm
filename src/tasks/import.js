import { src } from 'gulp';
import scripts from '@atscm/server-scripts';
import { version } from '@atscm/server-scripts/package.json';
import toPromise from 'stream-to-promise';
import { DataType } from 'node-opcua/lib/datamodel/variant';
import { StatusCodes } from 'node-opcua/lib/datamodel/opcua_status_code';
import ImportStream from '../lib/gulp/ImportStream';
import { writeNode, createNode } from '../api';
import { versionNode } from '../lib/server/scripts/version';

/**
 * Imports all xml files needed for atscm usage.
 * @return {Promise<void>} The running task.
 */
export default function importTask() {
  const srcStream = src(scripts);
  const versionVariant = { dataType: DataType.String, value: version };

  return toPromise(srcStream
    .pipe(new ImportStream())
  )
    .then(() => writeNode(versionNode, versionVariant))
    .catch(err => {
      if (err.statusCode === StatusCodes.BadNodeIdUnknown) {
        return createNode(versionNode, {
          name: 'version',
          value: versionVariant,
        });
      }

      throw err;
    });
}

importTask.description = 'Imports all xml resources needed for atscm usage';

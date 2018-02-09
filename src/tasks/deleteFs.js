import DeleteFsStream from '../lib/gulp/DeleteFsStream';
import ProjectConfig from '../config/ProjectConfig';

/**
 * Deletes listed files from the file system.
 * @param {function()} callback Called once completed.
 */
export default function deleteFs(callback) {
  return new DeleteFsStream({
    deleteFileName: ProjectConfig.DeleteFileNames.fs,
  })
    .on('close', callback);
}

deleteFs.description = 'Deletes listed files from file system';

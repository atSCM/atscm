import DeleteFsStream from '../lib/gulp/DeleteFsStream';
import ProjectConfig from '../config/ProjectConfig';

/**
 * Deletes listed files from the file system.
 */
export default function deleteFs (callback) {

  return new DeleteFsStream({
    deleteFileName: ProjectConfig.DeleteFileNames.fs,
  })
    .on('close', callback)
}

deleteFs.description = 'Deletes listed files from file system';
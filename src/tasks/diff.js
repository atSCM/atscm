import DiffStream from '../lib/gulp/DiffStream';
import ProjectConfig from '../config/ProjectConfig';

/**
 * Creates diff between atvise server process image and mapped files.
 */
export default function diff() {
  return new DiffStream({
    nodesToDiff: ProjectConfig.nodes,
    filePath: ProjectConfig.DiffFileName,
  });
}

diff.description = 'Creates diff between mapped file system nodes and atvise server nodes';

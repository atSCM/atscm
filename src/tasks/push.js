import { src } from 'gulp';
import PushStream from '../lib/gulp/PushStream';

/**
 * Pushes {@link AtviseFile}s to atvise server.
 */
export default function push() {
  return new PushStream(src('./src/**/**/*.*', { buffer: false }));
}

push.description = 'Push all stored nodes to atvise server';

import src from '../lib/gulp/src';
import PushStream from '../lib/gulp/PushStream';

/**
 * Pushes {@link AtviseFile}s to atvise server.
 */
export default function push() {
  return new PushStream(src('./src/')); // FIXME: Get from config file
}

push.description = 'Push all stored nodes to atvise server';

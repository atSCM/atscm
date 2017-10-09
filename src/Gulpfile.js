import cleanup from 'node-cleanup';
import cleanupHandler from './util/cleanup';

// Register tasks
export { default as pull } from './tasks/pull';
export { default as push } from './tasks/push';
export { default as watch } from './tasks/watch';
export { default as importXml } from './tasks/importXml';

// Register cleanup
/* istanbul ignore if */
if (process.env.NODE_ENV !== 'test') {
  // Prevent node-opcua logging
  console.log = () => {}; // eslint-disable-line no-console

  cleanup((code, signal) => cleanupHandler(code, signal, cleanup.uninstall), {
    ctrl_C: '',
    unhandledRejection: '',
  });
}

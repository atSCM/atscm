import cleanup from 'node-cleanup';
import cleanupHandler from './util/cleanup';

/**
 * Defines a lazy-loaded task.
 * @param {function(): function(): Promise<void>} loader Loads a task module.
 * @param {string} description A short description of what the task does.
 */
function lazyTask(loader, description) {
  async function task(...args) {
    const taskModule = await loader();

    // Prevent node-opcua logging
    console.log = () => {}; // eslint-disable-line no-console

    return (taskModule.default || taskModule)(...args);
  }

  task.description = description;

  return task;
}

// Register tasks
/** The gulp task for 'atscm pull' */
export const pull = lazyTask(() => import('./tasks/pull'), 'Pull all nodes from atvise server');

/** The gulp task for 'atscm push' */
export const push = lazyTask(
  () => import('./tasks/push'),
  'Push all stored nodes to atvise server'
);

/** The gulp task for 'atscm watch' */
export const watch = lazyTask(
  () => import('./tasks/watch'),
  'Watch local files and atvise server nodes to trigger pull/push on change'
);

/** The gulp task for 'atscm import' */
const importTask = lazyTask(
  () => import('./tasks/import'),
  'Pull all nodes',
  'Imports all xml resources needed for atscm usage'
);
export { importTask as import };

// Register cleanup
/* istanbul ignore if */
if (process.env.NODE_ENV !== 'test') {
  cleanup((code, signal) => cleanupHandler(code, signal, cleanup.uninstall), {
    ctrl_C: '',
    unhandledRejection: '',
  });
}

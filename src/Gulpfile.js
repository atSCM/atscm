import cleanup from 'node-cleanup';
import cleanupHandler from './util/cleanup';

function lazyTask(loader, description) {
  async function task(...args) {
    const taskModule = await loader();
    return (taskModule.default || taskModule)(...args);
  }

  task.description = description;

  return task;
}

// Register tasks
export const pull = lazyTask(() => import('./tasks/pull'), 'Pull all nodes from atvise server');
export const push = lazyTask(
  () => import('./tasks/push'),
  'Push all stored nodes to atvise server'
);
export const watch = lazyTask(
  () => import('./tasks/watch'),
  'Watch local files and atvise server nodes to trigger pull/push on change'
);
const importTask = lazyTask(
  () => import('./tasks/import'),
  'Pull all nodes',
  'Imports all xml resources needed for atscm usage'
);
export { importTask as import };

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

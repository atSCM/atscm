import { join } from 'path';
import type Emitter from 'events';
import sane from 'sane';
import { startServer, ReloadServer } from '@atscm/reload';
import getPort from 'get-port';
import open from 'open';
import Logger from 'gulplog';
import ServerWatcher from '../lib/server/Watcher';
import { delay } from '../lib/helpers/async';
import { handleTaskError } from '../lib/helpers/tasks';
import ProjectConfig from '../config/ProjectConfig';
import { validateDirectoryExists } from '../util/fs';
import { setupContext } from '../hooks/hooks';
import checkAtserver from '../hooks/check-atserver';
import checkServerscripts from '../hooks/check-serverscripts';
import type { NodeId } from '..';
import { performPull } from './pull';
import { performPush } from './push';

export interface WatchTaskOptions {
  /** If the reload server should be opened in a browser. */
  open?: boolean;
}

/**
 * The task executed when running `atscm watch`.
 */
export class WatchTask {
  /** If the task is currently pulling. */
  private _pulling = false;

  /** If the task is currently pushing. */
  private _pushing = false;

  /** Timestamp of the last pull */
  private _lastPull = 0;

  /** The {@link NodeId} of the last push */
  private _lastPushed: NodeId = null;

  /** The atserver's version. */
  private atserverVersion: string;

  /**
   * Creates a new watch task instance.
   * @param options The options to use.
   */
  constructor({ atserverVersion }: { atserverVersion: string }) {
    this.atserverVersion = atserverVersion;
  }

  /**
   * The directory to watch.
   * @type {string}
   */
  get directoryToWatch() {
    return './src';
  }

  /**
   * Waits for a watcher (which can actually be any kind of {@link events~Emitter}) to emit a
   * "ready" event.
   * @param {events~Emitter} watcher The watcher to wait for.
   * @return {Promise<events~Emitter, Error>} Fulfilled with the set up watcher or rejected with the
   * watcher error that occurred while waiting for it to get ready.
   */
  private _waitForWatcher<W extends Emitter = Emitter>(watcher: W) {
    return new Promise<W>((resolve, reject) => {
      watcher.on('error', (err) => reject(err));
      watcher.on('ready', () => resolve(watcher));
    });
  }

  /**
   * Starts a file watcher for the directory {@link WatchTask#directoryToWatch}.
   * @return Fulfilled with the file watcher once it is ready or
   * rejected with the error that occurred while starting the watcher.
   */
  private startFileWatcher() {
    return validateDirectoryExists(this.directoryToWatch)
      .catch((err) => {
        if (err.code === 'ENOENT') {
          Logger.info(`Create a directory at ${this.directoryToWatch} or run \`atscm pull\` first`);

          Object.assign(err, {
            message: `Directory ${this.directoryToWatch} does not exist`,
          });
        }

        throw err;
      })
      .then(() =>
        this._waitForWatcher(
          sane(this.directoryToWatch, {
            glob: '**/*.*',
            watchman: process.platform === 'darwin',
          })
        )
      );
  }

  /**
   * Starts a watcher that watches the atvise server for changes.
   * @return Fulfilled with the server watcher once it is ready or
   * rejected with the error that occurred while starting the watcher.
   */
  private startServerWatcher() {
    return this._waitForWatcher(new ServerWatcher());
  }

  /** The reload server instance. */
  private reloadServer: ReloadServer;

  /**
   * Starts a new reload server instance.
   * @param options The options to start the reload server with.
   */
  private async initReloadServer({ port }: { port: number }) {
    this.reloadServer = await startServer({
      target: {
        host: ProjectConfig.host,
        port: ProjectConfig.port.http,
      },
      port,
      logger: Logger,
    });
  }

  /**
   * Prints an error that happened while handling a change.
   * @param contextMessage Describes the currently run action.
   * @param err The error that occured.
   */
  private printTaskError(contextMessage: string, err: Error) {
    try {
      handleTaskError(err);
    } catch (refined) {
      Logger.error(contextMessage, refined.message, refined.stack);
    }
  }

  /** If the task is currently handling a file change. */
  private _handlingChange = false;

  /**
   * Handles a file change.
   * @param path The path of the file that changed.
   * @param root The root of the file that changed.
   * @return {Promise<boolean>} Resolved with `true` if the change triggered a push operation,
   * with `false` otherwise.
   */
  private handleFileChange(path: string, root: string) {
    if (this._handlingChange) {
      Logger.debug('Ignoring', path, 'changed');
      return Promise.resolve(false);
    }

    this._handlingChange = true;
    Logger.info(path, 'changed');

    return performPush(join(root, path), {
      singleNode: true,
      atserverVersion: this.atserverVersion,
    })
      .catch((err) => this.printTaskError('Push failed', err))
      .then(async () => {
        this.reloadServer.reload();

        await delay(500);

        this._handlingChange = false;
      });
  }

  /**
   * Handles an atvise server change.
   * @param {ReadStream.ReadResult} readResult The read result of the modification.
   * @return Resolved with `true` if the change triggered a pull operation,
   * with `false` otherwise.
   */
  private handleServerChange(readResult) {
    if (this._handlingChange) {
      Logger.debug('Ignoring', readResult.nodeId.value, 'changed');
      return Promise.resolve(false);
    }

    this._handlingChange = true;
    Logger.info(readResult.nodeId.value, 'changed');

    return performPull([readResult.nodeId], { recursive: false })
      .catch((err) => this.printTaskError('Pull failed', err))
      .then(async () => {
        this.reloadServer.reload();

        await delay(500);

        this._handlingChange = false;
        return true;
      });
  }

  /**
   * Starts the file and server watchers, initializes a reload server and registers change event
   * handlers.
   * @param [options] The options to use.
   * @return Fulfilled once all watchers are set up and Browsersync was initialized.
   */
  public async run({ open: shouldOpen = true }: WatchTaskOptions = {}) {
    const [fileWatcher, serverWatcher] = await Promise.all([
      this.startFileWatcher(),
      this.startServerWatcher(),
    ]);

    const reloadPort = await getPort({ port: 3000 });
    await this.initReloadServer({ port: reloadPort });
    const reloadURL = `http://localhost:${reloadPort}`;

    Logger.info(`Reload server started at ${reloadURL}`);

    fileWatcher.on('change', this.handleFileChange.bind(this));
    serverWatcher.on('change', this.handleServerChange.bind(this));

    if (shouldOpen) {
      await open(reloadURL);
    }

    Logger.info('Watching for changes...');
    Logger.debug('Press Ctrl-C to exit');

    return { fileWatcher: fileWatcher as Emitter, serverWatcher };
  }
}

/**
 * The gulp task invoced when running `atscm watch`.
 * @param options The options to pass to the watch task, see {@link WatchTask#run} for available
 * options.
 * @return Fulfilled once all watchers are set up and Browsersync was initialized.
 */
export default async function watch(options?: WatchTaskOptions) {
  const context = setupContext();
  const { version: atserverVersion } = await checkAtserver(context);
  await checkServerscripts(context);

  return new WatchTask({ atserverVersion }).run(options);
}

watch.description = 'Watch local files and atvise server nodes to trigger pull/push on change';

import { VariableIds } from 'node-opcua/lib/opcua_node_ids';
import { readJson } from 'fs-extra';
import { coerce, satisfies, gtr, minVersion } from 'semver';
import Logger from 'gulplog';
import prompts from 'prompts';
import { red, yellow } from 'chalk';
import { readNode } from '../api';
import { engines } from '../../package.json';
import { updateJson } from '../lib/helpers/fs';
import NodeId from '../lib/model/opcua/NodeId';
import { HookContext } from './hooks';

const atserverVersionNodeId = new NodeId(
  `ns=0;i=${VariableIds.Server_ServerStatus_BuildInfo_SoftwareVersion}`
);

export async function loadProjectRequirement(): Promise<string> {
  const packageManifest = await readJson('./package.json');

  return packageManifest.engines && packageManifest.engines.atserver;
}

export async function loadRemoteVersion(): Promise<string> {
  const raw = (await readNode(atserverVersionNodeId)).value;

  return coerce(raw).version;
}

export async function askForConfirmation({
  onAsk,
  ...options
}: {
  message: string;
  onAsk?: () => void;
}): Promise<boolean> {
  if (!process.stdin.isTTY) return false;

  if (onAsk) onAsk();

  return (
    await prompts({
      type: 'confirm',
      name: 'confirmed',
      ...options,
    })
  ).confirmed;
}

export async function approveToContinue(
  { log, continueOnError }: HookContext,
  error: Error
): Promise<void> {
  if (continueOnError) {
    log.warn(red(error.message));
    log.warn(`Using --continue, skipping...`);
    return;
  }

  const shouldContinue = await askForConfirmation({
    onAsk: () => Logger.error(red(error.message)),
    message: 'Do you want to continue anyway?',
  });

  if (!shouldContinue) {
    throw error;
  }
}

export default async function checkAtserver(context: HookContext): Promise<{ version: string }> {
  const { log } = context;

  log.debug('Checking atserver version');

  const atscmRequirement = engines.atserver;

  const [projectRequirement, remoteVersion] = await Promise.all([
    loadProjectRequirement(),
    loadRemoteVersion(),
  ]);

  if (!satisfies(remoteVersion, atscmRequirement)) {
    log.debug(`Version ${remoteVersion} does not satisfy requirement ${atscmRequirement}`);
    log.warn(
      yellow(
        `Your atvise server version (${remoteVersion}) is not supported, it may or may not work.`
      )
    );

    if (gtr(remoteVersion, atscmRequirement)) {
      log.info(
        `You're running a newer version of atvise server. Please run 'atscm update' to check for updates.`
      );
    } else {
      log.info(`Please upgrade to atserver ${minVersion(atscmRequirement)} or above.`);
    }
  }

  let updatePackage = false;
  if (!projectRequirement) {
    log.info(`Your package.json file doesn't specify an atserver version, adding it...`);

    updatePackage = true;
  } else if (!satisfies(remoteVersion, projectRequirement)) {
    await approveToContinue(
      context,
      new Error(
        `Your project is setup with atserver ${projectRequirement} but you're using ${remoteVersion}`
      )
    );

    updatePackage = await askForConfirmation({
      message: `Use atvise server ${remoteVersion} as new default?`,
    });
  } else {
    log.debug(`Running against atserver ${remoteVersion}`);
  }

  if (updatePackage) {
    await updateJson<{ engines?: { atserver?: string } }>('./package.json', (current) => {
      /* eslint-disable no-param-reassign */
      if (!current.engines) current.engines = {};
      current.engines.atserver = remoteVersion;
      /* eslint-enable no-param-reassign */

      return current;
    });
  }

  return { version: remoteVersion };
}

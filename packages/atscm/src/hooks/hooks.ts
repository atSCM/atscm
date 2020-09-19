/* eslint-disable import/prefer-default-export */

import Logger from 'gulplog';

export interface HookContext {
  continueOnError: boolean;
  log: typeof Logger;
}

export function setupContext({ log, continueOnError }: Partial<HookContext> = {}): HookContext {
  return {
    log: log || Logger,
    continueOnError:
      continueOnError === undefined ? process.env.CONTINUE_ON_FAILURE === 'true' : continueOnError,
  };
}

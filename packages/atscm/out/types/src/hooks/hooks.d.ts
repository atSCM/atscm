import Logger from 'gulplog';
export interface HookContext {
    continueOnError: boolean;
    log: typeof Logger;
}
export declare function setupContext({ log, continueOnError }?: Partial<HookContext>): HookContext;

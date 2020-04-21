import { HookContext } from './hooks';
export declare function loadProjectRequirement(): Promise<string>;
export declare function loadRemoteVersion(): Promise<string>;
export declare function askForConfirmation({ onAsk, ...options }: {
    message: string;
    onAsk?: () => void;
}): Promise<boolean>;
export declare function approveToContinue({ log, continueOnError }: HookContext, error: Error): Promise<void>;
export default function checkAtserver(context: HookContext): Promise<void>;

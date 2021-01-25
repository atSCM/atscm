/**
 * Returns a promise that resolves after the given duration.
 * @param ms Milliseconds to delay.
 * @return A promise resolved after the specified delay.
 */
export declare const delay: (ms: number) => Promise<void>;
declare type AsyncCallback<R> = (error?: Error | null, result?: R) => void;
/**
 * Wraps a function with an async callback in a promise.
 * @param fn The function to promisify.
 */
export declare const promisified: <R>(fn: (cb: AsyncCallback<R>) => R) => Promise<R>;
export {};

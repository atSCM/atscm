/**
 * Returns a promise that resolves after the given duration.
 * @param ms Milliseconds to delay.
 * @return A promise resolved after the specified delay.
 */
export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(() => resolve(), ms));

type AsyncCallback<R> = (error?: Error | null, result?: R) => void;

/**
 * Wraps a function with an async callback in a promise.
 * @param fn The function to promisify.
 */
export const promisified = <R>(fn: (cb: AsyncCallback<R>) => R): Promise<R> =>
  new Promise((resolve, reject) => {
    fn((err, data) => (err ? reject(err) : resolve(data)));
  });

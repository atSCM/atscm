declare type UpdateFn<T = string> = (current: T) => T | Promise<T>;
export declare function updateFile(path: string, update: UpdateFn, encoding?: string): Promise<void>;
export declare function updateJson<T = {}>(path: string, update: UpdateFn<T>): Promise<void>;
export {};

import { readFile, writeFile } from 'fs-extra';
import detectIndent from 'detect-indent';

type UpdateFn<T = string> = (current: T) => T | Promise<T>;

export async function updateFile(path: string, update: UpdateFn, encoding = 'utf8'): Promise<void> {
  const contents = await readFile(path, encoding);
  const updated = await update(contents);

  return writeFile(path, updated);
}

export async function updateJson<T = {}>(path: string, update: UpdateFn<T>): Promise<void> {
  return updateFile(path, async contents => {
    const indent = detectIndent(contents).indent || '  ';
    const current = JSON.parse(contents) as T;

    const updated = await update(current);

    return JSON.stringify(updated, null, indent);
  });
}

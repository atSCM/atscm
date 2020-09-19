import { join } from 'path';
import { readFile as _readFile } from 'fs';
import { promisify } from 'util';

export function id() {
  return Date.now().toString(32);
}

export const tmpBase = join(__dirname, '../tmp/');

export function tmpDir(name) {
  return join(tmpBase, `${name}-${id()}`);
}

export const readFile = promisify(_readFile);

/* eslint-disable import/prefer-default-export */

import { promises as fsp } from 'fs';

/**
 * Reads a file and parses it's contents as JSON.
 * @param {string} path The file to read.
 * @return {Promise<any>} The parsed file contents.
 */
export async function readJson(path) {
  return JSON.parse(await fsp.readFile(path, 'utf8'));
}

import { promises as fsp } from 'fs';
import type { IncomingMessage, ServerResponse } from 'http';
import type { NextFunction } from 'express';

let contents: string;

export default function serveClient({ path, file }: { path: string; file: string }) {
  return async function serve(req: IncomingMessage, res: ServerResponse, next: NextFunction) {
    try {
      if (!contents) contents = (await fsp.readFile(file, 'utf8')).replace('%%path%%', path);

      res.writeHead(200, { 'Content-Type': 'application/javascript; charset=UTF-8' });
      res.end(contents);
    } catch (error) {
      next(error);
    }
  };
}

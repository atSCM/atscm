import type { IncomingMessage, ServerResponse, OutgoingHttpHeaders } from 'http';
import type { NextFunction } from 'express';
import fetch from 'node-fetch';
import type { Target } from '../server';

export function injectScript(document: string, { path }: { path: string }) {
  return document.replace(
    /(<body[^>]*>)/,
    `$1<div id="reload-root"></div><script data-reload src="${path}/client/client.js"></script>`
  );
}

export function serveInjectedIndex({ target, path }: { target: Target; path: string }) {
  return async function serveIndex(req: IncomingMessage, res: ServerResponse, next: NextFunction) {
    try {
      const indexRes = await fetch(`http://${target.host}:${target.port}${req.url}`);

      if (!indexRes.ok) {
        throw new Error(indexRes.statusText);
      }

      res.writeHead(indexRes.status, (indexRes.headers as unknown) as OutgoingHttpHeaders);
      res.end(injectScript(await indexRes.text(), { path }));
    } catch (error) {
      next(error);
    }
  };
}

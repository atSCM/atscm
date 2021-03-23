/* eslint-disable import/prefer-default-export */

import { join } from 'path';
import express from 'express';
import { createProxyServer } from 'http-proxy';
import { serveInjectedIndex } from './server/inject-script';
import { eventsHandler } from './server/event-source';
import serveClient from './server/serve-client';
import { serverLog, setLogger, Logger } from './lib/log';

export interface Target {
  host: string;
  port: number;
}

export interface Options {
  target: Target;
  port: number;
  path?: string;
  logger?: Logger;
}

type NodeError = Error & { code: string };

function isNodeError(error: Error & { code?: string }, code?: string): error is NodeError {
  if (typeof error.code === 'undefined') return false;

  return code ? error.code === code : true;
}

export async function startServer({ target, port = 3000, path = '__reload__', logger }: Options) {
  if (logger) {
    setLogger(logger);
  }

  const proxy = createProxyServer({ target });
  const events = eventsHandler();
  const app = express()
    .get('/', serveInjectedIndex({ target, path }))
    .use(`/${path}/client/`, serveClient({ path, file: join(__dirname, 'client/client.js') }))
    .use(`/${path}/events`, events.middleware)
    .use('/', (req, res) =>
      proxy.web(req, res, {}, (error) => {
        if (isNodeError(error, 'ECONNRESET')) return;
        serverLog.error(`Proxy error: ${error.message}`);
      })
    );

  const server = app.listen(port);

  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });

  // Proxy websockets
  server.on('upgrade', function (req, socket, head) {
    proxy.ws(req, socket, head);
  });

  return {
    server,
    reload: events.reload,
  };
}

type PromiseResultType<F> = F extends Promise<infer R> ? R : never;

export type ReloadServer = PromiseResultType<ReturnType<typeof startServer>>;

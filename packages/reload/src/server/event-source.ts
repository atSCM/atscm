/* eslint-disable import/prefer-default-export */

import type { IncomingMessage, ServerResponse } from 'http';
import parseUserAgent from 'ua-parser-js';
import { serverLog } from '../lib/log';

type Client = {
  id: string;
  res: ServerResponse;
};

type Event = Record<string, any>;

export function sendEvent<E extends Event>(client: Client, event: E) {
  client.res.write(`data: ${JSON.stringify(event)}\n\n`);

  if (event.reload) {
    client.res.end();
  }
}

export function eventsHandler() {
  let clients: Client[] = [];
  let id = 0;

  function sendEventToAll<E>(event: E) {
    clients.forEach((c) => sendEvent(c, event));
  }

  return {
    middleware(req: IncomingMessage, res: ServerResponse) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        Connection: 'keep-alive',
        'Cache-Control': 'no-cache',
      });

      const { browser } = parseUserAgent(req.headers['user-agent']);
      const client = { id: `${id++} (${browser.name} ${browser.version})`, res };
      clients.push(client);

      sendEvent(client, { connected: true });
      serverLog.info(`Client ${client.id} connected`);

      req.on('close', () => {
        clients = clients.filter((c) => c.id !== client.id);

        // if the browser was reloaded close is emitted once with finished set to false and once with true
        if (res.finished) {
          // If we wanted to log all disconnects:
          // serverLog.info(`Client ${client.id} disconnected`);
        } else {
          serverLog.info(`Client ${client.id} disconnected`);
        }

        res.end();
      });
    },
    sendEvent<E extends Event>(event: E) {
      sendEventToAll<E>(event);
    },
    reload<D extends Record<string, any> = Record<string, any>>(data?: D) {
      sendEventToAll({ ...(data || {}), reload: true });
      serverLog.info(`Reloading all clients...`);
    },
  };
}

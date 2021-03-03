import { createInterface } from 'readline';
import { startServer, Options } from './server';
import { cliLog } from './lib/log';

export function listenForCommand(command: string, callback: () => void) {
  const rl = createInterface({ input: process.stdin });

  rl.on('line', (input) => {
    if (input.trim().toLowerCase() === command) {
      callback();
    }
  });
}

export async function start(options: Options) {
  const { reload } = await startServer(options);
  cliLog.info(
    `Forwarding all requests from http://localhost:${options.port} to http://${options.target.host}:${options.target.port}`
  );

  cliLog.info('Type `r` to reload');
  listenForCommand('r', () => {
    cliLog.info('Triggering reload...');
    reload();
  });
}

if (require.main === module) {
  const [targetPort, targetHost = 'localhost', reloadPort = '3000'] = process.argv.slice(2);
  if (!targetPort) {
    console.error(`Usage: ${process.argv[1]} <target port> [target host] [reload port]`);
    process.exitCode = 1;
  } else {
    start({
      target: {
        host: targetHost,
        port: parseInt(targetPort, 10),
      },
      port: parseInt(reloadPort, 10),
    }).catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
  }
}

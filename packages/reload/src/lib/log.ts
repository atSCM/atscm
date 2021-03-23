export type Logger = {
  info: typeof console.info;
  error: typeof console.error;
};

let logger: Logger = console;

function setupLogger(...prefix: string[]) {
  return {
    info: (...message: any[]) => logger.info(...prefix, ...message),
    error: (...message: any[]) => logger.error(...prefix, ...message),
  };
}

export function setLogger(newLogger: Logger) {
  logger = newLogger;
}

const cliColor = (color: number) => (text: TemplateStringsArray) =>
  `\x1b[${color}m${text.join('')}\x1b[0m`;

const magenta = cliColor(35);
const cyan = cliColor(36);

export const serverLog = setupLogger(cyan`[reload]`);
export const clientLog = setupLogger('%c@atscm/reload', 'color: orange');
export const cliLog = setupLogger(magenta`[reload cli]`);

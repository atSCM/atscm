import { EventEmitter } from 'events';

// sparkles
declare class Sparkles extends EventEmitter {}

// glogg
type LogMethod = (message?: any, ...optionalParams: any[]) => void;

interface WithLogMethods {
  debug: LogMethod;
  info: LogMethod;
  warn: LogMethod;
  error: LogMethod;
}

declare class Logger extends Sparkles implements WithLogMethods {

  public debug: LogMethod;
  public info: LogMethod;
  public warn: LogMethod;
  public error: LogMethod;

}

declare function getLogger(namespace: string): Logger;

// finally, gulplog
declare const gulplog: Logger;
export default gulplog;

declare module 'gulplog' {

  import { EventEmitter } from 'events';
  // sparkles
  class Sparkles extends EventEmitter {}

  // glogg
  type LogMethod = (message?: any, ...optionalParams: any[]) => void;

  interface WithLogMethods {
    debug: LogMethod;
    info: LogMethod;
    warn: LogMethod;
    error: LogMethod;
  }

  class Logger extends Sparkles implements WithLogMethods {

    public debug: LogMethod;
    public info: LogMethod;
    public warn: LogMethod;
    public error: LogMethod;

  }

  function getLogger(namespace: string): Logger;

  // finally, gulplog
  const gulplog: Logger;
  export default gulplog;

}

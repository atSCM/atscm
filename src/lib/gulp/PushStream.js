import readline from 'readline';
import Logger from 'gulplog';
import ProjectConfig from '../../config/ProjectConfig';
import Transformer, { TransformDirection } from '../transform/Transformer';
import MappingTransformer from '../../transform/Mapping';
import WriteStream from '../server/WriteStream';

/**
 * A stream that transforms read {@link vinyl~File}s and pushes them to atvise server.
 */
export default class PushStream {

  /**
   * Creates a new PushSteam based on a source file stream.
   * @param {Stream} srcStream The file stream to read from.
   */
  constructor(srcStream) {
    let uploaded = 0;

    const mappingStream = new MappingTransformer({ direction: TransformDirection.FromFilesystem });
    const writeStream = new WriteStream()
      .on('data', () => uploaded++);

    const printProgress = setInterval(() => {
      Logger.info(`Pushed: ${uploaded}`);

      readline.cursorTo(process.stdout, 0);
      readline.moveCursor(process.stdout, 0, -1);
    }, 1000);

    return Transformer.applyTransformers(
      srcStream
        .pipe(mappingStream),
      ProjectConfig.useTransformers,
      TransformDirection.FromFilesystem
    )
      .pipe(writeStream)
      .on('end', () => {
        readline.cursorTo(process.stdout, 0);
        readline.clearLine(process.stdout);

        clearInterval(printProgress);
      });
  }

}

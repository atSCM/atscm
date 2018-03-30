import { join } from 'path';
import replace from 'buffer-replace';
import promisify from 'stream-to-promise';
import { obj as createTransformStream } from 'through2';
import { StatusCodes } from 'node-opcua';
import { src } from 'gulp';
import ImportStream from '../../src/lib/gulp/ImportStream';
import CallScriptStream from '../../src/lib/server/scripts/CallScriptStream';
import NodeId from '../../src/lib/model/opcua/NodeId';

export function importSetup(name, rename = 'TestNode') {
  const setupPath = join(__dirname, `../fixtures/setup/${name}.xml`);

  const nodeName = `${rename}-${Date.now().toString(32)}`;
  const replaceStream = createTransformStream((file, enc, callback) => {
    callback(null, Object.assign(file, {
      contents: replace(file.contents, rename, nodeName),
    }));
  });

  const importStream = new ImportStream();

  return promisify(
    src(setupPath)
      .pipe(replaceStream)
      .pipe(importStream)
  )
    .then(() => nodeName);
}

class SingleCallScriptStream extends CallScriptStream {

  constructor(options) {
    super(options);

    this._scriptId = options.script;
    this._parameters = options.parameters || {};
  }

  get scriptId() {
    return this._scriptId;
  }

  scriptParameters() {
    return this._parameters;
  }

  handleOutputArguments(file, outArgs, callback) {
    if (outArgs[0].value !== StatusCodes.Good) {
      callback(new Error(outArgs[1].value));
    } else {
      callback(null, outArgs.slice(2).map(a => a.value));
    }
  }

}

export function callScript(name, parameters) {
  const stream = new SingleCallScriptStream({
    script: new NodeId(`ns=1;s=SYSTEM.LIBRARY.ATVISE.SERVERSCRIPTS.atscm.${name}`),
    parameters,
  });

  stream.write({
    relative: 'TestHelper',
    nodeId: new NodeId('ns=1;s=AGENT.TEST.Helper'),
  });

  stream.on('error', console.error.bind(console, '>> error'))

  stream.end();

  return promisify(stream);
}

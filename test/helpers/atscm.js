import { join } from 'path';
import replace from 'buffer-replace';
import promisify from 'stream-to-promise';
import { obj as createTransformStream } from 'through2';
import { StatusCodes, Variant, DataType, VariantArrayType } from 'node-opcua';
import { src, dest } from 'gulp';
import proxyquire from 'proxyquire';
import expect from '../expect';
import PushStream from '../../src/lib/gulp/PushStream';
import NodeStream from '../../src/lib/server/NodeStream';
import ReadStream from '../../src/lib/server/ReadStream';
import ImportStream from '../../src/lib/gulp/ImportStream';
import CallMethodStream from '../../src/lib/server/scripts/CallMethodStream';
import CallScriptStream from '../../src/lib/server/scripts/CallScriptStream';
import NodeId from '../../src/lib/model/opcua/NodeId';
import { id, tmpDir, readFile } from './util';

export function pull(nodes, destination) {
  const PullStream = proxyquire('../../src/lib/gulp/PullStream', {
    gulp: {
      dest() {
        return dest(destination);
      },
    },
  }).default;

  return promisify(
    new PullStream(
      (new NodeStream(nodes.map(n => new NodeId(n))))
        .pipe(new ReadStream())
    )
  );
}

export function push(source) {
  return promisify(new PushStream(src(
    [`${source}/**/.*`, `!${source}/**/.*.rc`, `${source}/**/*.*`],
    { base: source },
  )));
}

export const setupDir = join(__dirname, '../fixtures/setup');

export function setupPath(name) {
  return join(setupDir, `${name}.xml`);
}

export function importSetup(name, rename = 'TestNode') {
  const nodeName = `${rename}-${id()}`;
  const replaceStream = createTransformStream((file, enc, callback) => {
    callback(null, Object.assign(file, {
      contents: replace(file.contents, rename, nodeName),
    }));
  });

  const importStream = new ImportStream();

  return promisify(
    src(setupPath(name))
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

  stream.end();

  return promisify(stream);
}

export function deleteNode(nodeName) {
  return callScript('DeleteNode', {
    nodeId: {
      dataType: DataType.String,
      value: nodeName,
    },
  });
}

class ExportStream extends CallMethodStream {

  get methodId() {
    return new NodeId('AGENT.OPCUA.METHODS.exportNodes');
  }

  handleOutputArguments(file, outputArguments, callback) {
    this.push(outputArguments[0].value);

    callback(null);
  }

  inputArguments(file) {
    return [
      new Variant({
        dataType: DataType.NodeId,
        arrayType: VariantArrayType.Array,
        value: [file.nodeId],
      }),
    ];
  }

}

export function exportNode(nodeId) {
  const stream = new ExportStream();

  stream.write({
    relative: 'TestHelper',
    nodeId: new NodeId(nodeId),
  });

  stream.end();

  return promisify(stream);
}

export function expectCorrectMapping(setup, node) {
  let nodeName;
  let destination;

  before(`import setup and pull ${setup}`, async function() {
    nodeName = await importSetup(setup, node.name);
    destination = tmpDir(setup.replace(/\//g, '-'));

    // Run atscm pull
    await pull([`ns=1;s=${node.path}.${nodeName}`], destination);

    // Delete the pulled node
    await deleteNode(`${node.path}.${nodeName}`);
  });

  it('should recreate all fields', async function() {
    // Run atscm push
    await push(destination);

    const rawPushed = await exportNode(`${node.path}.${nodeName}`);
    const pushed = rawPushed.toString().replace(new RegExp(nodeName, 'g'), node.name);
    const original = await readFile(setupPath(setup), 'utf8');

    // Removes the first 2 lines (created at ...) and newlines
    const trim = str => str.split('\n').slice(2).map(s => s.trim());

    expect(trim(pushed), 'to equal', trim(original));
  });

  after('delete tmp node', function() {
    // Delete the pushed node
    return deleteNode(`${node.path}.${nodeName}`);
  });
}

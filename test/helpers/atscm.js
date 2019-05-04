import { join, sep } from 'path';
import replace from 'buffer-replace';
import promisify from 'stream-to-promise';
import { obj as createTransformStream } from 'through2';
import { StatusCodes, Variant, DataType, VariantArrayType } from 'node-opcua';
import { src as gulpSrc } from 'gulp';
import proxyquire from 'proxyquire';
import { parse } from 'modify-xml';
import expect from '../expect';
import ImportStream from '../../src/lib/gulp/ImportStream';
import CallMethodStream from '../../src/lib/server/scripts/CallMethodStream';
import CallScriptStream from '../../src/lib/server/scripts/CallScriptStream';
import NodeId from '../../src/lib/model/opcua/NodeId';
import dest from '../../src/lib/gulp/dest';
import { performPush } from '../../src/tasks/push';
import { id, tmpDir, readFile } from './util';

export function pull(nodes, destination) {
  const { performPull } = proxyquire('../../src/tasks/pull', {
    '../lib/gulp/dest': {
      default: () => dest(destination),
    },
  });

  return performPull(nodes.map(n => new NodeId(n)));
}

export function push(source) {
  return performPush(source);
}

export const setupDir = join(__dirname, '../fixtures/setup');

export function setupPath(name) {
  return join(setupDir, `${name}.xml`);
}

export function importSetup(name, ...rename) {
  const uniqueId = id();
  const nodeNames = rename
    .map(r => {
      const parts = r.split('.');

      return [`${parts[0]}-${uniqueId}`, ...(parts.slice(1))].join('.');
    });

  const createReplaceStream = (original, renamed) => createTransformStream((file, _, callback) => {
    callback(null, Object.assign(file, {
      contents: replace(file.contents, original, renamed),
    }));
  });

  const sourceStream = gulpSrc(setupPath(name));
  const importStream = new ImportStream();

  return promisify(
    rename.reduce((current, original, i) => current
      .pipe(createReplaceStream(original, nodeNames[i])),
    sourceStream)
      .pipe(importStream)
  )
    .then(() => nodeNames);
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

  inputArguments({ nodeIds }) {
    return [
      new Variant({
        dataType: DataType.NodeId,
        arrayType: VariantArrayType.Array,
        value: nodeIds,
      }),
    ];
  }

}

export function exportNodes(nodeIds) {
  const stream = new ExportStream();

  stream.write({
    relative: 'TestHelper',
    nodeIds: nodeIds.map(raw => new NodeId(raw)), // new NodeId(nodeId),
  });

  stream.end();

  return promisify(stream);
}

export function exportNode(nodeId) {
  return exportNodes([nodeId]);
}

export function expectCorrectMapping(setup, node) {
  const originalNames = [].concat(node.name);
  let nodeNames;
  let nodePaths;
  let nodeIds;
  let destination;

  before(`import setup and pull ${setup}`, async function() {
    if (Array.isArray(node.name)) {
      if (node.name.length !== node.path.length) {
        throw new Error('Need the same number of paths as names');
      }
    }
    nodeNames = await importSetup(setup, ...originalNames);
    nodePaths = [].concat(node.path);
    nodeIds = nodeNames.map((nodeName, i) => {
      const path = nodePaths[i];
      const divider = path.match(/RESOURCES/) ? '/' : '.';
      return `${path}${divider}${nodeName}`;
    });
    destination = tmpDir(setup.replace(/\//g, '-'));

    // Run atscm pull
    await pull(nodeIds.map(nodeId => `ns=1;s=${nodeId}`), destination);

    // Delete the pulled nodes
    await Promise.all(nodeIds.map(nodeId => deleteNode(nodeId)));
  });

  it('should recreate all fields', async function() {
    // Run atscm push
    await push(join(destination, node.path.replace(/\./g, sep)));

    await new Promise(resolve => setTimeout(resolve, 500));

    const rawPushed = await exportNodes(nodeIds);
    const pushed = originalNames.reduce((str, original, i) => str
      .replace(new RegExp(nodeNames[i], 'g'), original),
    rawPushed.toString());

    const original = await readFile(setupPath(setup), 'utf8');

    function normalize(element) {
      if (element.attributes) {
        // eslint-disable-next-line no-param-reassign
        delete element.attributes.EventNotifier;
      }

      if (element.type === 'cdata') {
        // eslint-disable-next-line no-param-reassign
        element.value = element.value
          .replace(/\?>\s/, '?>')
          .replace(/(^\s+|\r?\n?)/gm, '')
          .replace(/ standalone="no"/, '');
      }

      delete element.rawValue

      return element;
    }

    function sortElements(current) {
      return Object.assign(current, {
        childNodes: current.childNodes && current.childNodes
          .filter(({ type, name }) => type !== 'text' && type !== 'comment' && name !== 'Aliases')
          .sort(({ attributes: a }, { attributes: b }) => {
            const gotA = a && a.NodeId;
            const gotB = b && b.NodeId;

            if (gotA) {
              if (gotB) {
                return a.NodeId < b.NodeId ? -1 : 1;
              }

              return -1;
            } else if (gotB) { return 1; }

            return 0;
          })
          .map(n => normalize(sortElements(n))),
      });
    }

    function sortedTree(xml) {
      return sortElements(parse(xml));
    }

    expect(sortedTree(pushed), 'to equal', sortedTree(original));
  });

  after('delete tmp node', function() {
    // Delete the pushed node
    return Promise.all(nodeIds.map(n => deleteNode(n)));
  });
}

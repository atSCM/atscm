import { join, sep } from 'path';
import replace from 'buffer-replace';
import promisify from 'stream-to-promise';
import { obj as createTransformStream } from 'through2';
import { StatusCodes, Variant, DataType, VariantArrayType } from 'node-opcua';
import { src as gulpSrc } from 'gulp';
import proxyquire from 'proxyquire';
import {
  parse,
  removeChildren,
  isElement,
  attributeValues,
  render,
  isElementWithName,
  isTextNode,
} from 'modify-xml';
import expect from '../expect';
import ImportStream from '../../src/lib/gulp/ImportStream';
import CallMethodStream from '../../src/lib/server/scripts/CallMethodStream';
import CallScriptStream from '../../src/lib/server/scripts/CallScriptStream';
import NodeId from '../../src/lib/model/opcua/NodeId';
import dest from '../../src/lib/gulp/dest';
import { performPush } from '../../src/tasks/push';
import { setupContext } from '../../src/hooks/hooks';
import checkAtserver from '../../src/hooks/check-atserver';
import { id, tmpDir, readFile } from './util';

export function pull(nodes, destination) {
  const { performPull } = proxyquire('../../src/tasks/pull', {
    '../lib/gulp/dest': {
      default: () => dest(destination),
    },
  });

  return performPull(nodes.map((n) => new NodeId(n)));
}

export async function push(source) {
  const context = setupContext();
  const { version: atserverVersion } = await checkAtserver(context);

  return performPush(source, { atserverVersion });
}

export const setupDir = join(__dirname, '../fixtures/setup');

export function setupPath(name) {
  return join(setupDir, `${name}.xml`);
}

export async function importSetup(name, ...rename) {
  const uniqueId = id();
  const nodeNames = rename.map((r) => {
    const parts = r.split('.');

    return [`${parts[0]}-${uniqueId}`, ...parts.slice(1)].join('.');
  });

  const createReplaceStream = (original, renamed) =>
    createTransformStream((file, _, callback) => {
      callback(
        null,
        Object.assign(file, {
          contents: replace(file.contents, original, renamed),
        })
      );
    });

  const doImport = async () => {
    const sourceStream = gulpSrc(setupPath(name));
    const importStream = new ImportStream();

    return promisify(
      rename
        .reduce(
          (current, original, i) => current.pipe(createReplaceStream(original, nodeNames[i])),
          sourceStream
        )

        .pipe(importStream)
    ).then(() => nodeNames);
  };

  let result;
  try {
    result = await doImport();
  } catch (error) {
    console.warn('Import failed, retry...');
    result = await doImport();
  }

  return result;
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
      callback(
        null,
        outArgs.slice(2).map((a) => a.value)
      );
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
        value: nodeIds.slice().reverse(),
      }),
    ];
  }
}

export function exportNodes(nodeIds) {
  const stream = new ExportStream();

  stream.write({
    relative: 'TestHelper',
    nodeIds: nodeIds.map((raw) => new NodeId(raw)), // new NodeId(nodeId),
  });

  stream.end();

  return promisify(stream);
}

export function exportNode(nodeId) {
  return exportNodes([nodeId]);
}

const renameReferences = new Map([
  // Atserver 3.5.x Uses "i=85" instead of "Objects" in references
  ['i=85', 'Objects'],
]);

function normalizeXml(xml) {
  const doc = parse(xml);

  // Atserver 3.3+ adds <Extensions><atvise Version="3.x"/></Extensions> to <UANodeSet>s
  removeChildren(doc.childNodes.find(isElement), 'Extensions');

  // This is just a collection of references that differs between atserver versions
  removeChildren(doc.childNodes.find(isElement), 'Aliases');

  /* eslint-disable no-param-reassign */
  const walk = (n) => {
    const parentIsReference = isElementWithName(n, 'Reference');

    n.childNodes = n.childNodes
      .reduce((all, child) => {
        if (child.type === 'comment' || (child.type === 'text' && child.value.match(/^\s*$/))) {
          return all;
        }

        // Normalize reference ids
        if (parentIsReference && isTextNode(child)) {
          const replacement = renameReferences.get(child.value);
          if (replacement) {
            child.value = replacement;
          }
        }

        return all.concat(child.type === 'element' ? walk(child) : child);
      }, [])
      .sort((nodeA, nodeB) => {
        const nameA = nodeA.name;
        const a = attributeValues(nodeA);
        const nameB = nodeB.name;
        const b = attributeValues(nodeB);

        const gotA = a && a.NodeId;
        const gotB = b && b.NodeId;

        if (gotA) {
          if (gotB) {
            return a.NodeId < b.NodeId ? -1 : 1;
          }

          return -1;
        } else if (gotB) {
          return 1;
        }

        return nameA < nameB ? -1 : 1;
      });

    delete n.tokens;
    if (n.attributes) {
      n.attributes = n.attributes.map((a) => {
        delete a.tokens;
        return a;
      });
    }

    return n;
  };

  /* eslint-enable no-param-reassign */

  return walk(doc);
}

export function compareXml(value, expected) {
  return expect(render(normalizeXml(value)), 'to equal', render(normalizeXml(expected)));
}

export function expectCorrectMapping(setup, node) {
  const originalNames = [].concat(node.name);
  let nodeNames;
  let nodePaths;
  let nodeIds;
  let destination;

  before(`import setup and pull ${setup}`, async function () {
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
    await pull(
      nodeIds.map((nodeId) => `ns=1;s=${nodeId}`),
      destination
    );

    // Delete the pulled nodes
    await Promise.all(nodeIds.map((nodeId) => deleteNode(nodeId)));
  });

  it('should recreate all fields', async function () {
    // Run atscm push
    const paths = (Array.isArray(node.path)
      ? [...new Set(Array.from(node.path))]
      : [node.path]
    ).map((path) => join(destination, path.replace(/\./g, sep)));

    for (const path of paths) {
      await push(path);
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    const rawPushed = await exportNodes(nodeIds);
    const pushed = originalNames.reduce(
      (str, original, i) => str.replace(new RegExp(nodeNames[i], 'g'), original),
      rawPushed.toString()
    );

    const original = await readFile(setupPath(setup), 'utf8');

    return compareXml(pushed, original);
  });

  after('delete tmp node', function () {
    // Delete the pushed node
    return Promise.all(nodeIds.map((n) => deleteNode(n)));
  });
}

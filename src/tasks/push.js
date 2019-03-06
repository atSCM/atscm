import { satisfies as validVersion } from 'semver';
import Logger from 'gulplog';
import { StatusCodes } from 'node-opcua/lib/datamodel/opcua_status_code';
import { NodeClass } from 'node-opcua/lib/datamodel/nodeclass';
import src from '../lib/gulp/src.js';
import { readNode, writeNode, createNode, addReferences } from '../api';
import { versionNode } from '../lib/server/scripts/version';
import { dependencies } from '../../package.json';
import Transformer, { TransformDirection } from '../lib/transform/Transformer.js';
import NodeId from '../lib/model/opcua/NodeId.js';
import { ReferenceTypeIds } from '../lib/model/Node.js';
import { reportProgress } from '../lib/helpers/log.js';
import ProjectConfig from '../config/ProjectConfig.js';
import { handleTaskError } from '../lib/helpers/tasks.js';

const openInBuilderStatus = new Set([
  StatusCodes.BadUserAccessDenied,
  StatusCodes.BadNotWritable,
]);
const ignoredReferences = new Set([
  ReferenceTypeIds.toParent,
  ReferenceTypeIds.HasTypeDefinition,
  ReferenceTypeIds.HasModellingRule,
]);

export function performPush(path, options) {
  const applyTransforms = Transformer.combinedTransformer(
    ProjectConfig.useTransformers, TransformDirection.FromFilesystem);

  const ensureReferences = node => {
    const references = [...node.references]
      .reduce((result, [key, value]) => {
        if (ignoredReferences.has(key)) { return result; }

        return Object.assign(result, {
          [key]: [...value].map(s => (typeof s === 'string' ? `ns=1;s=${s}` : s)),
        });
      }, {});

    if (Object.keys(references).length > 0) {
      return addReferences(node.nodeId, references)
        .then(({ outputArguments }) => {
          const [{ value: failures }] = outputArguments[3].value;

          if (failures) {
            throw new Error(`Failed to create reference(s) from ${node.nodeId} to ${
              failures.join(', ')}`);
          } else {
            Logger.debug(`Added ${Object.keys(references).length} reference(s) to ${node.nodeId}`);
          }
        });
    }

    return Promise.resolve();
  };

  const create = node => {
    const nodeId = new NodeId(node.nodeId);
    let parentNodeId = node.parent && node.parent.nodeId;

    if (!node.parent) {
      parentNodeId = nodeId.parent;
      Logger.debug(`Assuming ${parentNodeId} as parent of ${node.nodeId}`);
    }

    return createNode(nodeId, {
      name: node.name,
      parentNodeId,
      nodeClass: node.nodeClass,
      typeDefinition: node.typeDefinition,
      value: node.nodeClass === NodeClass.Variable && node.variantValue,
    })
      .then(({ outputArguments }) => {
        const [{ value: createdNode }, { value: createFailed }] = outputArguments[3].value;

        if (createFailed) {
          Logger.warn('Failed to create node', node.nodeId);
          return Promise.resolve();
        } else if (createdNode) {
          Logger.debug('Created node', node.nodeId);
        } else {
          // Node already existed
        }

        return ensureReferences(node);
      });
  };

  return src(path, {
    ...options,
    readNodeFile(node) {
      const r = ProjectConfig.useTransformers.reverse()
        .reduce((result, t) => (result === undefined ?
          t.readNodeFile(node) :
          result),
        undefined);
      return r === undefined ? true : r;
    },
    async handleNode(node) {
      const context = this;

      await applyTransforms(node, context);

      if (node.push === false) { // Skip write
        return false;
      }

      // Create / write node
      if (node.nodeClass !== NodeClass.Variable) {
        return create(node);
      }

      // console.error('write', node.nodeId, node.value);
      return writeNode(`ns=1;s=${node.nodeId}`, node.variantValue)
        .then(
          () => ensureReferences(node),
          err => {
            if (openInBuilderStatus.has(err.statusCode)) {
              Logger.warn(`Error writing node ${
                node.nodeId
              }
    - Make sure it is not opened in atvise builder
    - Make sure the corresponding datasource is connected`);
              return StatusCodes.Good;
            }

            if (err.statusCode === StatusCodes.BadNodeIdUnknown) {
              Logger.debug(`Node ${
                node.nodeId
              } does not exist: Attempting to create it...`);

              return create(node);
            }

            throw err;
          }
        );
    },
  });
}

/**
 * Pushes {@link AtviseFile}s to atvise server.
 */
export default function push() {
  Logger.debug('Checking server setup');

  return readNode(versionNode)
    .catch(err => {
      if (err.statusCode && err.statusCode === StatusCodes.BadNodeIdUnknown) {
        throw Object.assign(new Error(`Invalid server scripts version
- Please run 'atscm import' again to update`), { originalError: err });
      }

      throw err;
    })
    .then(({ value: version }) => {
      const required = dependencies['@atscm/server-scripts'];
      Logger.debug(`Found server scripts version: ${version}`);

      try {
        const valid = validVersion(version.split('-beta')[0], required);

        return { version, valid, required };
      } catch (err) {
        throw Object.assign(new Error(`Invalid server scripts version
- Please run 'atscm import' again to update`), { originalError: err });
      }
    })
    .then(({ valid, version, required }) => {
      if (!valid) {
        throw new Error(`Invalid server scripts version: ${version} (${required} required)
- Please run 'atscm import' again to update`);
      }
    })
    .then(() => {
      const promise = performPush('./src');

      return reportProgress(promise, {
        getter: () => promise.browser._pushedPath.size,
        formatter: count => `Processed ${count} files`,
      });
    })
    .catch(handleTaskError);
}

push.description = 'Push all stored nodes to atvise server';

import Logger from 'gulplog';
import { StatusCodes } from 'node-opcua/lib/datamodel/opcua_status_code';
import { NodeClass } from 'node-opcua/lib/datamodel/nodeclass';
import src from '../lib/gulp/src';
import { writeNode, createNode, addReferences } from '../api';
import Transformer, { TransformDirection } from '../lib/transform/Transformer';
import NodeId from '../lib/model/opcua/NodeId';
import { ReferenceTypeIds, ReferenceTypeNames } from '../lib/model/Node';
import { reportProgress } from '../lib/helpers/log';
import ProjectConfig from '../config/ProjectConfig';
import { finishTask, handleTaskError } from '../lib/helpers/tasks';
import Session from '../lib/server/Session';
import checkServerscripts from '../hooks/check-serverscripts';
import checkAtserver from '../hooks/check-atserver';
import { setupContext } from '../hooks/hooks';

/**
 * Status codes indicating a node is opened in atvise builder and therefore not writable right now.
 * @type {Set<node-opcua~StatusCodes>}
 */
const openInBuilderStatus = new Set([StatusCodes.BadUserAccessDenied, StatusCodes.BadNotWritable]);

/**
 * The reference types ignored when adding references. The corresponding references are created
 * alongside the node itself using the 'CreateNode' server script.
 * @type {Set<node-opcua~ReferenceTypeId>}
 */
const ignoredReferences = new Set([
  ReferenceTypeIds.toParent,
  ReferenceTypeIds.HasTypeDefinition,
  // ReferenceTypeIds.HasModellingRule,
]);

/**
 * Pushes the given path to the server.
 * @param {string} path The local path to push.
 * @param {Object} options Options passed to {@link src}.
 */
export function performPush(path, options) {
  const applyTransforms = Transformer.combinedTransformer(
    ProjectConfig.useTransformers,
    TransformDirection.FromFilesystem
  );

  const ensureReferences = node => {
    const references = [...node.references].reduce((result, [key, value]) => {
      if (ignoredReferences.has(key)) {
        return result;
      }

      return Object.assign(result, {
        [key]: [...value].map(s => (typeof s === 'string' ? `ns=1;s=${s}` : s)),
      });
    }, {});

    if (Object.keys(references).length > 0) {
      return addReferences(node.nodeId, references)
        .then(({ outputArguments }) => {
          const [{ value: failures }] = outputArguments[3].value;

          if (failures) {
            throw new Error(
              `Failed to create reference(s) from ${node.nodeId} to ${failures.join(', ')}`
            );
          } else {
            Logger.debug(`Added ${Object.keys(references).length} reference(s) to ${node.nodeId}`);
          }
        })
        .catch(err => {
          throw Object.assign(err, { node });
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
      modellingRule: node.modellingRule,
      reference: ReferenceTypeNames[node.references.getSingle(ReferenceTypeIds.toParent)],
      value:
        node.nodeClass && node.nodeClass.value === NodeClass.Variable.value && node.variantValue,
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
      })
      .catch(err => {
        throw Object.assign(err, { node });
      });
  };

  return src(path, {
    ...options,
    readNodeFile(node) {
      const r = ProjectConfig.useTransformers
        .reverse()
        .reduce((result, t) => (result === undefined ? t.readNodeFile(node) : result), undefined);
      return r === undefined ? true : r;
    },
    async handleNode(node) {
      // NOTE: context = this
      await applyTransforms(node, this);

      if (node.push === false) {
        // Skip write
        return false;
      }

      // Create / write node
      if (node.nodeClass.value !== NodeClass.Variable.value) {
        return create(node);
      }

      // console.error('write', node.nodeId, node.value);
      return writeNode(`ns=1;s=${node.nodeId}`, node.variantValue).then(
        () => ensureReferences(node),
        err => {
          if (openInBuilderStatus.has(err.statusCode)) {
            Logger.warn(`Error writing node ${node.nodeId}
    - Make sure it is not opened in atvise builder
    - Make sure the corresponding datasource is connected`);
            return StatusCodes.Good;
          }

          if (err.statusCode === StatusCodes.BadNodeIdUnknown) {
            Logger.debug(`Node ${node.nodeId} does not exist: Attempting to create it...`);

            return create(node);
          }

          throw Object.assign(err, { node });
        }
      );
    },
  });
}

/**
 * Pushes {@link AtviseFile}s to atvise server.
 */
export default async function push() {
  Session.pool();

  const context = setupContext();

  await checkAtserver(context);
  await checkServerscripts(context);

  const promise = performPush('./src');

  return reportProgress(promise, {
    getter: () => promise.browser._pushedPath.size,
    formatter: count => `Processed ${count} files`,
  }).then(finishTask, handleTaskError);
}

push.description = 'Push all stored nodes to atvise server';

import { StatusCodes } from 'node-opcua';
import expect from '../../../expect';
import NodeId from '../../../../src/lib/model/opcua/NodeId';
import AddReferencesStream from '../../../../src/lib/server/AddReferencesStream';
import { ReferenceTypeIds } from '../../../../src/lib/model/Node';

/** @test {AddReferencesStream} */
describe('AddReferencesStream', function() {
  /** @test {AddReferencesStream#scriptId} */
  describe('#scriptId', function() {
    it("should return the AddReferences script's id", function() {
      expect(
        AddReferencesStream.prototype.scriptId.value,
        'to equal',
        'SYSTEM.LIBRARY.ATVISE.SERVERSCRIPTS.atscm.AddReferences'
      );
    });
  });

  /** @test {AddReferencesStream#scriptParameters} */
  describe('#scriptParameters', function() {
    it('should return null without references', function() {
      expect(
        AddReferencesStream.prototype.scriptParameters({ references: new Map() }),
        'to be',
        null
      );
    });

    it('should return null witout additional references', function() {
      expect(
        AddReferencesStream.prototype.scriptParameters({
          references: new Map([
            [ReferenceTypeIds.toParent, new Set([1])],
            [ReferenceTypeIds.HasTypeDefinition, new Set([2])],
            [ReferenceTypeIds.HasModellingRule, new Set([3])],
          ]),
        }),
        'to be',
        null
      );
    });

    it('should return JSON string for additional references', function() {
      expect(
        AddReferencesStream.prototype.scriptParameters({
          references: new Map([
            [ReferenceTypeIds.toParent, new Set([1])],
            [ReferenceTypeIds.HasTypeDefinition, new Set([2])],
            [ReferenceTypeIds.HasModellingRule, new Set([3])],
            [
              ReferenceTypeIds.HasComponent,
              new Set(['SYSTEM.LIBRARY.ATVISE.ALARMCATEGORIES.Error']),
            ],
          ]),
        }),
        'to satisfy',
        {
          paramObjString: {
            // eslint-disable-next-line max-len
            value:
              '{"references":[{"referenceIdValue":47,"items":["ns=1;s=SYSTEM.LIBRARY.ATVISE.ALARMCATEGORIES.Error"]}]}',
          },
        }
      );
    });
  });

  /** @test {AddReferencesStream#processErrorMessage} */
  describe('#processErrorMessage', function() {
    it('should decorate the error message', function() {
      expect(
        AddReferencesStream.prototype.processErrorMessage({
          nodeId: new NodeId('ns=1;s=AGENT.OBJECTS.Test'),
        }),
        'to contain',
        'AGENT.OBJECTS.Test',
        'adding references'
      );
    });
  });

  /** @test {AddReferencesStream#handleOutputArguments} */
  describe('#handleOutputArguments', function() {
    it('should error with bad status codes', function() {
      return expect(
        AddReferencesStream.prototype.handleOutputArguments.bind(null, {}, [
          { value: StatusCodes.Bad },
          { value: 'Something bad happened' },
        ]),
        'to call the callback with error',
        'Something bad happened'
      );
    });

    it('should retry when script had failures', async function() {
      const stream = new AddReferencesStream();
      const file = { nodeId: new NodeId('AGENT.OBJECTS.Failing') };
      const handleOutput = AddReferencesStream.prototype.handleOutputArguments.bind(stream, file, [
        { value: StatusCodes.Good },
        {},
        {},
        {
          value: [{ value: [new NodeId('A.Referenced.Node')] }],
        },
      ]);

      // The first time adding references fails is ignored
      await expect(handleOutput, 'to call the callback without error');

      // and pushed to the retry stack
      expect(Array.from(stream._retry.values()), 'to equal', ['AGENT.OBJECTS.Failing']);

      // The second time it should fail.
      await expect(
        handleOutput,
        'to call the callback with error',
        /Failed to create reference.+A.Referenced.Node/i
      );
    });

    it('should continue without failures', function() {
      return expect(
        AddReferencesStream.prototype.handleOutputArguments.bind(null, {}, [
          { value: StatusCodes.Good },
          {},
          {},
          {
            value: [{ value: [] }],
          },
        ]),
        'to call the callback without error'
      );
    });
  });
});

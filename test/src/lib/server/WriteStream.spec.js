import { spy } from 'sinon';
import { StatusCodes, resolveNodeId } from 'node-opcua';
import Logger from 'gulplog';
import expect from '../../../expect';
import WriteStream from '../../../../src/lib/server/WriteStream';
import AtviseFile from '../../../../src/lib/server/AtviseFile';

/** @test {WriteStream} */
describe('WriteStream', function() {
  /** @test {WriteStream#processErrorMessage} */
  describe('#processErrorMessage', function() {
    it('should include nodeId', function() {
      expect(WriteStream.prototype.processErrorMessage(new AtviseFile({
        path: 'src/AGENT/DISPLAYS/Main.display',
        base: 'src',
      })), 'to contain', 'AGENT.DISPLAYS.Main');
    });
  });

  /** @test {WriteStream#processChunk} */
  describe('#processChunk', function() {
    it('should forward errors', function() {
      const stream = new WriteStream();

      stream.prependOnceListener('session-open', () => {
        stream.session.writeSingleNode = (nodeId, value, callback) => callback(new Error('Test'));
      });

      return expect([{ nodeId: resolveNodeId('ns=1;s=AGENT.DISPLAYS.Main') }],
        'when piped through', stream,
        'to error with', /Test/);
    });

    it('should forward synchronous errors', function() {
      const stream = new WriteStream();

      stream.prependOnceListener('session-open', () => {
        stream.session.writeSingleNode = () => {
          throw new Error('Sync test');
        };
      });

      return expect([{ nodeId: resolveNodeId('ns=1;s=AGENT.DISPLAYS.Main') }],
        'when piped through', stream,
        'to error with', /Sync test/);
    });

    it('should warn if access is denied', function() {
      const stream = new WriteStream();

      stream.prependOnceListener('session-open', () => {
        stream.session.writeSingleNode = (nodeId, value, callback) =>
          callback(null, StatusCodes.BadUserAccessDenied);
      });

      const warnSpy = spy();
      Logger.on('warn', warnSpy);

      return expect([{ nodeId: resolveNodeId('ns=1;s=AGENT.DISPLAYS.Main') }],
        'when piped through', stream,
        'to yield objects satisfying', 'to have length', 0)
        .then(() => expect(warnSpy, 'was called once'))
        .then(() => expect(warnSpy.lastCall, 'to satisfy', [/opened in atvise builder/]));
    });

    it('should forward file with good status', function() {
      const stream = new WriteStream();

      stream.prependOnceListener('session-open', () => {
        stream.session.writeSingleNode = (nodeId, value, callback) =>
          callback(null, StatusCodes.Good);
      });

      const file = { nodeId: resolveNodeId('ns=1;s=AGENT.DISPLAYS.Main') };
      return expect([file],
        'when piped through', stream,
        'to yield objects satisfying', [
          expect.it('to be', file),
        ]);
    });
  });
});

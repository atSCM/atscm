import { stub, spy } from 'sinon';
import { DataType, VariantArrayType, StatusCodes, resolveNodeId } from 'node-opcua';
import Logger from 'gulplog';
import expect from '../../../expect';
import WriteStream from '../../../../src/lib/server/WriteStream';
import AtviseFile from '../../../../src/lib/server/AtviseFile';

/** @test {WriteStream} */
describe('WriteStream', function() {
  /** @test {WriteStream#writeFile} */
  describe('#writeFile', function() {
    it('should forward write errors', function() {
      const stream = new WriteStream();
      stream.once('session-open', () => {
        stub(stream.session, 'writeSingleNode', (node, value, cb) => cb(new Error('Test')));
      });

      stream.on('data', () => stream.end()); // Unpause readable stream
      stream.write(new AtviseFile({ path: 'AGENT/DISPLAYS/Main.display' }));

      return expect(stream, 'to error with', /Test/);
    });

    it('should forward synchronous errors', function() {
      const stream = new WriteStream();
      stream.once('session-open', () => {
        stub(stream.session, 'writeSingleNode', () => {
          throw new Error('Sync Test');
        });
      });

      stream.on('data', () => stream.end()); // Unpause readable stream
      stream.write(new AtviseFile({ path: 'AGENT/DISPLAYS/Main.display' }));

      return expect(stream, 'to error with', /Sync Test/);
    });

    it('should call node-opcua~ClientSession#writeSingleNode', function(done) {
      const stream = new WriteStream();
      stream.once('session-open', () => {
        stub(stream.session, 'writeSingleNode', (node, value, cb) => cb(null, StatusCodes.Good));
      });

      stream.on('data', () => {}); // Unpause readable stream
      stream.write(new AtviseFile({ path: 'AGENT/DISPLAYS/Main.display' }));

      stream.once('end', () => {
        const writeStub = stream.session.writeSingleNode;
        expect(writeStub.calledOnce, 'to be', true);

        const args = writeStub.lastCall.args;
        expect(args[0], 'to equal', 'ns=1;s=AGENT.DISPLAYS.Main');
        expect(args[1].dataType, 'to equal', DataType.XmlElement);
        expect(args[1].arrayType, 'to equal', VariantArrayType.Scalar);

        done();
      });

      stream.end();
    });

    it('should warn on access denied status', function() {
      const stream = new WriteStream();

      stream.once('session-open', () => {
        stub(stream.session, 'writeSingleNode',
          (node, value, cb) => cb(null, StatusCodes.BadUserAccessDenied));
      });

      const nodeId = resolveNodeId('ns=1;s=AGENT.DISPLAYS.Main');

      const warnSpy = spy();
      Logger.on('warn', warnSpy);

      return expect([{ nodeId }], 'when piped through', stream,
        'to yield objects satisfying', 'to have length', 1)
        .then(() => {
          expect(warnSpy.calledOnce, 'to be true');
          expect(warnSpy.lastCall.args[0], 'to match', /opened in atvise builder/);
        });
    });

    it('should forward invalid status codes', function() {
      const stream = new WriteStream();

      stream.once('session-open', () => {
        stub(stream.session, 'writeSingleNode',
          (node, value, cb) => cb(null, StatusCodes.BadTypeMismatch));
      });

      return expect([{ nodeId: resolveNodeId('ns=1;s=AGENT.DISPLAYS.Main') }],
        'when piped through', stream,
        'to error with', /Error writing node ns=1;s=AGENT\.DISPLAYS\.Main: .+/);
    });
  });

  /** @test {WriteStream#_transform} */
  describe('#_transform', function() {
    it('should wait for session to open', function(done) {
      const stream = new WriteStream();
      stub(stream, 'writeFile', (file, cb) => cb(null));
      spy(stream, '_transform');

      stream.on('data', () => {}); // Unpause readable stream
      stream.write(new AtviseFile({ path: 'AGENT/DISPLAYS/Main.display' }));

      expect(stream._transform.calledOnce, 'to be', true);
      expect(stream.writeFile.callCount, 'to equal', 0);

      stream.once('end', () => {
        expect(stream._transform.calledOnce, 'to be', true);
        expect(stream.writeFile.calledOnce, 'to be', true);
        done();
      });

      stream.end();
    });

    it('should write immediately if session is open', function(done) {
      const stream = new WriteStream();
      stub(stream, 'writeFile', (file, cb) => cb(null));

      stream.on('data', () => {}); // Unpause readable stream

      stream.once('session-open', () => {
        stream.write(new AtviseFile({ path: 'AGENT/DISPLAYS/Main.display' }));
        expect(stream.writeFile.calledOnce, 'to be true');
        stream.end();
      });

      stream.on('end', done);
    });

    /* it('should forward invalid status codes', function(done) {
      const stream = new WriteStream();
      stub(stream, 'writeFile', (file, cb) => cb(null));

      /* stream.on('data', () => {}); // Unpause readable stream

      stream.once('session-open', () => {
        stream.write(new AtviseFile({ path: 'AGENT/DISPLAYS/Main.display' }));
        expect(stream.writeFile.calledOnce, 'to be true');
        stream.end();
      }); *

      return expect([{ nodeId: resolveNodeId('ns=1;s=AGENT.DISPLAYS.Main') }],
        'when piped through', stream,
        'to error with', /Error writing ns=1;s=AGENT\.DISPLAYS\.Main/);

      // stream.on('end', done);
    }); */
  });
});

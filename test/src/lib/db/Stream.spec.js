import expect from 'unexpected';
import { spy } from 'sinon';

import { Stream as CoreStream } from 'stream';
import Stream from '../../../../src/lib/db/Stream';

/** @test {Stream} */
describe('Stream', function() {
  /** @test {Stream#constructor} */
  describe('#constructor', function() {
    it('should work with no arguments', function() {
      expect(() => new Stream(), 'not to throw');
    });

    it('should create a stream', function() {
      expect((new Stream()), 'to be a', CoreStream);
    });
  });
  
  /** @test {Stream#runWithSession} */
  describe('#runWithSession', function() {
    context('with failing stream', function() {
      const testErr = new Error('Test');

      class FailingStream extends Stream {

        runWithSession() {
          return Promise.reject(testErr);
        }

      }

      it('should pass errors to stream', function(done) {
        new FailingStream()
          .on('error', err => {
            expect(err, 'to equal', testErr);
            done();
          });
      });
    });

    it('should close session after stream ended', function(done) {
      let session;

      const stream = new Stream()
        .once('session-open', () => {
          session = stream.session;
          spy(session, 'close');

          stream.end();
        })
        .on('data', () => {}) // To unpause stream
        .on('end', () => {
          expect(session.close.calledOnce, 'to be', true);
          done();
        });
    });

    it('should call transfromWithSession on data', function(done) {
      const stream = new Stream();

      spy(stream, 'transformWithSession');

      stream.write('Test');

      stream.on('session-open', () => {
        expect(stream.transformWithSession.calledOnce, 'to be true');
        expect(stream.transformWithSession.lastCall.args[0], 'to equal', 'Test');

        // Test with existing session
        stream.write('Test2');
        expect(stream.transformWithSession.calledTwice, 'to be true');
        expect(stream.transformWithSession.lastCall.args[0], 'to equal', 'Test2');

        stream.end();
      })
        .on('data', () => {}) // To unpause stream
        .on('end', () => done());
    });
  });
});

import { StatusCodes } from 'node-opcua';
import { spy, stub } from 'sinon';
import expect from '../../../expect';
import QueueStream from '../../../../src/lib/server/QueueStream';

function fakeQueueStream(
  err = null, status = StatusCodes.Good, onSuccess = done => done(), options = {}
) {
  return new (class FakeQueueStream extends QueueStream {
    processErrorMessage(chunk) { return `Error processing ${chunk}`; }
    processChunk(chunk, handle) {
      handle(err, status, onSuccess);
    }
  })(options);
}

/** @test {QueueStream} */
describe('QueueStream', function() {
  /** @test {QueueStream#constructor} */
  describe('#constructor', function() {
    it('should work without options', function() {
      expect(() => new QueueStream(), 'not to throw');
    });

    it('should store maxParallel option', function() {
      expect((new QueueStream({ maxParallel: 99 }))._maxParallel, 'to equal', 99);
    });

    it('should store start date', function() {
      expect((new QueueStream())._start, 'to be a', 'number');
    });

    it('should listen for processed-chunk events', function() {
      expect((new QueueStream()).listenerCount('processed-chunk'), 'to be', 1);
    });
  });

  /** @test {QueueStream#hasPending} */
  describe('#hasPending', function() {
    it('should return true if there are queued operations', function() {
      const stream = new QueueStream();
      stream._queued.push({});

      expect(stream.hasPending, 'to be', true);
    });

    it('should return true if there are running operations', function() {
      const stream = new QueueStream();
      stream._processing = 1;

      expect(stream.hasPending, 'to be', true);
    });

    it('should return false otherwise', function() {
      expect((new QueueStream()).hasPending, 'to be', false);
    });
  });

  /** @test {QueueStream#queueEmpty} */
  describe('#queueEmpty', function() {
    it('should return true if not operations are queued', function() {
      expect((new QueueStream()).queueEmpty, 'to be', true);
    });

    it('should return false if there are queued operations', function() {
      const stream = new QueueStream();
      stream._queued.push({});

      expect(stream.queueEmpty, 'to be', false);
    });
  });

  /** @test {QueueStream#processed} */
  describe('#processed', function() {
    it('should return the number of processed items', function() {
      const stream = new QueueStream();
      stream._processed = 13;

      expect(stream.processed, 'to equal', 13);
    });
  });

  /** @test {QueueStream#opsPerSecond} */
  describe('#opsPerSecond', function() {
    it('should return 0 right after creating the stream', function() {
      expect((new QueueStream()).opsPerSecond, 'to be', 0);
    });

    it('should return the number of processed items after one second', function() {
      const stream = new QueueStream();
      stream._start -= 1000;
      stream._processed = 13;

      expect(stream.opsPerSecond, 'to be close to', 13, 0.5);
    });
  });

  /** @test {QueueStream#processErrorMessage} */
  describe('#processErrorMessage', function() {
    it('should throw if not overridden', function() {
      expect(() => (new QueueStream()).processErrorMessage({}), 'to throw', /must be implemented/);
    });
  });

  /** @test {QueueStream#processChunk} */
  describe('#processChunk', function() {
    it('should throw if not overridden', function() {
      expect(cb => (new QueueStream()).processChunk({}, cb),
        'to call the callback with error', /must be implemented/);
    });
  });

  /** @test {QueueStream#_processChunk} */
  describe('#_processChunk', function() {
    it('should increase #_processing', function() {
      const stream = fakeQueueStream();

      expect(stream._processing, 'to equal', 0);
      stream._processChunk('item');
      expect(stream._processing, 'to equal', 0);
    });

    it('should emit processed-chunk event', function() {
      const stream = fakeQueueStream();
      const listener = spy();
      stream.on('processed-chunk', listener);

      stream._processChunk('item');
      expect(listener, 'was called once');
      expect(listener.lastCall, 'to satisfy', ['item']);
    });

    it('should emit errors', function() {
      const stream = fakeQueueStream(new Error('Test'));
      const listener = spy();
      stream.on('error', listener);

      stream._processChunk('item');
      expect(listener, 'was called once');
      expect(listener.lastCall, 'to satisfy', [/Error processing item: Test/]);
    });

    it('should emit error on invalid status', function() {
      const stream = fakeQueueStream(null, StatusCodes.BadAggregateInvalidInputs);

      const listener = spy();
      stream.on('error', listener);

      stream._processChunk('item');
      expect(listener, 'was called once');
      expect(listener.lastCall, 'to satisfy', [/invalid data inputs/]);
    });
  });

  /** @test {QueueStream#_enqueueChunk} */
  describe('#_enqueueChunk', function() {
    it('should call _processChunk if allowed', function() {
      const stream = fakeQueueStream();
      stub(stream, '_processChunk');

      stream._enqueueChunk('item');
      expect(stream._processChunk, 'was called once');
      expect(stream._processChunk.lastCall, 'to satisfy', ['item']);
    });

    it('should add chunk to queue if maxParallel is reached', function() {
      const stream = fakeQueueStream();
      stream._processing = stream._maxParallel;

      stream._enqueueChunk('item');
      expect(stream._queued, 'to have length', 1);
      expect(stream._queued, 'to contain', 'item');
    });
  });

  /** @test {QueueStream#_transform} */
  describe('#_transform', function() {
    it('should wait for session to open', function() {
      const stream = fakeQueueStream();
      stub(stream, '_enqueueChunk');

      stream._transform('item', 'utf8', () => {});
      expect(stream._enqueueChunk, 'was not called');
    });

    it('should enqueue item once session is open', function(done) {
      const stream = fakeQueueStream();
      stub(stream, '_enqueueChunk');

      stream.once('session-open', () => {
        stream._transform('item', 'utf8', () => {});
        expect(stream._enqueueChunk, 'was called once');
        expect(stream._enqueueChunk.lastCall, 'to satisfy', ['item']);
        done();
      });
    });
  });

  /** @test {QueueStream#_flush} */
  describe('#_flush', function() {
    it('should wait for queue to drain', function() {
      const stream = fakeQueueStream();
      stream._processing = 1;
      const listener = spy();
      stream._flush(listener);

      expect(listener, 'was not called');

      stream.emit('drained');
      expect(listener, 'was called once');
    });

    it('should flush instantly if queue is empty', function() {
      const stream = fakeQueueStream();
      const listener = spy();
      stream._flush(listener);

      expect(listener, 'was called once');
    });
  });

  context('when chunk has been processed', function() {
    context('and queue is empty', function() {
      it('should emit drained if not processing any items', function() {
        const stream = new QueueStream();
        const listener = spy();
        stream.on('drained', listener);

        stream.emit('processed-chunk');
        expect(listener, 'was called once');
      });

      it('should not emit drained if processing an items', function() {
        const stream = new QueueStream();
        stream._processing = 1;
        const listener = spy();
        stream.on('drained', listener);

        stream.emit('processed-chunk');
        expect(listener, 'was not called');
      });
    });

    context('and queue is not empty', function() {
      it('should call _processChunk with queued chunk', function() {
        const stream = new QueueStream();
        const item = {};
        stub(stream, '_processChunk');
        stream._queued = [item];

        stream.emit('processed-chunk');
        expect(stream._processChunk, 'was called once');
        expect(stream._processChunk, 'was called with', item);
      });
    });
  });
});

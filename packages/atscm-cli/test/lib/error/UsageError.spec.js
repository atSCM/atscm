import expect from 'unexpected';
import UsageError from '../../../src/lib/error/UsageError';

/** @test {UsageError} */
describe('UsageError', function() {
  const msg = 'Invalid argument: missing';
  const help = 'Usage: ...';

  /** @test {UsageError#constructor} */
  describe('#constructor', function() {
    it('should create an instance of Error', function() {
      expect(new UsageError(msg, help), 'to be a', Error);
    });

    it('should create a stack trace', function() {
      expect(new UsageError(msg, help).stack, 'to be defined');
      expect(new UsageError(msg, help).stack, 'to be a', 'string');
    });
  });
});

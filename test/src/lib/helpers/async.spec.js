import expect from '../../../expect';
import { delay, promisified } from '../../../../src/lib/helpers/async';

/** @test {delay} */
describe('delay', function() {
  it('should resolve after duration', function() {
    expect(() => delay(100), 'to be fulfilled');
  });
});

/** @test {promisified} */
describe('promisified', function() {
  it('should be fulfilled when async function calls callback', function() {
    expect(promisified(cb => process.nextTick(cb)), 'to be fulfilled');
  });

  it('should be rejected when async function fails', function() {
    function failingAsync(callback) {
      process.nextTick(() => {
        callback(new Error('Oops'));
      });
    }

    expect(promisified(cb => failingAsync(cb)), 'to be rejected with', 'Oops');
  });
});

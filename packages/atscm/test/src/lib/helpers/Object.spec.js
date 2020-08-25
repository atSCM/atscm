import expect from '../../../expect';
import { reverse } from '../../../../src/lib/helpers/Object';

/** @test {reverse} */
describe('reverse', function() {
  it('should return an object with keys and values switched', function() {
    expect(reverse({ a: 1, 2: 'b' }), 'to equal', { 1: 'a', b: '2' });
  });
});

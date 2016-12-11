import expect from 'unexpected';

import * as tasks from '../src/Gulpfile';

describe('test', function() {
  it('should be run', function() {
    expect(true, 'to be true');
  });
});

describe('Task', function() {
  describe('default', function() {
    it('should exist', function() {
      expect(tasks.default(), 'to equal', 'config');
    });
  });
});

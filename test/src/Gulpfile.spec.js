import expect from 'unexpected';

import * as tasks from '../../src/Gulpfile';

describe('Gulpfile', function() {
  it('should export description for all tasks', function() {
    Object.keys(tasks).forEach(name => {
      const desc = tasks[name].description;

      expect(desc, 'to be defined');
      expect(desc, 'not to be empty');
    });
  });
});

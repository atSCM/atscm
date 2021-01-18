import expect from 'unexpected';
import { escapeForRegExp } from '../../../src/lib/regexp';

describe('regex helpers', function () {
  describe('excapeForRegExp', function () {
    it('should escape special characters', function () {
      const regExp = new RegExp(`^${escapeForRegExp('test.json')}$`);
      expect('test.json', 'to match', regExp);
      expect('testxjson', 'not to match', regExp);
    });
  });
});

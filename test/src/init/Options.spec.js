import expect from 'unexpected';

import InitOptionsAsArray, { InitOptions, ConfigLangs } from '../../../src/init/Options';
import InitOption from '../../../src/lib/init/Option';

/** @test {InitOptions} */
describe('InitOptions', function() {
  it('should contain InitOptions stored against names', function() {
    Object.keys(InitOptions).forEach(key => {
      expect(key, 'to be a', 'string');
      expect(InitOptions[key], 'to be a', InitOption);
    });
  });
});

/** @test {InitOptionsAsArray} */
describe('InitOptionsAsArray', function() {
  it('should contain all InitOptions', function() {
    InitOptionsAsArray.forEach(opt => {
      expect(InitOptions[opt.name], 'to be defined');
      expect(opt, 'to have properties', InitOptions[opt.name]);
    });
  });
});

import { Buffer } from 'buffer';
import expect from '../expect';
import DisplayTransformer from '../../src/transform/DisplayTransformer';
import { TransformDirection } from '../../src/lib/transform/Transformer';
import AtviseFile from '../../src/lib/server/AtviseFile';

describe('Issues', function() {
  /** @test {DisplayTransformer#createCombinedFile} */
  describe('#46: Order from the svg code is not correct', function() {
    it('should keep tag ordering', function() {
      const transformer = new DisplayTransformer({ direction: TransformDirection.FromDB });

      const testSvg = `<?xml version='1.0' encoding='UTF-8' standalone='no'?>
<svg>
  <text></text>
  <rect></rect>
  <text></text>
</svg>`;

      function asFile(ext, contentString) {
        return new AtviseFile({
          cwd: '/',
          base: '/test/',
          path: `/test/Display.display/Display${ext}`,
          contents: Buffer.from(contentString),
        });
      }

      return expect(cb => transformer.createCombinedFile({
        '.json': asFile('.json', JSON.stringify({
          dependencies: ['dep1.js'],
          parameters: [{
            name: 'test',
            valuetype: 'boolean',
            default: true,
          }],
        })),
        '.js': asFile('.js', 'console.log(\'test: do not escape <this>\')'),
        '.svg': asFile('.svg', testSvg),
      }, { contents: '' }, cb), 'to call the callback without error')
        .then(args => args[0].contents.toString())
        .then(resultSvg => expect(resultSvg, 'to match', /<text.*\r?\n.*<rect.*\r?\n.*<text/));
    });
  });
});

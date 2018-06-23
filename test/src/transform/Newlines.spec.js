import { EOL } from 'os';
import expect from '../../expect';
import NewlinesTransformer from '../../../src/transform/Newlines';
import File from '../../../src/lib/server/AtviseFile';

describe.only('NewlinesTransformer', function() {
  /** @test {MappingTransformer#constructor} */
  describe('#constructor', function() {
    context('trailingNewlines option', function() {
      it('should default to false', function() {
        const transformer = new NewlinesTransformer();
        expect(transformer._addTrailingNewlines, 'to be', false);

        const transformer2 = new NewlinesTransformer({});
        expect(transformer2._addTrailingNewlines, 'to be', false);
      });
    });
  });

  /** @test {NewlinesTransformer#shouldBeTransformed} */
  describe('#shouldBeTransformed', function() {
    it('should return true for reference files', function() {
      expect(NewlinesTransformer.prototype.shouldBeTransformed, 'called with',
        [new File({
          path: './src/test/.Object.json',
          contents: Buffer.from('{}'),
        })], 'to be', true);
    });

    it('should return true for source files', function() {
      expect(NewlinesTransformer.prototype.shouldBeTransformed, 'called with',
        [new File({
          path: './src/test/Test.script/Test.js',
          contents: Buffer.from(''),
        })], 'to be', true);
    });

    it('should return false for binary files', function() {
      expect(NewlinesTransformer.prototype.shouldBeTransformed, 'called with',
        [new File({
          path: './src/test/Test.jpg',
          contents: Buffer.from(''),
        })], 'to be', false);
    });
  });

  /** @test {NewlinesTransformer#transformFromDB} */
  describe('#transformFromDB', function() {
    it('should replace non-native newlines', function() {
      const transformer = new NewlinesTransformer({ trailingNewlines: false });
      const lines = ['first line', 'second'];

      return expect(cb => transformer.transformFromDB(new File({
        path: './src/test/Test.script/Test.js',
        contents: Buffer.from(lines.join('\r\n')),
      }), 'utf8', cb), 'to call the callback without error')
        .then(([file]) => expect(file.contents, 'when decoded as', 'utf8',
          'to equal', lines.join(EOL)));
    });

    it('should add trailing newlines if set', function() {
      const transformer = new NewlinesTransformer({ trailingNewlines: true });
      const lines = ['first line', 'second'];

      return expect(cb => transformer.transformFromDB(new File({
        path: './src/test/Test.script/Test.js',
        contents: Buffer.from(lines.join('\r\n')),
      }), 'utf8', cb), 'to call the callback without error')
        .then(([file]) => expect(file.contents, 'when decoded as', 'utf8',
          'to equal', lines.concat('').join(EOL)));
    });
  });

  /** @test {NewlinesTransformer#transformFromFilesystem} */
  describe('#transformFromFilesystem', function() {
    it('should replace native newlines', function() {
      const transformer = new NewlinesTransformer({ trailingNewlines: false });
      const lines = ['first line', 'second'];

      return expect(cb => transformer.transformFromFilesystem(new File({
        path: './src/test/Test.script/Test.js',
        contents: Buffer.from(lines.join(EOL)),
      }), 'utf8', cb), 'to call the callback without error')
        .then(([file]) => expect(file.contents, 'when decoded as', 'utf8',
          'to equal', lines.join('\r\n')));
    });

    it('should remove trailing newlines if set', function() {
      const transformer = new NewlinesTransformer({ trailingNewlines: true });
      const lines = ['first line', 'second'];

      return expect(cb => transformer.transformFromFilesystem(new File({
        path: './src/test/Test.script/Test.js',
        contents: Buffer.from(lines.concat('').join(EOL)),
      }), 'utf8', cb), 'to call the callback without error')
        .then(([file]) => expect(file.contents, 'when decoded as', 'utf8',
          'to equal', lines.join('\r\n')));
    });
  });
});

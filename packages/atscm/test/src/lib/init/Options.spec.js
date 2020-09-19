import expect from 'unexpected';
import InitOption from '../../../../src/lib/init/Option';

/** @test {InitOption} */
describe('InitOption', function () {
  it('should throw when run without arguments', function () {
    expect(() => new InitOption(), 'to throw', 'message or options required');
  });

  /** @test {InitOption#constructor} */
  describe('#constructor', function () {
    context('when run with string, string', function () {
      it('should throw error for empty message', function () {
        expect(() => new InitOption(''), 'to throw error', 'message is required');
      });

      it('should work with message only', function () {
        let opt;

        expect(() => (opt = new InitOption('message')), 'not to throw');
        expect(opt.message, 'to match', /message/);
        expect(opt.default, 'to be', undefined);
      });

      it('should set default type', function () {
        expect(new InitOption('message').type, 'to equal', InitOption.DefaultType);
      });

      it('should add `?` to message', function () {
        expect(new InitOption('message').message, 'to equal', 'message?');
      });

      it('should store default if given', function () {
        expect(new InitOption('message', 'default').default, 'to equal', 'default');
      });
    });

    context('when run with object', function () {
      it('should throw error for missing message', function () {
        expect(() => new InitOption({}), 'to throw error', 'message is required');
      });

      it('should throw error for empty message', function () {
        expect(() => new InitOption({ message: '' }), 'to throw error', 'message is required');
      });

      it('should add `?` to message', function () {
        expect(new InitOption({ message: 'message' }).message, 'to equal', 'message?');
      });

      it('should set default type', function () {
        expect(new InitOption({ message: 'message' }).type, 'to equal', InitOption.DefaultType);
      });

      it('should store type, message, default and validate', function () {
        const opts = {
          type: 'test',
          message: 'message',
          default: 'default',
          validate: () => true,
        };

        const result = Object.assign({}, opts, { message: `${opts.message}?` });

        expect(new InitOption(opts), 'to have properties', result);
      });
    });
  });
});

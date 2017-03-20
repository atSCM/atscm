import Logger from 'gulplog';
import { spy } from 'sinon';
import expect from '../../expect';
import TransformerHelper from '../../helpers/Transformer';
import ScriptTransformer from '../../../src/transform/ScriptTransformer';

const transformerHelper = new TransformerHelper(ScriptTransformer);

/** @test {ScriptTransformer} */
describe('ScriptTransformer', function() {
  const ScriptPath = 'SYSTEM/LIBRARY/PROJECT/SERVERSCRIPTS/Test.script';
  const QDPath = 'SYSTEM/LIBRARY/PROJECT/SERVERSCRIPTS/Test.qd';

  /** @test {ScriptTransformer#shouldBeTransformed} */
  describe('#shouldBeTransformed', function() {
    it('should return true for ScriptCode type nodes', function() {
      expect(ScriptTransformer.prototype.shouldBeTransformed(
        { isScript: true }
      ), 'to be true');
    });

    it('should return true for QuickDynamic type nodes', function() {
      expect(ScriptTransformer.prototype.shouldBeTransformed(
        { isQuickDynamic: true }
      ), 'to be true');
    });
  });

  /** @test {ScriptTransformer#transformFromDB} */
  describe('#transformFromDB', function() {
    it('should forward parse errors', function() {
      return expect(transformerHelper.writeXMLToTransformer(ScriptPath, 'invalid xml'),
        'to be rejected with', /Text data outside of root node/);
    });

    it('should warn with invalid xml', function() {
      const onWarn = spy();
      Logger.on('warn', onWarn);

      return expect(transformerHelper.writeXMLToTransformer(ScriptPath, '<root></root>'),
        'to be fulfilled')
        .then(() => {
          expect(onWarn, 'was called once');
          expect(onWarn, 'to have a call satisfying', { args: [/Empty document/] });
        });
    });

    it('should write empty config file for empty Script', function() {
      return transformerHelper.writeXMLToTransformer(ScriptPath, '<script></script>')
        .then(files => transformerHelper.expectFileContents(files))
        .then(contents => {
          expect(contents[0], 'to equal', '{}');
        });
    });

    it('should write empty .js file for empty Script', function() {
      return transformerHelper.writeXMLToTransformer(ScriptPath, '<script></script>')
        .then(files => transformerHelper.expectFileContents(files))
        .then(contents => {
          expect(contents[1], 'to equal', '');
        });
    });

    it('should store icon metadata', function() {
      return transformerHelper.writeXMLToTransformer(ScriptPath, `<script>
  <metadata>
    <icon type="image/png">asdf</icon>
  </metadata>
</script>`)
        .then(files => transformerHelper.expectFileContents(files))
        .then(contents => expect(JSON.parse(contents[0]), 'to equal', {
          icon: {
            type: 'image/png',
            content: 'asdf',
          },
        }));
    });

    it('should store empty icon metadata', function() {
      return transformerHelper.writeXMLToTransformer(ScriptPath, `<script>
  <metadata>
    <icon></icon>
  </metadata>
</script>`)
        .then(files => transformerHelper.expectFileContents(files))
        .then(contents => expect(JSON.parse(contents[0]), 'to equal', {
          icon: {
            content: '',
          },
        }));
    });

    it('should store visible metadata', function() {
      return transformerHelper.writeXMLToTransformer(ScriptPath, `<script>
  <metadata>
    <visible>1</visible>
  </metadata>
</script>`)
        .then(files => transformerHelper.expectFileContents(files))
        .then(contents => expect(JSON.parse(contents[0]), 'to equal', {
          visible: true,
        }));
    });

    it('should store title metadata', function() {
      return transformerHelper.writeXMLToTransformer(ScriptPath, `<script>
  <metadata>
    <title>script title</title>
  </metadata>
</script>`)
        .then(files => transformerHelper.expectFileContents(files))
        .then(contents => expect(JSON.parse(contents[0]), 'to equal', {
          title: 'script title',
        }));
    });

    it('should store description metadata', function() {
      return transformerHelper.writeXMLToTransformer(ScriptPath, `<script>
  <metadata>
    <description>script description</description>
  </metadata>
</script>`)
        .then(files => transformerHelper.expectFileContents(files))
        .then(contents => expect(JSON.parse(contents[0]), 'to equal', {
          description: 'script description',
        }));
    });

    it('should store parameters', function() {
      return transformerHelper.writeXMLToTransformer(ScriptPath, `<script>
  <parameter name="paramname"/>
</script>`)
        .then(files => transformerHelper.expectFileContents(files))
        .then(contents => expect(JSON.parse(contents[0]), 'to equal', {
          parameters: [
            { name: 'paramname' },
          ],
        }));
    });

    it('should store code', function() {
      const code = 'console.log("called");';
      return transformerHelper.writeXMLToTransformer(ScriptPath, `<script>
  <code>${code}</code>
</script>`)
        .then(files => transformerHelper.expectFileContents(files))
        .then(contents => expect(contents[1], 'to equal', code));
    });
  });

  /** @test {ScriptTransformer#createCombinedFile} */
  describe('#createCombinedFile', function() {
    it('should forward config parse errors', function() {
      return expect(transformerHelper.createCombinedFileWithContents(`${ScriptPath}/Test`, {
        '.json': '"description": "script description" }',
      }), 'to call the callback with error', /Error parsing JSON in /);
    });

    context('when called on a quick dynamic', function() {
      it('should store empty metadata', function() {
        return expect(transformerHelper.createCombinedFileWithContents(`${QDPath}/Test`, {
          '.json': '{ }',
        }), 'to call the callback')
          .then(args => transformerHelper.expectFileContents([args[1]]))
          .then(contents => expect(contents[0], 'to contain', '<metadata/>'));
      });

      it('should insert icon metadata', function() {
        return expect(transformerHelper.createCombinedFileWithContents(`${QDPath}/Test`, {
          '.json': '{ "icon": { "type": "image/png", "content": "asdf" } }',
        }), 'to call the callback')
          .then(args => transformerHelper.expectFileContents([args[1]]))
          .then(contents => expect(contents[0],
            'to contain', '<icon type="image/png">asdf</icon>'));
      });

      it('should insert visible metadata', function() {
        return Promise.all([
          expect(transformerHelper.createCombinedFileWithContents(`${QDPath}/Test`, {
            '.json': '{ "visible": false }',
          }), 'to call the callback')
            .then(args => transformerHelper.expectFileContents([args[1]]))
            .then(contents => expect(contents[0], 'to contain', '<visible>0</visible>')),
          expect(transformerHelper.createCombinedFileWithContents(`${QDPath}/Test`, {
            '.json': '{ "visible": true }',
          }), 'to call the callback')
            .then(args => transformerHelper.expectFileContents([args[1]]))
            .then(contents => expect(contents[0], 'to contain', '<visible>1</visible>')),
          ]);
      });

      it('should insert title metadata', function() {
        return expect(transformerHelper.createCombinedFileWithContents(`${QDPath}/Test`, {
          '.json': '{ "title": "qd title" }',
        }), 'to call the callback')
          .then(args => transformerHelper.expectFileContents([args[1]]))
          .then(contents => expect(contents[0], 'to contain', '<title>qd title</title>'));
      });

      it('should insert description metadata', function() {
        return expect(transformerHelper.createCombinedFileWithContents(`${QDPath}/Test`, {
          '.json': '{ "description": "qd desc" }',
        }), 'to call the callback')
          .then(args => transformerHelper.expectFileContents([args[1]]))
          .then(contents => expect(contents[0],
            'to contain', '<description>qd desc</description>'));
      });
    });

    context('when called on a script', function() {
      it('should ignore metadata', function() {
        return expect(transformerHelper.createCombinedFileWithContents(`${ScriptPath}/Test`, {
          '.json': '{ "icon": { "type": "image/png", "content": "asdf" } }',
        }), 'to call the callback')
          .then(args => transformerHelper.expectFileContents([args[1]]))
          .then(contents => expect(contents[0],
            'not to contain', '<icon', '<metadata'));
      });
    });

    it('should insert parameters', function() {
      return expect(transformerHelper.createCombinedFileWithContents(`${QDPath}/Test`, {
        '.json': '{ "parameters": [{ "name": "paramname" }] }',
      }), 'to call the callback')
        .then(args => transformerHelper.expectFileContents([args[1]]))
        .then(contents => expect(contents[0],
          'to contain', '<parameter name="paramname"/>'));
    });

    it('should insert script code', function() {
      const code = 'console.log("called");';
      return expect(transformerHelper.createCombinedFileWithContents(`${QDPath}/Test`, {
        '.js': code,
      }), 'to call the callback')
        .then(args => transformerHelper.expectFileContents([args[1]]))
        .then(contents => expect(contents[0],
          'to contain', `<code><![CDATA[${code}]]></code>`));
    });
  });
});

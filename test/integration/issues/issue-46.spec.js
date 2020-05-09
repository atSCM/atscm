import { EOL } from 'os';
import expect from '../../expect';
import { TransformDirection } from '../../../src/lib/transform/Transformer';
import XMLTransformer from '../../../src/lib/transform/XMLTransformer';

describe('XMLTransformer', function() {
  it('should keep element order', async function() {
    const testContents = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<svg version="1.2" xmlns="http://www.w3.org/2000/svg" width="1280" height="680">
  <text>text1</text>
  <rect width="200" height="200" x="160" y="16"/>
  <text>text2</text>
</svg>`
      .split('\n')
      .join(EOL); // Multi line string templates are always LF
    const testFile = { value: { value: Buffer.from(testContents) } };
    const transformer = new XMLTransformer({
      direction: TransformDirection.FromDB, // just to have os-native newlines
    });

    const decoded = transformer.decodeContents(testFile);
    const encoded = transformer.encodeContents(decoded);

    expect(encoded, 'to equal', testContents);
  });
});

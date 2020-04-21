import { promises as fsp } from 'fs';
import { join, dirname } from 'path';
import { NodeId } from 'atscm';
import { callMethod } from 'atscm/api';
import { Variant, DataType, VariantArrayType } from 'node-opcua';
import expect from '../../expect';
import { tmpDir } from '../../helpers/util';

describe('Manual API example', async () => {
  // Configuration: You could also use process.argv here...
  const nodesToExport = ['AGENT.DISPLAYS.Main'];
  const outDir = tmpDir();
  const exportPath = join(outDir, 'export.xml');

  // Our main function
  async function createExportFile() {
    console.log(`Exporting nodes: ${nodesToExport.join(',')}`);

    // Use the 'exportNodes' method to create an xml export on the server
    const {
      outputArguments: [{ value }],
    } = await callMethod(new NodeId('AGENT.OPCUA.METHODS.exportNodes'), [
      new Variant({
        dataType: DataType.NodeId,
        arrayType: VariantArrayType.Array,
        value: nodesToExport.map(id => new NodeId(id)),
      }),
    ]);

    // Create the output directory if needed
    await fsp.mkdir(dirname(exportPath), { recursive: true });

    // Write the export to the file
    await fsp.writeFile(exportPath, value);

    console.log(`Export written to ${exportPath}`);
  }

  await expect(createExportFile(), 'to be fulfilled');
});

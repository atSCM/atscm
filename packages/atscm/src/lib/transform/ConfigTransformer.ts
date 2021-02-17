import { DataType, VariantArrayType } from 'node-opcua/lib/datamodel/variant';
import XMLTransformer from './XMLTransformer';

export default class ConfigTransformer<C = Record<string, unknown>> extends XMLTransformer {
  /**
   * Returns an object containing all non-empty properties of the input object. Returns null if no
   * properties are non-empty.
   * @param input The config to process.
   */
  protected nonEmptyConfig(input: C) {
    let result: C | null = null;

    for (const [key, value] of Object.entries(input)) {
      if (Array.isArray(value) ? value.length > 0 : value !== undefined) {
        result = result || ({} as C);
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Writes the config file to disk if needed.
   * @param config The config to write.
   * @param node The original source node.
   * @param context The current transformer context.
   * @return `true` it the config was actually written.
   */
  protected writeConfigFile(config: C, node, context) {
    const processed = this.nonEmptyConfig(config);

    if (processed) {
      const configFile = (this.constructor as typeof XMLTransformer).splitFile(node, '.json');
      configFile.value = {
        dataType: DataType.String,
        arrayType: VariantArrayType.Scalar,
        value: JSON.stringify(config, null, '  '),
      };
      context.addNode(configFile);
    }

    return !!processed;
  }
}

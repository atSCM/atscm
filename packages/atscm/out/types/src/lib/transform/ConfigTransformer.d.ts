import XMLTransformer from './XMLTransformer';
export default class ConfigTransformer<C = Record<string, unknown>> extends XMLTransformer {
    /**
     * Returns an object containing all non-empty properties of the input object. Returns null if no
     * properties are non-empty.
     * @param input The config to process.
     */
    protected nonEmptyConfig(input: C): C;
    /**
     * Writes the config file to disk if needed.
     * @param config The config to write.
     * @param node The original source node.
     * @param context The current transformer context.
     * @return `true` it the config was actually written.
     */
    protected writeConfigFile(config: C, node: any, context: any): boolean;
}

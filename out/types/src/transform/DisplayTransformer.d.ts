/**
 * Splits read atvise display XML nodes into their SVG and JavaScript sources,
 * alongside with a .json file containing the display's parameters.
 */
export default class DisplayTransformer extends XMLTransformer {
    /**
     * The source file extension to allow for scripts.
     */
    static get scriptSourceExtension(): string;
    constructor(options?: any);
}
import XMLTransformer from "../lib/transform/XMLTransformer";

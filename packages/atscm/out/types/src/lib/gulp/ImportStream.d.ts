/**
 * A stream that imports xml files in parallel.
 */
export default class ImportStream extends CallMethodStream {
    constructor(options?: {
        maxParallel?: number;
    });
}
import CallMethodStream from "../server/scripts/CallMethodStream";

/**
 * A stream that transforms read {@link ReadStream.ReadResult}s and stores the on the filesystem.
 */
export default class PullStream {
    /**
     * Creates a new PullStream based on a stream that writes {@link ReadStream.ReadResult} which may
     * be an instance of {@link ReadStream}.
     * @param {ReadStream} readStream The stream to read from.
     */
    constructor(readStream: any);
}

import expect from 'unexpected';
import unexpectedStream from 'unexpected-stream';
import unexpectedSinon from 'unexpected-sinon';

expect.installPlugin(unexpectedStream);
expect.installPlugin(unexpectedSinon);

export default expect;

import expect from 'unexpected';
import unexpectedStream from 'unexpected-stream';
import unexpectedSinon from 'unexpected-sinon';

export default expect.clone().use(unexpectedStream).use(unexpectedSinon);

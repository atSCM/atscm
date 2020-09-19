import expect from 'unexpected';
import proxyquire from 'proxyquire';
import { ctor as throughStreamClass } from 'through2';
import { NodeClass } from 'node-opcua';
import NodeId from '../../../src/lib/model/opcua/NodeId';

const pull = proxyquire('../../../src/tasks/pull', {
  '../lib/server/NodeStream': {
    _esModule: true,
    default: class StubStream extends throughStreamClass({ objectMode: true }) {
      constructor() {
        super();

        this.push({
          nodeId: new NodeId('AGENT.DISPLAYS.Main'),
          typeDefinition: new NodeId('VariableTypes.ATVISE.Display'),
          nodeClass: NodeClass.Variable,
        });

        this.end();
      }
    },
  },
  '../lib/server/NodeBrowser': {
    _esModule: true,
    default: class NBrowser {
      async browse() {
        return true;
      }
    },
  },
}).default;

/** @test {pull} */
describe('pull', function () {
  it('should return a promise', function () {
    const task = pull();

    expect(task, 'to be a', Promise);

    return task;
  });
});

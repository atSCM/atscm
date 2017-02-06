import { NodeId as OpcNodeId } from 'node-opcua';

const Type = OpcNodeId.NodeIdType;

const TypeForIdentifier = {
  i: Type.NUMERIC,
  s: Type.STRING,
  g: Type.GUID,
  b: Type.BYTESTRING,
};

/**
 * A wrapper around {@link NodeOpcua.NodeId}.
 */
export default class NodeId extends OpcNodeId {

  /**
   * Creates a new NodeId. Can be called in multiple ways:
   *  - with a {@link NodeOpcua.NodeIdType}, a value and a namespace (defaults to 0),
   *  - with a value only (type will be taken from it, namespace defaults to 1) or
   *  - with a {@link NodeId}s string representation (e.g. `ns=1;s=AGENT.DISPLAYS`).
   * @param {NodeOpcua.NodeIdType|String|Number} typeOrValue The type or value to use.
   * @param {(Number|String)} [value] The value to use.
   * @param {Number} [namespace=1] The namespace to use.
   */
  constructor(typeOrValue, value, namespace = 1) {
    if (!(Type.get(typeOrValue))) {
      let m = null;

      if (typeof typeOrValue === 'string') {
        m = typeOrValue.match(/^ns=([0-9]+);(i|s|g|b)=(.*)$/);
      }

      if (m === null) {
        super(
          Number.isNaN(Number.parseInt(typeOrValue, 10)) ? Type.STRING : Type.NUMERIC,
          typeOrValue,
          1
        );
      } else {
        const n = Number.parseInt(m[1], 10);
        const t = TypeForIdentifier[m[2]];
        const v = t === Type.NUMERIC ? Number.parseInt(m[3], 10) : m[3];

        super(t, v, n);
      }
    } else {
      super(typeOrValue, value, namespace);
    }
  }

  /**
   * Returns a string in the format "namespace value" that is printed when inspecting the NodeId
   * using node.js's *util.inspect*.
   * @see https://nodejs.org/api/util.html#util_util_inspect_object_options
   * @param {Number} depth The depth to inspect.
   * @param {Object} options The options to use.
   * @return {String} A string in the format "namespace value".
   */
  inspect(depth, options) {
    return [
      options.stylize(this.namespace, 'number'),
      options.stylize(this.value, this.identifierType === Type.NUMERIC ? 'number' : 'string'),
    ].join(' ');
  }

}

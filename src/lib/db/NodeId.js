import { NodeId as OpcNodeId } from 'node-opcua';

const Type = OpcNodeId.NodeIdType;

const TypeForIdentifier = {
  i: Type.NUMERIC,
  s: Type.STRING,
  g: Type.GUID,
  b: Type.BYTESTRING,
};

export default class NodeId extends OpcNodeId {

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

  inspect(depth, options) {
    return [
      options.stylize(this.namespace, 'number'),
      options.stylize(this.value, this.identifierType === Type.NUMERIC ? 'number' : 'string'),
    ].join(' ');
  }

}

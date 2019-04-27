declare module 'node-opcua/lib/datamodel/nodeclass' {
  import { Enum } from 'node-opcua/lib/misc/enum.js';

  enum NodeClassEnum {
    Unspecified = 0, // No classes are selected.
    Object = 1, // The node is an object.
    Variable = 2, // The node is a variable.
    Method = 4, // The node is a method.
    ObjectType = 8, // The node is an object type.
    VariableType = 16, // The node is an variable type.
    ReferenceType = 32, // The node is a reference type.
    DataType = 64, // The node is a data type.
    View = 128, // The node is a view.
  }

  export const NodeClass: Enum<typeof NodeClassEnum>;
}

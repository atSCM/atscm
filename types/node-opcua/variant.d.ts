declare module 'node-opcua/lib/datamodel/variant' {
  import { Enum, ItemOf } from 'node-opcua/lib/misc/enum.js';

  enum DataTypeEnum {
    Null = 0,
    Boolean = 1,
    SByte = 2, // signed Byte = Int8
    Byte = 3, // unsigned Byte = UInt8
    Int16 = 4,
    UInt16 = 5,
    Int32 = 6,
    UInt32 = 7,
    Int64 = 8,
    UInt64 = 9,
    Float = 10,
    Double = 11,
    String = 12,
    DateTime = 13,
    Guid = 14,
    ByteString = 15,
    XmlElement = 16,
    NodeId = 17,
    ExpandedNodeId = 18,
    StatusCode = 19,
    QualifiedName = 20,
    LocalizedText = 21,
    ExtensionObject = 22,
    DataValue = 23,
    Variant = 24,
    DiagnosticInfo = 25
  }

  export const DataType: Enum<typeof DataTypeEnum>;

  enum VariantArrayTypeEnum {
    Scalar = 0x00,
    Array = 0x01,
    Matrix = 0x02
  }

  export const VariantArrayType: Enum<typeof VariantArrayTypeEnum>;

  export class Variant {

    public dataType: ItemOf<typeof DataType>;
    public arrayType: ItemOf<typeof VariantArrayType>;
    public value: any; // FIXME: Conditional on dataType...
    public dimensions: number[] | null;

  }

}

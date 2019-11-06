declare module 'node-opcua/lib/misc/enum.js' {
  interface EnumItem<K, V> {
    key: K;
    value: V;

    is(item: EnumItem<K, V> | K | V): boolean;
    has(value: EnumItem<K, V> | K | V): boolean;
    valueOf(): V;
  }

  export type Enum<E extends {}> = {
    readonly [key in keyof E]: EnumItem<key, E[key]>;
  } & {
    get(key: string): Enum<E>[keyof E] | null;
  };

  export type ItemOf<E extends {}> = E[Exclude<keyof E, 'get'>];
  export type KeyOf<E extends {}> = Exclude<keyof E, 'get'>;
}

/* tslint:disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

/**
 * An atvise server script configuration file
 */
export interface ServerscriptConfig {
  /**
   * The icon to show in atvise builder
   */
  icon?: {
    /**
     * A base64 encoded image
     */
    content: string;
    /**
     * A valid image mime type
     */
    type: string;
    [k: string]: unknown;
  };
  /**
   * If the script should be shown inside the atvise builder library
   */
  visible?: boolean;
  /**
   * The script's title
   */
  title?: string;
  /**
   * A short description of what the script does
   */
  description?: string;
  /**
   * Custom script metadata
   */
  metadata?: {
    /**
     * This interface was referenced by `undefined`'s JSON-Schema definition
     * via the `patternProperty` "^".
     */
    [k: string]: string | string[];
  };
  /**
   * Display parameters
   */
  parameters?: {
    /**
     * The parameter's name
     */
    name: string;
    /**
     * A short description of what the parameter does
     */
    desc?: string;
    /**
     * A string to search in the code and replace with the parameter's value
     */
    substitute?: string;
    /**
     * The parameter's type
     */
    valuetype:
      | 'address'
      | 'display'
      | 'string'
      | 'trstring'
      | 'number'
      | 'bool'
      | 'color'
      | 'enum'
      | 'global';
    behavior: 'mandatory' | 'optional' | 'hidden';
    defaultvalue?: string;
    /**
     * Holds possible values in enum parameters
     */
    config?: string;
    group?: string;
    target?: {
      namespaceIndex: number;
      name: string;
    };
    [k: string]: unknown;
  }[];
  [k: string]: unknown;
}

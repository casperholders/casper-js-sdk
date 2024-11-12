import { CLType, CLTypeMap } from './cltype';
import { CLValue, IResultWithBytes } from './CLValue';
import { CLValueTuple2 } from './Tuple2';
import { CLValueUInt32 } from './Uint32';
import { CLValueParser } from './Parser';
import { concat } from '@ethersproject/bytes';
import { toBytesU32 } from '../ByteConverters';

/**
 * Represents a Map value in the CasperLabs type system.
 */
export class CLValueMap {
  /**
   * The type of the map.
   */
  private type: CLTypeMap;

  /**
   * The data stored in the map as an array of CLValueTuple2.
   */
  private data: CLValueTuple2[];

  /**
   * An indexed representation of the map data for faster lookups.
   */
  private indexedData: Map<string, CLValue> = new Map();

  /**
   * Constructs a new CLValueMap instance.
   * @param mapType - The CLTypeMap representing the type of the map.
   * @param data - Optional array of CLValueTuple2 representing the map entries.
   * @param indexedData - Optional Map of string keys to CLValues for faster lookups.
   */
  constructor(
    mapType: CLTypeMap,
    data?: CLValueTuple2[],
    indexedData?: Map<string, CLValue>
  ) {
    this.type = mapType;
    this.data = data ?? [];
    this.indexedData = indexedData ?? new Map();
  }

  /**
   * Returns the byte representation of the map.
   * @returns A Uint8Array representing the bytes of the map.
   */
  bytes(): Uint8Array {
    const kvBytes = Array.from(this.data).map(element => {
      const byteKey = element.inner1.bytes();
      const byteVal = element.inner2.bytes();
      return concat([byteKey, byteVal]);
    });

    return concat([toBytesU32(this.data.length), ...kvBytes]);
  }

  /**
   * Returns the map as a plain JavaScript object.
   * @returns A Record with string keys and CLValue values.
   */
  public getMap(): Record<string, CLValue> {
    const result: Record<string, CLValue> = {};
    for (const [k, v] of this.indexedData.entries()) {
      result[k] = v;
    }
    return result;
  }

  /**
   * Returns the map data as an array of CLValueTuple2.
   * @returns An array of CLValueTuple2 representing the map entries.
   */
  public getData(): CLValueTuple2[] {
    return [...this.data];
  }

  /**
   * Returns a string representation of the map.
   * @returns A string representation of the map entries.
   */
  public toString(): string {
    const b: string[] = [];
    for (const [key, value] of this.indexedData.entries()) {
      b.push(`(${key}="${value.toString()}")`);
    }
    return b.join('');
  }

  /**
   * Finds a value in the map by key.
   * @param key - The key to search for.
   * @returns A tuple containing the found value (or undefined) and a boolean indicating if the key was found.
   */
  public find(key: string): [CLValue | undefined, boolean] {
    const value = this.indexedData.get(key);
    return [value, value !== undefined];
  }

  /**
   * Gets a value from the map by key.
   * @param key - The key to search for.
   * @returns The found CLValue or undefined if the key doesn't exist.
   */
  public get(key: string): CLValue | undefined {
    return this.indexedData.get(key);
  }

  /**
   * Finds any value in the map that matches one of the provided keys.
   * @param keys - An array of keys to search for.
   * @returns A tuple containing the first found value (or undefined) and a boolean indicating if any key was found.
   */
  public findAny(keys: string[]): [CLValue | undefined, boolean] {
    for (const key of keys) {
      const value = this.indexedData.get(key);
      if (value !== undefined) {
        return [value, true];
      }
    }
    return [undefined, false];
  }

  /**
   * Returns the number of entries in the map.
   * @returns The number of entries in the map.
   */
  public length(): number {
    return this.indexedData.size;
  }

  /**
   * Appends a new key-value pair to the map.
   * @param key - The key CLValue to append.
   * @param val - The value CLValue to append.
   * @returns null if successful, or an Error if the types are invalid or the key already exists.
   */
  public append(key: CLValue, val: CLValue): Error | null {
    if (key.type !== this.type.key) {
      return new Error('invalid key type');
    }
    if (val.type !== this.type.val) {
      return new Error('invalid value type');
    }

    const keyString = key.toString();
    if (this.indexedData.has(keyString)) {
      return new Error('map key already exists');
    }

    const tuple = CLValueTuple2.newCLTuple2(key, val).tuple2;

    if (!tuple) {
      return new Error('no tuple');
    }

    this.data.push(tuple);
    this.indexedData.set(keyString, val);
    return null;
  }

  /**
   * Creates a CLValueMap instance from a Uint8Array.
   * @param bytes - The Uint8Array containing the byte representation of the Map value.
   * @param mapType - The CLTypeMap representing the type of the map.
   * @returns A new CLValueMap instance.
   */
  public static fromBytes(
    bytes: Uint8Array,
    mapType: CLTypeMap
  ): IResultWithBytes<CLValueMap> {
    const mapResult = new CLValueMap(mapType);

    const { result: u32, bytes: u32Bytes } = CLValueUInt32.fromBytes(bytes);
    const size = u32.getValue().toNumber();
    let remainder = u32Bytes;

    if (size === 0) {
      return { result: mapResult, bytes: remainder };
    }

    for (let i = 0; i < size; i++) {
      const keyVal = CLValueParser.fromBytesByType(remainder, mapType.key);
      remainder = keyVal?.bytes;

      const valVal = CLValueParser.fromBytesByType(u32.bytes(), mapType.val);

      remainder = valVal.bytes;

      mapResult.append(keyVal?.result, valVal?.result);
    }

    return { result: mapResult, bytes: remainder };
  }

  /**
   * Creates a new CLValue instance with a Map value.
   * @param keyType - The CLType for the map keys.
   * @param valType - The CLType for the map values.
   * @returns A new CLValue instance with CLTypeMap and a CLValueMap.
   */
  public static newCLMap(keyType: CLType, valType: CLType): CLValue {
    const mapType = new CLTypeMap(keyType, valType);
    const clValue = new CLValue(mapType);
    clValue.map = new CLValueMap(mapType);
    return new CLValue(mapType);
  }
}
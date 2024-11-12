import { jsonArrayMember, jsonMember, jsonObject } from 'typedjson';
import { EntityAddr } from './EntityAddr';
import { Hash } from './Hash';
import { Conversions } from '../Conversions';
import { IResultWithBytes } from '../clvalue';

/**
 * Enum representing the types of entry points.
 */
export enum EntryPointTag {
  V1EntryPoint = 0,
  V2EntryPoint = 1
}

/**
 * Custom error class for EntryPoint related errors.
 */
export class EntryPointError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EntryPointError';
  }
}

/**
 * Validates and returns the EntryPointTag for a given tag number.
 * @param tag - The tag number to validate.
 * @returns The corresponding EntryPointTag.
 * @throws EntryPointError if the tag is invalid.
 */
export function getEntryPointTag(tag: number): EntryPointTag {
  if (
    tag === EntryPointTag.V1EntryPoint ||
    tag === EntryPointTag.V2EntryPoint
  ) {
    return tag;
  }
  throw new EntryPointError('Invalid EntryPointTag');
}

const V1Prefix = 'v1-';
const V2Prefix = 'v2-';
const SelectorBytesLen = 4;

/**
 * Represents a V1 Casper VM entry point.
 */
@jsonObject
class VmCasperV1 {
  @jsonMember({ name: 'EntityAddr', constructor: EntityAddr })
  entityAddr: EntityAddr;

  @jsonArrayMember(Uint8Array, { name: 'NameBytes' })
  nameBytes: Uint8Array;

  constructor(entityAddr: EntityAddr, nameBytes: Uint8Array) {
    this.entityAddr = entityAddr;
    this.nameBytes = nameBytes;
  }
}

/**
 * Represents a V2 Casper VM entry point.
 */
@jsonObject
class VmCasperV2 {
  @jsonMember({ name: 'EntityAddr', constructor: EntityAddr })
  entityAddr: EntityAddr;

  @jsonMember({ name: 'Selector', constructor: Number })
  selector: number;

  constructor(entityAddr: EntityAddr, selector: number) {
    this.entityAddr = entityAddr;
    this.selector = selector;
  }
}

/**
 * Represents an entry point address in the system.
 */
@jsonObject
export class EntryPointAddr {
  @jsonMember({ name: 'VmCasperV1', constructor: VmCasperV1 })
  vmCasperV1?: VmCasperV1;

  @jsonMember({ name: 'VmCasperV2', constructor: VmCasperV2 })
  vmCasperV2?: VmCasperV2;

  constructor(vmCasperV1?: VmCasperV1, vmCasperV2?: VmCasperV2) {
    this.vmCasperV1 = vmCasperV1;
    this.vmCasperV2 = vmCasperV2;
  }

  /**
   * Creates an EntryPointAddr from a string representation.
   * @param source - The string representation of the entry point address.
   * @returns A new EntryPointAddr instance.
   * @throws EntryPointError if the format is invalid.
   */
  static fromString(source: string): EntryPointAddr {
    const lastIndex = source.lastIndexOf('-');
    if (lastIndex === -1) {
      throw new EntryPointError('Invalid EntryPoint format');
    }

    const prefix = source.substring(0, lastIndex);
    const data = source.substring(lastIndex + 1);

    const rawBytes = Buffer.from(data, 'hex');

    if (prefix.startsWith(V1Prefix)) {
      const entityAddr = EntityAddr.fromPrefixedString(
        prefix.replace(V1Prefix, '')
      );
      const nameBytes = new Uint8Array(rawBytes);

      return new EntryPointAddr(new VmCasperV1(entityAddr, nameBytes));
    } else if (prefix.startsWith(V2Prefix)) {
      const entityAddr = EntityAddr.fromPrefixedString(
        prefix.replace(V2Prefix, '')
      );
      const selector = rawBytes.readUInt32LE(0);

      return new EntryPointAddr(
        undefined,
        new VmCasperV2(entityAddr, selector)
      );
    } else {
      throw new EntryPointError('Invalid EntryPoint format');
    }
  }

  /**
   * Returns a prefixed string representation of the EntryPointAddr.
   * @returns The prefixed string representation.
   * @throws EntryPointError if the EntryPointAddr type is unexpected.
   */
  toPrefixedString(): string {
    if (this.vmCasperV1) {
      return (
        V1Prefix +
        this.vmCasperV1.entityAddr.toPrefixedString() +
        '-' +
        Conversions.encodeBase16(this.vmCasperV1.nameBytes)
      );
    } else if (this.vmCasperV2) {
      const selectorBuffer = Buffer.alloc(SelectorBytesLen);
      selectorBuffer.writeUInt32LE(this.vmCasperV2.selector, 0);
      return (
        V2Prefix +
        this.vmCasperV2.entityAddr.toPrefixedString() +
        '-' +
        selectorBuffer.toString('hex')
      );
    }
    throw new EntryPointError('Unexpected EntryPointAddr type');
  }

  /**
   * Converts the EntryPointAddr to a byte array.
   * @returns The byte array representation of the EntryPointAddr.
   * @throws EntryPointError if the EntryPointAddr type is unexpected.
   */
  toBytes(): Uint8Array {
    const result = [];
    if (this.vmCasperV1) {
      result.push(EntryPointTag.V1EntryPoint);
      result.push(...this.vmCasperV1.entityAddr.toBytes());
      result.push(...this.vmCasperV1.nameBytes);
    } else if (this.vmCasperV2) {
      result.push(EntryPointTag.V2EntryPoint);
      result.push(...this.vmCasperV2.entityAddr.toBytes());
      const selectorBuffer = Buffer.alloc(SelectorBytesLen);
      selectorBuffer.writeUInt32LE(this.vmCasperV2.selector, 0);
      result.push(...selectorBuffer);
    } else {
      throw new EntryPointError('Unexpected EntryPointAddr type');
    }
    return new Uint8Array(result);
  }

  /**
   * Creates an EntryPointAddr from a byte array.
   * @param array - The byte array.
   * @returns A new EntryPointAddr instance.
   * @throws EntryPointError if the EntryPointAddr type is unexpected.
   */
  static fromBytes(array: Uint8Array): IResultWithBytes<EntryPointAddr> {
    const tag = array[0];
    const entryPointTag = getEntryPointTag(tag);

    const entityAddr = EntityAddr.fromBytes(array.slice(1));

    if (entryPointTag === EntryPointTag.V1EntryPoint) {
      const nameBytes = array.slice(
        1 + Hash.ByteHashLen,
        1 + Hash.ByteHashLen + 32
      );
      return {
        result: new EntryPointAddr(
          new VmCasperV1(entityAddr?.result, nameBytes)
        ),
        bytes: nameBytes
      };
    } else if (entryPointTag === EntryPointTag.V2EntryPoint) {
      const selector = new DataView(
        array.buffer,
        1 + Hash.ByteHashLen
      ).getUint32(0, true);

      return {
        result: new EntryPointAddr(
          undefined,
          new VmCasperV2(entityAddr?.result, selector)
        ),
        bytes: array.subarray(Hash.ByteHashLen)
      };
    } else {
      throw new EntryPointError('Unexpected EntryPointAddr type');
    }
  }

  /**
   * Creates an EntryPointAddr from its JSON representation.
   * @param json - The JSON string representation of the EntryPointAddr.
   * @returns A new EntryPointAddr instance.
   */
  public static fromJSON(json: string): EntryPointAddr {
    return this.fromString(json);
  }

  /**
   * Converts the EntryPointAddr to its JSON representation.
   * @returns The JSON string representation of the EntryPointAddr.
   */
  public toJSON(): string {
    return this.toPrefixedString();
  }
}
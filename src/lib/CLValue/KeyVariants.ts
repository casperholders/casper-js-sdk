import { Ok, Err } from 'ts-results';
import {
  KeyTag,
  ResultAndRemainder,
  resultHelper,
  CLErrorCodes
} from './index';
import { decodeBase16, encodeBase16 } from '../Conversions';

// Its not a CLValue but internal type that got serialized as a part of CLKey
// Key features:
//  - internal type creator
//  - stores data
//  - serialize when inside a Key
//  - normally do not serialize as normal CLValue eg. using CLValueParsers.fromBytes
export abstract class CLKeyVariant {
  abstract keyVariant: KeyTag;
  abstract value(): any;
  abstract data: Uint8Array;

  abstract toStr(): string;
  abstract toFormattedStr(): string;
  static fromFormattedStr(hexStr: string): CLKeyVariant {
    throw Error(
      `Trying to deserialize KeyVariant - unknown string provided: ${hexStr}`
    );
  }
}

export const HASH_PREFIX = 'hash';
const KEY_HASH_LENGTH = 32;

export const HashParser = {
  fromBytesWithRemainder: (
    bytes: Uint8Array
  ): ResultAndRemainder<Hash, CLErrorCodes> => {
    const hash = new Hash(bytes.subarray(0, KEY_HASH_LENGTH));
    return resultHelper(Ok(hash), bytes.subarray(KEY_HASH_LENGTH));
  }
};

export class Hash implements CLKeyVariant {
  keyVariant = KeyTag.Hash;
  prefix = HASH_PREFIX;

  constructor(public data: Uint8Array) {}

  value() {
    return this.data;
  }

  toStr() {
    return encodeBase16(this.data);
  }

  toFormattedStr() {
    return `${HASH_PREFIX}-${this.toStr()}`;
  }

  static fromFormattedStr(input: string): Hash {
    if (!input.startsWith(`${HASH_PREFIX}-`)) {
      throw new Error("Prefix is not 'uref-'");
    }

    const hashStr = input.substring(`${HASH_PREFIX}-`.length + 1);
    const hashBytes = decodeBase16(hashStr);

    return new Hash(hashBytes);
  }
}

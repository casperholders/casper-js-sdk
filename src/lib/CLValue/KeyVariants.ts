import { Ok } from 'ts-results';
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
  abstract data: Uint8Array;

  value(): any {
    return this.data;
  }

  abstract toStr(): string;
  abstract toFormattedStr(): string;
  static fromFormattedStr(hexStr: string): CLKeyVariant {
    throw Error(
      `Trying to deserialize KeyVariant - unknown string provided: ${hexStr}`
    );
  }
}

export const HASH_PREFIX = 'hash';
export const TRANSFER_PREFIX = 'transfer';
export const DEPLOY_INFO_PREFIX = '

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

  value(): any {
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

export class TransferAddr implements CLKeyVariant {
  keyVariant = KeyTag.Transfer;
  prefix = TRANSFER_PREFIX;

  constructor(public data: Uint8Array) {}

  value(): any {
    return this.data;
  }

  toStr() {
    return encodeBase16(this.data);
  }

  toFormattedStr() {
    return `${TRANSFER_PREFIX}-${this.toStr()}`;
  }

  static fromFormattedStr(input: string): Hash {
    if (!input.startsWith(`${TRANSFER_PREFIX}-`)) {
      throw new Error(`Prefix is not ${TRANSFER_PREFIX}`);
    }

    const hashStr = input.substring(`${TRANSFER_PREFIX}-`.length + 1);
    const hashBytes = decodeBase16(hashStr);

    return new TransferAddr(hashBytes);
  }
}

export class DeployHash implements CLKeyVariant {
  keyVariant = KeyTag.DeployInfo;
  prefix = TRANSFER_PREFIX;

  constructor(public data: Uint8Array) {}

  value(): any {
    return this.data;
  }
}

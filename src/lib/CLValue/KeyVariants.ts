import { Ok } from 'ts-results';
import { BigNumberish, BigNumber } from '@ethersproject/bignumber';

import {
  KeyTag,
  ResultAndRemainder,
  resultHelper,
  CLErrorCodes,
  CLAccountHash,
  // CLValueBytesParsers,
  // UREF_ADDR_LENGTH,
  ACCOUNT_HASH_LENGTH,
  HASH_PREFIX,
  TRANSFER_PREFIX,
  DEPLOY_HASH_PREFIX,
  ERA_INFO_PREFIX,
  BALANCE_PREFIX,
  BID_PREFIX,
  WITHDRAW_PREFIX,
  DICTIONARY_PREFIX,
  SYSTEM_ENTITY_REGISTRY_PREFIX,
  ERA_SUMMARY_PREFIX,
  UNBOND_PREFIX,
  CHAINSPEC_REGISTRY_PREFIX,
  CHECKSUM_REGISTRY_PREFIX,
  BID_ADDR_PREFIX
  // PACKAGE_PREFIX,
  // BLOCK_GLOBAL_TIME_PREFIX,
  // BLOCK_GLOBAL_MESSAGE_COUNT_PREFIX
} from './index';
import { decodeBase16, encodeBase16 } from '../Conversions';

// Its not a CLValue but internal type that got serialized as a part of CLKey
// Key features:
//  - internal type creator
//  - stores data
//  - serialize when inside a Key
export abstract class CLKeyVariant {
  abstract keyVariant: KeyTag;
  abstract data: any;

  value(): any {
    return this.data;
  }

  abstract toString(): string;

  abstract toFormattedString(): string;

  static fromFormattedStringing(hexStr: string): CLKeyVariant {
    throw Error(
      `Trying to deserialize KeyVariant - unknown string provided: ${hexStr}`
    );
  }
}

const KEY_HASH_LENGTH = 32;

export const HashParser = {
  fromBytesWithRemainder: (
    bytes: Uint8Array
  ): ResultAndRemainder<KeyHash, CLErrorCodes> => {
    const hash = new KeyHash(bytes.subarray(0, KEY_HASH_LENGTH));
    return resultHelper(Ok(hash), bytes.subarray(KEY_HASH_LENGTH));
  }
};

export class KeyHash implements CLKeyVariant {
  keyVariant = KeyTag.Hash;
  prefix = HASH_PREFIX;

  constructor(public data: Uint8Array) {}

  value(): any {
    return this.data;
  }

  toString() {
    return encodeBase16(this.data);
  }

  toFormattedString() {
    return `${HASH_PREFIX}-${this.toString()}`;
  }

  static fromFormattedString(input: string): KeyHash {
    if (!input.startsWith(`${HASH_PREFIX}-`)) {
      throw new Error("Prefix is not 'uref-'");
    }

    const hashStr = input.substring(`${HASH_PREFIX}-`.length + 1);
    const hashBytes = decodeBase16(hashStr);

    return new KeyHash(hashBytes);
  }
}

export class KeyTransferAddr implements CLKeyVariant {
  keyVariant = KeyTag.Transfer;
  prefix = TRANSFER_PREFIX;

  constructor(public data: Uint8Array) {}

  value(): any {
    return this.data;
  }

  toString() {
    return encodeBase16(this.data);
  }

  toFormattedString() {
    return `${TRANSFER_PREFIX}-${this.toString()}`;
  }

  static fromFormattedString(input: string): KeyTransferAddr {
    if (!input.startsWith(`${TRANSFER_PREFIX}-`)) {
      throw new Error(`Prefix is not ${TRANSFER_PREFIX}`);
    }

    const hashStr = input.substring(`${TRANSFER_PREFIX}-`.length + 1);
    const hashBytes = decodeBase16(hashStr);

    return new KeyTransferAddr(hashBytes);
  }
}

export class DeployHash implements CLKeyVariant {
  keyVariant = KeyTag.DeployInfo;
  prefix = DEPLOY_HASH_PREFIX;

  constructor(public data: Uint8Array) {}

  value(): any {
    return this.data;
  }

  toString() {
    return encodeBase16(this.data);
  }

  toFormattedString() {
    return `${DEPLOY_HASH_PREFIX}-${this.toString()}`;
  }

  static fromFormattedString(input: string): DeployHash {
    if (!input.startsWith(`${DEPLOY_HASH_PREFIX}-`)) {
      throw new Error(`Prefix is not ${DEPLOY_HASH_PREFIX}`);
    }

    const hashStr = input.substring(`${DEPLOY_HASH_PREFIX}-`.length + 1);
    const hashBytes = decodeBase16(hashStr);

    return new DeployHash(hashBytes);
  }
}

export class EraInfo implements CLKeyVariant {
  keyVariant = KeyTag.EraInfo;
  prefix = ERA_INFO_PREFIX;
  data: BigNumber;

  constructor(value: BigNumberish) {
    this.data = BigNumber.from(value);
  }

  value(): any {
    return this.data;
  }

  toString() {
    return this.value();
  }

  toFormattedString() {
    return `${ERA_INFO_PREFIX}-${this.toString()}`;
  }

  static fromFormattedString(input: string): EraInfo {
    if (!input.startsWith(`${ERA_INFO_PREFIX}-`)) {
      throw new Error(`Prefix is not ${ERA_INFO_PREFIX}`);
    }

    const hashStr = input.substring(`${ERA_INFO_PREFIX}-`.length + 1);
    const hashBytes = decodeBase16(hashStr);

    return new EraInfo(hashBytes);
  }
}

export class Balance implements CLKeyVariant {
  keyVariant = KeyTag.Balance;
  prefix = BALANCE_PREFIX;

  constructor(public data: Uint8Array) {}

  value(): any {
    return this.data;
  }

  toString() {
    return encodeBase16(this.data);
  }

  toFormattedString() {
    return `${BALANCE_PREFIX}-${this.toString()}`;
  }

  static fromFormattedString(input: string): DeployHash {
    if (!input.startsWith(`${BALANCE_PREFIX}-`)) {
      throw new Error(`Prefix is not ${BALANCE_PREFIX}`);
    }

    const hashStr = input.substring(`${BALANCE_PREFIX}-`.length + 1);
    const hashBytes = decodeBase16(hashStr);

    return new Balance(hashBytes);
  }
}

export class KeyBid implements CLKeyVariant {
  keyVariant = KeyTag.Bid;
  prefix = BID_PREFIX;

  constructor(public data: Uint8Array) {}

  value(): any {
    return this.data;
  }

  toString() {
    return encodeBase16(this.data);
  }

  toFormattedString() {
    return `${BID_PREFIX}-${this.toString()}`;
  }

  static fromFormattedString(input: string): KeyBid {
    if (!input.startsWith(`${BID_PREFIX}-`)) {
      throw new Error(`Prefix is not ${BID_PREFIX}`);
    }

    const hashStr = input.substring(`${BID_PREFIX}-`.length + 1);
    const hashBytes = decodeBase16(hashStr);

    return new KeyBid(hashBytes);
  }
}

export class Withdraw implements CLKeyVariant {
  keyVariant = KeyTag.Withdraw;
  prefix = WITHDRAW_PREFIX;

  constructor(public data: Uint8Array) {}

  value(): any {
    return this.data;
  }

  toString() {
    return encodeBase16(this.data);
  }

  toFormattedString() {
    return `${WITHDRAW_PREFIX}-${this.toString()}`;
  }

  static fromFormattedString(input: string): DeployHash {
    if (!input.startsWith(`${WITHDRAW_PREFIX}-`)) {
      throw new Error(`Prefix is not ${WITHDRAW_PREFIX}`);
    }

    const hashStr = input.substring(`${WITHDRAW_PREFIX}-`.length + 1);
    const hashBytes = decodeBase16(hashStr);

    return new Withdraw(hashBytes);
  }
}

export class KeyDictionary implements CLKeyVariant {
  keyVariant = KeyTag.Dictionary;
  prefix = DICTIONARY_PREFIX;

  constructor(public data: Uint8Array) {}

  value(): any {
    return this.data;
  }

  toString() {
    return encodeBase16(this.data);
  }

  toFormattedString() {
    return `${DICTIONARY_PREFIX}-${this.toString()}`;
  }

  static fromFormattedString(input: string): DeployHash {
    if (!input.startsWith(`${DICTIONARY_PREFIX}-`)) {
      throw new Error(`Prefix is not ${DICTIONARY_PREFIX}`);
    }

    const hashStr = input.substring(`${DICTIONARY_PREFIX}-`.length + 1);
    const hashBytes = decodeBase16(hashStr);

    return new KeyDictionary(hashBytes);
  }
}

export class KeySystemEntityRegistry implements CLKeyVariant {
  keyVariant = KeyTag.SystemEntityRegistry;
  prefix = DICTIONARY_PREFIX;

  constructor(public data: Uint8Array) {}

  value(): any {
    return this.data;
  }

  toString() {
    return encodeBase16(this.data);
  }

  toFormattedString() {
    return `${SYSTEM_ENTITY_REGISTRY_PREFIX}-${this.toString()}`;
  }

  static fromFormattedString(input: string): DeployHash {
    if (!input.startsWith(`${SYSTEM_ENTITY_REGISTRY_PREFIX}-`)) {
      throw new Error(`Prefix is not ${SYSTEM_ENTITY_REGISTRY_PREFIX}`);
    }

    const hashStr = input.substring(
      `${SYSTEM_ENTITY_REGISTRY_PREFIX}-`.length + 1
    );
    const hashBytes = decodeBase16(hashStr);

    return new KeySystemEntityRegistry(hashBytes);
  }
}

export class KeyEraSummary implements CLKeyVariant {
  keyVariant = KeyTag.EraSummary;
  prefix = ERA_SUMMARY_PREFIX;

  constructor(public data: Uint8Array) {}

  value(): any {
    return this.data;
  }

  toString() {
    return encodeBase16(this.data);
  }

  toFormattedString() {
    return `${ERA_SUMMARY_PREFIX}-${this.toString()}`;
  }

  static fromFormattedString(input: string): DeployHash {
    if (!input.startsWith(`${ERA_SUMMARY_PREFIX}-`)) {
      throw new Error(`Prefix is not ${ERA_SUMMARY_PREFIX}`);
    }

    const hashStr = input.substring(`${ERA_SUMMARY_PREFIX}-`.length + 1);
    const hashBytes = decodeBase16(hashStr);

    return new KeyEraSummary(hashBytes);
  }
}

export class KeyUnbond implements CLKeyVariant {
  keyVariant = KeyTag.Unbond;
  prefix = UNBOND_PREFIX;

  constructor(public data: Uint8Array) {}

  value(): any {
    return this.data;
  }

  toString() {
    return encodeBase16(this.data);
  }

  toFormattedString() {
    return `${UNBOND_PREFIX}-${this.toString()}`;
  }

  static fromFormattedString(input: string): DeployHash {
    if (!input.startsWith(`${UNBOND_PREFIX}-`)) {
      throw new Error(`Prefix is not ${UNBOND_PREFIX}`);
    }

    const hashStr = input.substring(`${UNBOND_PREFIX}-`.length + 1);
    const hashBytes = decodeBase16(hashStr);

    return new KeyUnbond(hashBytes);
  }
}

export class KeyChainspecRegistry implements CLKeyVariant {
  keyVariant = KeyTag.ChainspecRegistry;
  prefix = CHAINSPEC_REGISTRY_PREFIX;

  constructor(public data: Uint8Array) {}

  value(): any {
    return this.data;
  }

  toString() {
    return encodeBase16(this.data);
  }

  toFormattedString() {
    return `${CHAINSPEC_REGISTRY_PREFIX}-${this.toString()}`;
  }

  static fromFormattedString(input: string): DeployHash {
    if (!input.startsWith(`${CHAINSPEC_REGISTRY_PREFIX}-`)) {
      throw new Error(`Prefix is not ${CHAINSPEC_REGISTRY_PREFIX}`);
    }

    const hashStr = input.substring(`${CHAINSPEC_REGISTRY_PREFIX}-`.length + 1);
    const hashBytes = decodeBase16(hashStr);

    return new KeyChainspecRegistry(hashBytes);
  }
}

export class KeyChecksumRegistry implements CLKeyVariant {
  keyVariant = KeyTag.ChecksumRegistry;
  prefix = CHECKSUM_REGISTRY_PREFIX;

  constructor(public data: Uint8Array) {}

  value(): any {
    return this.data;
  }

  toString() {
    return encodeBase16(this.data);
  }

  toFormattedString() {
    return `${CHECKSUM_REGISTRY_PREFIX}-${this.toString()}`;
  }

  static fromFormattedString(input: string): DeployHash {
    if (!input.startsWith(`${CHECKSUM_REGISTRY_PREFIX}-`)) {
      throw new Error(`Prefix is not ${CHECKSUM_REGISTRY_PREFIX}`);
    }

    const hashStr = input.substring(`${CHECKSUM_REGISTRY_PREFIX}-`.length + 1);
    const hashBytes = decodeBase16(hashStr);

    return new KeyChecksumRegistry(hashBytes);
  }
}

// export class BidAddrBytesParser {
//   fromBytesWithRemainder(
//     bytes: Uint8Array
//   ): ResultAndRemainder<CLKey, CLErrorCodes> {
//   }
// }

const UNIFIED_TAG = 0;
const VALIDATOR_TAG = 1;
const DELEGATOR_TAG = 2;
const CREDIT_TAG = 4;

enum BidAddrTag {
  // BidAddr for legacy unified bid.
  Unified = UNIFIED_TAG,
  /// BidAddr for validator bid.
  Validator = VALIDATOR_TAG,
  /// BidAddr for delegator bid.
  Delegator = DELEGATOR_TAG,

  /// BidAddr for auction credit.
  Credit = CREDIT_TAG,
}

const BID_ADDR_TAG_LENGTH = 1;
const VALIDATOR_BID_ADDR_LENGTH = ACCOUNT_HASH_LENGTH + BID_ADDR_TAG_LENGTH;
const DELEGATOR_BID_ADDR_LENGTH = (ACCOUNT_HASH_LENGTH * 2) + BID_ADDR_TAG_LENGTH;

interface BidAddrData {
  Unified?: CLAccountHash,
  Validator?: CLAccountHash,
  Delegator?: {
    validator: CLAccountHash,
    delegator: CLAccountHash
  },
  Credit?: {
    validator: CLAccountHash,
    era_id: BigNumberish
  }
}

export class BidAddr implements CLKeyVariant {
  keyVariant = KeyTag.BidAddr;
  prefix = BID_ADDR_PREFIX;
  
  bidAddrTag = BidAddrTag;

  constructor(public data: BidAddrData) {}

  value(): any {
    return this.data;
  }

  // toString() {
  //   return encodeBase16(this.data);
  // }

  // toFormattedString() {
  //   return `${BID_ADDR_PREFIX}-${this.toString()}`;
  // }

  // static fromFormattedString(input: string): DeployHash {
  //   if (!input.startsWith(`${BID_ADDR_PREFIX}-`)) {
  //     throw new Error(`Prefix is not ${BID_ADDR_PREFIX}`);
  //   }

  //   const hashStr = input.substring(`${BID_PREFIX}-`.length + 1);
  //   const hashBytes = decodeBase16(hashStr);

  //   return new BidAddr(hashBytes);
  // }
}

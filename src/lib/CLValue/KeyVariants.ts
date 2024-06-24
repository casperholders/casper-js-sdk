import { concat } from '@ethersproject/bytes';
import { Ok, Err } from 'ts-results';
import { BigNumberish, BigNumber } from '@ethersproject/bignumber';

import {
  KeyTag,
  ResultAndRemainder,
  resultHelper,
  CLErrorCodes,
  CLAccountHash,
  CLPublicKey,
  CLAccountHashBytesParser,
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
  BID_ADDR_PREFIX,
  PACKAGE_PREFIX,
  // BLOCK_GLOBAL_TIME_PREFIX,
  // BLOCK_GLOBAL_MESSAGE_COUNT_PREFIX
} from './index';
import { decodeBase16, encodeBase16 } from '../Conversions';
import { toBytesU64 } from '../ByteConverters';

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
    return this.value().toString();
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
  Credit = CREDIT_TAG
}

interface BidAddrData {
  Unified?: CLAccountHash;
  Validator?: CLAccountHash;
  Delegator?: {
    validator: CLAccountHash;
    delegator: CLAccountHash;
  };
  Credit?: {
    validator: CLAccountHash;
    eraId: BigNumberish;
  };
}

export const BidAddrParser = {
  fromBytesWithRemainder(
    bytes: Uint8Array
  ): ResultAndRemainder<BidAddr, CLErrorCodes> {
    const tag = bytes[0];
    const rem = bytes.subarray(1);

    const accHashParser = new CLAccountHashBytesParser();

    switch (tag) {
      case BidAddrTag.Unified: {
        const { result, remainder } = accHashParser.fromBytesWithRemainder(rem);

        if (result.ok) {
          const bidAddr = BidAddr.legacy(result.val);
          return resultHelper(Ok(bidAddr), remainder);
        } else {
          return resultHelper<BidAddr, CLErrorCodes>(Err(result.val));
        }
      }
      case BidAddrTag.Validator: {
        const { result, remainder } = accHashParser.fromBytesWithRemainder(rem);

        if (result.ok) {
          const bidAddr = BidAddr.validator(result.val);
          return resultHelper(Ok(bidAddr), remainder);
        } else {
          return resultHelper<BidAddr, CLErrorCodes>(Err(result.val));
        }
      }
      case BidAddrTag.Delegator: {
        const {
          result: validatorRes,
          remainder: delegatorRem
        } = accHashParser.fromBytesWithRemainder(rem);

        if (validatorRes.ok) {
          const {
            result: delegatorRes,
            remainder
          } = accHashParser.fromBytesWithRemainder(delegatorRem!);

          if (delegatorRes.ok) {
            const bidAddr = BidAddr.delegator(
              validatorRes.val,
              delegatorRes.val
            );
            return resultHelper(Ok(bidAddr), remainder);
          } else {
            return resultHelper<BidAddr, CLErrorCodes>(Err(delegatorRes.val));
          }
        } else {
          return resultHelper<BidAddr, CLErrorCodes>(Err(validatorRes.val));
        }
      }
      case BidAddrTag.Credit: {
        const {
          result: validatorRes,
          remainder
        } = accHashParser.fromBytesWithRemainder(rem);

        if (validatorRes.ok) {
          const u64Bytes = Uint8Array.from(remainder!.subarray(0, 8));
          const eraId = BigNumber.from(u64Bytes.slice().reverse());
          const bidAddr = BidAddr.credit(validatorRes.val, eraId);
          return resultHelper(Ok(bidAddr), remainder);
        } else {
          return resultHelper<BidAddr, CLErrorCodes>(Err(validatorRes.val));
        }
      }
      default:
        throw new Error('Unsupported tag while deserializing!');
    }
  },
  toBytes(value: BidAddr): Uint8Array {
    const tag = value.tag();

    switch (tag) {
      case BidAddrTag.Unified:
        return concat([[tag], value.data.Unified!.data]);
      case BidAddrTag.Validator:
        return concat([[tag], value.data.Validator!.data]);
      case BidAddrTag.Delegator:
        return concat([
          [tag],
          value.data.Delegator!.validator.data,
          value.data.Delegator!.delegator.data
        ]);
      case BidAddrTag.Credit:
        const era = BigNumber.from(value.data.Credit!.eraId);
        return concat([
          [tag],
          value.data.Credit!.validator.data,
          toBytesU64(era)
        ]);
      default:
        throw new Error('Unsupported tag while serializing!');
    }
  }
};

export class BidAddr implements CLKeyVariant {
  keyVariant = KeyTag.BidAddr;
  prefix = BID_ADDR_PREFIX;

  bidAddrTag = BidAddrTag;

  constructor(public data: BidAddrData) {}

  value(): any {
    return this.data;
  }

  static validator(validator: CLAccountHash) {
    return new BidAddr({ Validator: validator });
  }

  static delegator(validator: CLAccountHash, delegator: CLAccountHash) {
    return new BidAddr({ Delegator: { validator, delegator } });
  }

  static legacy(validator: CLAccountHash) {
    return new BidAddr({ Unified: validator });
  }

  static fromPublicKeys(validator: CLPublicKey, delegator?: CLPublicKey) {
    if (delegator) {
      return new BidAddr({
        Delegator: {
          validator: validator.toAccountHashType(),
          delegator: delegator.toAccountHashType()
        }
      });
    }

    return new BidAddr({ Validator: validator.toAccountHashType() });
  }

  static credit(validator: CLAccountHash, eraId: BigNumberish) {
    return new BidAddr({
      Credit: {
        validator: validator,
        eraId
      }
    });
  }

  tag(): BidAddrTag {
    if (this.data.Unified) return BidAddrTag.Unified;
    if (this.data.Validator) return BidAddrTag.Validator;
    if (this.data.Delegator) return BidAddrTag.Delegator;
    if (this.data.Credit) return BidAddrTag.Credit;

    throw new Error('Invalid data stored inside BidAddr');
  }

  toString() {
    return encodeBase16(BidAddrParser.toBytes(this));
  }

  toFormattedString() {
    return `${BID_ADDR_PREFIX}-${this.toString()}`;
  }

  static fromFormattedString(input: string): BidAddr {
    if (!input.startsWith(`${BID_ADDR_PREFIX}-`)) {
      throw new Error(`Prefix is not ${BID_ADDR_PREFIX}`);
    }

    const hashStr = input.substring(`${BID_PREFIX}-`.length + 1);
    const hashBytes = decodeBase16(hashStr);
    const { result } = BidAddrParser.fromBytesWithRemainder(hashBytes);

    if (result.ok) {
      return result.val;
    } else {
      throw new Error('Problem deserializing bytes from string.');
    }
  }
}

export class KeyPackage implements CLKeyVariant {
  keyVariant = KeyTag.Package;
  prefix = PACKAGE_PREFIX;

  constructor(public data: Uint8Array) {}

  value(): any {
    return this.data;
  }

  toString() {
    return encodeBase16(this.data);
  }

  toFormattedString() {
    return `${PACKAGE_PREFIX}-${this.toString()}`;
  }

  static fromFormattedString(input: string): DeployHash {
    if (!input.startsWith(`${PACKAGE_PREFIX}-`)) {
      throw new Error(`Prefix is not ${PACKAGE_PREFIX}`);
    }

    const hashStr = input.substring(`${PACKAGE_PREFIX}-`.length + 1);
    const hashBytes = decodeBase16(hashStr);

    return new KeyPackage(hashBytes);
  }
}

import { concat } from '@ethersproject/bytes';
import { Ok, Err } from 'ts-results';

import {
  CLType,
  CLValue,
  CLKeyVariant,
  CLURef,
  CLURefBytesParser,
  CLAccountHash,
  CLAccountHashBytesParser,
  CLErrorCodes,
  KeyTag,
  ResultAndRemainder,
  ToBytesResult,
  CLValueBytesParsers,
  CLValueParsers,
  resultHelper,
  KeyHash,
  HashParser,
  KeyTransferAddr,
  DeployHash,
  EraInfo,
  Balance,
  KeyBid,
  Withdraw,
  KeyDictionary,
  KeySystemEntityRegistry,
  KeyEraSummary,
  KeyUnbond,
  ACCOUNT_HASH_PREFIX,
  HASH_PREFIX,
  UREF_PREFIX,
  TRANSFER_PREFIX,
  DEPLOY_HASH_PREFIX,
  ERA_INFO_PREFIX,
  BALANCE_PREFIX,
  BID_PREFIX,
  WITHDRAW_PREFIX,
  DICTIONARY_PREFIX,
  SYSTEM_ENTITY_REGISTRY_PREFIX,
  ERA_SUMMARY_PREFIX,
  UNBOND_PREFIX
} from './index';
import { toBytesNumber } from '../ByteConverters';
import { KEY_TYPE, CLTypeTag } from './constants';

export class CLKeyType extends CLType {
  linksTo = KEY_TYPE;
  tag = CLTypeTag.Key;
}

export class CLKeyBytesParser extends CLValueBytesParsers {
  toBytes(value: CLKey): ToBytesResult {
    switch (value.data.keyVariant) {
      case KeyTag.Account:
        return Ok(
          concat([
            Uint8Array.from([KeyTag.Account]),
            new CLAccountHashBytesParser()
              .toBytes(value.data as CLAccountHash)
              .unwrap()
          ])
        );
      case KeyTag.Hash:
        return Ok(concat([Uint8Array.from([KeyTag.Hash]), value.data.data]));
      case KeyTag.URef:
        return Ok(
          concat([
            Uint8Array.from([KeyTag.URef]),
            CLValueParsers.toBytes(value.data as CLURef).unwrap()
          ])
        );
      case KeyTag.Transfer:
        return Ok(
          concat([Uint8Array.from([KeyTag.Transfer]), value.data.data])
        );
      case KeyTag.DeployInfo:
        return Ok(
          concat([Uint8Array.from([KeyTag.DeployInfo]), value.data.data])
        );
      case KeyTag.EraInfo:
        return Ok(
          concat([
            Uint8Array.from([KeyTag.DeployInfo]),
            toBytesNumber(64, false)(value.data.data)
          ])
        );
      case KeyTag.Balance:
        return Ok(concat([Uint8Array.from([KeyTag.Balance]), value.data.data]));
      case KeyTag.Bid:
        return Ok(concat([Uint8Array.from([KeyTag.Bid]), value.data.data]));
      case KeyTag.Withdraw:
        return Ok(
          concat([Uint8Array.from([KeyTag.Withdraw]), value.data.data])
        );
      case KeyTag.Dictionary:
        return Ok(
          concat([Uint8Array.from([KeyTag.Dictionary]), value.data.data])
        );
      case KeyTag.SystemEntityRegistry:
        // TODO: Add padding to 32
        return Ok(
          concat([Uint8Array.from([KeyTag.SystemEntityRegistry]), value.data.data])
        );
      case KeyTag.EraSummary:
        // TODO: Add padding to 32
        return Ok(
          concat([Uint8Array.from([KeyTag.EraSummary]), value.data.data])
        );
      case KeyTag.ChainspecRegistry:
        // TODO: Add padding to 32
        return Ok(
          concat([Uint8Array.from([KeyTag.ChainspecRegistry]), value.data.data])
        );
      case KeyTag.ChecksumRegistry:
        // TODO: Add padding to 32
        return Ok(
          concat([Uint8Array.from([KeyTag.ChecksumRegistry]), value.data.data])
        );

        throw new Error('TODO: Implement parsing and serializing');
      default:
        throw new Error(
          `Problem serializing keyVariant: ${value.data.keyVariant}`
        );
    }
    throw new Error('Unknown byte types');
  }

  fromBytesWithRemainder(
    bytes: Uint8Array
  ): ResultAndRemainder<CLKey, CLErrorCodes> {
    if (bytes.length < 1) {
      return resultHelper<CLKey, CLErrorCodes>(
        Err(CLErrorCodes.EarlyEndOfStream)
      );
    }

    const tag = bytes[0];

    // TODO: Use switch
    if (tag === KeyTag.Hash) {
      const hashBytes = bytes.subarray(1);
      const { result, remainder } = HashParser.fromBytesWithRemainder(
        hashBytes
      );
      if (result.ok) {
        const key = new CLKey(result.val);
        return resultHelper(Ok(key), remainder);
      } else {
        return resultHelper<CLKey, CLErrorCodes>(Err(result.val));
      }
    } else if (tag === KeyTag.URef) {
      const {
        result: urefResult,
        remainder: urefRemainder
      } = new CLURefBytesParser().fromBytesWithRemainder(bytes.subarray(1));
      if (urefResult.ok) {
        const key = new CLKey(urefResult.val);
        return resultHelper(Ok(key), urefRemainder);
      } else {
        return resultHelper<CLKey, CLErrorCodes>(Err(urefResult.val));
      }
    } else if (tag === KeyTag.Account) {
      const {
        result: accountHashResult,
        remainder: accountHashRemainder
      } = new CLAccountHashBytesParser().fromBytesWithRemainder(
        bytes.subarray(1)
      );
      if (accountHashResult.ok) {
        const key = new CLKey(accountHashResult.val);
        return resultHelper(Ok(key), accountHashRemainder);
      } else {
        return resultHelper<CLKey, CLErrorCodes>(Err(accountHashResult.val));
      }
    } else {
      return resultHelper<CLKey, CLErrorCodes>(Err(CLErrorCodes.Formatting));
    }
  }
}

export class CLKey extends CLValue {
  data: CLKeyVariant;

  constructor(v: CLKeyVariant) {
    super();
    this.data = v;
  }

  clType(): CLType {
    return new CLKeyType();
  }

  value(): CLKeyVariant {
    return this.data;
  }

  toJSON(): string {
    return this.data.toString();
  }

  isHash(): boolean {
    return this.data.keyVariant === KeyTag.Hash;
  }

  isURef(): boolean {
    return this.data.keyVariant === KeyTag.URef;
  }

  isAccount(): boolean {
    return this.data.keyVariant === KeyTag.Account;
  }

  static fromFormattedString(input: string): CLKey {
    const lastDashIndex = input.lastIndexOf('-');
    if (lastDashIndex >= 0) {
      const prefix = input.slice(0, lastDashIndex);

      switch (prefix) {
        case ACCOUNT_HASH_PREFIX:
          return new CLKey(CLAccountHash.fromFormattedString(input));
        case HASH_PREFIX:
          return new CLKey(KeyHash.fromFormattedString(input));
        case UREF_PREFIX:
          return new CLKey(CLURef.fromFormattedString(input));
        case TRANSFER_PREFIX:
          return new CLKey(KeyTransferAddr.fromFormattedString(input));
        case DEPLOY_HASH_PREFIX:
          return new CLKey(DeployHash.fromFormattedString(input));
        case ERA_INFO_PREFIX:
          return new CLKey(EraInfo.fromFormattedString(input));
        case BALANCE_PREFIX:
          return new CLKey(Balance.fromFormattedString(input));
        case BID_PREFIX:
          return new CLKey(KeyBid.fromFormattedString(input));
        case WITHDRAW_PREFIX:
          return new CLKey(Withdraw.fromFormattedString(input));
        case DICTIONARY_PREFIX:
          return new CLKey(KeyDictionary.fromFormattedString(input));
        case SYSTEM_ENTITY_REGISTRY_PREFIX:
          return new CLKey(KeySystemEntityRegistry.fromFormattedString(input));
        case ERA_SUMMARY_PREFIX:
          return new CLKey(KeyEraSummary.fromFormattedString(input));
        case UNBOND_PREFIX:
          return new CLKey(KeyUnbond.fromFormattedString(input));
        default:
          throw new Error('Unsupported prefix');
      }
    }
    throw Error(`Wrong string format`);
  }
}

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
  KeyHashAddr,
  HashParser,
  KeyTransferAddr,
  KeyDeployHash,
  KeyEraInfo,
  KeyBalance,
  KeyBid,
  KeyWithdraw,
  KeyDictionary,
  KeySystemEntityRegistry,
  KeyEraSummary,
  KeyUnbond,
  KeyChainspecRegistry,
  KeyChecksumRegistry,
  KeyPackage,
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
  UNBOND_PREFIX,
  CHAINSPEC_REGISTRY_PREFIX,
  CHECKSUM_REGISTRY_PREFIX,
  KeyBidAddr,
  BidAddrParser,
  KeyEntityAddrParser,
  KeyEntityAddr,
  ENTITY_PREFIX
} from './index';
import { toBytesNumber } from '../ByteConverters';
import { KEY_TYPE, CLTypeTag, KEY_DEFAULT_BYTE_LENGTH } from './constants';
import { splitAt } from './utils';

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
            Uint8Array.from([KeyTag.EraInfo]),
            toBytesNumber(64, false)(value.data.data)
          ])
        );
      case KeyTag.Balance:
        return Ok(concat([Uint8Array.from([KeyTag.Balance]), value.data.data]));
      case KeyTag.BidAddr:
        const bidAddrBytes = BidAddrParser.toBytes(value.data as KeyBidAddr);
        return Ok(concat([Uint8Array.from([KeyTag.BidAddr]), bidAddrBytes]));
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
      case KeyTag.SystemEntityRegistry: {
        const padding = new Uint8Array(32);
        padding.set(value.data.data, 0);
        return Ok(
          concat([Uint8Array.from([KeyTag.SystemEntityRegistry]), padding])
        );
      }
      case KeyTag.EraSummary: {
        const padding = new Uint8Array(32);
        padding.set(value.data.data, 0);
        return Ok(concat([Uint8Array.from([KeyTag.EraSummary]), padding]));
      }
      case KeyTag.ChainspecRegistry: {
        const padding = new Uint8Array(32);
        padding.set(value.data.data, 0);
        return Ok(
          concat([Uint8Array.from([KeyTag.ChainspecRegistry]), padding])
        );
      }
      case KeyTag.ChecksumRegistry: {
        const padding = new Uint8Array(32);
        padding.set(value.data.data, 0);
        return Ok(
          concat([Uint8Array.from([KeyTag.ChecksumRegistry]), padding])
        );
      }
      case KeyTag.Unbond: {
        return Ok(
          concat([
            Uint8Array.from([KeyTag.Unbond]),
            new CLAccountHashBytesParser()
              .toBytes(value.data as CLAccountHash)
              .unwrap()
          ])
        );
      }
      case KeyTag.AddressableEntity: {
        const bytes = KeyEntityAddrParser.toBytes(value.data as KeyEntityAddr);
        return Ok(concat([Uint8Array.from([KeyTag.AddressableEntity]), bytes]));
      }
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
    const contentBytes = bytes.subarray(1);

    switch (tag) {
      case KeyTag.Hash: {
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
      }
      case KeyTag.URef: {
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
      }
      case KeyTag.Account: {
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
      }
      case KeyTag.Transfer: {
        const [transferBytes, remainder] = splitAt(
          KEY_DEFAULT_BYTE_LENGTH,
          contentBytes
        );
        const transfer = new KeyTransferAddr(transferBytes);
        return resultHelper(Ok(new CLKey(transfer)), remainder);
      }
      case KeyTag.DeployInfo: {
        const [deployBytes, remainder] = splitAt(
          KEY_DEFAULT_BYTE_LENGTH,
          contentBytes
        );
        const deploy = new KeyDeployHash(deployBytes);
        return resultHelper(Ok(new CLKey(deploy)), remainder);
      }
      case KeyTag.EraInfo: {
        const [eraBytes, remainder] = splitAt(64, contentBytes);
        const era = new KeyEraInfo(eraBytes);
        return resultHelper(Ok(new CLKey(era)), remainder);
      }
      case KeyTag.Balance: {
        const [balanceBytes, remainder] = splitAt(
          KEY_DEFAULT_BYTE_LENGTH,
          contentBytes
        );
        const balance = new KeyBalance(balanceBytes);
        return resultHelper(Ok(new CLKey(balance)), remainder);
      }
      case KeyTag.BidAddr: {
        const { result, remainder } = BidAddrParser.fromBytesWithRemainder(
          contentBytes
        );
        if (result.ok) {
          const key = new CLKey(result.val);
          return resultHelper(Ok(key), remainder);
        } else {
          return resultHelper<CLKey, CLErrorCodes>(Err(result.val));
        }
      }
      case KeyTag.Bid: {
        const [bidBytes, remainder] = splitAt(
          KEY_DEFAULT_BYTE_LENGTH,
          contentBytes
        );
        const bid = new KeyBid(bidBytes);
        return resultHelper(Ok(new CLKey(bid)), remainder);
      }
      case KeyTag.Withdraw: {
        const [withdrawBytes, remainder] = splitAt(
          KEY_DEFAULT_BYTE_LENGTH,
          contentBytes
        );
        const withdraw = new KeyWithdraw(withdrawBytes);
        return resultHelper(Ok(new CLKey(withdraw)), remainder);
      }
      case KeyTag.Dictionary: {
        const [dictBytes, remainder] = splitAt(
          KEY_DEFAULT_BYTE_LENGTH,
          contentBytes
        );
        const dict = new KeyDictionary(dictBytes);
        return resultHelper(Ok(new CLKey(dict)), remainder);
      }
      case KeyTag.SystemEntityRegistry: {
        const [systemBytes, remainder] = splitAt(
          KEY_DEFAULT_BYTE_LENGTH,
          contentBytes
        );
        const system = new KeySystemEntityRegistry(systemBytes);
        return resultHelper(Ok(new CLKey(system)), remainder);
      }
      case KeyTag.EraSummary: {
        const [eraBytes, remainder] = splitAt(
          KEY_DEFAULT_BYTE_LENGTH,
          contentBytes
        );
        const era = new KeyEraSummary(eraBytes);
        return resultHelper(Ok(new CLKey(era)), remainder);
      }
      case KeyTag.ChainspecRegistry: {
        const [chainBytes, remainder] = splitAt(
          KEY_DEFAULT_BYTE_LENGTH,
          contentBytes
        );
        const chain = new KeyChainspecRegistry(chainBytes);
        return resultHelper(Ok(new CLKey(chain)), remainder);
      }
      case KeyTag.ChecksumRegistry: {
        const [checksumBytes, remainder] = splitAt(
          KEY_DEFAULT_BYTE_LENGTH,
          contentBytes
        );
        const checksum = new KeyChecksumRegistry(checksumBytes);
        return resultHelper(Ok(new CLKey(checksum)), remainder);
      }
      case KeyTag.Package: {
        const [packageBytes, remainder] = splitAt(
          KEY_DEFAULT_BYTE_LENGTH,
          contentBytes
        );
        const keyPackage = new KeyPackage(packageBytes);
        return resultHelper(Ok(new CLKey(keyPackage)), remainder);
      }
      case KeyTag.Unbond: {
        const {
          result: accountHashResult,
          remainder: accountHashRemainder
        } = new CLAccountHashBytesParser().fromBytesWithRemainder(
          bytes.subarray(1)
        );
        if (accountHashResult.ok) {
          const key = new CLKey(new KeyUnbond(accountHashResult.val));
          return resultHelper(Ok(key), accountHashRemainder);
        } else {
          return resultHelper<CLKey, CLErrorCodes>(Err(accountHashResult.val));
        }
      }
      case KeyTag.AddressableEntity: {
        const {
          result: addressableEntityResult,
          remainder: addressableEntityRemainder
        } = KeyEntityAddrParser.fromBytesWithRemainder(bytes.subarray(1));
        if (addressableEntityResult.ok) {
          const key = new CLKey(addressableEntityResult.val);
          return resultHelper(Ok(key), addressableEntityRemainder);
        } else {
          return resultHelper<CLKey, CLErrorCodes>(
            Err(addressableEntityResult.val)
          );
        }
      }
      default: {
        return resultHelper<CLKey, CLErrorCodes>(Err(CLErrorCodes.Formatting));
      }
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
          return new CLKey(KeyHashAddr.fromFormattedString(input));
        case UREF_PREFIX:
          return new CLKey(CLURef.fromFormattedString(input));
        case TRANSFER_PREFIX:
          return new CLKey(KeyTransferAddr.fromFormattedString(input));
        case DEPLOY_HASH_PREFIX:
          return new CLKey(KeyDeployHash.fromFormattedString(input));
        case ERA_INFO_PREFIX:
          return new CLKey(KeyEraInfo.fromFormattedString(input));
        case BALANCE_PREFIX:
          return new CLKey(KeyBalance.fromFormattedString(input));
        // note: BID_ADDR must come before BID as their heads overlap (bid- / bid-addr-)
        case BID_PREFIX:
          return new CLKey(KeyBid.fromFormattedString(input));
        case WITHDRAW_PREFIX:
          return new CLKey(KeyWithdraw.fromFormattedString(input));
        case DICTIONARY_PREFIX:
          return new CLKey(KeyDictionary.fromFormattedString(input));
        case UNBOND_PREFIX:
          return new CLKey(KeyUnbond.fromFormattedString(input));
        case SYSTEM_ENTITY_REGISTRY_PREFIX:
          return new CLKey(KeySystemEntityRegistry.fromFormattedString(input));
        case ERA_SUMMARY_PREFIX:
          return new CLKey(KeyEraSummary.fromFormattedString(input));
        case CHAINSPEC_REGISTRY_PREFIX:
          return new CLKey(KeyChainspecRegistry.fromFormattedString(input));
        case CHECKSUM_REGISTRY_PREFIX:
          return new CLKey(KeyChecksumRegistry.fromFormattedString(input));
        case ENTITY_PREFIX:
          return new CLKey(KeyEntityAddr.fromFormattedString(input));
        default:
          throw new Error('Unsupported prefix');
      }
    }
    throw Error(`Wrong string format`);
  }
}

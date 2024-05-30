import { concat } from '@ethersproject/bytes';
import { Ok, Err } from 'ts-results';

import {
  CLType,
  CLValue,
  CLKeyVariant,
  CLByteArray,
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
  CLPublicKey,
  resultHelper,
  HashParser,
} from './index';
import { KEY_TYPE, CLTypeTag } from './constants';

export class CLKeyType extends CLType {
  linksTo = KEY_TYPE;
  tag = CLTypeTag.Key;
}

export class CLKeyBytesParser extends CLValueBytesParsers {
  toBytes(value: CLKey): ToBytesResult {
    if (value.isAccount()) {
      return Ok(
        concat([
          Uint8Array.from([KeyTag.Account]),
          new CLAccountHashBytesParser()
            .toBytes(value.data as CLAccountHash)
            .unwrap()
        ])
      );
    }
    if (value.isHash()) {
      return Ok(concat([Uint8Array.from([KeyTag.Hash]), value.data.data]));
    }
    if (value.isURef()) {
      return Ok(
        concat([
          Uint8Array.from([KeyTag.URef]),
          CLValueParsers.toBytes(value.data as CLURef).unwrap()
        ])
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
}

import { concat } from '@ethersproject/bytes';
import { Ok, Err } from 'ts-results';

import {
  CLType,
  CLValue,
  CLKeyVariant,
  CLByteArray,
  CLByteArrayType,
  CLByteArrayBytesParser,
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
  // PUBLIC_KEY_TYPE,
  // ACCOUNT_HASH_TYPE,
  // BYTE_ARRAY_TYPE,
  // UREF_TYPE
} from './index';
import { KEY_TYPE, CLTypeTag, KEY_DEFAULT_BYTE_LENGTH } from './constants';

export class CLKeyType extends CLType {
  linksTo = KEY_TYPE;
  tag = CLTypeTag.Key;
}

export class CLKeyBytesParser extends CLValueBytesParsers {
  toBytes(value: CLKey): ToBytesResult {
    return Ok(
      concat([
        Uint8Array.from([value.keyTag]),

        // CLValueParsers.toBytes(value.data as CLValue).unwrap()
      ])
    );
  }

  fromBytesWithRemainder(
    bytes: Uint8Array
  ): ResultAndRemainder<CLKey, CLErrorCodes> {
    if (bytes.length < 1) {
      return resultHelper<CLKey, CLErrorCodes>(
        Err(CLErrorCodes.EarlyEndOfStream)
      );
    }

    const tag = bytes[0] as KeyTag;
    const remainderBytes = bytes.subarray(1);
    const remainderBytesLength = KEY_DEFAULT_BYTE_LENGTH;
    let parser: CLValueBytesParsers;
    let innerType;
    switch (tag) {
      case KeyTag.Account:
        parser = new CLAccountHashBytesParser();
        break;
      case KeyTag.Hash:
        parser = new CLByteArrayBytesParser();
        innerType = new CLByteArrayType(remainderBytesLength);
        break;
      case KeyTag.URef:
        parser = new CLURefBytesParser();
        break;
      default:
        throw Error('Unknown Key variant - unable to parse');
    }

    const {
      result: parseResult,
      remainder: parseRemainder
    } = parser.fromBytesWithRemainder(remainderBytes, innerType);

    if (parseResult.ok) {
      const res = parseResult.val as unknown as CLKeyVariant;
      const key = new CLKey(res, tag);
      return resultHelper(Ok(key), parseRemainder);
    } else {
      return resultHelper<CLKey, CLErrorCodes>(Err(parseResult.val));
    }
  }
}

export type CLKeyParameters =
  | CLByteArray
  | CLURef
  | CLAccountHash
  | CLPublicKey;

export class CLKey extends CLValue {
  data: CLKeyVariant;
  keyTag: KeyTag;

  constructor(v: CLKeyVariant, keyTag: KeyTag) {
    super();
    this.keyTag === keyTag;
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

  // isHash(): boolean {
  //   return this.data.clType().linksTo === BYTE_ARRAY_TYPE;
  // }

  // isURef(): boolean {
  //   return this.data.clType().linksTo === UREF_TYPE;
  // }

  // isAccount(): boolean {
  //   return this.data.clType().linksTo === ACCOUNT_HASH_TYPE;
  // }
}

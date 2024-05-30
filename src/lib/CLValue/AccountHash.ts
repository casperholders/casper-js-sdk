import { Ok, Err } from 'ts-results';

import {
  CLValue,
  CLValueBytesParsers,
  CLType,
  CLKeyVariant,
  CLErrorCodes,
  ResultAndRemainder,
  ToBytesResult,
  resultHelper,
  ACCOUNT_HASH_TYPE,
  CLByteArrayType,
  ACCOUNT_HASH_LENGTH,
  KeyTag
} from './index';

// AccountHash is an alias, not a fully functional CLType so uses the same CLTypeTag as ByteArray
export class CLAccountHashType extends CLByteArrayType {
  linksTo = ACCOUNT_HASH_TYPE;

  constructor() {
    super(ACCOUNT_HASH_LENGTH);
  }
}

export class CLAccountHashBytesParser extends CLValueBytesParsers {
  toBytes(value: CLAccountHash): ToBytesResult {
    return Ok(value.data);
  }

  fromBytesWithRemainder(
    bytes: Uint8Array
  ): ResultAndRemainder<CLAccountHash, CLErrorCodes> {
    if (bytes.length < ACCOUNT_HASH_LENGTH) {
      return resultHelper<CLAccountHash, CLErrorCodes>(
        Err(CLErrorCodes.EarlyEndOfStream)
      );
    }

    const accountHashBytes = bytes.subarray(0, ACCOUNT_HASH_LENGTH);
    const accountHash = new CLAccountHash(accountHashBytes);
    return resultHelper(Ok(accountHash), bytes.subarray(ACCOUNT_HASH_LENGTH));
  }
}

const ACCOUNT_HASH_PREFIX = 'account-hash';

/** A cryptographic public key. */
export class CLAccountHash extends CLValue implements CLKeyVariant {
  data: Uint8Array;
  keyVariant = KeyTag.Account;
  prefix = ACCOUNT_HASH_PREFIX;
  /**
   * Constructs a new `AccountHash`.
   *
   * @param v The bytes constituting the public key.
   */
  constructor(v: Uint8Array) {
    super();
    this.data = v;
  }

  clType(): CLType {
    return new CLAccountHashType();
  }

  value(): Uint8Array {
    return this.data;
  }

  toStr(): string {
    const bytes = this.data;
    return Buffer.from(bytes).toString('hex');
  }

  toFormattedStr(): string {
    return `${ACCOUNT_HASH_PREFIX}-${this.toStr()}`;
  }

  static fromFormattedStr(hexStr: string): CLAccountHash {
    if (hexStr.startsWith(`${ACCOUNT_HASH_PREFIX}-`)) {
      const formatedString = hexStr.replace(`${ACCOUNT_HASH_PREFIX}-`, '');
      const bytes = Uint8Array.from(Buffer.from(formatedString, 'hex'));
      return new CLAccountHash(bytes);
    }
    throw new Error(
      `Invalid string format. It needs to start with ${ACCOUNT_HASH_PREFIX}`
    );
  }
}

import { concat } from '@ethersproject/bytes';
import { Ok, Err } from 'ts-results';

import {
  CLType,
  CLValue,
  CLAccountHash,
  CLValueBytesParsers,
  CLErrorCodes,
  resultHelper,
  ResultAndRemainder,
  ToBytesResult,
  CLKeyVariant
} from './index';
import { PUBLIC_KEY_TYPE, CLTypeTag, KeyTag } from './constants';
import { decodeBase16, encodeBase16 } from '../Conversions';

// TODO: Tidy up almost the same enum in Keys.
import { SignatureAlgorithm, accountHashHelper } from '../Keys';
import { encode, isChecksummed } from '../ChecksummedHex';

const ED25519_LENGTH = 32;
const SECP256K1_LENGTH = 33;

export enum CLPublicKeyTag {
  ED25519 = 1,
  SECP256K1 = 2
}

export class CLPublicKeyType extends CLType {
  linksTo = PUBLIC_KEY_TYPE;
  tag = CLTypeTag.PublicKey;
}

export class CLPublicKeyBytesParser extends CLValueBytesParsers {
  public toBytes(value: CLPublicKey): ToBytesResult {
    return Ok(concat([Uint8Array.from([value.tag]), value.data]));
  }

  fromBytesWithRemainder(
    rawBytes: Uint8Array
  ): ResultAndRemainder<CLPublicKey, CLErrorCodes> {
    if (rawBytes.length < 1) {
      return resultHelper<CLPublicKey, CLErrorCodes>(
        Err(CLErrorCodes.EarlyEndOfStream)
      );
    }

    const variant = rawBytes[0];

    let expectedPublicKeySize;
    if (variant === CLPublicKeyTag.ED25519) {
      expectedPublicKeySize = ED25519_LENGTH;
    } else if (variant === CLPublicKeyTag.SECP256K1) {
      expectedPublicKeySize = SECP256K1_LENGTH;
    } else {
      return resultHelper<CLPublicKey, CLErrorCodes>(
        Err(CLErrorCodes.Formatting)
      );
    }

    const bytes = rawBytes.subarray(1, expectedPublicKeySize + 1);

    const publicKey = new CLPublicKey(bytes, variant);

    return resultHelper(
      Ok(publicKey),
      rawBytes.subarray(expectedPublicKeySize + 1)
    );
  }
}

export class CLPublicKey extends CLValue implements CLKeyVariant<Uint8Array> {
  data: Uint8Array;
  tag: CLPublicKeyTag;
  keyVariant = KeyTag.Account;

  constructor(
    rawPublicKey: Uint8Array,
    tag: CLPublicKeyTag | SignatureAlgorithm
  ) {
    super();
    // NOTE Two ifs because of the legacy indentifiers in ./Keys
    if (tag === CLPublicKeyTag.ED25519 || tag === SignatureAlgorithm.Ed25519) {
      if (rawPublicKey.length !== ED25519_LENGTH) {
        throw new Error(
          `Wrong length of ED25519 key. Expected ${ED25519_LENGTH}, but got ${rawPublicKey.length}.`
        );
      }
      this.data = rawPublicKey;
      this.tag = CLPublicKeyTag.ED25519;
      return;
    }
    if (
      tag === CLPublicKeyTag.SECP256K1 ||
      tag === SignatureAlgorithm.Secp256K1
    ) {
      if (rawPublicKey.length !== SECP256K1_LENGTH) {
        throw new Error(
          `Wrong length of SECP256K1 key. Expected ${SECP256K1_LENGTH}, but got ${rawPublicKey.length}.`
        );
      }
      this.data = rawPublicKey;
      this.tag = CLPublicKeyTag.SECP256K1;
      return;
    }
    throw new Error('Unsupported type of public key');
  }

  clType(): CLType {
    return new CLPublicKeyType();
  }

  isEd25519(): boolean {
    return this.tag === CLPublicKeyTag.ED25519;
  }

  isSecp256K1(): boolean {
    return this.tag === CLPublicKeyTag.SECP256K1;
  }

  toString(checksummed = true): string {
    // Updated: Returns checksummed hex string
    const rawHex = `0${this.tag}${encodeBase16(this.data)}`;
    if (checksummed) {
      const bytes = decodeBase16(rawHex);
      return encode(bytes.slice(0, 1)) + encode(bytes.slice(1));
    }
    return rawHex;
  }

  toFormattedString(checksummed = true): string {
    return this.toString(checksummed);
  }

  /**
   * Returns hex string representation of the public key.
   * @param checksummed if true, returns checksummed hex string
   * @returns
   * @deprecated Use {@link CLPublicKey.toFormattedString} instead.
   */
  toHex(checksummed = true): string {
    console.warn(
      `CLPublicKey.toHex is deprecated. Use CLPublicKey.toFormattedString instead.`
    );
    return this.toFormattedString(checksummed);
  }

  toAccountHash(): CLAccountHash {
    const hash = accountHashHelper(this.getSignatureAlgorithm(), this.data);
    return new CLAccountHash(hash);
  }

  /**
   * Returns formatted account hash string
   * @returns
   * @deprecated Use {@link CLPublicKey.toAccountHash} instead.
   */
  toAccountHashStr(): string {
    console.warn(
      `CLPublicKey.toAccountHashStr is deprecated. Use CLPublicKey.toAccountHash().toFormattedString() instead.`
    );

    return this.toAccountHash().toFormattedString();
  }

  /**
   * Returns unformatted account hash string
   * @returns
   * @deprecated Use {@link CLPublicKey.toAccountHash} instead.
   */
  toAccountRawHashStr(): string {
    console.warn(
      `CLPublicKey.toAccountRawHashStr is deprecated. Use CLPublicKey.toAccountHash().toString() instead.`
    );

    return this.toAccountHash().toString();
  }

  value(): Uint8Array {
    return this.data;
  }

  static fromEd25519(publicKey: Uint8Array): CLPublicKey {
    return new CLPublicKey(publicKey, CLPublicKeyTag.ED25519);
  }

  static fromSecp256K1(publicKey: Uint8Array): CLPublicKey {
    return new CLPublicKey(publicKey, CLPublicKeyTag.SECP256K1);
  }

  /**
   * Tries to decode PublicKey from its hex-representation.
   * The hex format should be as produced by CLPublicKey.toHex
   * @param publicKeyHex public key hex string contains key tag
   * @param checksummed throws an Error if true and given string is not checksummed
   */
  static fromFormattedString(
    publicKeyHex: string,
    checksummed = false
  ): CLPublicKey {
    if (publicKeyHex.length < 2) {
      throw new Error('Asymmetric key error: too short');
    }
    if (!/^0(1[0-9a-fA-F]{64}|2[0-9a-fA-F]{66})$/.test(publicKeyHex)) {
      throw new Error('Invalid public key');
    }
    if (!isChecksummed(publicKeyHex)) {
      console.warn(
        'Provided public key is not checksummed. Please check if you provide valid public key. You can generate checksummed public key from CLPublicKey.toHex(true).'
      );
      if (checksummed) throw Error('Provided public key is not checksummed.');
    }
    const publicKeyHexBytes = decodeBase16(publicKeyHex);

    return new CLPublicKey(publicKeyHexBytes.subarray(1), publicKeyHexBytes[0]);
  }

  /**
   * Tries to decode PublicKey from its hex-representation.
   * The hex format should be as produced by CLPublicKey.toHex
   * @param publicKeyHex public key hex string contains key tag
   * @param checksummed throws an Error if true and given string is not checksummed
   * @deprecated Use {@link CLPublicKey.fromFormattedString} instead.
   */
  static fromHex(publicKeyHex: string, checksummed = false): CLPublicKey {
    return this.fromFormattedString(publicKeyHex, checksummed);
  }

  getTag(): CLPublicKeyTag {
    return this.tag;
  }

  // TODO: mapping tag to signature algo because of the legacy indentifiers in ./Keys
  getSignatureAlgorithm(): SignatureAlgorithm {
    const mapTagToSignatureAlgorithm = (
      tag: CLPublicKeyTag
    ): SignatureAlgorithm => {
      const signatureAlgorithm = {
        [CLPublicKeyTag.ED25519]: SignatureAlgorithm.Ed25519,
        [CLPublicKeyTag.SECP256K1]: SignatureAlgorithm.Secp256K1
      }[tag];

      if (signatureAlgorithm === undefined) {
        throw Error('Unknown tag to signature algo mapping.');
      }

      return signatureAlgorithm;
    };

    return mapTagToSignatureAlgorithm(this.tag);
  }
}

import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { MaxUint256, NegativeOne, One, Zero } from '@ethersproject/constants';
import { arrayify, concat } from '@ethersproject/bytes';
import { blake2b } from '@noble/hashes/blake2b';

/**
 * Converts a BigNumberish value to bytes with specified bit size and signedness.
 * @param bitSize - The bit size of the integer.
 * @param signed - `true` if the integer is signed; `false` otherwise.
 * @returns A function that converts a BigNumberish value into a `Uint8Array` byte representation.
 */
export const toBytesNumber = (bitSize: number, signed: boolean) => (
  value: BigNumberish
): Uint8Array => {
  const val = BigNumber.from(value);

  // Calculate the maximum allowed unsigned value for the given bit size
  const maxUintValue = MaxUint256.mask(bitSize);

  if (signed) {
    // Calculate signed bounds for the given bit size
    const bounds = maxUintValue.mask(bitSize - 1);
    if (val.gt(bounds) || val.lt(bounds.add(One).mul(NegativeOne))) {
      throw new Error('value out-of-bounds, value: ' + value);
    }
  } else if (val.lt(Zero) || val.gt(maxUintValue.mask(bitSize))) {
    throw new Error('value out-of-bounds, value: ' + value);
  }

  const valTwos = val.toTwos(bitSize).mask(bitSize);

  const bytes = arrayify(valTwos);

  if (valTwos.gte(0)) {
    if (bitSize > 64) {
      if (valTwos.eq(0)) {
        return bytes;
      }
      return concat([bytes, Uint8Array.from([bytes.length])])
        .slice()
        .reverse();
    } else {
      const byteLength = bitSize / 8;
      return concat([
        bytes.slice().reverse(),
        new Uint8Array(byteLength - bytes.length)
      ]);
    }
  } else {
    return bytes.reverse();
  }
};

/**
 * Converts an 8-bit unsigned integer (`u8`) to little-endian byte format.
 */
export const toBytesU8 = toBytesNumber(8, false);

/**
 * Converts a 32-bit signed integer (`i32`) to little-endian byte format.
 */
export const toBytesI32 = toBytesNumber(32, true);

/**
 * Converts a 32-bit unsigned integer (`u32`) to little-endian byte format.
 */
export const toBytesU32 = toBytesNumber(32, false);

/**
 * Converts a 64-bit unsigned integer (`u64`) to little-endian byte format.
 */
export const toBytesU64 = toBytesNumber(64, false);

/**
 * Converts a 64-bit signed integer (`i64`) to little-endian byte format.
 */
export const toBytesI64 = toBytesNumber(64, true);

/**
 * Converts a 128-bit unsigned integer (`u128`) to little-endian byte format.
 */
export const toBytesU128 = toBytesNumber(128, false);

/**
 * Converts a 256-bit unsigned integer (`u256`) to little-endian byte format.
 */
export const toBytesU256 = toBytesNumber(256, false);

/**
 * Converts a 512-bit unsigned integer (`u512`) to little-endian byte format.
 */
export const toBytesU512 = toBytesNumber(512, false);

/**
 * Converts a deploy hash to bytes.
 * @param deployHash - A `Uint8Array` representing the deploy hash.
 * @returns The `Uint8Array` representation of the deploy hash.
 * @deprecated This function will be removed in future versions.
 */
export const toBytesDeployHash = (deployHash: Uint8Array): Uint8Array => {
  return deployHash;
};

/**
 * Serializes a string into a byte array.
 * @param str - The string to be converted.
 * @returns A `Uint8Array` representation of the string, including its length as a `u32` prefix.
 */
export function toBytesString(str: string): Uint8Array {
  const arr = Uint8Array.from(Buffer.from(str));
  return concat([toBytesU32(arr.byteLength), arr]);
}

/**
 * Deserializes a byte array into a string.
 * @param byte - `Uint8Array` representing the serialized string.
 * @returns The deserialized string.
 */
export const fromBytesString = (byte: Uint8Array): string => {
  return Buffer.from(byte).toString();
};

/**
 * Serializes an array of `u8` values, equivalent to `Vec<u8>` in Rust.
 * @param arr - A `Uint8Array` buffer of `u8` integers.
 * @returns A serialized `Uint8Array` with the array's length as a `u32` prefix.
 */
export function toBytesArrayU8(arr: Uint8Array): Uint8Array {
  return concat([toBytesU32(arr.length), arr]);
}

/**
 * Computes the Blake2b hash of a byte array.
 * @param x - A `Uint8Array` byte array to compute the Blake2b hash on.
 * @returns A `Uint8Array` buffer containing the 32-byte Blake2b hash.
 */
export function byteHash(x: Uint8Array): Uint8Array {
  return blake2b(x, { dkLen: 32 });
}

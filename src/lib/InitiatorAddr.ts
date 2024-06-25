import {
  CLAccountHash,
  CLErrorCodes,
  CLPublicKey,
  CLValueParsers,
  ToBytesResult
} from './CLValue';
import { Err, Ok } from 'ts-results';
import { concat } from '@ethersproject/bytes';
import { toBytesU8 } from './ByteConverters';

const PUBLIC_KEY_TAG = 0;
const ACCOUNT_HASH_TAG = 1;
export class InitiatorAddr {
  public PublicKey?: CLPublicKey;
  public AccountHash?: CLAccountHash;

  public static fromPublicKey(publicKey: CLPublicKey): InitiatorAddr {
    return new InitiatorAddr(publicKey);
  }

  public static fromAccountHash(accountHash: CLAccountHash): InitiatorAddr {
    return new InitiatorAddr(undefined, accountHash);
  }

  constructor(publicKey?: CLPublicKey, accountHash?: CLAccountHash) {
    this.PublicKey = publicKey;
    this.AccountHash = accountHash;
  }

  public toBytes(): ToBytesResult {
    if (this.PublicKey) {
      const maybePublicKeyBytes = CLValueParsers.toBytes(this.PublicKey);
      if (maybePublicKeyBytes.err) {
        return maybePublicKeyBytes;
      }
      return Ok(
        concat([toBytesU8(PUBLIC_KEY_TAG), maybePublicKeyBytes.unwrap()])
      );
    } else if (this.AccountHash) {
      const maybeAccountHash = CLValueParsers.toBytes(this.AccountHash);
      if (maybeAccountHash.err) {
        return maybeAccountHash;
      }
      return Ok(
        concat([toBytesU8(ACCOUNT_HASH_TAG), maybeAccountHash.unwrap()])
      );
    }
    return Err(CLErrorCodes.UnknownValue);
  }

  public toJSON(): unknown {
    if (this.AccountHash) {
      return {
        AccountHash: this.AccountHash.toFormattedString()
      };
    } else if (this.PublicKey) {
      return {
        PublicKey: this.PublicKey.toHex()
      };
    }
    return undefined;
  }
}

export const matchInitiatorAddress = (json: any): InitiatorAddr | undefined => {
  if (json.PublicKey) {
    return InitiatorAddr.fromPublicKey(CLPublicKey.fromHex(json.PublicKey));
  } else if (json.AccountHash) {
    return InitiatorAddr.fromAccountHash(
      CLAccountHash.fromFormattedString(json.AccountHash)
    );
  }
  return undefined;
};

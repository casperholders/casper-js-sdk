import { CLPublicKey } from './CLValue';

export interface AccountIdentifier {
  toJSON(): string;
}

export class PublicKey implements AccountIdentifier {
  private key: string;

  constructor(key: string) {
    this.key = key;
  }

  toJSON(): string {
    return this.key;
  }
}

export class AccountHash implements AccountIdentifier {
  private accountHash: string;
  constructor(accountHash: string) {
    this.accountHash = accountHash;
  }

  toJSON(): string {
    return this.accountHash;
  }
}

export function accountHash(publicKey: CLPublicKey): AccountIdentifier {
  return new AccountHash(publicKey.toAccountHashStr());
}

export function publicKey(key: string): AccountIdentifier {
  return new PublicKey(key);
}

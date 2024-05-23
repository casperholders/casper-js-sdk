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
  constructor(publicKey: CLPublicKey) {
    this.accountHash = publicKey.toAccountHashStr();
  }

  toJSON(): string {
    return this.accountHash;
  }
}

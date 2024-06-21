import { Ok } from 'ts-results';
import { ToBytes, ToBytesResult } from './CLValue';
import { toBytesString, toBytesU8 } from './ByteConverters';
import { concat } from '@ethersproject/bytes';

const CUSTOM_TAG = 0;
const TRANSFER_TAG = 1;
const ADD_BID_TAG = 2;
const WITHDRAW_BID_TAG = 3;
const DELEGATE_TAG = 4;
const UNDELEGATE_TAG = 5;
const REDELEGATE_TAG = 6;
const ACTIVATE_BID_TAG = 7;
const CHANGE_BID_PUBLIC_KEY_TAG = 8;
const CALL_TAG = 9;

export abstract class TransactionEntryPoint extends ToBytes {
  public abstract toJSON(): unknown;
}

export class WithdrawBid extends TransactionEntryPoint {
  public toJSON(): string {
    return 'WithdrawBid';
  }

  toBytes(): ToBytesResult {
    return Ok(toBytesU8(WITHDRAW_BID_TAG));
  }
}

export class Call extends TransactionEntryPoint {
  public toJSON(): string {
    return 'Call';
  }

  toBytes(): ToBytesResult {
    return Ok(toBytesU8(CALL_TAG));
  }
}
export class Delegate extends TransactionEntryPoint {
  public toJSON(): string {
    return 'Delegate';
  }

  toBytes(): ToBytesResult {
    return Ok(toBytesU8(DELEGATE_TAG));
  }
}

export class Undelegate extends TransactionEntryPoint {
  public toJSON(): string {
    return 'Undelegate';
  }

  toBytes(): ToBytesResult {
    return Ok(toBytesU8(UNDELEGATE_TAG));
  }
}

export class Redelegate extends TransactionEntryPoint {
  public toJSON(): string {
    return 'Redelegate';
  }

  toBytes(): ToBytesResult {
    return Ok(toBytesU8(REDELEGATE_TAG));
  }
}

export class ActivateBid extends TransactionEntryPoint {
  public toJSON(): string {
    return 'ActivateBid';
  }

  toBytes(): ToBytesResult {
    return Ok(toBytesU8(ACTIVATE_BID_TAG));
  }
}
export class Transfer extends TransactionEntryPoint {
  public toJSON(): string {
    return 'Transfer';
  }
  toBytes(): ToBytesResult {
    return Ok(toBytesU8(TRANSFER_TAG));
  }
}

export class AddBid extends TransactionEntryPoint {
  public toJSON(): string {
    return 'AddBid';
  }
  toBytes(): ToBytesResult {
    return Ok(toBytesU8(ADD_BID_TAG));
  }
}

export class ChangeBidPublicKey extends TransactionEntryPoint {
  public toJSON(): string {
    return 'ChangeBidPublicKey';
  }
  toBytes(): ToBytesResult {
    return Ok(toBytesU8(CHANGE_BID_PUBLIC_KEY_TAG));
  }
}

export class Custom extends TransactionEntryPoint {
  value: string;
  public toJSON(): unknown {
    return {
      Custom: this.value
    };
  }
  static build(value: string): Custom {
    const custom = new Custom();
    custom.value = value;
    return custom;
  }
  toBytes(): ToBytesResult {
    const valueBytes = toBytesString(this.value);
    return Ok(concat([toBytesU8(CUSTOM_TAG), valueBytes]));
  }
}

export const matchTransactionEntryPoint = (
  type: any
): TransactionEntryPoint | undefined => {
  if (type instanceof Object) {
    if (type.Custom) {
      return Custom.build(type.Custom);
    }
  } else if (type == 'ChangeBidPublicKey') {
    return new ChangeBidPublicKey();
  } else if (type == 'AddBid') {
    return new AddBid();
  } else if (type == 'Transfer') {
    return new Transfer();
  } else if (type == 'WithdrawBid') {
    return new WithdrawBid();
  } else if (type == 'Delegate') {
    return new Delegate();
  } else if (type == 'Undelegate') {
    return new Undelegate();
  } else if (type == 'Redelegate') {
    return new Redelegate();
  } else if (type == 'ActivateBid') {
    return new ActivateBid();
  } else if (type == 'Call') {
    return new Call();
  }

  return undefined;
};

import { ToBytes, ToBytesResult } from './CLValue';
import { Ok } from 'ts-results';
import { toBytesU64, toBytesU8 } from './ByteConverters';
import { concat } from '@ethersproject/bytes';

const STANDARD_TAG = 0;
const FUTURE_ERA_TAG = 1;
const FUTURE_TIMESTAMP_TAG = 2;

export abstract class TransactionScheduling extends ToBytes {
  public abstract toJSON(): unknown;
}

export class Standard extends TransactionScheduling {
  public toJSON(): string {
    return 'Standard';
  }

  toBytes(): ToBytesResult {
    return Ok(toBytesU8(STANDARD_TAG));
  }
}

export class FutureEra extends TransactionScheduling {
  value: number;
  constructor(value: number) {
    super();
    this.value = value;
  }
  public toJSON(): unknown {
    return {
      FutureEra: this.value
    };
  }
  toBytes(): ToBytesResult {
    return Ok(concat([toBytesU8(FUTURE_ERA_TAG), toBytesU64(this.value)]));
  }
}

export class FutureTimestamp extends TransactionScheduling {
  value: number;
  constructor(value: string) {
    super();
    this.value = Date.parse(value);
  }
  public toJSON(): unknown {
    return {
      FutureTimestamp: new Date(this.value).toISOString()
    };
  }
  toBytes(): ToBytesResult {
    return Ok(
      concat([toBytesU8(FUTURE_TIMESTAMP_TAG), toBytesU64(this.value)])
    );
  }
}

export const matchTransactionScheduling = (
  type: any
): TransactionScheduling | undefined => {
  if (type === 'Standard') {
    return new Standard();
  } else if (type.FutureEra) {
    return new FutureEra(type.FutureEra);
  } else if (type.FutureTimestamp) {
    return new FutureTimestamp(type.FutureTimestamp);
  }
  return undefined;
};

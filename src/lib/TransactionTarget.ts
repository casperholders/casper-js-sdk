import { TypedJSON, jsonMember, jsonObject } from 'typedjson';
import { TransactionRuntime, transactionRuntimeToBytes } from './StoredValue';
import { TransactionInvocationTarget } from './TransactionInvocationTarget';
import { ToBytes, ToBytesResult } from './CLValue';
import { Ok } from 'ts-results';
import { concat } from '@ethersproject/bytes';
import { toBytesArrayU8, toBytesU8 } from './ByteConverters';
import {
  byteArrayJsonDeserializer,
  byteArrayJsonSerializer
} from './SerializationUtils';

export interface TransactionTarget extends ToBytes {
  toJSON(): unknown;
}

const NATIVE_TAG = 0;
const STORED_TAG = 1;
const SESSION_TAG = 2;

export class Native implements TransactionTarget {
  toBytes(): ToBytesResult {
    return Ok(new Uint8Array([NATIVE_TAG]));
  }
  public toJSON(): string {
    return 'Native';
  }
}

const idSerializer = new TypedJSON(TransactionInvocationTarget);

@jsonObject
export class Stored implements TransactionTarget {
  @jsonMember({ constructor: TransactionInvocationTarget })
  public id: TransactionInvocationTarget;
  @jsonMember({ constructor: String })
  public runtime: TransactionRuntime;

  public toJSON(): unknown {
    return {
      Stored: {
        id: idSerializer.toPlainJson(this.id),
        runtime: this.runtime
      }
    };
  }
  public toBytes(): ToBytesResult {
    const maybeIdBytes = this.id.toBytes();
    if (maybeIdBytes.err) {
      return maybeIdBytes;
    }
    const idBytes = maybeIdBytes.unwrap();

    const maybeRuntimeBytes = transactionRuntimeToBytes(this.runtime);
    if (maybeRuntimeBytes.err) {
      return maybeRuntimeBytes;
    }

    return Ok(
      concat([toBytesU8(STORED_TAG), idBytes, maybeRuntimeBytes.unwrap()])
    );
  }
  static build(
    id: TransactionInvocationTarget,
    runtime: TransactionRuntime
  ): Stored {
    const stored = new Stored();
    stored.id = id;
    stored.runtime = runtime;
    return stored;
  }
}

@jsonObject
export class Session implements TransactionTarget {
  @jsonMember({
    name: 'module_bytes',
    serializer: byteArrayJsonSerializer,
    deserializer: byteArrayJsonDeserializer
  })
  public moduleBytes: Uint8Array;
  @jsonMember({ constructor: String })
  public runtime: TransactionRuntime;
  public toJSON(): unknown {
    return {
      Session: {
        module_bytes: byteArrayJsonSerializer(this.moduleBytes),
        runtime: this.runtime
      }
    };
  }

  public toBytes(): ToBytesResult {
    const maybeRuntimeBytes = transactionRuntimeToBytes(this.runtime);
    if (maybeRuntimeBytes.err) {
      return maybeRuntimeBytes;
    }
    const runtimeBytes = maybeRuntimeBytes.unwrap();

    return Ok(
      concat([
        toBytesU8(SESSION_TAG),
        toBytesArrayU8(this.moduleBytes),
        runtimeBytes
      ])
    );
  }
  static build(moduleBytes: Uint8Array, runtime: TransactionRuntime): Session {
    const session = new Session();
    session.moduleBytes = moduleBytes;
    session.runtime = runtime;
    return session;
  }
}

const storedSerializer = new TypedJSON(Stored);
const sessionSerializer = new TypedJSON(Session);

export const matchTransactionTarget = (
  type: any
): TransactionTarget | undefined => {
  if (type === 'Native') {
    return new Native();
  } else if (type.Stored) {
    const obj = storedSerializer.parse(type.Stored);
    return obj;
  } else if (type.Session) {
    const obj = sessionSerializer.parse(type.Session);
    return obj;
  }
  return undefined;
};

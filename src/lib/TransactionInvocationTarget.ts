import { jsonMember, jsonObject } from 'typedjson';
import { CLErrorCodes, ToBytes, ToBytesResult } from './CLValue';
import { toBytesString, toBytesU32, toBytesU8 } from './ByteConverters';
import { Err, Ok } from 'ts-results';
import { concat } from '@ethersproject/bytes';
import {
  byteArrayJsonDeserializer,
  byteArrayJsonSerializer,
  undefinedSafeByteArrayJsonDeserializer,
  undefinedSafeByteArrayJsonSerializer
} from './Common';

const INVOCABLE_ENTITY_TAG = 0;
const INVOCABLE_ENTITY_ALIAS_TAG = 1;
const PACKAGE_TAG = 2;
const PACKAGE_ALIAS_TAG = 3;

@jsonObject
export class ByPackageHashJson {
  @jsonMember({
    serializer: byteArrayJsonSerializer,
    deserializer: byteArrayJsonDeserializer
  })
  addr: Uint8Array;
  @jsonMember({ constructor: Number })
  version?: number;
}

@jsonObject
export class ByPackageNameJson {
  @jsonMember({ constructor: String })
  name: string;
  @jsonMember({ constructor: Number })
  version?: number;
}

@jsonObject
export class TransactionInvocationTarget extends ToBytes {
  @jsonMember({
    serializer: undefinedSafeByteArrayJsonSerializer,
    deserializer: undefinedSafeByteArrayJsonDeserializer
  })
  ByHash?: Uint8Array;
  @jsonMember({
    constructor: String
  })
  ByName?: string;
  @jsonMember({
    constructor: ByPackageHashJson
  })
  ByPackageHash?: ByPackageHashJson;
  @jsonMember({
    constructor: ByPackageNameJson
  })
  ByPackageName?: ByPackageNameJson;

  toBytes(): ToBytesResult {
    if (this.ByHash) {
      return Ok(concat([toBytesU8(INVOCABLE_ENTITY_TAG), this.ByHash]));
    }
    if (this.ByName) {
      return Ok(
        concat([
          toBytesU8(INVOCABLE_ENTITY_ALIAS_TAG),
          toBytesString(this.ByName)
        ])
      );
    }
    if (this.ByPackageHash) {
      let versionBytes;
      if (this.ByPackageHash.version) {
        versionBytes = concat([
          toBytesU8(1),
          toBytesU32(this.ByPackageHash.version)
        ]);
      } else {
        versionBytes = toBytesU8(0);
      }
      return Ok(
        concat([
          Uint8Array.from([PACKAGE_TAG]),
          this.ByPackageHash.addr,
          versionBytes
        ])
      );
    }
    if (this.ByPackageName) {
      let versionBytes;
      if (this.ByPackageName.version) {
        versionBytes = concat([
          toBytesU8(1),
          toBytesU32(this.ByPackageName.version)
        ]);
      } else {
        versionBytes = toBytesU8(0);
      }
      return Ok(
        concat([
          Uint8Array.from([PACKAGE_ALIAS_TAG]),
          toBytesString(this.ByPackageName.name),
          versionBytes
        ])
      );
    }
    return Err(CLErrorCodes.UnknownValue);
  }
}

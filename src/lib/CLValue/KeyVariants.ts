import { KeyTag } from './index';

// Its not a CLValue but internal type that got serialized as a part of CLKey
// Key features:
//  - internal type creator
//  - stores data
//  - serialize when inside a Key
//  - normally do not serialize as normal CLValue eg. using CLValueParsers.fromBytes
export abstract class CLKeyVariant {
  abstract keyVariant: KeyTag
  abstract data: Uint8Array;
  abstract value(): any;

  abstract toStr(): string;
  abstract toFormattedStr(): string;
  static fromFormattedStr(hexStr: string): CLKeyVariant {
    throw Error(`Trying to deserialize KeyVariant - unknown string provided: ${hexStr}`);
  }
}

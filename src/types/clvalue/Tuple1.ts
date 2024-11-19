import { CLTypeTuple1 } from './cltype';
import { CLValue, IResultWithBytes } from './CLValue';
import { CLValueParser } from './Parser';

/**
 * Represents a tuple containing one CLValue in the Casper type system.
 */
export class CLValueTuple1 {
  public innerType: CLTypeTuple1;
  private innerVal: CLValue;

  /**
   * Initializes a new instance of the CLValueTuple1 class.
   * @param innerType - The CLTypeTuple1 representing the type of the tuple.
   * @param innerVal - The CLValue contained in the tuple.
   */
  constructor(innerType: CLTypeTuple1, innerVal: CLValue) {
    this.innerType = innerType;
    this.innerVal = innerVal;
  }

  /**
   * Converts the tuple to its byte representation.
   * @returns A Uint8Array representing the bytes of the inner CLValue.
   */
  public bytes(): Uint8Array {
    return this.innerVal.bytes();
  }

  /**
   * Provides a string representation of the tuple.
   * @returns A string representation of the tuple in the format "(value)".
   */
  public toString(): string {
    return `(${this.innerVal.toString()})`;
  }

  /**
   * Retrieves the value of the tuple.
   * @returns The CLValue contained in the tuple.
   */
  public value(): CLValue {
    return this.innerVal;
  }

  /**
   * Creates a new CLValue instance with a Tuple1 value.
   * @param val - The CLValue to be contained in the tuple.
   * @returns A new CLValue instance containing CLTypeTuple1 and a CLValueTuple1.
   */
  public static newCLTuple1(val: CLValue): CLValue {
    const tupleType = new CLTypeTuple1(val.type);
    const clValue = new CLValue(tupleType);
    clValue.tuple1 = new CLValueTuple1(tupleType, val);
    return clValue;
  }

  /**
   * Creates a CLValueTuple1 instance from a Uint8Array.
   * Parses the byte array to retrieve the inner value of the tuple.
   * @param source - The Uint8Array containing the byte representation of the Tuple1 value.
   * @param clType - The CLTypeTuple1 representing the type of the tuple.
   * @returns An object containing the new CLValueTuple1 instance and any remaining bytes.
   */
  public static fromBytes(
    source: Uint8Array,
    clType: CLTypeTuple1
  ): IResultWithBytes<CLValueTuple1> {
    const inner = CLValueParser.fromBytesByType(source, clType.inner);

    return {
      result: new CLValueTuple1(clType, inner?.result),
      bytes: inner?.bytes
    };
  }
}
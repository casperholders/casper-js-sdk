import { TypedJSON, jsonMember, jsonObject } from 'typedjson';
import { expect } from 'chai';
import assert, { fail } from 'assert';
import { TransactionTarget, matchTransactionTarget } from './TransactionTarget';

@jsonObject
class UnderTest {
  @jsonMember({
    deserializer: json => matchTransactionTarget(json),
    serializer: value => value.toJSON()
  })
  public a: TransactionTarget;
}
const expectedStoredVariantBytes = [
  1,
  2,
  211,
  230,
  150,
  66,
  179,
  61,
  20,
  111,
  121,
  120,
  11,
  22,
  180,
  170,
  219,
  114,
  32,
  82,
  135,
  179,
  232,
  232,
  154,
  12,
  202,
  185,
  217,
  134,
  159,
  86,
  38,
  8,
  1,
  43,
  2,
  0,
  0,
  0
];
const expectedSessionVariantBytes = [2, 0, 4, 0, 0, 0, 81, 5, 6, 10, 0];
const mockSessionJson = {
  a: {
    Session: {
      kind: 'Standard',
      module_bytes: '5105060a',
      runtime: 'VmCasperV1'
    }
  }
};
const mockStoredJson = {
  a: {
    Stored: {
      id: {
        ByPackageHash: {
          addr:
            'd3e69642b33d146f79780b16b4aadb72205287b3e8e89a0ccab9d9869f562608',
          version: 555
        }
      },
      runtime: 'VmCasperV1'
    }
  }
};
const mockNativeJson = { a: 'Native' };
describe('TransactionTarget', () => {
  const serializer = new TypedJSON(UnderTest);
  it('should parse TransactionTarget::Native correctly', () => {
    const parsed = serializer.parse(mockNativeJson);
    const reserialized = JSON.parse(serializer.stringify(parsed!));
    expect(reserialized).to.deep.eq(mockNativeJson);
  });

  it('should byte-serialize TransactionTarget::Native correctly', () => {
    const parsed = serializer.parse(mockNativeJson);
    const bytes = parsed!.a.toBytes().unwrap();
    assert.deepStrictEqual(Array.from(bytes), [0]);
  });

  it('should parse TransactionTarget::Stored correctly', () => {
    const parsed = serializer.parse(mockStoredJson);
    const reserialized = JSON.parse(serializer.stringify(parsed!));
    expect(reserialized).to.deep.eq(mockStoredJson);
  });

  it('should byte-serialize TransactionTarget::Stored correctly', () => {
    const parsed = serializer.parse(mockStoredJson);
    const bytes = parsed!.a.toBytes().unwrap();
    assert.deepStrictEqual(Array.from(bytes), expectedStoredVariantBytes);
  });

  it('should parse TransactionTarget::Session correctly', () => {
    const parsed = serializer.parse(mockSessionJson);
    const reserialized = JSON.parse(serializer.stringify(parsed!));
    expect(reserialized).to.deep.eq(mockSessionJson);
  });

  it('should byte-serialize TransactionTarget::Session correctly', () => {
    const parsed = serializer.parse(mockSessionJson);
    const bytes = parsed!.a.toBytes().unwrap();
    assert.deepStrictEqual(Array.from(bytes), expectedSessionVariantBytes);
  });
});

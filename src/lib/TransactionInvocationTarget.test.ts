import { TypedJSON } from 'typedjson';
import { expect } from 'chai';
import assert from 'assert';
import { TransactionInvocationTarget } from './TransactionInvocationTarget';

const expectedBytesForByHash = [
  0,
  8,
  117,
  150,
  229,
  121,
  105,
  149,
  229,
  115,
  98,
  45,
  209,
  192,
  231,
  33,
  178,
  220,
  32,
  145,
  244,
  168,
  151,
  102,
  59,
  141,
  178,
  86,
  235,
  185,
  153,
  236,
  60
];
const expectedBytesForByPackageHash = [
  2,
  229,
  152,
  248,
  139,
  241,
  156,
  23,
  31,
  248,
  61,
  189,
  146,
  70,
  92,
  107,
  83,
  113,
  20,
  36,
  197,
  198,
  230,
  143,
  151,
  115,
  28,
  133,
  54,
  96,
  139,
  232,
  108,
  1,
  123,
  0,
  0,
  0
];
const byHashMockJson = {
  ByHash: '087596e5796995e573622dd1c0e721b2dc2091f4a897663b8db256ebb999ec3c'
};
const byNameMockJson = { ByName: 'xyz' };
const byPackageHashJson = {
  ByPackageHash: {
    addr: 'e598f88bf19c171ff83dbd92465c6b53711424c5c6e68f97731c8536608be86c',
    version: 123
  }
};
const byPackageNameMockJson = { ByPackageName: { name: 'xyz', version: 456 } };
describe('TransactionInvocationTarget', () => {
  const serializer = new TypedJSON(TransactionInvocationTarget);
  it('should parse TransactionInvocationTarget::ByHash correctly', () => {
    const parsed = serializer.parse(byHashMockJson);
    const reserialized = JSON.parse(serializer.stringify(parsed!));
    expect(reserialized).to.deep.eq(byHashMockJson);
  });

  it('should byte-serialize TransactionInvocationTarget::ByHash correctly', () => {
    const parsed = serializer.parse(byHashMockJson);
    const bytes = parsed!.toBytes().unwrap();
    assert.deepStrictEqual(Array.from(bytes), expectedBytesForByHash);
  });

  it('should parse TransactionInvocationTarget::ByName correctly', () => {
    const parsed = serializer.parse(byNameMockJson);
    const reserialized = JSON.parse(serializer.stringify(parsed!));
    expect(reserialized).to.deep.eq(byNameMockJson);
  });

  it('should byte-serialize TransactionInvocationTarget::ByName correctly', () => {
    const parsed = serializer.parse(byNameMockJson);
    const bytes = parsed!.toBytes().unwrap();
    assert.deepStrictEqual(Array.from(bytes), [1, 3, 0, 0, 0, 120, 121, 122]);
  });

  it('should parse TransactionInvocationTarget::ByPackageHash correctly', () => {
    const parsed = serializer.parse(byPackageHashJson);
    const reserialized = JSON.parse(serializer.stringify(parsed!));
    expect(reserialized).to.deep.eq(byPackageHashJson);
  });

  it('should byte-serialize TransactionInvocationTarget::ByPackageHash correctly', () => {
    const parsed = serializer.parse(byPackageHashJson);
    const bytes = parsed!.toBytes().unwrap();
    assert.deepStrictEqual(Array.from(bytes), expectedBytesForByPackageHash);
  });

  it('should parse TransactionInvocationTarget::ByPackageName correctly', () => {
    const parsed = serializer.parse(byPackageNameMockJson);
    const reserialized = JSON.parse(serializer.stringify(parsed!));
    expect(reserialized).to.deep.eq(byPackageNameMockJson);
  });

  it('should byte-serialize TransactionInvocationTarget::ByPackageName correctly', () => {
    const parsed = serializer.parse(byPackageNameMockJson);
    const bytes = parsed!.toBytes().unwrap();
    assert.deepStrictEqual(Array.from(bytes), [
      3,
      3,
      0,
      0,
      0,
      120,
      121,
      122,
      1,
      200,
      1,
      0,
      0
    ]);
  });
});

import { TypedJSON, jsonMember, jsonObject } from 'typedjson';
import { expect } from 'chai';
import assert from 'assert';
import {
  TransactionScheduling,
  matchTransactionScheduling
} from './TransactionScheduling';

@jsonObject
class UnderTest {
  @jsonMember({
    deserializer: json => matchTransactionScheduling(json),
    serializer: value => value.toJSON()
  })
  public a: TransactionScheduling;
}

const standardMockJson = { a: 'Standard' };
const futureEraMockJson = { a: { FutureEra: 1456 } };
const futureTimestampMockJson = {
  a: { FutureTimestamp: '2024-05-28T20:41:27.510Z' }
};
describe('TransactionScheduling', () => {
  const serializer = new TypedJSON(UnderTest);
  it('should parse TransactionScheduling::Standard correctly', () => {
    const parsed = serializer.parse(standardMockJson);
    const reserialized = JSON.parse(serializer.stringify(parsed!));
    expect(reserialized).to.deep.eq(standardMockJson);
  });

  it('should byte-serialize TransactionScheduling::Standard correctly', () => {
    const parsed = serializer.parse(standardMockJson);
    const bytes = parsed!.a.toBytes().unwrap();
    assert.deepStrictEqual(Array.from(bytes), [0]);
  });

  it('should parse TransactionScheduling::FutureEra correctly', () => {
    const parsed = serializer.parse(futureEraMockJson);
    const reserialized = JSON.parse(serializer.stringify(parsed!));
    expect(reserialized).to.deep.eq(futureEraMockJson);
  });

  it('should byte-serialize TransactionScheduling::FutureEra correctly', () => {
    const parsed = serializer.parse(futureEraMockJson);
    const bytes = parsed!.a.toBytes().unwrap();
    assert.deepStrictEqual(Array.from(bytes), [1, 176, 5, 0, 0, 0, 0, 0, 0]);
  });

  it('should parse TransactionScheduling::FutureTimestamp correctly', () => {
    const parsed = serializer.parse(futureTimestampMockJson);
    const reserialized = JSON.parse(serializer.stringify(parsed!));
    expect(reserialized).to.deep.eq(futureTimestampMockJson);
  });

  it('should byte-serialize TransactionScheduling::FutureEra correctly', () => {
    const parsed = serializer.parse(futureTimestampMockJson);
    const bytes = parsed!.a.toBytes().unwrap();
    assert.deepStrictEqual(Array.from(bytes), [
      2,
      214,
      186,
      239,
      192,
      143,
      1,
      0,
      0
    ]);
  });
});

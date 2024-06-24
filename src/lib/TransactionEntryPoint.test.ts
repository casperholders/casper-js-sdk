import { TypedJSON, jsonMember, jsonObject } from 'typedjson';
import { expect } from 'chai';
import assert from 'assert';
import {
  TransactionEntryPoint,
  matchTransactionEntryPoint
} from './TransactionEntryPoint';

@jsonObject
class UnderTest {
  @jsonMember({
    deserializer: json => matchTransactionEntryPoint(json),
    serializer: value => value.toJSON()
  })
  public a: TransactionEntryPoint;
}
const customMockJson = { a: { Custom: 'asd' } };
const activateMockJson = { a: 'ActivateBid' };
const addBidMockJson = { a: 'AddBid' };
const changeBidPublicKeyMockJson = { a: 'ChangeBidPublicKey' };
const delegateMockJson = { a: 'Delegate' };
const redelegateMockJson = { a: 'Redelegate' };
const transferMockJson = { a: 'Transfer' };
const undelegateMockJson = { a: 'Undelegate' };
const withdrawMockJson = { a: 'WithdrawBid' };
const callMockJson = { a: 'Call' };

describe('TransactionEntryPoint', () => {
  const serializer = new TypedJSON(UnderTest);
  it('should byte-serialize  TransactionEntryPoint::Custom correctly', () => {
    const parsed = serializer.parse(customMockJson);
    const bytes = parsed!.a.toBytes().unwrap();
    assert.deepStrictEqual(Array.from(bytes), [0, 3, 0, 0, 0, 97, 115, 100]);
  });

  it('should parse TransactionEntryPoint::Custom correctly', () => {
    const parsed = serializer.parse(customMockJson);
    const reserialized = JSON.parse(serializer.stringify(parsed!));
    expect(reserialized).to.deep.eq(customMockJson);
  });

  it('should parse TransactionEntryPoint::ActivateBid correctly', () => {
    const parsed = serializer.parse(activateMockJson);
    const reserialized = JSON.parse(serializer.stringify(parsed!));
    expect(reserialized).to.deep.eq(activateMockJson);
  });

  it('should byte-serialize TransactionEntryPoint::ActivateBid correctly', () => {
    const parsed = serializer.parse(activateMockJson);
    const bytes = parsed!.a.toBytes().unwrap();
    assert.deepStrictEqual(Array.from(bytes), [7]);
  });

  it('should parse TransactionEntryPoint::AddBid correctly', () => {
    const parsed = serializer.parse(addBidMockJson);
    const reserialized = JSON.parse(serializer.stringify(parsed!));
    expect(reserialized).to.deep.eq(addBidMockJson);
  });

  it('should byte-serialize TransactionEntryPoint::AddBid correctly', () => {
    const parsed = serializer.parse(addBidMockJson);
    const bytes = parsed!.a.toBytes().unwrap();
    assert.deepStrictEqual(Array.from(bytes), [2]);
  });

  it('should parse TransactionEntryPoint::ChangeBidPublicKey correctly', () => {
    const parsed = serializer.parse(changeBidPublicKeyMockJson);
    const reserialized = JSON.parse(serializer.stringify(parsed!));
    expect(reserialized).to.deep.eq(changeBidPublicKeyMockJson);
  });

  it('should byte-serialize TransactionEntryPoint::ChangeBidPublicKey correctly', () => {
    const parsed = serializer.parse(changeBidPublicKeyMockJson);
    const bytes = parsed!.a.toBytes().unwrap();
    assert.deepStrictEqual(Array.from(bytes), [8]);
  });

  it('should parse TransactionEntryPoint::Delegate correctly', () => {
    const parsed = serializer.parse(delegateMockJson);
    const reserialized = JSON.parse(serializer.stringify(parsed!));
    expect(reserialized).to.deep.eq(delegateMockJson);
  });

  it('should byte-serialize TransactionEntryPoint::Delegate correctly', () => {
    const parsed = serializer.parse(delegateMockJson);
    const bytes = parsed!.a.toBytes().unwrap();
    assert.deepStrictEqual(Array.from(bytes), [4]);
  });

  it('should parse TransactionEntryPoint::Redelegate correctly', () => {
    const parsed = serializer.parse(redelegateMockJson);
    const reserialized = JSON.parse(serializer.stringify(parsed!));
    expect(reserialized).to.deep.eq(redelegateMockJson);
  });

  it('should byte-serialize TransactionEntryPoint::Redelegate correctly', () => {
    const parsed = serializer.parse(redelegateMockJson);
    const bytes = parsed!.a.toBytes().unwrap();
    assert.deepStrictEqual(Array.from(bytes), [6]);
  });

  it('should parse TransactionEntryPoint::Transfer correctly', () => {
    const parsed = serializer.parse(transferMockJson);
    const reserialized = JSON.parse(serializer.stringify(parsed!));
    expect(reserialized).to.deep.eq(transferMockJson);
  });

  it('should byte-serialize TransactionEntryPoint::Transfer correctly', () => {
    const parsed = serializer.parse(transferMockJson);
    const bytes = parsed!.a.toBytes().unwrap();
    assert.deepStrictEqual(Array.from(bytes), [1]);
  });

  it('should parse TransactionEntryPoint::Undelegate correctly', () => {
    const parsed = serializer.parse(undelegateMockJson);
    const reserialized = JSON.parse(serializer.stringify(parsed!));
    expect(reserialized).to.deep.eq(undelegateMockJson);
  });

  it('should byte-serialize TransactionEntryPoint::Undelegate correctly', () => {
    const parsed = serializer.parse(undelegateMockJson);
    const bytes = parsed!.a.toBytes().unwrap();
    assert.deepStrictEqual(Array.from(bytes), [5]);
  });

  it('should parse TransactionEntryPoint::WithdrawBid correctly', () => {
    const parsed = serializer.parse(withdrawMockJson);
    const reserialized = JSON.parse(serializer.stringify(parsed!));
    expect(reserialized).to.deep.eq(withdrawMockJson);
  });

  it('should byte-serialize TransactionEntryPoint::WithdrawBid correctly', () => {
    const parsed = serializer.parse(withdrawMockJson);
    const bytes = parsed!.a.toBytes().unwrap();
    assert.deepStrictEqual(Array.from(bytes), [3]);
  });

  it('should parse TransactionEntryPoint::Call correctly', () => {
    const parsed = serializer.parse(callMockJson);
    const reserialized = JSON.parse(serializer.stringify(parsed!));
    expect(reserialized).to.deep.eq(callMockJson);
  });

  it('should byte-serialize TransactionEntryPoint::Call correctly', () => {
    const parsed = serializer.parse(callMockJson);
    const bytes = parsed!.a.toBytes().unwrap();
    assert.deepStrictEqual(Array.from(bytes), [9]);
  });
});

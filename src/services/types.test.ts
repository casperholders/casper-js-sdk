import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Operation, OpKind } from './types';

chai.use(chaiAsPromised);

describe('CasperServiceByJsonRPC', () => {
  it('should deserialize operations', async () => {
    let operationRaw = '{"key":"key","kind":"Read"}';
    let operation: Operation = JSON.parse(operationRaw);
    let expected: Operation = { key: 'key', kind: OpKind.Read };
    expect(operation).to.deep.eq(expected);

    operationRaw = '{"key":"key2","kind":"Write"}';
    operation = JSON.parse(operationRaw);
    expected = { key: 'key2', kind: OpKind.Write };
    expect(operation).to.deep.eq(expected);

    operationRaw = '{"key":"key3","kind":"Add"}';
    operation = JSON.parse(operationRaw);
    expected = { key: 'key3', kind: OpKind.Add };
    expect(operation).to.deep.eq(expected);

    operationRaw = '{"key":"key4","kind":"NoOp"}';
    operation = JSON.parse(operationRaw);
    expected = { key: 'key4', kind: OpKind.NoOp };
    expect(operation).to.deep.eq(expected);

    operationRaw = '{"key":"key5","kind":"Prune"}';
    operation = JSON.parse(operationRaw);
    expected = { key: 'key5', kind: OpKind.Prune };
    expect(operation).to.deep.eq(expected);
  });
});

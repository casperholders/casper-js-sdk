import { expect } from 'chai';
import { CLAccountHash } from './AccountHash';
import { CLValueParsers, CLAccountHashType } from './index';

describe('CLAccountHash', () => {
  it('Should be able to return proper value by calling .value()', () => {
    const arr8 = new Uint8Array([21, 31]);
    const myHash = new CLAccountHash(arr8);

    expect(myHash.value()).to.be.deep.eq(arr8);
  });

  it('toBytes() / fromBytes() do proper bytes serialization', () => {
    const expectedBytes = Uint8Array.from(Array(32).fill(42));
    const expectedHash = new CLAccountHash(expectedBytes);

    const bytes = CLValueParsers.toBytes(expectedHash).unwrap();
    const hash = CLValueParsers.fromBytes(
      bytes,
      new CLAccountHashType()
    ).unwrap();

    expect(bytes).to.deep.eq(expectedBytes);
    expect(hash).to.deep.eq(expectedHash);
  });

  it('Dealing with formatted strings', () => {
    const hashStr = 'account-hash-9fb3803b335f14b083b97400e57d5c8e8ad0ec5859a51225b6611e34357c8d77';

    const fromStr = CLAccountHash.fromFormattedStr(hashStr);

    expect(fromStr.toFormattedStr()).to.eq(fromStr);

    const badFn = () => CLAccountHash.fromFormattedStr('9fb3803b335f14b083b97400e57d5c8e8ad0ec5859a51225b6611e34357c8d77');
    expect(badFn).to.throw();
  });
});

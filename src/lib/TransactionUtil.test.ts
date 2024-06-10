import { CLPublicKey } from './CLValue';
import { RuntimeArgs } from './RuntimeArgs';
import { TransactionCategoryMint, TransactionV1Body } from './TransactionUtil';
import { byteHash } from './ByteConverters';
import { expect } from 'chai';
import { Native } from './TransactionTarget';
import { Transfer } from './TransactionEntryPoint';
import { Standard } from './TransactionScheduling';
import { byteArrayJsonSerializer } from './Common';
import { TypedJSON } from 'typedjson';

const mockArgs = {
  args: [
    [
      'amount',
      { cl_type: 'U512', bytes: '0500e40b5402', parsed: '10000000000' }
    ],
    [
      'id',
      {
        cl_type: { Option: 'U64' },
        bytes: '01980f11de8f010000',
        parsed: 1717417611160
      }
    ],
    [
      'target',
      {
        cl_type: 'PublicKey',
        bytes:
          '012706c89fdca5419f573464abba1583d6c6c268548769e582683cd794b2998696',
        parsed:
          '012706c89fdca5419f573464abba1583d6c6c268548769e582683cd794b2998696'
      }
    ]
  ]
};
describe('TransactionUtil', () => {
  const expectedBodyHash =
    '7d963698c7464204e91e1b1b4ead647a9e85e64dbf5573b2180216214d155724';
  it('should calculate body has correctly', () => {
    CLPublicKey.fromHex(
      '01ae0a8ba1e0d2c96eaa84de63d4051396147ed30aeba6919b01952c833e0814b8',
      false
    );
    const serializer = new TypedJSON(RuntimeArgs);
    const args = serializer.parse(mockArgs)!;

    const transactionTarget = new Native();
    const transactionEntryPoint = new Transfer();
    const transactionScheduling = new Standard();
    const body = TransactionV1Body.build(
      args,
      transactionTarget,
      transactionEntryPoint,
      TransactionCategoryMint,
      transactionScheduling
    );
    const bodyBytes = body.toBytes().unwrap();
    const bodyHash = byteHash(bodyBytes);
    expect(byteArrayJsonSerializer(bodyHash)).to.deep.eq(expectedBodyHash);
  });
});

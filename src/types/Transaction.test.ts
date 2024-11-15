import { BigNumber } from '@ethersproject/bignumber';
import { assert, expect } from 'chai';

import { Duration, Timestamp } from './Time';
import {
  TransactionV1,
  TransactionV1Body,
  TransactionV1Header
} from './Transaction';
import { InitiatorAddr } from './InitiatorAddr';
import { PrivateKey } from './keypair/PrivateKey';
import { FixedMode, PricingMode } from './PricingMode';

import { KeyAlgorithm } from './keypair/Algorithm';

import { SessionTarget, TransactionTarget } from './TransactionTarget';
import { TransactionEntryPoint } from './TransactionEntryPoint';
import { TransactionScheduling } from './TransactionScheduling';
import { Args } from './Args';
import {
  CLValue,
  CLValueOption,
  CLValueUInt512,
  CLValueUInt64
} from './clvalue';
import { PublicKey } from './keypair';

describe('Test Transaction', () => {
  it('should create a Transaction from TransactionV1', async () => {
    const keys = await PrivateKey.generate(KeyAlgorithm.ED25519);
    const timestamp = new Timestamp(new Date());
    const paymentAmount = 20000000000000;

    const pricingMode = new PricingMode();
    const fixedMode = new FixedMode();
    fixedMode.gasPriceTolerance = 3;
    pricingMode.fixed = fixedMode;

    const transactionHeader = TransactionV1Header.build({
      chainName: 'casper-net-1',
      timestamp,
      ttl: new Duration(1800000),
      initiatorAddr: new InitiatorAddr(keys.publicKey),
      pricingMode
    });

    const args = Args.fromMap({
      target: CLValue.newCLPublicKey(
        PublicKey.fromHex(
          '0202f5a92ab6da536e7b1a351406f3744224bec85d7acbab1497b65de48a1a707b64'
        )
      ),
      amount: CLValueUInt512.newCLUInt512(BigNumber.from(paymentAmount)),
      id: CLValueOption.newCLOption(CLValueUInt64.newCLUint64(3))
    });

    const transactionTarget = new TransactionTarget(new SessionTarget());
    const entryPoint = new TransactionEntryPoint(undefined, {});
    const scheduling = new TransactionScheduling({});

    const transactionBody = TransactionV1Body.build({
      args: args,
      target: transactionTarget,
      transactionEntryPoint: entryPoint,
      transactionScheduling: scheduling,
      transactionCategory: 2
    });

    const transaction = TransactionV1.makeTransactionV1(
      transactionHeader,
      transactionBody
    );
    await transaction.sign(keys);

    const toJson = TransactionV1.toJson(transaction);
    const parsed = TransactionV1.fromJSON(toJson);

    const transactionPaymentAmount = parsed.body.args.args
      .get('amount')!
      .toString();

    assert.deepEqual(parsed.approvals[0].signer, keys.publicKey);
    expect(transaction.body).to.deep.equal(transactionBody);
    expect(transaction.header).to.deep.equal(transactionHeader);
    assert.deepEqual(parseInt(transactionPaymentAmount, 10), paymentAmount);
  });
});

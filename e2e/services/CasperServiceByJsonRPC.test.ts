import fs from 'fs';
import path from 'path';

import { assert, expect } from 'chai';
import { config } from 'dotenv';
import { BigNumber } from '@ethersproject/bignumber';

import {
  CasperServiceByJsonRPC,
  EraSummary,
  NamedKey,
  PurseIdentifier,
  getBlockHash,
  getHeight
} from '../../src/services';
import {
  Keys,
  DeployUtil,
  RuntimeArgs,
  CasperClient,
  CLValueBuilder,
  CLValueParsers,
  CLKeyVariant,
  TransactionUtil,
  CLU64,
  CLU64Type,
  encodeBase16,
  TransactionRuntime
} from '../../src/index';
import { sleep } from './utils';
import { Contract } from '../../src/lib/Contracts';

import { FAUCET_PRIV_KEY, NETWORK_NAME, NODE_URL } from '../config';
import {
  PricingMode,
  TransactionCategoryInstallUpgrade,
  TransactionCategoryLarge,
  TransactionCategoryMint,
  makeV1Transaction
} from '../../src/lib/TransactionUtil';
import {
  Native,
  Session,
  Stored,
  TransactionSessionKind
} from '../../src/lib/TransactionTarget';
import { Call, Custom, Transfer } from '../../src/lib/TransactionEntryPoint';
import { Standard } from '../../src/lib/TransactionScheduling';
import { InitiatorAddr } from '../../src/lib/InitiatorAddr';
import { Some } from 'ts-results';
import { DEFAULT_DEPLOY_TTL } from '../../src/constants';
import { TransactionInvocationTarget } from '../../src/lib/TransactionInvocationTarget';

config();

const { SignatureAlgorithm, getKeysFromHexPrivKey, Ed25519 } = Keys;

const client = new CasperServiceByJsonRPC(NODE_URL);
const faucetKey = getKeysFromHexPrivKey(
  FAUCET_PRIV_KEY,
  SignatureAlgorithm.Ed25519
);

describe('CasperServiceByJsonRPC', () => {
  const BLOCKS_TO_CHECK = 3;

  let transferBlockHash = '';
  // TODO: Remove After mainnet goes 1.5
  let isAfterDot5 = false;

  // Run tests after `BLOCKS_TO_CHECK` blocks are mined
  before(async () => {
    try {
      const promise = new Promise<void>(async resolve => {
        setInterval(async () => {
          try {
            const latestBlock = await client.getLatestBlockInfo();
            const block_with_signatures = latestBlock.block_with_signatures;
            if (block_with_signatures !== null) {
              const gotHeight = getHeight(block_with_signatures.block);
              if (gotHeight > BLOCKS_TO_CHECK) {
                return resolve();
              }
            }
          } catch (error) {
            console.error(error);
          }
        }, 500);
      });

      await promise;
    } catch (error) {
      console.error(error);
    }
  });

  it('info_get_status', async () => {
    const status = await client.getStatus();

    isAfterDot5 = !status.build_version.startsWith('1.4');

    expect(status).to.have.property('peers');
    expect(status).to.have.property('build_version');
    expect(status).to.have.property('chainspec_name');
    expect(status).to.have.property('starting_state_root_hash');
    expect(status).to.have.property('last_added_block_info');
    expect(status).to.have.property('our_public_signing_key');
    expect(status).to.have.property('round_length');
    expect(status).to.have.property('next_upgrade');
    expect(status).to.have.property('uptime');
    if (isAfterDot5) {
      expect(status).to.have.property('reactor_state');
      expect(status).to.have.property('last_progress');
      expect(status).to.have.property('available_block_range');
      expect(status).to.have.property('block_sync');
    }
  });

  it('chain_get_block - by number', async () => {
    const check = async (height: number) => {
      const result = await client.getBlockInfoByHeight(height);
      assert.equal(getHeight(result.block_with_signatures!.block), height);
    };

    for (let i = 0; i < BLOCKS_TO_CHECK; i++) {
      await check(i);
      //
      // **Work arround for `Error: request to http://127.0.0.1:7777/rpc failed, reason: socket hang up` issue in Node.js v20 version**
      // Check https://github.com/casper-ecosystem/casper-js-sdk/actions/runs/5451894505/jobs/9918683628#step:7:112
      //
      // await sleep(100);
      //
    }
  });

  it('chain_get_block - by hash', async () => {
    const check = async (height: number) => {
      const block_by_height = await client.getBlockInfoByHeight(height);
      const block_hash = getBlockHash(
        block_by_height.block_with_signatures!.block
      );
      assert.exists(block_hash);

      const block = await client.getBlockInfo(block_hash!);
      const block_hash_2 = getBlockHash(block.block_with_signatures!.block);
      assert.equal(block_hash_2, block_hash);
    };

    for (let i = 0; i < BLOCKS_TO_CHECK; i++) {
      await check(i);
    }
  });

  it('chain_get_block', async () => {
    const latestBlock = await client.getLatestBlockInfo();
    expect(latestBlock).to.have.property('block_with_signatures');
  });

  it('should not allow to send deploy larger then 1 megabyte.', async () => {
    // moduleBytes need to have length of (1 megabyte - 169 bytes) to produce
    // a deploy with the size of (1 megabyte + 1 byte).
    const oneMegaByte = 1048576;
    const moduleBytes = Uint8Array.from(Array(oneMegaByte - 169).fill(0));

    const deployParams = new DeployUtil.DeployParams(
      Keys.Ed25519.new().publicKey,
      'test'
    );
    const session = DeployUtil.ExecutableDeployItem.newModuleBytes(
      moduleBytes,
      RuntimeArgs.fromMap({})
    );
    const payment = DeployUtil.standardPayment(100000);
    const deploy = DeployUtil.makeDeploy(deployParams, session, payment);

    assert.equal(DeployUtil.deploySizeInBytes(deploy), oneMegaByte + 1);
    await client
      .deploy(deploy)
      .then(() => {
        assert.fail("client.deploy should't throw an error.");
      })
      .catch(err => {
        const expectedMessage =
          `Deploy can not be send, because it's too large: ${oneMegaByte +
            1} bytes. ` + `Max size is 1 megabyte.`;
        assert.equal(err.message, expectedMessage);
      });
  });

  it('chain_get_state_root_hash - by hash', async () => {
    const latestBlock = await client.getLatestBlockInfo();

    expect(latestBlock.block_with_signatures).to.exist;
    const block_hash = getBlockHash(latestBlock.block_with_signatures!.block);
    const stateRootHash = await client.getStateRootHash(block_hash!);
    assert.equal(stateRootHash.length, 64);
  });

  it('chain_get_state_root_hash - by height', async () => {
    const latestBlock = await client.getLatestBlockInfo();

    expect(latestBlock.block_with_signatures).to.exist;
    expect(getHeight(latestBlock.block_with_signatures!.block)).to.greaterThan(
      1
    );

    const stateRootHash = await client.getStateRootHashByHeight(1);
    assert.equal(stateRootHash.length, 64);
  });

  it('info_get_peers', async () => {
    const peers = await client.getPeers();
    expect(peers).to.have.property('peers');
  });

  xit('state_get_auction_info - newest one', async () => {
    const validators = await client.getValidatorsInfo();
    expect(validators).to.have.property('auction_state');
  });

  xit('state_get_auction_info - by height', async () => {
    const validators = await client.getValidatorsInfoByBlockHeight(1);
    expect(validators).to.have.property('auction_state');
    expect(validators.auction_state.block_height).to.be.eq(1);
  });

  it('state_get_account_info - should fail if fetching an account created after 2.x', async () => {
    await client
      .getAccountInfo(faucetKey.publicKey)
      .then(() => {
        assert.fail('client.getAccountInfo should throw an error.');
      })
      .catch(err => {
        const expectedMessage = `Account migrated to an addressable entity`;
        assert.equal(err.message, expectedMessage);
      });
  });

  it('state_get_balance', async () => {
    const faucetBalance = '1000000000000000000000000000000000';
    const stateRootHash = await client.getStateRootHash();
    const entity_identifier = {
      PublicKey: faucetKey.publicKey.toHex(false)
    };
    const entity = await client.getEntity(entity_identifier);
    const main_purse = entity.AddressableEntity.entity.main_purse;
    const balance = await client.getAccountBalance(stateRootHash, main_purse);
    expect(balance.eq(faucetBalance)).to.be;
  });

  it('query_balance', async () => {
    const balanceByPublicKey = await client.queryBalance(
      PurseIdentifier.MainPurseUnderPublicKey,
      faucetKey.publicKey.toHex(false)
    );

    const balanceByAccountHash = await client.queryBalance(
      PurseIdentifier.MainPurseUnderAccountHash,
      faucetKey.publicKey.toAccountHashStr()
    );
    expect(balanceByAccountHash.eq(balanceByPublicKey)).to.be;

    const entity = await client.getEntity({
      PublicKey: faucetKey.publicKey.toHex(false)
    });

    const balanceByUref = await client.queryBalance(
      PurseIdentifier.PurseUref,
      entity.AddressableEntity.entity.main_purse
    );
    expect(balanceByUref.eq(balanceByPublicKey)).to.be;
  });

  it('should transfer CSPR - account_put_transaction', async () => {
    // for native-transfers payment price is fixed
    const paymentAmount = 10000000000;
    const id = Date.now();

    const initiatorAddr = InitiatorAddr.fromPublicKey(faucetKey.publicKey);
    const ttl = 1000000;
    const transactionParams = new TransactionUtil.Version1Params(
      initiatorAddr,
      Date.now(),
      ttl,
      NETWORK_NAME,
      PricingMode.buildFixed(100)
    );

    const toPublicKey = Keys.Ed25519.new().publicKey;
    const runtimeArgs = RuntimeArgs.fromMap({
      target: toPublicKey,
      amount: CLValueBuilder.u512(paymentAmount),
      id: CLValueBuilder.option(Some(new CLU64(id)), new CLU64Type())
    });
    const transactionTarget = new Native();
    const transactionEntryPoint = new Transfer();
    const transactionScheduling = new Standard();
    const transaction = TransactionUtil.makeV1Transaction(
      transactionParams,
      runtimeArgs,
      transactionTarget,
      transactionEntryPoint,
      transactionScheduling,
      TransactionCategoryMint
    );
    const signedTransaction = TransactionUtil.signTransaction(
      transaction,
      faucetKey
    );
    await client.transaction(signedTransaction);
    await sleep(2500);
    const result = await client.waitForTransaction(signedTransaction, 100000);
    if (!result) {
      assert.fail('Transfer deploy failed');
    }
    expect(encodeBase16(signedTransaction.Version1!.hash)).to.be.equal(
      result.transaction.Version1.hash
    );
    const block_hash = result.execution_info?.block_hash;
    if (!block_hash) {
      assert.fail('Expected block_hash in execution_info');
    }
    transferBlockHash = block_hash;

    const balance = await client.queryBalance(
      PurseIdentifier.MainPurseUnderPublicKey,
      toPublicKey.toHex(false)
    );

    expect('' + paymentAmount).to.be.equal(balance.toString());
  });

  it('should transfer CSPR - account_put_deploy', async () => {
    // for native-transfers payment price is fixed
    const paymentAmount = 10000000000;
    const id = Date.now();

    const amount = '5000000000';

    const deployParams = new DeployUtil.DeployParams(
      faucetKey.publicKey,
      NETWORK_NAME
    );

    const toPublicKey = Keys.Ed25519.new().publicKey;
    const session = DeployUtil.ExecutableDeployItem.newTransfer(
      amount,
      toPublicKey,
      null,
      id
    );
    const payment = DeployUtil.standardPayment(paymentAmount);
    const deploy = DeployUtil.makeDeploy(deployParams, session, payment);
    const signedDeploy = DeployUtil.signDeploy(deploy, faucetKey);
    const { deploy_hash } = await client.deploy(signedDeploy);
    await sleep(2500);

    const result = await client.waitForDeploy(signedDeploy, 100000);
    if (!result) {
      assert.fail('Transfer deploy failed');
    }
    expect(deploy_hash).to.be.equal(result.deploy.hash);
    expect(result.deploy.session).to.have.property('Transfer');
    const block_hash = result.execution_info?.block_hash;
    if (!block_hash) {
      assert.fail('Expected block_hash in execution_info');
    }
    transferBlockHash = block_hash;

    const balance = await client.queryBalance(
      PurseIdentifier.MainPurseUnderPublicKey,
      toPublicKey.toHex(false)
    );

    expect(amount).to.be.equal(balance.toString());
  });

  it('should deploy example wasm over rpc', async () => {
    const casperClient = new CasperClient(NODE_URL);
    const erc20 = new Contract(casperClient);
    const wasmPath = path.resolve(__dirname, './contract.wasm');
    const wasm = new Uint8Array(fs.readFileSync(wasmPath, null).buffer);

    const tokenName = 'TEST';
    const tokenSymbol = 'TST';
    const tokenDecimals = 8;
    const tokenTotlaSupply = 500_000_000_000;

    const args = RuntimeArgs.fromMap({
      message: CLValueBuilder.string(tokenName),
      symbol: CLValueBuilder.string(tokenSymbol),
      decimals: CLValueBuilder.u8(tokenDecimals),
      total_supply: CLValueBuilder.u256(tokenTotlaSupply)
    });
    const signedDeploy = erc20.install(
      wasm,
      args,
      '200000000000',
      faucetKey.publicKey,
      NETWORK_NAME,
      [faucetKey]
    );

    await client.deploy(signedDeploy);
    await sleep(2500);
    await client.waitForDeploy(signedDeploy, 100000);
    const entity_identifier = {
      AccountHash: faucetKey.publicKey.toAccountHashStr()
    };
    const { AddressableEntity } = await client.getEntity(entity_identifier);
    const named_key = AddressableEntity!.named_keys.find((i: NamedKey) => {
      return i.name === 'my-key-name';
    })?.key;

    assert.exists(named_key);
  });

  it('CEP18 should work deployed via "account_put_deploy"', async () => {
    const casperClient = new CasperClient(NODE_URL);
    const cep18 = new Contract(casperClient);
    const wasmPath = path.resolve(__dirname, './cep18.wasm');
    const wasm = new Uint8Array(fs.readFileSync(wasmPath, null).buffer);
    const id = Date.now();

    const tokenName = 'TEST-' + id;
    const tokenSymbol = 'TST-' + id;
    const tokenDecimals = 8;
    const tokenTotalSupply = 500_000;

    const runtimeArgs = RuntimeArgs.fromMap({
      name: CLValueBuilder.string(tokenName),
      symbol: CLValueBuilder.string(tokenSymbol),
      decimals: CLValueBuilder.u8(tokenDecimals),
      total_supply: CLValueBuilder.u256(tokenTotalSupply),
      events_mode: CLValueBuilder.u8(0)
    });

    const signedDeploy = cep18.install(
      wasm,
      runtimeArgs,
      '50000000000',
      faucetKey.publicKey,
      NETWORK_NAME,
      [faucetKey]
    );
    await client.deploy(signedDeploy);

    await sleep(2500);

    let result = await client.waitForDeploy(signedDeploy, 100000);

    const entity_identifier = {
      AccountHash: faucetKey.publicKey.toAccountHashStr()
    };
    const { AddressableEntity } = await client.getEntity(entity_identifier);
    const contractHash = AddressableEntity!.named_keys.find((i: NamedKey) => {
      return i.name === 'cep18_contract_hash_' + tokenName;
    })?.key;

    assert.exists(contractHash);

    cep18.setContractHash(contractHash!);
    cep18.setContractName(`cep18_contract_hash_${tokenName}`);
    const fetchedTokenName = await cep18.queryContractData(['name']);
    const fetchedTokenSymbol = await cep18.queryContractData(['symbol']);
    const fetchedTokenDecimals: BigNumber = await cep18.queryContractData([
      'decimals'
    ]);
    const fetchedTokenTotalSupply: BigNumber = await cep18.queryContractData([
      'total_supply'
    ]);

    const balanceOf = async (erc20: Contract, owner: CLKeyVariant) => {
      const balanceKey = Buffer.from(
        CLValueParsers.toBytes(CLValueBuilder.key(owner)).unwrap()
      ).toString('base64');
      const balance: BigNumber = (
        await erc20.queryContractDictionary('balances', balanceKey)
      ).value();
      return balance;
    };

    const balanceOfFaucet = await balanceOf(
      cep18,
      faucetKey.publicKey.toAccountHash()
    );

    assert.equal(tokenName, fetchedTokenName);
    assert.equal(tokenSymbol, fetchedTokenSymbol);
    assert.equal(tokenDecimals, fetchedTokenDecimals.toNumber());
    assert.equal(tokenTotalSupply, fetchedTokenTotalSupply.toNumber());
    assert.equal(balanceOfFaucet.toNumber(), tokenTotalSupply);

    // Test `callEntrypoint` method: Transfter token
    const recipient = Ed25519.new().publicKey.toAccountHash();
    const transferAmount = 2_000;
    const transferArgs = RuntimeArgs.fromMap({
      recipient: CLValueBuilder.key(recipient),
      amount: CLValueBuilder.u256(2_000)
    });

    const transferDeploy = cep18.callEntrypoint(
      'transfer',
      transferArgs,
      faucetKey.publicKey,
      NETWORK_NAME,
      '2500000000',
      [faucetKey]
    );
    const { deploy_hash } = await client.deploy(transferDeploy);
    await sleep(2500);
    result = await client.waitForDeploy(transferDeploy, 100000);

    assert.equal(result.deploy.hash, deploy_hash);
    expect(result.deploy.session).to.have.property('StoredContractByName');
    expect(result.execution_info!.execution_result!).to.have.property(
      'Version2'
    );
    const amorphicExecutionResult: any = result.execution_info!
      .execution_result!;
    if (amorphicExecutionResult['Version2']) {
      expect(amorphicExecutionResult['Version2'].error_message).to.be.null;
    }
    const balanceOfRecipient = await balanceOf(cep18, recipient);
    assert.equal(balanceOfRecipient.toNumber(), transferAmount);
  });

  //This needs to wait for a fix in the node which currently prevents wasm transactions
  xit('CEP18 should work deployed via "account_put_transaction"', async () => {
    const casperClient = new CasperClient(NODE_URL);
    const cep18 = new Contract(casperClient);
    const wasmPath = path.resolve(__dirname, './cep18.wasm');
    const wasm = new Uint8Array(fs.readFileSync(wasmPath, null).buffer);
    const paymentAmount = 10000000000;
    const id = Date.now();

    const tokenName = 'TEST-' + id;
    const tokenSymbol = 'TST-' + id;
    const tokenDecimals = 8;
    const tokenTotalSupply = 500_000;
    const runtimeArgs = RuntimeArgs.fromMap({
      name: CLValueBuilder.string(tokenName),
      symbol: CLValueBuilder.string(tokenSymbol),
      decimals: CLValueBuilder.u8(tokenDecimals),
      total_supply: CLValueBuilder.u256(tokenTotalSupply),
      events_mode: CLValueBuilder.u8(0),
      amount: CLValueBuilder.u512(paymentAmount)
    });
    const params = new TransactionUtil.Version1Params(
      InitiatorAddr.fromPublicKey(faucetKey.publicKey),
      Date.now(),
      DEFAULT_DEPLOY_TTL,
      NETWORK_NAME,
      PricingMode.buildFixed(3)
    );
    const transaction = makeV1Transaction(
      params,
      runtimeArgs,
      Session.build(
        TransactionSessionKind.Installer,
        wasm,
        TransactionRuntime.VmCasperV1
      ),
      new Call(),
      new Standard(),
      TransactionCategoryInstallUpgrade
    );
    const signedTransaction = transaction.sign([faucetKey]);
    await client.transaction(signedTransaction);

    await sleep(2500);

    const result = await client.waitForTransaction(signedTransaction, 100000);
    if (!result) {
      assert.fail('Deploy failed');
    }
    const entity_identifier = {
      AccountHash: faucetKey.publicKey.toAccountHashStr()
    };
    const { AddressableEntity } = await client.getEntity(entity_identifier);
    const contractHash = AddressableEntity!.named_keys.find((i: NamedKey) => {
      return i.name === 'cep18_contract_hash_' + tokenName;
    })?.key;

    assert.exists(contractHash);

    cep18.setContractHash(contractHash!);
    cep18.setContractName(`cep18_contract_hash_${tokenName}`);
    const fetchedTokenName = await cep18.queryContractData(['name']);
    const fetchedTokenSymbol = await cep18.queryContractData(['symbol']);
    const fetchedTokenDecimals: BigNumber = await cep18.queryContractData([
      'decimals'
    ]);
    const fetchedTokenTotalSupply: BigNumber = await cep18.queryContractData([
      'total_supply'
    ]);

    const balanceOfFaucet = await balanceOf(
      cep18,
      faucetKey.publicKey.toAccountHash()
    );

    assert.equal(tokenName, fetchedTokenName);
    assert.equal(tokenSymbol, fetchedTokenSymbol);
    assert.equal(tokenDecimals, fetchedTokenDecimals.toNumber());
    assert.equal(tokenTotalSupply, fetchedTokenTotalSupply.toNumber());
    assert.equal(balanceOfFaucet.toNumber(), tokenTotalSupply);

    // Test `callEntrypoint` method: Transfter token
    const recipient = Ed25519.new().publicKey;
    const transferAmount = 2_000;
    const transferArgs = RuntimeArgs.fromMap({
      recipient: CLValueBuilder.key(recipient.toAccountHash()),
      amount: CLValueBuilder.u256(2_000)
    });

    const runEndpointParams = new TransactionUtil.Version1Params(
      InitiatorAddr.fromPublicKey(faucetKey.publicKey),
      Date.now(),
      DEFAULT_DEPLOY_TTL,
      NETWORK_NAME,
      PricingMode.buildFixed(3)
    );
    const byHash = new TransactionInvocationTarget();
    const contractName = `cep18_contract_hash_${tokenName}`;
    byHash.ByName = contractName;
    const runEndpointTransaction = makeV1Transaction(
      runEndpointParams,
      transferArgs,
      Stored.build(byHash, TransactionRuntime.VmCasperV1),
      Custom.build('transfer'),
      new Standard(),
      TransactionCategoryLarge
    );

    const signedRunEndpointTransaction = runEndpointTransaction.sign([
      faucetKey
    ]);
    const { transaction_hash } = await client.transaction(
      signedRunEndpointTransaction
    );
    await sleep(2500);
    const transferResult = await client.waitForTransaction(
      signedRunEndpointTransaction,
      100000
    );
    assert.equal(
      transferResult.transaction.Version1.hash,
      transaction_hash.Version1!
    );

    expect(
      transferResult.transaction.Version1.body.target.Stored.id
    ).to.have.property('ByName');
    expect(transferResult.execution_info!.execution_result!).to.have.property(
      'Version2'
    );
    const amorphicExecutionResult: any = transferResult.execution_info!
      .execution_result!;
    if (amorphicExecutionResult['Version2']) {
      expect(amorphicExecutionResult['Version2'].error_message).to.be.null;
    }

    const balanceOfRecipient = await balanceOf(
      cep18,
      recipient.toAccountHash()
    );
    assert.equal(balanceOfRecipient.toNumber(), transferAmount);
  });

  it('chain_get_block_transfers - blockHash', async () => {
    const { transfers } = await client.getBlockTransfers(transferBlockHash);
    expect(transfers.length).to.be.greaterThan(0);
  });

  it('chain_get_era_info_by_switch_block - by height', async () => {
    const getEarliestSwitchBlock = async (): Promise<[number, EraSummary]> => {
      return new Promise(async resolve => {
        // For some reason in 2.0 blok with height 0 has `era_end` filled, but there is no era_end entity in storage.
        // This makes getEraInfoBySwitchBlock fail on block 0. For now we start from 1, but we need to know if this is a bug or it's intentional.
        // On mainnet block 0 has no era_end, plus this code worked in 1.x
        let height = 1;
        let summary;
        while (!summary) {
          const eraSummary = await client.getEraInfoBySwitchBlock({
            Height: height
          });
          if (eraSummary) {
            height = height;
            summary = eraSummary;
            return resolve([height, summary]);
          } else {
            height += 1;
          }
        }
      });
    };
    const [height, eraSummary] = await getEarliestSwitchBlock();
    const blockInfo = await client.getBlockInfoByHeight(height);
    expect(eraSummary.blockHash).to.be.equal(
      getBlockHash(blockInfo.block_with_signatures!.block)
    );
  });

  it('info_get_chainspec', async () => {
    if (!isAfterDot5) {
      return;
    }
    const result = await client.getChainSpec();
    expect(result).to.have.property('chainspec_bytes');
    expect(result.chainspec_bytes).to.have.property('chainspec_bytes');
    expect(result.chainspec_bytes).to.have.property(
      'maybe_genesis_accounts_bytes'
    );
    expect(result.chainspec_bytes).to.have.property('maybe_global_state_bytes');
  });

  // TODO
  xit('speculative_exec');
});

async function balanceOf(
  erc20: Contract,
  owner: CLKeyVariant
): Promise<BigNumber> {
  const balanceKey = Buffer.from(
    CLValueParsers.toBytes(CLValueBuilder.key(owner)).unwrap()
  ).toString('base64');
  const balance: BigNumber = (
    await erc20.queryContractDictionary('balances', balanceKey)
  ).value();
  return balance;
}

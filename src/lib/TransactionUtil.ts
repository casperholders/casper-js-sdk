import { TypedJSON, jsonArrayMember, jsonMember, jsonObject } from 'typedjson';
import { Keys, RuntimeArgs, ToBytes, ToBytesResult, encodeBase16 } from '.';
import { TransactionTarget, matchTransactionTarget } from './TransactionTarget';
import {
  TransactionEntryPoint,
  matchTransactionEntryPoint
} from './TransactionEntryPoint';
import {
  TransactionScheduling,
  matchTransactionScheduling
} from './TransactionScheduling';
import { concat } from '@ethersproject/bytes';
import { Ok } from 'ts-results';
import {
  byteHash,
  toBytesBytesArray,
  toBytesDeployHash,
  toBytesString,
  toBytesU64,
  toBytesU8
} from './ByteConverters';
import { AsymmetricKey, SignatureAlgorithm } from './Keys';
import { InitiatorAddr, matchInitiatorAddress } from './InitiatorAddr';
import {
  Approval,
  byteArrayJsonDeserializer,
  byteArrayJsonSerializer,
  dehumanizerTTL,
  desRA,
  humanizerTTL,
  serRA
} from './SerializationUtils';
import { Deploy, deploySizeInBytes, signDeploy } from './DeployUtil';
import { TransactionHash } from '../services';
import { PricingMode } from './PricingMode';

export * from './PricingMode';
export const TransactionCategoryMint = 0;
export const TransactionCategoryAuction = 1;
export const TransactionCategoryInstallUpgrade = 2;
export const TransactionCategoryLarge = 3;
export const TransactionCategoryMedium = 4;
export const TransactionCategorySmall = 5;

@jsonObject
export class TransactionV1Header implements ToBytes {
  @jsonMember({
    name: 'chain_name',
    constructor: String
  })
  public chainName: string;
  @jsonMember({
    serializer: (n: number) => new Date(n).toISOString(),
    deserializer: (s: string) => Date.parse(s)
  })
  public timestamp: number;

  @jsonMember({
    serializer: humanizerTTL,
    deserializer: dehumanizerTTL
  })
  public ttl: number;

  @jsonMember({
    name: 'body_hash',
    serializer: byteArrayJsonSerializer,
    deserializer: byteArrayJsonDeserializer
  })
  public bodyHash: Uint8Array;
  @jsonMember({
    name: 'pricing_mode',
    constructor: PricingMode
  })
  public pricingMode: PricingMode;
  @jsonMember({
    name: 'initiator_addr',
    deserializer: json => matchInitiatorAddress(json),
    serializer: value => value.toJSON()
  })
  public initiatorAddr: InitiatorAddr;

  constructor(
    initiatorAddr: InitiatorAddr,
    timestamp: number,
    ttl: number,
    chainName: string,
    bodyHash: Uint8Array,
    pricingMode: PricingMode
  ) {
    this.initiatorAddr = initiatorAddr;
    this.timestamp = timestamp;
    this.ttl = ttl;
    this.bodyHash = bodyHash;
    this.pricingMode = pricingMode;
    this.chainName = chainName;
  }

  toBytes(): ToBytesResult {
    const maybePricingModeBytes = this.pricingMode.toBytes();
    if (maybePricingModeBytes.err) {
      return maybePricingModeBytes;
    }
    const pricingModeBytes = maybePricingModeBytes.unwrap();

    const maybeInitiatorAddressBytes = this.initiatorAddr.toBytes();
    if (maybeInitiatorAddressBytes.err) {
      return maybeInitiatorAddressBytes;
    }
    const initiatorAddressBytes = maybeInitiatorAddressBytes.unwrap();
    return Ok(
      concat([
        toBytesString(this.chainName),
        toBytesU64(this.timestamp),
        toBytesU64(this.ttl),
        toBytesDeployHash(this.bodyHash),
        pricingModeBytes,
        initiatorAddressBytes
      ])
    );
  }
}

@jsonObject
export class TransactionV1Body {
  @jsonMember({
    deserializer: desRA,
    serializer: serRA
  })
  public args: RuntimeArgs;
  @jsonMember({
    deserializer: matchTransactionTarget,
    serializer: v => v.toJSON()
  })
  public target: TransactionTarget;
  @jsonMember({
    name: 'entry_point',
    deserializer: matchTransactionEntryPoint,
    serializer: v => v.toJSON()
  })
  public entryPoint: TransactionEntryPoint;
  @jsonMember({
    name: 'transaction_kind',
    constructor: Number
  })
  public transactionKind: number;
  @jsonMember({
    deserializer: matchTransactionScheduling,
    serializer: value => value.toJSON()
  })
  public scheduling: TransactionScheduling;

  static build(
    args: RuntimeArgs,
    target: TransactionTarget,
    entryPoint: TransactionEntryPoint,
    transactionKind: number,
    scheduling: TransactionScheduling
  ): TransactionV1Body {
    const body = new TransactionV1Body();
    body.args = args;
    body.target = target;
    body.entryPoint = entryPoint;
    body.scheduling = scheduling;
    body.transactionKind = transactionKind;
    return body;
  }

  public toBytes(): ToBytesResult {
    const argsBytes = toBytesBytesArray(this.args.toBytes().unwrap());
    const targetBytes = this.target.toBytes().unwrap();
    const entryPointBytes = this.entryPoint.toBytes().unwrap();
    const transactionKindBytes = toBytesU8(this.transactionKind);
    const schedulingBytes = this.scheduling.toBytes().unwrap();
    return Ok(
      concat([
        argsBytes,
        targetBytes,
        entryPointBytes,
        transactionKindBytes,
        schedulingBytes
      ])
    );
  }
}

@jsonObject
export class TransactionV1 {
  @jsonMember({
    serializer: byteArrayJsonSerializer,
    deserializer: byteArrayJsonDeserializer
  })
  public hash: Uint8Array;
  @jsonMember({
    constructor: TransactionV1Header
  })
  public header: TransactionV1Header;
  @jsonMember({
    constructor: TransactionV1Body
  })
  public body: TransactionV1Body;

  @jsonArrayMember(Approval)
  public approvals: Approval[];

  constructor(
    hash: Uint8Array,
    header: TransactionV1Header,
    body: TransactionV1Body
  ) {
    this.hash = hash;
    this.header = header;
    this.body = body;
    this.approvals = [];
  }
}

/**
 * A variant enum of either a Version1-style Transaction or a legacy Deploy one.
 */
@jsonObject
export class Transaction {
  @jsonMember({
    constructor: TransactionV1
  })
  public Version1?: TransactionV1;
  @jsonMember({
    constructor: Deploy
  })
  public Deploy?: Deploy;
  static fromVersion1(version1: TransactionV1): Transaction {
    return Transaction.build(version1);
  }
  static fromDeploy(deploy: Deploy): Transaction {
    return Transaction.build(undefined, deploy);
  }

  private static build(version1?: TransactionV1, deploy?: Deploy): Transaction {
    const transaction = new Transaction();
    transaction.Version1 = version1;
    transaction.Deploy = deploy;
    return transaction;
  }

  public sizeInBytes(): number {
    if (this.Deploy) {
      return deploySizeInBytes(this.Deploy) + 1; //+1 for the transaction type tag
    } else if (this.Version1) {
      return version1SizeInBytes(this.Version1) + 1; //+1 for the transaction type tag
    }
    return 0;
  }

  public hasApprovals(): boolean {
    if (this.Deploy) {
      return this.Deploy.approvals.length > 0;
    } else if (this.Version1) {
      return this.Version1.approvals.length > 0;
    }
    return false;
  }

  public sign(keys: AsymmetricKey[]): Transaction {
    const signedTransaction = keys.reduce(
      (acc: Transaction, key: AsymmetricKey) => {
        acc = signTransaction(acc, key);
        return acc;
      },
      this
    );

    return signedTransaction;
  }

  public getTransactionHash(): TransactionHash {
    if (this.Deploy) {
      return {
        Deploy: encodeBase16(this.Deploy.hash)
      };
    } else if (this.Version1) {
      return {
        Version1: encodeBase16(this.Version1.hash)
      };
    }
    throw new Error('Unknown transaction type');
  }
}

function version1SizeInBytes(transaction: TransactionV1): number {
  const hashSize = transaction.hash.length;
  const bodySize = serializeBody(transaction.body).length;
  const headerSize = serializeHeader(transaction.header).unwrap().length;
  const approvalsSize = transaction.approvals
    .map(approval => {
      return (approval.signature.length + approval.signer.length) / 2;
    })
    .reduce((a, b) => a + b, 0);

  return hashSize + headerSize + bodySize + approvalsSize;
}

export const serializeHeader = (header: TransactionV1Header): ToBytesResult => {
  const maybePricingModeBytes = header.pricingMode.toBytes();
  if (maybePricingModeBytes.err) {
    return maybePricingModeBytes;
  }
  const pricingModeBytes = maybePricingModeBytes.unwrap();

  const maybeInitiatorAddressBytes = header.initiatorAddr.toBytes();
  if (maybeInitiatorAddressBytes.err) {
    return maybeInitiatorAddressBytes;
  }
  const initiatorAddressBytes = maybeInitiatorAddressBytes.unwrap();
  return Ok(
    concat([
      toBytesString(header.chainName),
      toBytesU64(header.timestamp),
      toBytesU64(header.ttl),
      toBytesDeployHash(header.bodyHash),
      pricingModeBytes,
      initiatorAddressBytes
    ])
  );
};

export const serializeBody = (body: TransactionV1Body): Uint8Array => {
  const argsBytes = body.args.toBytes().unwrap();
  const targetBytes = body.target.toBytes().unwrap();
  const entryPointBytes = body.entryPoint.toBytes().unwrap();
  const schedulingBytes = body.scheduling.toBytes().unwrap();
  return concat([argsBytes, targetBytes, entryPointBytes, schedulingBytes]);
};

/**
 * Convert the transaction to a JSON representation
 *
 * @param transaction The `Transaction` object to convert to JSON
 * @returns A JSON version of the `Deploy`, which can be converted back later
 */
export const transactionToJson = (transaction: Transaction) => {
  const serializer = new TypedJSON(Transaction);
  return {
    transaction: serializer.toPlainJson(transaction)
  };
};

/**
 * Uses the provided key pair to sign the Transaction message
 * @param transaction Either an unsigned `Transaction` object or one with other signatures
 * @param signingKey The keypair used to sign the `Transaction`
 */
export const signTransaction = (
  transaction: Transaction,
  signingKey: AsymmetricKey
): Transaction => {
  const approval = new Approval();
  if (transaction.Deploy) {
    signDeploy(transaction.Deploy, signingKey);
    return transaction;
  } else if (transaction.Version1) {
    const version1 = transaction.Version1;
    const signature = signingKey.sign(version1.hash);
    approval.signer = signingKey.accountHex();
    switch (signingKey.signatureAlgorithm) {
      case SignatureAlgorithm.Ed25519:
        approval.signature = Keys.Ed25519.accountHex(signature);
        break;
      case SignatureAlgorithm.Secp256K1:
        approval.signature = Keys.Secp256K1.accountHex(signature);
        break;
    }
    version1.approvals.push(approval);
  } else {
    throw new Error('Unknown transaction type');
  }

  return transaction;
};

export class Version1Params {
  initiatorAddr: InitiatorAddr;
  timestamp: number;
  ttl: number;
  chainName: string;
  pricingMode: PricingMode;
  constructor(
    initiatorAddr: InitiatorAddr,
    timestamp: number,
    ttl: number,
    chainName: string,
    pricingMode: PricingMode
  ) {
    this.initiatorAddr = initiatorAddr;
    this.timestamp = timestamp;
    this.ttl = ttl;
    this.chainName = chainName;
    this.pricingMode = pricingMode;
  }
}

/**
 * Builds a `Transaction` object from `TransactionParams`, session logic, and payment logic
 * @param transactionParam The parameters of the deploy, see [DeployParams](#L1323)
 * @param session The session logic of the deploy
 * @param payment The payment logic of the deploy
 * @returns A new `Transaction` object
 */
export function makeV1Transaction(
  transactionParam: Version1Params,
  args: RuntimeArgs,
  target: TransactionTarget,
  entryPoint: TransactionEntryPoint,
  scheduling: TransactionScheduling
): Transaction {
  const body = TransactionV1Body.build(
    args,
    target,
    entryPoint,
    TransactionCategoryMint,
    scheduling
  );
  const bodyBytes = body.toBytes().unwrap();
  const bodyHash = byteHash(bodyBytes);

  const header = new TransactionV1Header(
    transactionParam.initiatorAddr,
    transactionParam.timestamp,
    transactionParam.ttl,
    transactionParam.chainName,
    bodyHash,
    transactionParam.pricingMode
  );

  const headerBytes = header.toBytes().unwrap();
  const headerHash = byteHash(headerBytes);
  const version1 = new TransactionV1(headerHash, header, body);
  return Transaction.fromVersion1(version1);
}

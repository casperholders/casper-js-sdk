import { jsonObject, jsonMember, jsonArrayMember, TypedJSON } from 'typedjson';
import { concat } from '@ethersproject/bytes';

import { Hash } from './key';
import { Deploy } from './Deploy';
import { Duration, Timestamp } from './Time';
import { InitiatorAddr } from './InitiatorAddr';
import { PricingMode } from './PricingMode';
import { TransactionTarget } from './TransactionTarget';
import { TransactionEntryPoint } from './TransactionEntryPoint';
import { TransactionScheduling } from './TransactionScheduling';
import { PublicKey } from './keypair';
import { HexBytes } from './HexBytes';
import { PrivateKey } from './keypair/PrivateKey';
import { CLValueString, CLValueUInt64 } from './clvalue';
import { Args } from './Args';
import { deserializeArgs, serializeArgs } from './SerializationUtils';
import { byteHash } from './ByteConverters';

export class TransactionError extends Error {}
export const ErrInvalidBodyHash = new TransactionError('invalid body hash');
export const ErrInvalidTransactionHash = new TransactionError(
  'invalid transaction hash'
);
export const ErrInvalidApprovalSignature = new TransactionError(
  'invalid approval signature'
);
export const ErrTransactionV1FromJson = new TransactionError(
  "The JSON can't be parsed as a TransactionV1."
);

export enum TransactionCategory {
  Mint = 0,
  Auction,
  InstallUpgrade,
  Large,
  Medium,
  Small
}

export enum TransactionVersion {
  V1 = 0,
  Deploy
}

@jsonObject
export class Approval {
  @jsonMember({
    name: 'signer',
    constructor: PublicKey,
    deserializer: json => PublicKey.fromJSON(json),
    serializer: value => value.toJSON()
  })
  public signer: PublicKey;

  @jsonMember({
    name: 'signature',
    constructor: HexBytes,
    deserializer: json => HexBytes.fromJSON(json),
    serializer: value => value.toJSON()
  })
  public signature: HexBytes;

  constructor(signer: PublicKey, signature: HexBytes) {
    this.signer = signer;
    this.signature = signature;
  }
}

@jsonObject
export class TransactionV1Header {
  @jsonMember({ name: 'chain_name', constructor: String })
  public chainName: string;

  @jsonMember({
    name: 'timestamp',
    constructor: Timestamp,
    deserializer: json => Timestamp.fromJSON(json),
    serializer: value => value.toJSON()
  })
  public timestamp: Timestamp;

  @jsonMember({
    name: 'ttl',
    constructor: Duration,
    deserializer: json => Duration.fromJSON(json),
    serializer: value => value.toJSON()
  })
  public ttl: Duration;

  @jsonMember({
    name: 'initiator_addr',
    constructor: InitiatorAddr,
    deserializer: json => InitiatorAddr.fromJSON(json),
    serializer: value => value.toJSON()
  })
  public initiatorAddr: InitiatorAddr;

  @jsonMember({ name: 'pricing_mode', constructor: PricingMode })
  public pricingMode: PricingMode;

  @jsonMember({
    name: 'body_hash',
    constructor: Hash,
    deserializer: json => Hash.fromJSON(json),
    serializer: value => value.toJSON()
  })
  public bodyHash: Hash;

  static build({
    initiatorAddr,
    timestamp,
    ttl,
    chainName,
    pricingMode
  }: {
    initiatorAddr: InitiatorAddr;
    timestamp: Timestamp;
    ttl: Duration;
    chainName: string;
    bodyHash?: Hash;
    pricingMode: PricingMode;
  }): TransactionV1Header {
    const header = new TransactionV1Header();
    header.initiatorAddr = initiatorAddr;
    header.timestamp = timestamp;
    header.ttl = ttl;
    header.pricingMode = pricingMode;
    header.chainName = chainName;
    return header;
  }

  public toBytes(): Uint8Array {
    const chainNameBytes = CLValueString.newCLString(this.chainName).bytes();
    const timestampMillis = this.timestamp.toMilliseconds();
    const timestampBytes = CLValueUInt64.newCLUint64(
      BigInt(timestampMillis)
    ).bytes();
    const ttlBytes = CLValueUInt64.newCLUint64(
      BigInt(this.ttl.toMilliseconds())
    ).bytes();
    const bodyHashBytes = this.bodyHash.toBytes();
    const pricingModeBytes = this.pricingMode.toBytes();
    const initiatorAddrBytes = this.initiatorAddr.toBytes();

    return concat([
      chainNameBytes,
      timestampBytes,
      ttlBytes,
      bodyHashBytes,
      pricingModeBytes,
      initiatorAddrBytes
    ]);
  }
}

@jsonObject
export class TransactionV1Body {
  @jsonMember({
    name: 'args',
    constructor: Args,
    deserializer: deserializeArgs,
    serializer: serializeArgs
  })
  public args: Args;

  @jsonMember({
    name: 'target',
    constructor: TransactionTarget,
    deserializer: json => TransactionTarget.fromJSON(json),
    serializer: value => value.toJSON()
  })
  public target: TransactionTarget;

  @jsonMember({
    name: 'entry_point',
    constructor: TransactionEntryPoint,
    deserializer: json => TransactionEntryPoint.fromJSON(json),
    serializer: value => value.toJSON()
  })
  public entryPoint: TransactionEntryPoint;

  @jsonMember({ name: 'transaction_category', constructor: Number })
  public category: number;

  @jsonMember({
    name: 'scheduling',
    constructor: TransactionScheduling,
    deserializer: json => TransactionScheduling.fromJSON(json),
    serializer: value => value.toJSON()
  })
  public scheduling: TransactionScheduling;

  static build({
    args,
    target,
    transactionEntryPoint,
    transactionScheduling,
    transactionCategory
  }: {
    args: Args;
    target: TransactionTarget;
    transactionEntryPoint: TransactionEntryPoint;
    transactionScheduling: TransactionScheduling;
    transactionCategory: number;
  }): TransactionV1Body {
    const body = new TransactionV1Body();
    body.args = args;
    body.target = target;
    body.entryPoint = transactionEntryPoint;
    body.scheduling = transactionScheduling;
    body.category = transactionCategory;
    return body;
  }

  toBytes(): Uint8Array {
    const argsBytes = this.args?.toBytes() || new Uint8Array();
    const targetBytes = this.target.toBytes();
    const entryPointBytes = this.entryPoint.bytes();
    const categoryBytes = new Uint8Array([this.category]);
    const schedulingBytes = this.scheduling.bytes();

    return concat([
      argsBytes,
      targetBytes,
      entryPointBytes,
      categoryBytes,
      schedulingBytes
    ]);
  }
}

@jsonObject
export class TransactionV1 {
  @jsonMember({
    name: 'hash',
    constructor: Hash,
    deserializer: json => Hash.fromJSON(json),
    serializer: value => value.toJSON()
  })
  public hash: Hash;

  @jsonMember({ name: 'header', constructor: TransactionV1Header })
  public header: TransactionV1Header;

  @jsonMember({ name: 'body', constructor: TransactionV1Body })
  public body: TransactionV1Body;

  @jsonArrayMember(() => Approval)
  public approvals: Approval[];

  constructor(
    hash: Hash,
    header: TransactionV1Header,
    body: TransactionV1Body,
    approvals: Approval[]
  ) {
    this.hash = hash;
    this.header = header;
    this.body = body;
    this.approvals = approvals;
  }

  public validate(): void {
    const bodyBytes = this.body.toBytes();

    if (!this.arrayEquals(byteHash(bodyBytes), this.header.bodyHash.toBytes()))
      throw ErrInvalidBodyHash;

    const headerBytes = this.header.toBytes();

    if (!this.arrayEquals(byteHash(headerBytes), this.hash.toBytes()))
      throw ErrInvalidTransactionHash;

    for (const approval of this.approvals) {
      if (
        !approval.signer.verifySignature(
          this.hash.toBytes(),
          approval.signature.bytes
        )
      ) {
        throw ErrInvalidApprovalSignature;
      }
    }
  }

  private arrayEquals(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  async sign(keys: PrivateKey): Promise<void> {
    const signatureBytes = await keys.sign(this.hash.toBytes());
    const signature = new HexBytes(signatureBytes);

    if (!this.approvals) {
      this.approvals = [];
    }

    this.approvals.push(new Approval(keys.publicKey, signature));
  }

  /**
   * Sets already generated signature
   *
   * @param transaction the TransactionV1 instance
   * @param signature the Ed25519 or Secp256K1 signature
   * @param publicKey the public key used to generate the signature
   */
  static setSignature(
    transaction: TransactionV1,
    signature: Uint8Array,
    publicKey: PublicKey
  ): TransactionV1 {
    const hex = new HexBytes(signature);
    transaction.approvals.push(new Approval(publicKey, hex));

    return transaction;
  }

  static newTransactionV1(
    hash: Hash,
    header: TransactionV1Header,
    body: TransactionV1Body,
    approvals: Approval[]
  ): TransactionV1 {
    return new TransactionV1(hash, header, body, approvals);
  }

  static makeTransactionV1(
    transactionHeader: TransactionV1Header,
    transactionBody: TransactionV1Body
  ): TransactionV1 {
    const bodyBytes = transactionBody.toBytes();
    transactionHeader.bodyHash = new Hash(new Uint8Array(byteHash(bodyBytes)));

    const headerBytes = transactionHeader.toBytes();
    const transactionHash = new Hash(new Uint8Array(byteHash(headerBytes)));
    return new TransactionV1(
      transactionHash,
      transactionHeader,
      transactionBody,
      []
    );
  }

  /**
   * Convert a JSON representation of a transactionV1 to a `TransactionV1` object
   *
   * @param json A JSON representation of a `TransactionV1`
   * @returns A `TransactionV1` object if successful, or throws an error if parsing fails
   */
  public static fromJSON(json: any): TransactionV1 {
    let tx: TransactionV1 | undefined;

    try {
      const data: Record<string, any> =
        typeof json === 'string' ? JSON.parse(json) : json;
      const txData: Record<string, any> | null =
        data?.transaction?.Version1 ?? data?.Version1 ?? data ?? null;

      if (!(txData?.hash && txData?.header?.initiator_addr)) {
        throw ErrTransactionV1FromJson;
      }

      const serializer = new TypedJSON(TransactionV1);
      tx = serializer.parse(JSON.stringify(txData));

      if (!tx) {
        throw ErrTransactionV1FromJson;
      }
    } catch (e) {
      throw new Error(`Serialization error: ${e.message}`);
    }

    tx.validate();

    return tx;
  }

  /**
   * Convert the transactionV1 object to a JSON representation
   *
   * @param transaction The `TransactionV1` object to convert to JSON
   * @returns A JSON version of the `TransactionV1`, which can be converted back later
   */
  public static toJson = (transaction: TransactionV1) => {
    const serializer = new TypedJSON(TransactionV1);

    return { transaction: serializer.toPlainJson(transaction) };
  };
}

@jsonObject
export class TransactionHeader {
  @jsonMember({ name: 'chain_name', constructor: String })
  public chainName: string;

  @jsonMember({
    name: 'timestamp',
    constructor: Timestamp,
    deserializer: json => Timestamp.fromJSON(json),
    serializer: value => value.toJSON()
  })
  public timestamp: Timestamp;

  @jsonMember({
    name: 'ttl',
    constructor: Duration,
    deserializer: json => Duration.fromJSON(json),
    serializer: value => value.toJSON()
  })
  public ttl: Duration;

  @jsonMember({
    name: 'initiator_addr',
    constructor: InitiatorAddr,
    deserializer: json => InitiatorAddr.fromJSON(json),
    serializer: value => value.toJSON()
  })
  public initiatorAddr: InitiatorAddr;

  @jsonMember({ name: 'pricing_mode', constructor: PricingMode })
  public pricingMode: PricingMode;

  constructor(
    chainName: string,
    timestamp: Timestamp,
    ttl: Duration,
    initiatorAddr: InitiatorAddr,
    pricingMode: PricingMode
  ) {
    this.chainName = chainName;
    this.timestamp = timestamp;
    this.ttl = ttl;
    this.initiatorAddr = initiatorAddr;
    this.pricingMode = pricingMode;
  }
}

@jsonObject
export class TransactionBody {
  @jsonMember({
    constructor: Args,
    name: 'args',
    deserializer: deserializeArgs,
    serializer: serializeArgs
  })
  public args: Args;

  @jsonMember({
    name: 'target',
    constructor: TransactionTarget,
    serializer: value => value.toJSON(),
    deserializer: json => TransactionTarget.fromJSON(json)
  })
  public target: TransactionTarget;

  @jsonMember({
    name: 'entry_point',
    constructor: TransactionEntryPoint,
    serializer: value => value.toJSON(),
    deserializer: json => TransactionEntryPoint.fromJSON(json)
  })
  public entryPoint: TransactionEntryPoint;

  @jsonMember({
    name: 'scheduling',
    constructor: TransactionScheduling,
    serializer: value => value.toJSON(),
    deserializer: json => TransactionScheduling.fromJSON(json)
  })
  public scheduling: TransactionScheduling;

  @jsonMember({ name: 'transaction_category', constructor: Number })
  public category: number;

  constructor(
    args: Args,
    target: TransactionTarget,
    entryPoint: TransactionEntryPoint,
    scheduling: TransactionScheduling,
    category: number
  ) {
    this.args = args;
    this.target = target;
    this.entryPoint = entryPoint;
    this.scheduling = scheduling;
    this.category = category;
  }
}

@jsonObject
export class Transaction {
  @jsonMember({
    name: 'hash',
    constructor: Hash,
    deserializer: json => Hash.fromJSON(json),
    serializer: value => value.toJSON()
  })
  public hash: Hash;

  @jsonMember({ name: 'header', constructor: TransactionHeader })
  public header: TransactionHeader;

  @jsonMember({ name: 'body', constructor: TransactionBody })
  public body: TransactionBody;

  @jsonArrayMember(Approval)
  public approvals: Approval[];

  private originDeployV1?: Deploy;
  private originTransactionV1?: TransactionV1;

  constructor(
    hash: Hash,
    header: TransactionHeader,
    body: TransactionBody,
    approvals: Approval[],
    originTransactionV1?: TransactionV1,
    originDeployV1?: Deploy
  ) {
    this.hash = hash;
    this.header = header;
    this.body = body;
    this.approvals = approvals;
    this.originDeployV1 = originDeployV1;
    this.originTransactionV1 = originTransactionV1;
  }

  public getDeploy(): Deploy | undefined {
    return this.originDeployV1;
  }

  public getTransactionV1(): TransactionV1 | undefined {
    return this.originTransactionV1;
  }

  static fromTransactionV1(v1: TransactionV1): Transaction {
    return new Transaction(
      v1.hash,
      new TransactionHeader(
        v1.header.chainName,
        v1.header.timestamp,
        v1.header.ttl,
        v1.header.initiatorAddr,
        v1.header.pricingMode
      ),
      new TransactionBody(
        v1.body.args,
        v1.body.target,
        v1.body.entryPoint,
        v1.body.scheduling,
        v1.body.category
      ),
      v1.approvals,
      v1
    );
  }
}

@jsonObject
export class TransactionWrapper {
  @jsonMember({ name: 'Deploy', constructor: Deploy })
  deploy?: Deploy;

  @jsonMember({ name: 'Version1', constructor: TransactionV1 })
  transactionV1?: TransactionV1;

  constructor(deploy?: Deploy, transactionV1?: TransactionV1) {
    this.deploy = deploy;
    this.transactionV1 = transactionV1;
  }
}

@jsonObject
export class TransactionHash {
  @jsonMember({
    name: 'Deploy',
    constructor: Hash,
    deserializer: json => {
      if (!json) return;
      return Hash.fromJSON(json);
    },
    serializer: value => {
      if (!value) return;
      return value.toJSON();
    }
  })
  public deploy?: Hash;

  @jsonMember({
    name: 'Version1',
    constructor: Hash,
    deserializer: json => {
      if (!json) return;
      return Hash.fromJSON(json);
    },
    serializer: value => value.toJSON()
  })
  public transactionV1?: Hash;

  constructor(deploy?: Hash, transactionV1?: Hash) {
    this.deploy = deploy;
    this.transactionV1 = transactionV1;
  }
}

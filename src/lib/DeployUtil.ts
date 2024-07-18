/**
 * Util methods for making Deploy message
 *
 * @packageDocumentation
 */
import { Result, Ok, Err, Some, None } from 'ts-results';
import { concat } from '@ethersproject/bytes';
import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { jsonArrayMember, jsonMember, jsonObject, TypedJSON } from 'typedjson';

import { decodeBase16, encodeBase16 } from './Conversions';
import {
  CLValue,
  CLValueBuilder,
  CLTypeBuilder,
  CLValueParsers,
  CLPublicKey,
  ToBytes,
  CLU32,
  CLU32Type,
  CLU64,
  CLU64Type,
  CLOption,
  CLURef,
  ToBytesResult,
  CLErrorCodes
} from './CLValue';
import {
  toBytesArrayU8,
  toBytesBytesArray,
  toBytesDeployHash,
  toBytesString,
  toBytesU64,
  toBytesU32,
  toBytesVector,
  byteHash
} from './ByteConverters';
import { RuntimeArgs } from './RuntimeArgs';
import { DeployUtil, Keys } from './index';
import { AsymmetricKey, SignatureAlgorithm, validateSignature } from './Keys';
import { CasperClient } from './CasperClient';
import { TimeService } from '../services/TimeService';
import { DEFAULT_DEPLOY_TTL } from '../constants';
import { TIME_API_URL } from '../config';
import {
  Approval,
  byteArrayJsonDeserializer,
  byteArrayJsonSerializer,
  dehumanizerTTL,
  desRA,
  humanizerTTL,
  serRA
} from './SerializationUtils';

export { dehumanizerTTL, humanizerTTL, Approval } from './SerializationUtils';

/**
 * An object containing a unique address constructed from the `transferId` of a `Deploy`
 */
export class UniqAddress {
  /** The `CLPublicKey` representation of the transacting account */
  publicKey: CLPublicKey;

  /** A transaction nonce */
  transferId: BigNumber;

  /**
   * Builds UniqAddress from the transacting account's `CLPublicKey` and unique transferId.
   * @param publicKey CLPublicKey instance
   * @param transferId BigNumberish value (can be also string representing number). Max U64.
   */
  static build(publicKey: CLPublicKey, transferId: BigNumberish): UniqAddress {
    const addr = new UniqAddress();
    if (!(publicKey instanceof CLPublicKey)) {
      throw new Error('publicKey is not an instance of CLPublicKey');
    }
    const bigNum = BigNumber.from(transferId);
    if (bigNum.gt('18446744073709551615')) {
      throw new Error('transferId max value is U64');
    }
    addr.transferId = bigNum;
    addr.publicKey = publicKey;
    return addr;
  }

  /**
   * Stringifies the `UniqAddress`
   * @returns string with the format "accountHex-transferIdHex"
   */
  toString(): string {
    return `${this.publicKey.toHex()}-${this.transferId.toHexString()}`;
  }

  /**
   * Builds UniqAddress from string
   * @param value `UniqAddress` string representation in the format "accountHex-transferIdHex"
   * @returns A new `UniqAddress`
   */
  static fromString(value: string): UniqAddress {
    const [accountHex, transferHex] = value.split('-');
    const publicKey = CLPublicKey.fromHex(accountHex);
    return UniqAddress.build(publicKey, transferHex);
  }
}

/** Header data of a `Deploy` object that contains information like the transacting account, timestamp, gas price, and other relevent deploy information */
@jsonObject
export class DeployHeader implements ToBytes {
  @jsonMember({
    serializer: (account: CLPublicKey) => {
      return account.toHex();
    },
    deserializer: (hexStr: string) => {
      return CLPublicKey.fromHex(hexStr, false);
    }
  })
  public account: CLPublicKey;

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

  @jsonMember({ constructor: Number, name: 'gas_price' })
  public gasPrice: number;

  @jsonMember({
    name: 'body_hash',
    serializer: byteArrayJsonSerializer,
    deserializer: byteArrayJsonDeserializer
  })
  public bodyHash: Uint8Array;

  @jsonArrayMember(Uint8Array, {
    serializer: (value: Uint8Array[]) =>
      value.map(it => byteArrayJsonSerializer(it)),
    deserializer: (json: any) =>
      json.map((it: string) => byteArrayJsonDeserializer(it))
  })
  public dependencies: Uint8Array[];

  @jsonMember({ name: 'chain_name', constructor: String })
  public chainName: string;

  /**
   * Builds the header portion of a deploy
   * @param account The `CLPublicKey` representation of the transacting account.
   * @param timestamp The UNIX timestamp at which the deploy was created
   * @param ttl The amount of time in milliseconds that the deploy is given to live before it is dropped and rejected by validators
   * @param gasPrice Price per gas unit for this deploy, measured in motes, where 1 mote = 10^-9 CSPR
   * @param bodyHash  Hash of the compiled WebAssembly logic
   * @param dependencies Zero, one, or many instances of session code that is/are required to execute before this deploy
   * @param chainName The chain for which the deploy should be deployed on. For the Casper mainnet, use "casper" and for the testnet, use "casper-test"
   */
  static build(
    account: CLPublicKey,
    timestamp: number,
    ttl: number,
    gasPrice: number,
    bodyHash: Uint8Array,
    dependencies: Uint8Array[],
    chainName: string
  ): DeployHeader {
    const header = new DeployHeader();
    header.account = account;
    header.timestamp = timestamp;
    header.ttl = ttl;
    header.gasPrice = gasPrice;
    header.bodyHash = bodyHash;
    header.dependencies = dependencies;
    header.chainName = chainName;
    return header;
  }

  /**
   * Converts `DeployHeader` to `ToBytesResult`.
   * @returns `Ok` result, consisting of the account's byte representation, the timestamp, ttl, gasPrice, bodyHash, dependencies, and chainName concatenated together in a byte array
   */
  public toBytes(): ToBytesResult {
    return Ok(
      concat([
        CLValueParsers.toBytes(this.account).unwrap(),
        toBytesU64(this.timestamp),
        toBytesU64(this.ttl),
        toBytesU64(this.gasPrice),
        toBytesDeployHash(this.bodyHash),
        toBytesVector(this.dependencies.map(d => new DeployHash(d))),
        toBytesString(this.chainName)
      ])
    );
  }
}

/**
 * The cryptographic hash of a Deploy.
 */
class DeployHash implements ToBytes {
  /**
   * Constructs a `DeployHash` from a `Uint8Array` typed deploy hash
   */
  constructor(private hash: Uint8Array) {}

  /**
   * Converts `DeployHash` to `ToBytes`
   * @returns `Ok` result, consisting of the deploy hash as a byte array
   */
  public toBytes(): ToBytesResult {
    return Ok(toBytesDeployHash(this.hash));
  }
}

export interface DeployJson {
  session: Record<string, any>;
  approvals: { signature: string; signer: string }[];
  header: DeployHeader;
  payment: Record<string, any>;
  hash: string;
}

abstract class ExecutableDeployItemInternal implements ToBytes {
  public abstract tag: number;

  public abstract args: RuntimeArgs;

  public abstract toBytes(): ToBytesResult;

  public getArgByName(name: string): CLValue | undefined {
    return this.args.args.get(name);
  }

  public setArg(name: string, value: CLValue) {
    this.args.args.set(name, value);
  }
}

/**
 * An object which can be passed along in a deploy, including session code and runtime arguments.
 */
@jsonObject
export class ModuleBytes extends ExecutableDeployItemInternal {
  public tag = 0;

  /**
   * A `Uint8Array` typed representation of the session code.
   */
  @jsonMember({
    name: 'module_bytes',
    serializer: byteArrayJsonSerializer,
    deserializer: byteArrayJsonDeserializer
  })
  public moduleBytes: Uint8Array;

  /**
   * A `RuntimeArgs` object containing the runtime arguments passed along with the deploy.
   */
  @jsonMember({
    deserializer: desRA,
    serializer: serRA
  })
  public args: RuntimeArgs;

  /**
   * Constructs a `ModuleBytes` object from the `Uint8Array` typed session code and a `RuntimeArgs` object.
   * @param moduleBytes The `Uint8Array` representation of the session code
   * @param args Runtime arguments as `RuntimeArgs`
   */
  constructor(moduleBytes: Uint8Array, args: RuntimeArgs) {
    super();

    this.moduleBytes = moduleBytes;
    this.args = args;
  }

  /**
   * Converts `ModuleBytes` to `ToBytesResult`
   * @returns `Ok` result, consisting of the `ModuleBytes` as a byte array
   */
  public toBytes(): ToBytesResult {
    if (!this.args) return Err(CLErrorCodes.Formatting);

    return Ok(
      concat([
        Uint8Array.from([this.tag]),
        toBytesArrayU8(this.moduleBytes),
        toBytesBytesArray(this.args.toBytes().unwrap())
      ])
    );
  }
}

/** The `StoredContractByHash` class, when instantiated, represents a stored smart contract referenced by it's hash */
@jsonObject
export class StoredContractByHash extends ExecutableDeployItemInternal {
  /** An identifier that other functions use to recognize that `StoredContractByHash` objects are indeed stored contracts by hash during deserialization */
  public tag = 1;

  /** The `Uint8Array` typed hash of the stored smart contract */
  @jsonMember({
    serializer: byteArrayJsonSerializer,
    deserializer: byteArrayJsonDeserializer
  })
  public hash: Uint8Array;

  /** An entrypoint of the stored smart contract */
  @jsonMember({
    name: 'entry_point',
    constructor: String
  })
  public entryPoint: string;

  /** A `RuntimeArgs` object containing the runtime arguments to be passed along with the deploy. */
  @jsonMember({
    deserializer: desRA,
    serializer: serRA
  })
  public args: RuntimeArgs;

  /**
   * Constructs a `StoredContractByHash` object from the hash, entrypoint of the contract, and associated runtime arguments
   * @param hash hash of the addressable entity of the contract
   * @param entryPoint An entrypoint of the smart contract
   * @param args The runtime arguments for interaction on the `entryPoint`
   */
  constructor(hash: Uint8Array, entryPoint: string, args: RuntimeArgs) {
    super();

    this.entryPoint = entryPoint;
    this.args = args;
    this.hash = hash;
  }

  /**
   * Converts `StoredContractByHash` to `ToBytesResult`
   * @returns `Ok` result, consisting of the tag, contract hash, entrypoint, and runtime arguments as a byte array
   */
  public toBytes(): ToBytesResult {
    return Ok(
      concat([
        Uint8Array.from([this.tag]),
        toBytesBytesArray(this.hash),
        toBytesString(this.entryPoint),
        toBytesBytesArray(this.args.toBytes().unwrap())
      ])
    );
  }
}

/** The `StoredContractByName` class, when instantiated, represents a stored smart contract referenced by it's name */
@jsonObject
export class StoredContractByName extends ExecutableDeployItemInternal {
  /** An identifier that other functions use to recognize that `StoredContractByName` objects are indeed stored contracts by name during deserialization */
  public tag = 2;

  /** The name of the smart contract */
  @jsonMember({ constructor: String })
  public name: string;

  /** An entrypoint of the smart contract */
  @jsonMember({
    name: 'entry_point',
    constructor: String
  })
  public entryPoint: string;

  /** A `RuntimeArgs` object containing the runtime arguments to be passed along with the deploy. */
  @jsonMember({
    deserializer: desRA,
    serializer: serRA
  })
  public args: RuntimeArgs;

  /**
   * Constructs a `StoredContractByName` object from the name, entrypoint of the contract, and associated runtime arguments
   * @param name The name of the smart contract
   * @param entryPoint An entrypoint of the smart contract
   * @param args The runtime arguments for interaction on the `entryPoint`
   */
  constructor(name: string, entryPoint: string, args: RuntimeArgs) {
    super();

    this.name = name;
    this.entryPoint = entryPoint;
    this.args = args;
  }

  /**
   * Converts `StoredContractByName` to `ToBytesResult`
   * @returns `Ok` result, consisting of the tag, name, entrypoint, and runtime arguments as a byte array
   */
  public toBytes(): ToBytesResult {
    return Ok(
      concat([
        Uint8Array.from([this.tag]),
        toBytesString(this.name),
        toBytesString(this.entryPoint),
        toBytesBytesArray(this.args.toBytes().unwrap())
      ])
    );
  }
}

/** The `StoredVersionedContractByName` class, when instantiated, represents a stored smart contract referenced by it's name */
@jsonObject
export class StoredVersionedContractByName extends ExecutableDeployItemInternal {
  /** An identifier that other functions use to recognize that `StoredVersionedContractByName` objects are indeed stored versioned contracts by name during deserialization */
  public tag = 4;

  /** The name of the stored versioned contract */
  @jsonMember({ constructor: String })
  public name: string;

  /** The version of the contract */
  @jsonMember({ constructor: Number, preserveNull: true })
  public version: number | null;

  /** An entrypoint of the smart contract */
  @jsonMember({ name: 'entry_point', constructor: String })
  public entryPoint: string;

  /** A `RuntimeArgs` object containing the runtime arguments to be passed along with the deploy. */
  @jsonMember({
    deserializer: desRA,
    serializer: serRA
  })
  public args: RuntimeArgs;

  /**
   * Constructs a `StoredContractByName` object from the name, entrypoint of the contract, and associated runtime arguments
   * @param name The name of the smart contract
   * @param version The version of the named smart contract
   * @param entryPoint An entrypoint of the smart contract
   * @param args The runtime arguments for interaction on the `entryPoint`
   */
  constructor(
    name: string,
    version: number | null,
    entryPoint: string,
    args: RuntimeArgs
  ) {
    super();
    this.name = name;
    this.version = version;
    this.entryPoint = entryPoint;
    this.args = args;
  }

  /**
   * Converts `StoredVersionedContractByName` to `ToBytesResult`
   * @returns `Ok` result, consisting of the tag, name, serialized version, entrypoint, and runtime arguments as a byte array
   */
  public toBytes(): ToBytesResult {
    let serializedVersion;
    if (this.version === null) {
      serializedVersion = new CLOption(None, new CLU32Type());
    } else {
      serializedVersion = new CLOption(Some(new CLU32(this.version as number)));
    }
    return Ok(
      concat([
        Uint8Array.from([this.tag]),
        toBytesString(this.name),
        CLValueParsers.toBytes(serializedVersion).unwrap(),
        toBytesString(this.entryPoint),
        toBytesBytesArray(this.args.toBytes().unwrap())
      ])
    );
  }
}

/** The `StoredVersionedContractByHash` class, when instantiated, represents a stored versioned smart contract referenced by it's hash */
@jsonObject
export class StoredVersionedContractByHash extends ExecutableDeployItemInternal {
  /** An identifier that other functions use to recognize that `StoredVersionedContractByHash` objects are indeed stored versioned contracts by hash during deserialization */
  public tag = 3;

  /** The `Uint8Array` typed hash of the stored smart contract */
  @jsonMember({
    serializer: byteArrayJsonSerializer,
    deserializer: byteArrayJsonDeserializer
  })
  public hash: Uint8Array;

  /** The version of the contract */
  @jsonMember({
    constructor: Number,
    preserveNull: true
  })
  public version: number | null;

  /** An entrypoint of the stored smart contract */
  @jsonMember({
    name: 'entry_point',
    constructor: String
  })
  public entryPoint: string;

  /** A `RuntimeArgs` object containing the runtime arguments to be passed along with the deploy. */
  @jsonMember({
    deserializer: desRA,
    serializer: serRA
  })
  public args: RuntimeArgs;

  /**
   * Constructs a `StoredContractByHash` object from the `Uint8Array` typed hash, entrypoint of the contract, and associated runtime arguments
   * @param hash `Uint8Array` typed smart contract hash
   * @param version The version of the smart contract
   * @param entryPoint An entrypoint of the smart contract
   * @param args The runtime arguments for interaction on the `entryPoint`
   */
  constructor(
    hash: Uint8Array,
    version: number | null,
    entryPoint: string,
    args: RuntimeArgs
  ) {
    super();
    this.hash = hash;
    this.version = version;
    this.entryPoint = entryPoint;
    this.args = args;
  }

  /**
   * Converts `StoredVersionedContractByHash` to `ToBytesResult`
   * @returns `Ok` result, consisting of the tag, hash, serialized version, entrypoint, and runtime arguments as a byte array
   */
  public toBytes(): ToBytesResult {
    let serializedVersion;

    if (this.version === null) {
      serializedVersion = new CLOption(None, new CLU32Type());
    } else {
      serializedVersion = new CLOption(Some(new CLU32(this.version as number)));
    }
    return Ok(
      concat([
        Uint8Array.from([this.tag]),
        toBytesBytesArray(this.hash),
        CLValueParsers.toBytes(serializedVersion).unwrap(),
        toBytesString(this.entryPoint),
        toBytesBytesArray(this.args.toBytes().unwrap())
      ])
    );
  }
}

/** Represents a transferral deploy. Construct and deploy to execute a standard CSPR transfer */
@jsonObject
export class Transfer extends ExecutableDeployItemInternal {
  /** An identifier that other functions use to recognize that `Transfer` objects are indeed transfers during deserialization */
  public tag = 5;

  /** Runtime arguments necessary for building the transfer deploy */
  @jsonMember({
    deserializer: desRA,
    serializer: serRA
  })
  public args: RuntimeArgs;

  /**
   * Constructor for Transfer deploy item.
   * @param args `RuntimeArgs` containing the transfer amount in motes, the URef of the target purse or the public key of the target account, the URef of the source purse, and the transfer id
   * @remarks The `RuntimeArgs` should contain the arguments `amount`, `target`, `sourcePurse`, and `id`
   */
  constructor(args: RuntimeArgs) {
    super();
    this.args = args;
  }

  /**
   * Converts `Transfer` to `ToBytesResult`
   * @returns `Ok` result, consisting of the tag and runtime arguments concatenated in a byte array
   */
  public toBytes(): ToBytesResult {
    return Ok(
      concat([
        Uint8Array.from([this.tag]),
        toBytesBytesArray(this.args.toBytes().unwrap())
      ])
    );
  }
}

/** Represents an executable deploy object that can be deployed on-chain. `ModuleBytes`, `StoredContractByHash`, `StoredContractByName`, `StoredVersionedContractByHash`, `StoredVersionedContractByName`, and `Transfer` objects can all be casted as `ExecutableDeployItem`s. */
@jsonObject
export class ExecutableDeployItem implements ToBytes {
  /** Optional `ModuleBytes` object representing the `ExecutableDeployItem` if applicable. */
  @jsonMember({
    name: 'ModuleBytes',
    constructor: ModuleBytes
  })
  public moduleBytes?: ModuleBytes;

  /** Optional `StoredContractByHash` object representing the `ExecutableDeployItem` if applicable. */
  @jsonMember({
    name: 'StoredContractByHash',
    constructor: StoredContractByHash
  })
  public storedContractByHash?: StoredContractByHash;

  /** Optional `StoredContractByName` object representing the `ExecutableDeployItem` if applicable. */
  @jsonMember({
    name: 'StoredContractByName',
    constructor: StoredContractByName
  })
  public storedContractByName?: StoredContractByName;

  /** Optional `StoredVersionedContractByHash` object representing the `ExecutableDeployItem` if applicable. */
  @jsonMember({
    name: 'StoredVersionedContractByHash',
    constructor: StoredVersionedContractByHash
  })
  public storedVersionedContractByHash?: StoredVersionedContractByHash;

  /** Optional `StoredVersionedContractByName` object representing the `ExecutableDeployItem` if applicable. */
  @jsonMember({
    name: 'StoredVersionedContractByName',
    constructor: StoredVersionedContractByName
  })
  public storedVersionedContractByName?: StoredVersionedContractByName;

  /** Optional `Transfer` object representing the `ExecutableDeployItem` if applicable. */
  @jsonMember({
    name: 'Transfer',
    constructor: Transfer
  })
  public transfer?: Transfer;

  /**
   * Converts `ExecutableDeployItem` to `ToBytesResult` depending on the `ExecutableDeployItem`'s type. Throws an error if it cannot serialize the `ExecutableDeployItem` from its parent type.
   * @returns `ModuleBytes`, or `StoredContractByHash`, or `StoredContractByName`, or `StoredVersionedContractByHash`, or `StoredVersionedContractByName`, or `Transfer` depending on the original type.
   */
  public toBytes(): ToBytesResult {
    if (this.isModuleBytes()) {
      return this.moduleBytes!.toBytes();
    } else if (this.isStoredContractByHash()) {
      return this.storedContractByHash!.toBytes();
    } else if (this.isStoredContractByName()) {
      return this.storedContractByName!.toBytes();
    } else if (this.isStoredVersionContractByHash()) {
      return this.storedVersionedContractByHash!.toBytes();
    } else if (this.isStoredVersionContractByName()) {
      return this.storedVersionedContractByName!.toBytes();
    } else if (this.isTransfer()) {
      return this.transfer!.toBytes();
    }
    throw new Error('failed to serialize ExecutableDeployItemJsonWrapper');
  }

  /**
   * Gets a `CLValue` argument via its name, returns `undefined` if the argument does not exist. Throws an error if it cannot serialize the `ExecutableDeployItem` from its original type.
   * @param name The name of the argument
   * @returns A `CLValue` runtime argument
   */
  public getArgByName(name: string): CLValue | undefined {
    if (this.isModuleBytes()) {
      return this.moduleBytes!.getArgByName(name);
    } else if (this.isStoredContractByHash()) {
      return this.storedContractByHash!.getArgByName(name);
    } else if (this.isStoredContractByName()) {
      return this.storedContractByName!.getArgByName(name);
    } else if (this.isStoredVersionContractByHash()) {
      return this.storedVersionedContractByHash!.getArgByName(name);
    } else if (this.isStoredVersionContractByName()) {
      return this.storedVersionedContractByName!.getArgByName(name);
    } else if (this.isTransfer()) {
      return this.transfer!.getArgByName(name);
    }
    throw new Error('failed to serialize ExecutableDeployItemJsonWrapper');
  }

  /**
   * Sets an argument given an argument name and a value typed as a `CLValue`. Throws an error if it cannot serialize the `ExecutableDeployItem` from its original type.
   * @param name The name of the argument being set
   * @param value The `CLValue` that will be stored under the new argument `name`
   * @returns The success status of setting the argument
   */
  public setArg(name: string, value: CLValue) {
    if (this.isModuleBytes()) {
      return this.moduleBytes!.setArg(name, value);
    } else if (this.isStoredContractByHash()) {
      return this.storedContractByHash!.setArg(name, value);
    } else if (this.isStoredContractByName()) {
      return this.storedContractByName!.setArg(name, value);
    } else if (this.isStoredVersionContractByHash()) {
      return this.storedVersionedContractByHash!.setArg(name, value);
    } else if (this.isStoredVersionContractByName()) {
      return this.storedVersionedContractByName!.setArg(name, value);
    } else if (this.isTransfer()) {
      return this.transfer!.setArg(name, value);
    }
    throw new Error('failed to serialize ExecutableDeployItemJsonWrapper');
  }

  /**
   * Builds an `ExecutableDeployItem` from an `ExecutableDeployItemInternal`. The `ExecutableDeployItemInternal` abstract class is inherited by `ModuleBytes`, `StoredContractByHash`, `StoredContractByName`, `StoredVersionedContractByHash`, `StoredVersionedContractByName`, and `Transfer`, so you may pass in an object of any of these types.
   * @param item The `ExecutableDeployItemInternal` to build into an `ExecutableDeployItem`
   */
  public static fromExecutableDeployItemInternal(
    item: ExecutableDeployItemInternal
  ) {
    const res = new ExecutableDeployItem();
    switch (item.tag) {
      case 0:
        res.moduleBytes = item as ModuleBytes;
        break;
      case 1:
        res.storedContractByHash = item as StoredContractByHash;
        break;
      case 2:
        res.storedContractByName = item as StoredContractByName;
        break;
      case 3:
        res.storedVersionedContractByHash = item as StoredVersionedContractByHash;
        break;
      case 4:
        res.storedVersionedContractByName = item as StoredVersionedContractByName;
        break;
      case 5:
        res.transfer = item as Transfer;
        break;
    }
    return res;
  }

  /**
   * Creates a new `ModuleBytes` object from a `Uint8Array` of module bytes and a set of `RuntimeArgs`
   * @param moduleBytes A set of module bytes as a `Uint8Array`
   * @param args The runtime arguments for the new `ModuleBytes` object
   * @returns A new `ExecutableDeployItem` created from a new `ModuleBytes` object built using `moduleBytes` and `args`
   */
  public static newModuleBytes(
    moduleBytes: Uint8Array,
    args: RuntimeArgs
  ): ExecutableDeployItem {
    return ExecutableDeployItem.fromExecutableDeployItemInternal(
      new ModuleBytes(moduleBytes, args)
    );
  }

  /**
   * Creates a new `StoredContractByHash` object from a `Uint8Array` contract hash, entrypoint, and runtime arguments
   * @param hash `string` representation of a smart contract addreassable entity hash
   * @param entryPoint Name of an entrypoint of the stored contract
   * @param args The runtime arguments for the new `StoredContractByHash` object
   * @returns A new `ExecutableDeployItem` created from a new `StoredContractByHash` object built using `hash`, `entryPoint` and `args`
   */
  public static newStoredContractByHash(
    hash: Uint8Array,
    entryPoint: string,
    args: RuntimeArgs
  ) {
    return ExecutableDeployItem.fromExecutableDeployItemInternal(
      new StoredContractByHash(hash, entryPoint, args)
    );
  }

  /**
   * Creates a new `StoredContractByName` object from a contract name, entrypoint, and runtime arguments
   * @param name The name of the stored smart contract
   * @param entryPoint Name of an entrypoint of the stored contract
   * @param args The runtime arguments for the new `StoredContractByHash` object
   * @returns A new `ExecutableDeployItem` created from a new `StoredContractByName` object built using `name`, `entryPoint` and `args`
   */
  public static newStoredContractByName(
    name: string,
    entryPoint: string,
    args: RuntimeArgs
  ) {
    return ExecutableDeployItem.fromExecutableDeployItemInternal(
      new StoredContractByName(name, entryPoint, args)
    );
  }

  /**
   * Creates a new `StoredVersionedContractByHash` object from a `Uint8Array` contract hash, version number, entrypoint, and runtime arguments
   * @param hash `Uint8Array` representation of a smart contract hash
   * @param version The version of the stored contract
   * @param entryPoint Name of an entrypoint of the stored contract
   * @param args The runtime arguments for the new `StoredContractByHash` object
   * @returns A new `ExecutableDeployItem` created from a new `StoredVersionedContractByHash` object built using `hash`, `version`, `entryPoint` and `args`
   */
  public static newStoredVersionContractByHash(
    hash: Uint8Array,
    version: number | null,
    entryPoint: string,
    args: RuntimeArgs
  ) {
    return ExecutableDeployItem.fromExecutableDeployItemInternal(
      new StoredVersionedContractByHash(hash, version, entryPoint, args)
    );
  }

  /**
   * Creates a new `StoredVersionedContractByName` object from a contract name, version number, entrypoint, and runtime arguments
   * @param name The name of the stored smart contract
   * @param version The version of the stored contract
   * @param entryPoint Name of an entrypoint of the stored contract
   * @param args The runtime arguments for the new `StoredContractByHash` object
   * @returns A new `ExecutableDeployItem` created from a new `StoredVersionedContractByName` object built using `name`, `version`, `entryPoint` and `args`
   */
  public static newStoredVersionContractByName(
    name: string,
    version: number | null,
    entryPoint: string,
    args: RuntimeArgs
  ) {
    return ExecutableDeployItem.fromExecutableDeployItemInternal(
      new StoredVersionedContractByName(name, version, entryPoint, args)
    );
  }

  /**
   * Creates a new `Transfer` object
   * @param amount The number of motes to transfer, where 1 mote = 1 * 10^-9 CSPR
   * @param target URef of the target purse or the public key of target account, as a `CLUref` or `CLPublicKey` respectively
   * @param sourcePurse URef of the source purse. If this is omitted, the main purse of the account creating this transfer will be used as the source purse
   * @param id User-defined transfer id
   * @returns New `Transfer` object which can be deployed to execute a standard CSPR transferral
   */
  public static newTransfer(
    amount: BigNumberish,
    target: CLURef | CLPublicKey,
    sourcePurse: CLURef | null = null,
    id: BigNumberish
  ): ExecutableDeployItem {
    const runtimeArgs = RuntimeArgs.fromMap({});
    runtimeArgs.insert('amount', CLValueBuilder.u512(amount));
    if (sourcePurse) {
      runtimeArgs.insert('source', sourcePurse);
    }
    if (target instanceof CLURef) {
      runtimeArgs.insert('target', target);
    } else if (target instanceof CLPublicKey) {
      runtimeArgs.insert('target', target);
    } else {
      throw new Error('Please specify target');
    }
    if (id === undefined) {
      throw new Error('transfer-id missing in new transfer.');
    } else {
      runtimeArgs.insert(
        'id',
        CLValueBuilder.option(Some(new CLU64(id)), new CLU64Type())
      );
    }
    return ExecutableDeployItem.fromExecutableDeployItemInternal(
      new Transfer(runtimeArgs)
    );
  }

  // TODO: Abstract the logic of this and newTransfer so there won't be so much redundancy.
  /**
   * Creates a new `Transfer` object with an optional transfer id
   * @param amount The number of motes to transfer, where 1 mote = 1 * 10^-9 CSPR
   * @param target URef of the target purse or the public key of target account, as a `CLUref` or `CLPublicKey` respectively
   * @param sourcePurse URef of the source purse. If this is omitted, the main purse of the account creating this transfer will be used as the source purse
   * @param id User-defined transfer id, which if not provided will be created on the fly
   * @returns New `Transfer` object which can be deployed to execute a standard CSPR transferral
   */
  public static newTransferWithOptionalTransferId(
    amount: BigNumberish,
    target: CLURef | CLPublicKey,
    sourcePurse?: CLURef | null,
    id?: BigNumberish
  ) {
    const runtimeArgs = RuntimeArgs.fromMap({});
    runtimeArgs.insert('amount', CLValueBuilder.u512(amount));
    if (sourcePurse) {
      runtimeArgs.insert('source', sourcePurse);
    }
    if (target instanceof CLURef) {
      runtimeArgs.insert('target', target);
    } else if (target instanceof CLPublicKey) {
      runtimeArgs.insert('target', target);
    } else {
      throw new Error('Please specify target');
    }
    if (id !== undefined && id !== null) {
      runtimeArgs.insert(
        'id',
        CLValueBuilder.option(Some(CLValueBuilder.u64(id)), CLTypeBuilder.u64())
      );
    } else {
      runtimeArgs.insert(
        'id',
        CLValueBuilder.option(None, CLTypeBuilder.u64())
      );
    }

    return ExecutableDeployItem.fromExecutableDeployItemInternal(
      new Transfer(runtimeArgs)
    );
  }

  /**
   * Constructor for Transfer deploy item using UniqAddress.
   * @param source `CLPublicKey` of source account
   * @param target `UniqAddress` of target account
   * @param amount The amount of motes to transfer, where 1 mote = 1 * 10^-9 CSPR
   * @param paymentAmount The number of motes paid to execution engine, where 1 mote = 1 * 10^-9 CSPR
   * @param chainName Name of the chain, to avoid the `Deploy` from being accidentally or maliciously included in a different chain.
   * @param gasPrice The gas price at which to execute the deploy
   * @param ttl Time that the `Deploy` will remain valid for, in milliseconds. The default value is 1800000, which is 30 minutes
   * @param sourcePurse URef of the source purse. If this is omitted, the main purse of the account creating this \
   * transfer will be used as the source purse
   * @returns A new `Deploy` representing a transferral to a unique address
   */
  public static newTransferToUniqAddress(
    source: CLPublicKey,
    target: UniqAddress,
    amount: BigNumberish,
    paymentAmount: BigNumberish,
    chainName: string,
    gasPrice = 1,
    ttl = DEFAULT_DEPLOY_TTL,
    sourcePurse?: CLURef
  ): Deploy {
    const deployParams = new DeployUtil.DeployParams(
      source,
      chainName,
      gasPrice,
      ttl
    );

    const payment = DeployUtil.standardPayment(paymentAmount);

    const session = DeployUtil.ExecutableDeployItem.newTransfer(
      amount,
      target.publicKey,
      sourcePurse,
      target.transferId
    );

    return DeployUtil.makeDeploy(deployParams, session, payment);
  }

  /**
   * Identifies whether the `ExecutableDeployItem` is of the original type `ModuleBytes`
   * @returns `true` is the `ExecutableDeployItem` conforms to `ModuleBytes`, and `false` otherwise.
   */
  public isModuleBytes(): boolean {
    return !!this.moduleBytes;
  }

  /**
   * Casts the `ExecutableDeployItem` to `ModuleBytes` if possible
   * @returns `ModuleBytes` representation of `ExecutableDeployItem`, or `undefined` if the `ExecutableDeployItem` cannot be cast
   */
  public asModuleBytes(): ModuleBytes | undefined {
    return this.moduleBytes;
  }

  /**
   * Identifies whether the `ExecutableDeployItem` is of the original type `StoredContractByHash`
   * @returns `true` is the `ExecutableDeployItem` conforms to `StoredContractByHash`, and `false` otherwise.
   */
  public isStoredContractByHash(): boolean {
    return !!this.storedContractByHash;
  }

  /**
   * Casts the `ExecutableDeployItem` to `StoredContractByHash` if possible
   * @returns `StoredContractByHash` representation of `ExecutableDeployItem`, or `undefined` if the `ExecutableDeployItem` cannot be cast
   */
  public asStoredContractByHash(): StoredContractByHash | undefined {
    return this.storedContractByHash;
  }

  /**
   * Identifies whether the `ExecutableDeployItem` is of the original type `StoredContractByName`
   * @returns `true` is the `ExecutableDeployItem` conforms to `StoredContractByName`, and `false` otherwise.
   */
  public isStoredContractByName(): boolean {
    return !!this.storedContractByName;
  }

  /**
   * Casts the `ExecutableDeployItem` to `StoredContractByName` if possible
   * @returns `StoredContractByName` representation of `ExecutableDeployItem`, or `undefined` if the `ExecutableDeployItem` cannot be cast
   */
  public asStoredContractByName(): StoredContractByName | undefined {
    return this.storedContractByName;
  }

  /**
   * Identifies whether the `ExecutableDeployItem` is of the original type `StoredVersionedContractByName`
   * @returns `true` is the `ExecutableDeployItem` conforms to `StoredVersionedContractByName`, and `false` otherwise.
   */
  public isStoredVersionContractByName(): boolean {
    return !!this.storedVersionedContractByName;
  }

  /**
   * Casts the `ExecutableDeployItem` to `StoredVersionedContractByName` if possible
   * @returns `StoredVersionedContractByName` representation of `ExecutableDeployItem`, or `undefined` if the `ExecutableDeployItem` cannot be cast
   */
  public asStoredVersionContractByName():
    | StoredVersionedContractByName
    | undefined {
    return this.storedVersionedContractByName;
  }

  /**
   * Identifies whether the `ExecutableDeployItem` is of the original type `StoredVersionedContractByHash`
   * @returns `true` is the `ExecutableDeployItem` conforms to `StoredVersionedContractByHash`, and `false` otherwise.
   */
  public isStoredVersionContractByHash(): boolean {
    return !!this.storedVersionedContractByHash;
  }

  /**
   * Casts the `ExecutableDeployItem` to `StoredVersionedContractByHash` if possible
   * @returns `StoredVersionedContractByHash` representation of `ExecutableDeployItem`, or `undefined` if the `ExecutableDeployItem` cannot be cast
   */
  public asStoredVersionContractByHash():
    | StoredVersionedContractByHash
    | undefined {
    return this.storedVersionedContractByHash;
  }

  /**
   * Identifies whether the `ExecutableDeployItem` is of the original type `Transfer`
   * @returns `true` is the `ExecutableDeployItem` conforms to `Transfer`, and `false` otherwise.
   */
  public isTransfer() {
    return !!this.transfer;
  }

  /**
   * Casts the `ExecutableDeployItem` to `Transfer` if possible
   * @returns `Transfer` representation of `ExecutableDeployItem`, or `undefined` if the `ExecutableDeployItem` cannot be cast
   */
  public asTransfer(): Transfer | undefined {
    return this.transfer;
  }
}

/**
 * A deploy containing a smart contract along with the requester's signature(s).
 */
@jsonObject
export class Deploy {
  /**
   * The deploy hash
   */
  @jsonMember({
    serializer: byteArrayJsonSerializer,
    deserializer: byteArrayJsonDeserializer
  })
  public hash: Uint8Array;

  /**
   * The header of the deploy
   */
  @jsonMember({ constructor: DeployHeader })
  public header: DeployHeader;

  /**
   * The payment logic of the deploy
   */
  @jsonMember({
    constructor: ExecutableDeployItem
  })
  public payment: ExecutableDeployItem;

  /**
   * The session code of the deploy
   */
  @jsonMember({
    constructor: ExecutableDeployItem
  })
  public session: ExecutableDeployItem;

  /**
   * An array of approvals in the form of signatures from an account or multiple accounts
   */
  @jsonArrayMember(Approval)
  public approvals: Approval[];

  /**
   * Builds a `Deploy` object
   * @param hash The DeployHash identifying this Deploy
   * @param header The deploy header
   * @param payment An ExecutableDeployItem representing the payment logic
   * @param session An ExecutableDeployItem representing the session logic
   * @param approvals An array of signatures and associated accounts who have approved this deploy
   */
  static build(
    hash: Uint8Array,
    header: DeployHeader,
    payment: ExecutableDeployItem,
    session: ExecutableDeployItem,
    approvals: Approval[]
  ): Deploy {
    const deploy = new Deploy();
    deploy.approvals = approvals;
    deploy.session = session;
    deploy.payment = payment;
    deploy.header = header;
    deploy.hash = hash;
    return deploy;
  }

  /**
   * Identifies whether this `Deploy` represents a transfer of CSPR
   * @returns `true` if the `Deploy` is a `Transfer`, and `false` otherwise
   */
  public isTransfer(): boolean {
    return this.session.isTransfer();
  }

  /**
   * Identifies whether this `Deploy` represents a standard payment, like that of gas payment
   * @returns `true` if the `Deploy` is a standard payment, and `false` otherwise
   */
  public isStandardPayment(): boolean {
    if (this.payment.isModuleBytes()) {
      return this.payment.asModuleBytes()?.moduleBytes.length === 0;
    }
    return false;
  }

  /**
   * Can be used to send the `Deploy` to an online Casper node
   * @param nodeUrl The url of a live Casper node
   * @returns The deploy hash of the `Deploy`
   * @remarks Works by instantiating a `CasperClient` with the provided `nodeUrl` and calling [`putDeploy`](./CasperClient.ts#L157) on it
   */
  public async send(nodeUrl: string): Promise<string> {
    const client = new CasperClient(nodeUrl);

    const deployHash = client.putDeploy(this);

    return deployHash;
  }

  /**
   * Signs the `Deploy` using the provided `AsymmetricKey`(s)
   * @param keys An array consisting of one or many `AsymmetricKey`(s)
   * @returns The original `Deploy` signed by the provided `AsymmetricKey`(s)
   */
  public sign(keys: AsymmetricKey[]): Deploy {
    const signedDeploy = keys.reduce((acc: Deploy, key: AsymmetricKey) => {
      acc = signDeploy(acc, key);
      return acc;
    }, this);

    return signedDeploy;
  }
}

/**
 * Serializes a `DeployHeader` into an array of bytes
 * @param deployHeader
 * @returns A serialized representation of the provided `DeployHeader`
 */
export const serializeHeader = (deployHeader: DeployHeader): ToBytesResult => {
  return deployHeader.toBytes();
};

/**
 * Serializes the body of a deploy into an array of bytes
 * @param payment Payment logic for use in a deployment
 * @param session Session logic of a deploy
 * @returns `Uint8Array` typed byte array, containing the payment and session logic of a deploy
 */
export const serializeBody = (
  payment: ExecutableDeployItem,
  session: ExecutableDeployItem
): Uint8Array => {
  return concat([payment.toBytes().unwrap(), session.toBytes().unwrap()]);
};

/**
 * Serializes an array of `Approval`s into a `Uint8Array` typed byte array
 * @param approvals An array of `Approval`s to be serialized
 * @returns `Uint8Array` typed byte array that can be deserialized to an array of `Approval`s
 */
export const serializeApprovals = (approvals: Approval[]): Uint8Array => {
  const len = toBytesU32(approvals.length);
  const bytes = concat(
    approvals.map(approval => {
      return concat([
        Uint8Array.from(Buffer.from(approval.signer, 'hex')),
        Uint8Array.from(Buffer.from(approval.signature, 'hex'))
      ]);
    })
  );
  return concat([len, bytes]);
};

/**
 * enum of supported contract types
 * @enum
 */
export enum ContractType {
  /** A pure WebAssembly representation of a smart contract */
  WASM = 'WASM',
  /** A linked contract by hash */
  Hash = 'Hash',
  /** A linked contract by name */
  Name = 'Name'
}

/** The parameters of a `Deploy` object */
export class DeployParams {
  /**
   * Container for `Deploy` construction options.
   * @param accountPublicKey The public key of the deploying account as a `CLPublicKey`
   * @param chainName Name of the chain, to avoid the `Deploy` from being accidentally or maliciously included in a different chain.
   * @param gasPrice Conversion rate between the cost of Wasm opcodes and the motes sent by the payment code, where 1 mote = 1 * 10^-9 CSPR
   * @param ttl Time that the `Deploy` will remain valid for, in milliseconds. The default value is 1800000, which is 30 minutes
   * @param dependencies Hex-encoded `Deploy` hashes of deploys which must be executed before this one.
   * @param timestamp  Note that timestamp is UTC, not local.
   */
  constructor(
    public accountPublicKey: CLPublicKey,
    public chainName: string,
    public gasPrice: number = 1,
    public ttl: number = DEFAULT_DEPLOY_TTL,
    public dependencies: Uint8Array[] = [],
    public timestamp?: number
  ) {
    this.dependencies = dependencies.filter(
      d =>
        dependencies.filter(t => encodeBase16(d) === encodeBase16(t)).length < 2
    );
  }
}

/**
 * Builds a `Deploy` object from `DeployParams`, session logic, and payment logic
 * @param deployParam The parameters of the deploy, see [DeployParams](#L1323)
 * @param session The session logic of the deploy
 * @param payment The payment logic of the deploy
 * @returns A new `Deploy` object
 */
export function makeDeploy(
  deployParam: DeployParams,
  session: ExecutableDeployItem,
  payment: ExecutableDeployItem
): Deploy {
  const serializedBody = serializeBody(payment, session);
  const bodyHash = byteHash(serializedBody);

  if (!deployParam.timestamp) {
    deployParam.timestamp = Date.now();
  }

  const header: DeployHeader = DeployHeader.build(
    deployParam.accountPublicKey,
    deployParam.timestamp!,
    deployParam.ttl,
    deployParam.gasPrice,
    bodyHash,
    deployParam.dependencies,
    deployParam.chainName
  );
  const serializedHeader = serializeHeader(header);
  const deployHash = byteHash(serializedHeader.unwrap());
  return Deploy.build(deployHash, header, payment, session, []);
}

/**
 * Builds a `Deploy` object from `DeployParams`, session logic, and payment logic.
 * If there is no timestamp in `DeployParams` it fetches it from the TimeService.
 * Recommened to use in browser environment.
 * @param deployParam The parameters of the deploy, see [DeployParams](#L1323)
 * @param session The session logic of the deploy
 * @param payment The payment logic of the deploy
 * @returns A new `Deploy` object
 */
export async function makeDeployWithAutoTimestamp(
  deployParam: DeployParams,
  session: ExecutableDeployItem,
  payment: ExecutableDeployItem
): Promise<Deploy> {
  if (!deployParam.timestamp && typeof window !== 'undefined') {
    const timeService = new TimeService(
      `${location.protocol}//${TIME_API_URL}`
    );
    const { unixtime } = await timeService.getTime();
    deployParam.timestamp = unixtime;
  }

  return makeDeploy(deployParam, session, payment);
}

/**
 * Uses the provided key pair to sign the Deploy message
 * @param deploy Either an unsigned `Deploy` object or one with other signatures
 * @param signingKey The keypair used to sign the `Deploy`
 */
export const signDeploy = (
  deploy: Deploy,
  signingKey: AsymmetricKey
): Deploy => {
  const approval = new Approval();
  const signature = signingKey.sign(deploy.hash);
  approval.signer = signingKey.accountHex();
  switch (signingKey.signatureAlgorithm) {
    case SignatureAlgorithm.Ed25519:
      approval.signature = Keys.Ed25519.accountHex(signature);
      break;
    case SignatureAlgorithm.Secp256K1:
      approval.signature = Keys.Secp256K1.accountHex(signature);
      break;
  }
  deploy.approvals.push(approval);

  return deploy;
};

/**
 * Sets the algorithm of the already generated signature
 *
 * @param deploy A `Deploy` to be signed with `sig`
 * @param sig the Ed25519 or Secp256K1 signature
 * @param publicKey the public key used to generate the signature
 */
export const setSignature = (
  deploy: Deploy,
  sig: Uint8Array,
  publicKey: CLPublicKey
): Deploy => {
  const approval = new Approval();
  approval.signer = publicKey.toHex();
  // TBD: Make sure it is proper
  if (publicKey.isEd25519()) {
    approval.signature = Keys.Ed25519.accountHex(sig);
  }
  if (publicKey.isSecp256K1()) {
    approval.signature = Keys.Secp256K1.accountHex(sig);
  }
  deploy.approvals.push(approval);
  return deploy;
};

/**
 * Creates an instance of standard payment logic
 *
 * @param paymentAmount The amount of motes to be used to pay for gas
 * @returns A standard payment, as an `ExecutableDeployItem` to be attached to a `Deploy`
 */
export const standardPayment = (paymentAmount: BigNumberish) => {
  const paymentArgs = RuntimeArgs.fromMap({
    amount: CLValueBuilder.u512(paymentAmount.toString())
  });

  return ExecutableDeployItem.newModuleBytes(Uint8Array.from([]), paymentArgs);
};

/**
 * Convert the deploy object to a JSON representation
 *
 * @param deploy The `Deploy` object to convert to JSON
 * @returns A JSON version of the `Deploy`, which can be converted back later
 */
export const deployToJson = (deploy: Deploy) => {
  const serializer = new TypedJSON(Deploy);
  return {
    deploy: serializer.toPlainJson(deploy)
  };
};

/**
 * Convert a JSON representation of a deploy to a `Deploy` object
 *
 * @param json A JSON representation of a `Deploy`
 * @returns A `Result` that collapses to a `Deploy` or an error string
 */
export const deployFromJson = (json: any): Result<Deploy, Error> => {
  if (json.deploy === undefined) {
    return new Err(new Error("The Deploy JSON doesn't have 'deploy' field."));
  }
  let deploy = null;
  try {
    const serializer = new TypedJSON(Deploy);
    deploy = serializer.parse(json.deploy);
  } catch (serializationError) {
    return new Err(serializationError);
  }

  if (deploy === undefined || deploy === null) {
    return Err(new Error("The JSON can't be parsed as a Deploy."));
  }

  const valid = validateDeploy(deploy);
  if (valid.err) {
    return new Err(new Error(valid.val));
  }

  return new Ok(deploy);
};

/**
 * Adds a runtime argument to a `Deploy` object
 * @param deploy The `Deploy` object for which to add the runtime argument
 * @param name The name of the runtime argument
 * @param value The value of the runtime argument
 * @returns The original `Deploy` with the additional runtime argument
 * @remarks Will fail if the `Deploy` has already been signed
 */
export const addArgToDeploy = (
  deploy: Deploy,
  name: string,
  value: CLValue
): Deploy => {
  if (deploy.approvals.length !== 0) {
    throw Error('Can not add argument to already signed deploy.');
  }

  const deployParams = new DeployUtil.DeployParams(
    deploy.header.account,
    deploy.header.chainName,
    deploy.header.gasPrice,
    deploy.header.ttl,
    deploy.header.dependencies,
    deploy.header.timestamp
  );

  const session = deploy.session;
  session.setArg(name, value);

  return makeDeploy(deployParams, session, deploy.payment);
};

/**
 * Gets the byte-size of a deploy
 * @param deploy The `Deploy` for which to calculate the size
 * @returns The size of the `Deploy` in its serialized representation
 */
export const deploySizeInBytes = (deploy: Deploy): number => {
  const hashSize = deploy.hash.length;
  const bodySize = serializeBody(deploy.payment, deploy.session).length;
  const headerSize = serializeHeader(deploy.header).unwrap().length;
  const approvalsSize = deploy.approvals
    .map(approval => {
      return (approval.signature.length + approval.signer.length) / 2;
    })
    .reduce((a, b) => a + b, 0);

  return hashSize + headerSize + bodySize + approvalsSize;
};

/**
 * Validate a `Deploy` by calculating and comparing its stored blake2b hash
 * @param deploy A `Deploy` to be validated
 * @returns A `Result` that collapses to a `Deploy` or an error string
 */
export const validateDeploy = (deploy: Deploy): Result<Deploy, string> => {
  if (!(deploy instanceof Deploy)) {
    return new Err("'deploy' is not an instance of Deploy class.");
  }

  const serializedBody = serializeBody(deploy.payment, deploy.session);
  const bodyHash = byteHash(serializedBody);

  if (!arrayEquals(deploy.header.bodyHash, bodyHash)) {
    return Err(`Invalid deploy: bodyHash mismatch. Expected: ${bodyHash},
                  got: ${deploy.header.bodyHash}.`);
  }

  const serializedHeader = serializeHeader(deploy.header).unwrap();
  const deployHash = byteHash(serializedHeader);

  if (!arrayEquals(deploy.hash, deployHash)) {
    return Err(`Invalid deploy: hash mismatch. Expected: ${deployHash},
                  got: ${deploy.hash}.`);
  }

  const isProperlySigned = deploy.approvals.every(({ signer, signature }) => {
    const pk = CLPublicKey.fromHex(signer, false);
    const signatureRaw = decodeBase16(signature.slice(2));
    return validateSignature(deploy.hash, signatureRaw, pk);
  });

  if (!isProperlySigned) {
    return Err('Invalid signature.');
  } else {
    return Ok(deploy);
  }
};

/**
 * Compares two `Uint8Array`s
 * @param a The first `Uint8Array`
 * @param b The second `Uint8Array`
 * @returns `true` if the two `Uint8Array`s match, and `false` otherwise
 */
export const arrayEquals = (a: Uint8Array, b: Uint8Array): boolean => {
  return a.length === b.length && a.every((val, index) => val === b[index]);
};

/**
 * Serializes a `Deploy` to a `Uint8Array`
 * @param deploy The `Deploy` to be serialized
 * @returns A `Uint8Array` serialization of the provided `Deploy`
 */
export const deployToBytes = (deploy: Deploy): Uint8Array => {
  return concat([
    serializeHeader(deploy.header).unwrap(),
    deploy.hash,
    serializeBody(deploy.payment, deploy.session),
    serializeApprovals(deploy.approvals)
  ]);
};

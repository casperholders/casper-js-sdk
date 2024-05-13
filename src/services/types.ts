import { CLValue } from '../lib';

/** RPC request props interface */
export interface RpcRequestProps {
  timeout?: number;
}

/** RPC result interface */
export interface RpcResult {
  api_version: string;
}

/** Node peer interface */
export interface Peer {
  node_id: string;
  address: string;
}

/** A peers result interface defining `peers` as an array of `Peer`s */
export interface GetPeersResult extends RpcResult {
  peers: Peer[];
}

/** Interface for information on the most recently appended block on the network */
interface LastAddedBlockInfo {
  hash: string;
  timestamp: string;
  era_id: number;
  height: number;
  state_root_hash: string;
  creator: string;
}

interface NextUpgrade {
  activation_point: number | string;
  protocol_version: string;
}

type ReactorState =
  | 'Initialize'
  | 'CatchUp'
  | 'Upgrading'
  | 'KeepUp'
  | 'Validate'
  | 'ShutdownForUpgrade';

/** The status of syncing an individual block. */
interface BlockSyncStatus {
  /** The block hash. */
  block_hash: string;
  /** The height of the block, if known. */
  block_height: number | null;
  /** The state of acquisition of the data associated with the block. */
  acquisition_state: string;
}

/** The status of the block synchronizer. */
interface BlockSynchronizerStatus {
  historical: BlockSyncStatus;
  forward: BlockSyncStatus;
}

/** Result interface for a get-status call */
export interface GetStatusResult extends GetPeersResult {
  /** The compiled node version. */
  build_version: string;
  /** The chainspec name. */
  chainspec_name: string;
  /** The state root hash of the lowest block in the available block range. */
  starting_state_root_hash: string;
  /** The minimal info of the last block from the linear chain. */
  last_added_block_info: LastAddedBlockInfo | null;
  /** Our public signing key. */
  our_public_signing_key: string | null;
  /** The next round length if this node is a validator. */
  round_length: number | null;
  /** Information about the next scheduled upgrade. */
  next_upgrade: NextUpgrade | null;
  /** Time that passed since the node has started. */
  uptime: string;
  /** @added casper-node 1.5 */
  reactor_state: ReactorState;
  /** Timestamp of the last recorded progress in the reactor. */
  last_progress: string;
  /** The available block range in storage. */
  available_block_range: {
    /** The inclusive lower bound of the range. */
    row: number;
    /** The inclusive upper bound of the range. */
    high: number;
  };
  /** The status of syncing a forward block, if any. */
  block_sync: BlockSynchronizerStatus | null;

  latest_switch_block_hash: string | null;
}

export interface GetChainSpecResult extends RpcResult {
  chainspec_bytes: {
    /** Hex-encoded raw bytes of the current chainspec.toml file. */
    chainspec_bytes: string;
    /** Hex-encoded raw bytes of the current genesis accounts.toml file. */
    maybe_genesis_accounts_bytes: string | null;
    /** Hex-encoded raw bytes of the current global_state.toml file. */
    maybe_global_state_bytes: string | null;
  };
}

export type StateIdentifier =
  | { BlockHash: string }
  | { BlockHeight: number }
  | { StateRootHash: string };

/** Result interface for a get-state-root-hash call */
export interface GetStateRootHashResult extends RpcResult {
  state_root_hash: string;
}

export type WriteCLValue = {
  cl_type: any;
  bytes: string;
  parsed: any;
};

export type WriteDeployInfo = {
  gas: string;
  from: string;
  source: string;
  transfers: string[];
  deploy_hash: string;
};

export type WriteTransfer = {
  id: number;
  /** to account hash, `null` if the target is URef */
  to: string | null;
  gas: string;
  /** from account hash */
  from: string;
  amount: string;
  /** source uref */
  source: string;
  /** target uref */
  target: string;
  deploy_hash: string;
};

export type AddKey = {
  key: string;
  name: string;
};

export type TransformValue =
  | 'Identity'
  | 'WriteContractWasm'
  | 'WriteContract'
  | 'WriteContractPackage'
  | {
      WriteCLValue: WriteCLValue;
    }
  | { WriteDeployInfo: WriteDeployInfo }
  | { WriteTransfer: WriteTransfer }
  | { AddUInt512: string }
  | { AddKeys: AddKey[] };

interface Transform {
  key: string;
  transform: TransformValue;
}

interface Effect {
  transforms: Transform[];
}

/** Result interface for an execution result body */
interface ExecutionResultBody {
  cost: number;
  error_message?: string | null;
  transfers: string[];
  effect: Effect;
}

/** Result interface for a JSON execution result */
export interface JsonExecutionResult {
  block_hash: JsonBlockHash;
  result: ExecutionResult;
}

export interface ExecutionResultV1 {
  Success?: ExecutionResultBody;
  Failure?: ExecutionResultBody;
}

export interface ExecutionResultV2 {
  initiator: any;
  /** If error_message is null, the execution was successful */
  error_message: string | null;
  limit: string;
  consumed: string;
  cost: string;
  payment: { source: string }[];
  transfers: any[];
  effect: Effect;
}

export type ExecutionResult =
  | { Version1: ExecutionResultV1 }
  | { Version2: ExecutionResultV2 };

/** Result interface for a get-deploy call */
export interface GetDeployResult extends RpcResult {
  deploy: JsonDeploy;
  block_hash: string;
  block_height: number;
  execution_result: ExecutionResult | undefined;
}

export type BlockIdentifier =
  | {
      Hash: string;
    }
  | { Height: number };

export interface SpeculativeExecutionResult extends RpcResult {
  block_hash: string;
  execution_result: ExecutionResult;
}

/** Result interface for a get-block call */
export interface GetBlockResult extends RpcResult {
  block_with_signatures: JsonBlockWithSignatures | null;
}

/** Result interface for a account_put_deploy call */
export interface DeployResult extends RpcResult {
  deploy_hash: string;
}

export type JsonBlockHash = string;
export type JsonDeployHash = string;

/** JSON system transaction interface */
export interface JsonSystemTransaction {
  Slash?: string;
  Reward?: Record<string, number>;
}

/** JSON deploy header interface that acts as a schema for JSON deploy headers */
interface JsonDeployHeader {
  account: string;
  timestamp: string;
  ttl: number;
  gas_price: number;
  body_hash: string;
  dependencies: JsonDeployHash[];
  chain_name: string;
}

interface JsonBasicExecutionDeployItemInternal {
  args: Map<string, CLValue>;
}

interface JsonModuleBytes extends JsonBasicExecutionDeployItemInternal {
  module_bytes: string;
}

interface JsonStoredContract extends JsonBasicExecutionDeployItemInternal {
  entry_point: string;
}

interface JsonStoredContractByHash extends JsonStoredContract {
  hash: string;
}

interface JsonStoredContractByName extends JsonStoredContract {
  name: string;
}

interface JsonStoredVersionedContractByName extends JsonStoredContractByName {
  version: number | null;
}

interface JsonStoredVersionedContractByHash extends JsonStoredContractByHash {
  version: number | null;
}

/** Interface describing a JSON ExecutableDeployItem */
export interface JsonExecutableDeployItem {
  ModuleBytes?: JsonModuleBytes;
  StoredContractByHash?: JsonStoredContractByHash;
  StoredContractByName?: JsonStoredContractByName;
  StoredVersionedContractByName?: JsonStoredVersionedContractByName;
  StoredVersionedContractByHash?: JsonStoredVersionedContractByHash;
  Transfer?: JsonBasicExecutionDeployItemInternal;
}

/** Interface for JSON represented approvals */
export interface JsonApproval {
  signer: string;
  signature: string;
}

/** Interface describing a JSON represented deploy */
export interface JsonDeploy {
  hash: JsonDeployHash;
  header: JsonDeployHeader;
  payment: JsonExecutableDeployItem;
  session: JsonExecutableDeployItem;
  approvals: JsonApproval[];
}

/** Interface describing a JSON represented deploy header */
export interface JsonHeader {
  parent_hash: string;
  state_root_hash: string;
  body_hash: string;
  deploy_hashes: string[];
  random_bit: boolean;
  switch_block: boolean;
  timestamp: string;
  system_transactions: JsonSystemTransaction[];
  era_id: number;
  height: number;
  proposer: string;
  protocol_version: string;
}

/** Interface describing JSON represented block proof */
export interface Proof {
  public_key: string;
  signature: string;
}

export interface BlockBodyV1 {
  proposer: string;
  deploy_hashes: JsonDeployHash[];
  transfer_hashes: JsonDeployHash[];
  hash: JsonBlockHash;
}

export interface BlockV1 {
  hash: JsonBlockHash;
  header: JsonHeader;
  proofs: string[];
  body: BlockBodyV1;
}

export interface NextEraValidatorV2 {
  validator: string;
  weight: string;
}
export interface EraEndV2 {
  equivocators: string[];
  inactive_validators: string[];
  next_era_validator_weights: NextEraValidatorV2[];
  rewards: object; //TODO make this a map
  next_era_gas_price: number;
}

export interface BlockHeaderV1 {
  parent_hash: JsonBlockHash;
  state_root_hash: string;
  body_hash: string;
  random_bit: boolean;
  accumulated_seed: string;
  era_end: EraEndV2 | null;
  timestamp: string;
  era_id: number;
  height: number;
  protocol_version: string;
}

export interface BlockHeaderV2 {
  parent_hash: JsonBlockHash;
  state_root_hash: string;
  body_hash: string;
  random_bit: boolean;
  accumulated_seed: string;
  era_end: EraEndV2 | null;
  timestamp: string;
  era_id: number;
  height: number;
  protocol_version: string;
  current_gas_price: number;
}
export type TransactionHash =
  | {
      Deploy: string;
    }
  | { Version1: string };

export interface BlockBodyV2 {
  proposer: string;
  mint: TransactionHash[];
  auction: TransactionHash[];
  install_upgrade: TransactionHash;
  standard: TransactionHash[];
  rewarded_signatures: number[][];
  hash: string;
}

export interface BlockV2 {
  hash: JsonBlockHash;
  header: BlockHeaderV2;
  body: BlockBodyV2;
}

export type Block =
  | {
      Version1: BlockV1;
    }
  | { Version2: BlockV2 };

export function getStateRootHash(block: Block): string {
  if ('Version1' in block) {
    return block.Version1.header.state_root_hash;
  } else if ('Version2' in block) {
    return block.Version2.header.state_root_hash;
  }
  throw new Error('Got block with unknown structure.');
}

export function getHeight(block: Block): number {
  if ('Version1' in block) {
    return block.Version1.header.height;
  } else if ('Version2' in block) {
    return block.Version2.header.height;
  }
  throw new Error('Got block with unknown structure.');
}

export function getBlockHash(block: Block): string {
  if ('Version1' in block) {
    return block.Version1.hash;
  } else if ('Version2' in block) {
    return block.Version2.hash;
  }
  throw new Error('Got block with unknown structure.');
}

/** Interface describing JSON represented block related information */
export interface JsonBlockWithSignatures {
  block: Block;
  proofs: Proof[];
}

/** Interface describing auction bidding information */
export interface BidInfo {
  bonding_purse: string;
  staked_amount: string;
  delegation_rate: number;
  funds_locked: null | string;
}

/** Interface describing the weight of a validator by its public key */
export interface ValidatorWeight {
  public_key: string;
  weight: string;
}

export type Account =
  | {
      PublicKey: string;
    }
  | {
      AccountHash: string;
    };

export type EntityIdentifier = Account | { EntityAddr: string };

export interface AddressableEntity {
  protocol_version: string;
  entity_kind: object;
  package_hash: string;
  byte_code_hash: string;
  main_purse: string;
  entry_points: [];
  associated_keys: [];
  action_thresholds: [];
  message_topics: [];
}

export type BlockHeader =
  | {
      Version1: BlockHeaderV1;
    }
  | { Version2: BlockHeaderV2 };

/** TODO: Update */
export type StoredValueJson = any;

export interface QueryGlobalStateResult extends RpcResult {
  block_header: BlockHeader | null;
  stored_value: StoredValueJson;
  merkle_proof: string;
}

export interface TransferV1 {
  deploy_hash: string;
  /** account hash as a formatted string */
  from: string;
  /** account hash as a formatted string */
  to: string | null;
  /** source uref */
  source: string;
  /** target uref */
  target: string;
  amount: string;
  gas: string;
  id: number | null;
}

export interface TransferV2 {
  transaction_hash: TransactionHash;
  from: Account;
  /** account hash as a formatted string */
  to: string | null;
  /** source uref */
  source: string;
  /** target uref */
  target: string;
  amount: string;
  gas: string;
  id: number | null;
}

export type Transfer =
  | {
      Version1: TransferV1;
    }
  | {
      Version2: TransferV2;
    };

export interface GetBlockTransfersResult extends RpcResult {
  block_hash: string;
  transfers: Transfer[];
}

export interface BalanceHold {
  time: number;
  amount: string;
  proof: string;
}

export interface QueryBalanceDetailsResult extends RpcResult {
  total_balance: string;
  available_balance: string;
  total_balance_proof: string;
  holds: BalanceHold[];
}

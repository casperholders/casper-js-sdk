/* eslint-disable @typescript-eslint/no-unused-vars */
import { BigNumber } from '@ethersproject/bignumber';
import { RequestManager, HTTPTransport, Client } from '@open-rpc/client-js';
import { TypedJSON, jsonMember, jsonObject } from 'typedjson';
import {
  CLAccountHash,
  CLPublicKey,
  DeployUtil,
  TransactionUtil,
  encodeBase16,
  StoredValue
} from '..';
import ProviderTransport, {
  SafeEventEmitterProvider
} from './ProviderTransport';
import {
  ValidatorWeight,
  RpcResult,
  RpcRequestProps,
  GetDeployResult,
  JsonBlockHash,
  GetBlockResult,
  GetPeersResult,
  GetStatusResult,
  GetStateRootHashResult,
  DeployResult,
  SpeculativeExecutionResult,
  BlockIdentifier,
  GetChainSpecResult,
  StateIdentifier,
  getBlockHash,
  getHeight,
  EntityIdentifier,
  QueryGlobalStateResult,
  Transfers,
  QueryBalanceDetailsResult,
  AddressableEntityWrapper,
  TransactionHash,
  TransactionResult,
  GetTransactionResult
} from './types';

export { JSONRPCError } from '@open-rpc/client-js';

export enum PurseIdentifier {
  MainPurseUnderPublicKey = 'main_purse_under_public_key',
  MainPurseUnderAccountHash = 'main_purse_under_account_hash',
  MainPurseUnderEntityAddr = 'main_purse_under_entity_addr',
  PurseUref = 'purse_uref'
}

/** Object to represent era specific information */
@jsonObject
export class EraSummary {
  /** The hash of the block when the era was encountered */
  @jsonMember({ constructor: String, name: 'block_hash' })
  blockHash: string;

  /** The id of the era */
  @jsonMember({ constructor: Number, name: 'era_id' })
  eraId: number;

  /** A `StoredValue` */
  @jsonMember(() => ({ constructor: StoredValue, name: 'stored_value' }))
  StoredValue: StoredValue;

  /** The state root hash when the era was encountered */
  @jsonMember({ constructor: String, name: 'state_root_hash' })
  stateRootHash: string;

  /** The merke proof */
  @jsonMember({ constructor: String, name: ' merkle_proof' })
  merkleProof: string;
}

/** Interface describing the validators at a certain era */
export interface EraValidators {
  era_id: number;
  validator_weights: ValidatorWeight[];
}

export interface VestingSchedule {
  initial_release_timestamp_millis: number;
  locked_amounts: string[];
}

/** Interface describing a validator auction bid */
export interface Bid {
  validator_public_key: string;
  bonding_purse: string;
  staked_amount: string;
  delegation_rate: number;
  vesting_schedule?: VestingSchedule;
  delegators: DelegatorEntry[];
  inactive: boolean;
}

export interface DelegatorEntry {
  delegator_public_key: string;
  delegator: Delegator;
}
/** Interface describing a delegator */
export interface Delegator {
  delegator_public_key: string;
  staked_amount: string;
  bonding_purse: string;
  validator_public_key: string;
  vesting_schedule?: VestingSchedule;
}

/** Interface describing a delegator's information */
export interface DelegatorInfo {
  bonding_purse: string;
  delegatee: string;
  reward: string;
  staked_amount: string;
}

/** Interface describing a validator's auction bid */
export interface ValidatorBid {
  public_key: string;
  bid: Bid;
}

/** Interface describing the state of a validator auction */
export interface AuctionState {
  state_root_hash: string;
  block_height: number;
  era_validators: EraValidators[];
  bids: ValidatorBid[];
}

/** Result interface describing validator information */
export interface ValidatorsInfoResult extends RpcResult {
  api_version: string;
  auction_state: AuctionState;
}

/** JSON RPC service for interacting with Casper nodes */
export class CasperServiceByJsonRPC {
  oneMegaByte = 1048576;
  /** JSON RPC client */
  protected client: Client;

  /**
   * Constructor for building a `CasperServiceByJsonRPC`
   * @param provider A provider uri
   */
  constructor(provider: string | SafeEventEmitterProvider) {
    let transport: HTTPTransport | ProviderTransport;
    if (typeof provider === 'string') {
      let providerUrl = provider.endsWith('/')
        ? provider.substring(0, provider.length - 1)
        : provider;

      providerUrl = providerUrl.endsWith('/rpc')
        ? providerUrl
        : providerUrl + '/rpc';

      transport = new HTTPTransport(providerUrl);
    } else {
      transport = new ProviderTransport(provider);
    }
    const requestManager = new RequestManager([transport]);
    this.client = new Client(requestManager);
  }

  /**
   * Get information about a deploy using its hexadecimal hash
   * @param deployHash Hex-encoded hash digest.
   * @param finalizedApprovals Whether to return the deploy with the finalized approvals substituted. If `false` or omitted, returns the deploy with the approvals that were originally received by the node.
   * @param props optional request props
   * @returns A `Promise` that resolves to a `GetDeployResult`
   * @deprecated use `getTransactionInfo` method
   */
  public async getDeployInfo(
    deployHash: string,
    finalizedApprovals?: boolean,
    props?: RpcRequestProps
  ): Promise<GetDeployResult> {
    console.warn(
      'This method is deprecated and will be removed in the future release, please use getTransactionInfo method instead.'
    );
    const params: any[] = [deployHash];
    if (finalizedApprovals) {
      params.push(finalizedApprovals);
    }

    return await this.client.request(
      {
        method: 'info_get_deploy',
        params
      },
      props?.timeout
    );
  }

  /**
   * Get information about a deploy using its hexadecimal hash
   * @param deployHash Hex-encoded hash digest.
   * @param finalizedApprovals Whether to return the deploy with the finalized approvals substituted. If `false` or omitted, returns the deploy with the approvals that were originally received by the node.
   * @param props optional request props
   * @returns A `Promise` that resolves to a `GetTransactionResult`
   */
  public async getTransactionInfo(
    transaction_hash: TransactionHash,
    finalizedApprovals?: boolean,
    props?: RpcRequestProps
  ): Promise<GetTransactionResult> {
    const params: any[] = [transaction_hash];
    if (finalizedApprovals) {
      params.push(finalizedApprovals);
    }
    return await this.client.request(
      {
        method: 'info_get_transaction',
        params
      },
      props?.timeout
    );
  }

  /**
   * Get block information
   * @param blockHash A hexadecimal string representing the hash of a block
   * @param props optional request props
   * @returns A `Promise` resolving to a `GetBlockResult`
   */
  public async getBlockInfo(
    blockHash: JsonBlockHash,
    props?: RpcRequestProps
  ): Promise<GetBlockResult> {
    return await this.client
      .request(
        {
          method: 'chain_get_block',
          params: [
            {
              Hash: blockHash
            }
          ]
        },
        props?.timeout
      )
      .then((res: GetBlockResult) => {
        const block_with_signatures = res.block_with_signatures;
        if (block_with_signatures === null) {
          return res;
        }
        const gotBlockHash = getBlockHash(block_with_signatures.block);
        if (gotBlockHash.toLowerCase() !== blockHash.toLowerCase()) {
          throw new Error('Returned block does not have a matching hash.');
        }
        return res;
      });
  }

  /**
   * Get block info at a provided block height
   * @param height The block height at which to gather the block info
   * @param props optional request props
   * @returns A `Promise` resolving to a `GetBlockResult`
   */
  public async getBlockInfoByHeight(
    height: number,
    props?: RpcRequestProps
  ): Promise<GetBlockResult> {
    return await this.client
      .request(
        {
          method: 'chain_get_block',
          params: [
            {
              Height: height
            }
          ]
        },
        props?.timeout
      )
      .then((res: GetBlockResult) => {
        const block_with_signatures = res.block_with_signatures;
        if (block_with_signatures === null) {
          return res;
        }
        const gotHeight = getHeight(block_with_signatures.block);
        if (gotHeight !== height) {
          throw new Error('Returned block does not have a matching height.');
        }
        return res;
      });
  }

  /**
   * Get the block info of the latest block added
   * @param props optional request props
   * @returns A `Promise` that resolves to a `GetBlockResult`
   */
  public async getLatestBlockInfo(
    props?: RpcRequestProps
  ): Promise<GetBlockResult> {
    return await this.client.request(
      {
        method: 'chain_get_block'
      },
      props?.timeout
    );
  }

  /**
   * Get the attached node's current peers
   * @param props optional request props
   * @returns A `Promise` that resolves to a `GetPeersResult`
   */
  public async getPeers(props?: RpcRequestProps): Promise<GetPeersResult> {
    return await this.client.request(
      {
        method: 'info_get_peers'
      },
      props?.timeout
    );
  }

  /**
   * Get the status of a node
   * @param props optional request props
   * @returns A `Promise` that resolves to a `GetStatusResult`
   */
  public async getStatus(props?: RpcRequestProps): Promise<GetStatusResult> {
    return await this.client.request(
      {
        method: 'info_get_status'
      },
      props?.timeout
    );
  }

  /**
   * Get information on the current validators
   * @param blockHash (optional) blockHash that you want to check
   * @param props optional request props
   * @returns A `Promise` that resolves to a `ValidatorsInfoResult`
   */
  public async getValidatorsInfo(
    blockHash?: string,
    props?: RpcRequestProps
  ): Promise<ValidatorsInfoResult> {
    return await this.client.request(
      {
        method: 'state_get_auction_info',
        params: blockHash
          ? [
              {
                Hash: blockHash
              }
            ]
          : []
      },
      props?.timeout
    );
  }

  /**
   * Get information on the network validators of at a certain block height
   * @param blockHeight The block height at which to query the validators' info
   * @param props optional request props
   * @returns A `Promise` that resolves to a `ValidatorsInfoResult`
   */
  public async getValidatorsInfoByBlockHeight(
    blockHeight: number,
    props?: RpcRequestProps
  ): Promise<ValidatorsInfoResult> {
    return await this.client.request(
      {
        method: 'state_get_auction_info',
        params:
          blockHeight >= 0
            ? [
                {
                  Height: blockHeight
                }
              ]
            : []
      },
      props?.timeout
    );
  }

  /**
   * Returns legacy account information
   * @param publicKeyOrAccountHash Formatted public key or account hash
   * @param blockIdentifier BlockIdentifier
   * @param props optional request props
   * @returns The account's main purse URef
   */
  public async getAccountInfo(
    accountIdentifier: CLPublicKey | CLAccountHash,
    blockIdentifier?: BlockIdentifier,
    props?: RpcRequestProps
  ): Promise<any> {
    let identifier;
    if (accountIdentifier instanceof CLPublicKey) {
      identifier = accountIdentifier.toHex();
    } else if (accountIdentifier instanceof CLAccountHash) {
      identifier = accountIdentifier.toFormattedString();
    }
    const params: any = {
      account_identifier: identifier
    };
    if (blockIdentifier) {
      params.block_identifier = blockIdentifier;
    }
    const payload = {
      method: 'state_get_account_info',
      params: params
    };
    const account = await this.client.request(payload, props?.timeout);
    return account;
  }

  /**
   * Returns legacy account information
   * @param publicKeyOrAccountHash Formatted public key or account hash
   * @param blockIdentifier BlockIdentifier
   * @param props optional request props
   * @returns The account's main purse URef
   */
  public async getEntity(
    entityIdentifier: EntityIdentifier,
    blockIdentifier?: BlockIdentifier,
    props?: RpcRequestProps
  ): Promise<{ AddressableEntity: AddressableEntityWrapper }> {
    const params: any[] = [entityIdentifier];

    if (blockIdentifier) {
      params.push(blockIdentifier);
    } else {
      params.push(null);
    }
    const { entity } = await this.client.request(
      {
        method: 'state_get_entity',
        params: params
      },
      props?.timeout
    );

    return entity;
  }

  /**
   * Get the balance of an account using its main purse URef
   * @param stateRootHash The state root hash at which the account balance will be queried
   * @param balanceUref The URef of an account's main purse URef
   * @param props optional request props
   * @deprecated since casper-node 1.5, use `queryBalance` method instead
   * @returns An account's balance
   */
  public async getAccountBalance(
    stateRootHash: string,
    purseUref: string,
    props?: RpcRequestProps
  ): Promise<BigNumber> {
    console.warn(
      'This method is deprecated and will be removed in the future release, please use queryBalance method instead.'
    );
    return await this.client
      .request(
        {
          method: 'state_get_balance',
          params: { state_root_hash: stateRootHash, purse_uref: purseUref }
        },
        props?.timeout
      )
      .then(res => BigNumber.from(res.balance_value));
  }

  /**
   * Get the reference to an account balance uref by an account's account hash, so it may be cached. This will work only for accounts that were not migrated to `AddressableEntity`
   * @param stateRootHash The state root hash at which the main purse URef will be queried
   * @param accountHash The account hash of the account
   * @param props optional request props
   * @returns The account's main purse URef
   */
  public async getAccountBalanceUrefByPublicKeyHash(
    stateRootHash: string,
    accountHash: string,
    props?: RpcRequestProps
  ): Promise<string> {
    const account = await this.getBlockState(
      stateRootHash,
      'account-hash-' + accountHash,
      [],
      props
    ).then(res => res.Account!);
    return account.mainPurse;
  }

  /**
   * Get the reference to an account balance uref by an account's public key, so it may be cached. This will work only for accounts that were not migrated to `AddressableEntity`
   * @param stateRootHash The state root hash at which the main purse URef will be queried
   * @param publicKey The public key of the account
   * @param props optional request props
   * @returns The account's main purse URef
   * @see [getAccountBalanceUrefByPublicKeyHash](#L486)
   */
  public async getAccountBalanceUrefByPublicKey(
    stateRootHash: string,
    publicKey: CLPublicKey,
    props?: RpcRequestProps
  ): Promise<string> {
    return this.getAccountBalanceUrefByPublicKeyHash(
      stateRootHash,
      publicKey.toAccountHash().toString(),
      props
    );
  }

  /**
   * Returns balance using a purse identifier and a state identifier
   * @added casper-node 1.5
   * @example
   * ```ts
   * const client = new CasperServiceByJsonRPC("http://localhost:11101/rpc");
   * const balance = await client.queryBalance(PurseIdentifier.MainPurseUnderAccountHash, "account-hash-0909090909090909090909090909090909090909090909090909090909090909");
   * ```
   * @param purseIdentifierType purse type enum
   * @param purseIdentifier purse identifier
   * @param stateRootHash state root hash at which the block state will be queried
   * @param props optional request props
   * @returns Purse balance
   */
  public async queryBalance(
    purseIdentifierType: PurseIdentifier,
    purseIdentifier: string,
    stateIdentifier?: StateIdentifier,
    props?: RpcRequestProps
  ): Promise<BigNumber> {
    const params: any[] = [];
    if (stateIdentifier) {
      params.push(stateIdentifier);
    } else {
      params.push(null);
    }
    params.push({
      [purseIdentifierType]: purseIdentifier
    });

    return await this.client
      .request(
        {
          method: 'query_balance',
          params
        },
        props?.timeout
      )
      .then(res => BigNumber.from(res.balance));
  }

  /**
   * Returns balance details using a purse identifier and a state identifier
   * @added casper-node 2.0
   * @example
   * ```ts
   * const client = new CasperServiceByJsonRPC("http://localhost:11101/rpc");
   * const balance = await client.queryBalanceDetails(PurseIdentifier.MainPurseUnderAccountHash, "account-hash-0909090909090909090909090909090909090909090909090909090909090909");
   * ```
   * @param purseIdentifierType purse type enum
   * @param purseIdentifier purse identifier
   * @param stateRootHash state root hash at which the block state will be queried
   * @param props optional request props
   * @returns balance details object
   */
  public async queryBalanceDetails(
    purseIdentifierType: PurseIdentifier,
    purseIdentifier: string,
    stateIdentifier?: StateIdentifier,
    props?: RpcRequestProps
  ): Promise<QueryBalanceDetailsResult> {
    const params: any[] = [];
    if (stateIdentifier) {
      params.push(stateIdentifier);
    } else {
      params.push(null);
    }
    params.push({
      [purseIdentifierType]: purseIdentifier
    });

    return await this.client.request(
      {
        method: 'query_balance_details',
        params
      },
      props?.timeout
    );
  }

  /**
   * Get the state root hash at a specific block hash
   * @param blockHashBase16 The hexadecimal string representation of a block hash
   * @param props optional request props
   * @returns A `Promise` resolving to a state root hash hexadecimal string
   */
  public async getStateRootHash(
    blockHashBase16?: JsonBlockHash,
    props?: RpcRequestProps
  ): Promise<string> {
    return await this.client
      .request(
        {
          method: 'chain_get_state_root_hash',
          params: blockHashBase16 ? [{ Hash: blockHashBase16 }] : []
        },
        props?.timeout
      )
      .then((res: GetStateRootHashResult) => res.state_root_hash);
  }

  /**
   * Get the state root hash at a specific block height
   * @param blockHeight The height of a block hash
   * @param props optional request props
   * @returns A `Promise` resolving to a state root hash hexadecimal string
   */
  public async getStateRootHashByHeight(
    blockHeight: number,
    props?: RpcRequestProps
  ): Promise<string> {
    return await this.client
      .request(
        {
          method: 'chain_get_state_root_hash',
          params: [{ Height: blockHeight }]
        },
        props?.timeout
      )
      .then((res: GetStateRootHashResult) => res.state_root_hash);
  }

  /**
   * Get the global block state at a certain state root hash, path, and key
   * @param stateRootHash The state root hash at which the block state will be queried
   * @param key The key at which to query the state
   * @param path An array of a path / paths at which to query the state
   * @param props optional request props
   * @returns The block state at the state root hash, path, and key provided, as a `StoredValue`
   */
  public async getBlockState(
    stateRootHash: string,
    key: string,
    path: string[],
    props?: RpcRequestProps
  ): Promise<StoredValue> {
    const res = await this.client.request(
      {
        method: 'state_get_item',
        params: [stateRootHash, key, path]
      },
      props?.timeout
    );
    if (res.error) {
      return res;
    } else {
      const storedValueJson = res.stored_value;
      const serializer = new TypedJSON(StoredValue);
      const storedValue = serializer.parse(storedValueJson)!;
      return storedValue;
    }
  }

  /**
   * Check deploy size and throws error if deploy size exceeds 1 Mbytes.
   * @param deploy deploy to check size.
   */
  public checkDeploySize(deploy: DeployUtil.Deploy) {
    const size = DeployUtil.deploySizeInBytes(deploy);
    if (size > this.oneMegaByte) {
      throw Error(
        `Deploy can not be send, because it's too large: ${size} bytes. ` +
          `Max size is 1 megabyte.`
      );
    }
  }

  /**
   * Check deploy size and throws error if deploy size exceeds 1 Mbytes.
   * @param deploy deploy to check size.
   */
  public checkTransactionSize(transaction: TransactionUtil.Transaction) {
    const size = transaction.sizeInBytes();
    if (size > this.oneMegaByte) {
      throw Error(
        `Deploy can not be send, because it's too large: ${size} bytes. ` +
          `Max size is 1 megabyte.`
      );
    }
  }

  /**
   * Deploys a provided signed deploy
   * @param signedDeploy A signed `Deploy` object to be sent to a node
   * @param props optional request props
   * @remarks A deploy must not exceed 1 megabyte
   * @deprecated use `transaction` method
   */
  public async deploy(
    signedDeploy: DeployUtil.Deploy,
    props?: RpcRequestProps & {
      /**
       * Throws error for unsigned deploy if true
       * @default false
       */
      checkApproval?: boolean;
    }
  ): Promise<DeployResult> {
    console.warn(
      'This method is deprecated and will be removed in the future release, please use transaction method instead.'
    );
    this.checkDeploySize(signedDeploy);
    const { checkApproval = false } = props ?? {};
    if (checkApproval && signedDeploy.approvals.length == 0) {
      throw new Error('Required signed deploy');
    }
    return await this.client.request(
      {
        method: 'account_put_deploy',
        params: [DeployUtil.deployToJson(signedDeploy).deploy]
      },
      props?.timeout
    );
  }

  /**
   * Deploys a provided signed deploy
   * @param signedTransaction A signed `Transaction` object to be sent to a node
   * @param props optional request props
   * @remarks A deploy must not exceed 1 megabyte
   */
  public async transaction(
    signedTransaction: TransactionUtil.Transaction,
    props?: RpcRequestProps & {
      /**
       * Throws error for unsigned deploy if true
       * @default false
       */
      checkApproval?: boolean;
    }
  ): Promise<{ transaction_hash: TransactionResult }> {
    this.checkTransactionSize(signedTransaction);

    const { checkApproval = false } = props ?? {};
    if (checkApproval && !signedTransaction.hasApprovals()) {
      throw new Error('Required signed transaction');
    }
    const params = [
      TransactionUtil.transactionToJson(signedTransaction).transaction
    ];
    const request = {
      method: 'account_put_transaction',
      params: params
    };
    return await this.client.request(request, props?.timeout);
  }

  public async waitForTransaction(
    transaction: TransactionUtil.Transaction,
    timeout = 60000
  ) {
    const sleep = (ms: number) => {
      return new Promise(resolve => setTimeout(resolve, ms));
    };
    const timer = setTimeout(() => {
      throw new Error('Timeout');
    }, timeout);
    while (true) {
      const transactionHash = transaction.getTransactionHash();
      const transactionInfo = await this.getTransactionInfo(transactionHash);

      let successful = false;
      const execution_result = transactionInfo.execution_info?.execution_result;

      if (!execution_result) {
        successful = false;
      } else {
        if ('Version1' in execution_result) {
          //Technically Transaction should never have Version1 execution result
          successful = !!execution_result.Version1.Success;
        }
        if ('Version2' in execution_result) {
          successful = execution_result.Version2.error_message === null;
        }
      }

      if (successful) {
        clearTimeout(timer);
        return transactionInfo;
      } else {
        await sleep(400);
      }
    }
  }

  /**
   * Wait for deploy to be confirmed on-chain
   * @param deploy deploy instance or deploy hash
   * @param timeout optional parameter for timeout
   * @returns GetDepoyResult
   */
  public async waitForDeploy(
    deploy: DeployUtil.Deploy | string,
    timeout = 60000
  ): Promise<GetDeployResult> {
    const sleep = (ms: number) => {
      return new Promise(resolve => setTimeout(resolve, ms));
    };
    const timer = setTimeout(() => {
      throw new Error('Timeout');
    }, timeout);
    while (true) {
      const deployHash =
        typeof deploy === 'string' ? deploy : encodeBase16(deploy.hash);
      const deployInfo = await this.getDeployInfo(deployHash);

      let successful = false;
      const execution_result = deployInfo.execution_info?.execution_result;

      if (!execution_result) {
        successful = false;
      } else {
        if ('Version1' in execution_result) {
          successful = !!execution_result.Version1.Success;
        }
        if ('Version2' in execution_result) {
          successful = execution_result.Version2.error_message === null;
        }
      }

      if (successful) {
        clearTimeout(timer);
        return deployInfo;
      } else {
        await sleep(400);
      }
    }
  }

  /**
   * Estimate execution cost of the deploy without committing the execution result to the global state.
   * By default, `speculative_exec` JSON RPC method is **DISABLED** on a node.
   * Sending a request to a node with the endpoint disabled will result in an error message.
   * If enabled, `speculative_exec` operates on a separate port from the primary JSON-RPC, using 7778.
   * @added casper-node 1.5
   * @param signedDeploy signed deploy object
   * @param blockIdentifier block identifier
   * @param props optional request props
   * @returns deploy execution result
   */
  public async speculativeDeploy(
    signedDeploy: DeployUtil.Deploy,
    blockIdentifier?: BlockIdentifier,
    props?: RpcRequestProps
  ): Promise<SpeculativeExecutionResult> {
    this.checkDeploySize(signedDeploy);

    const deploy = DeployUtil.deployToJson(signedDeploy);

    return await this.client.request(
      {
        method: 'speculative_exec',
        params: blockIdentifier
          ? { ...deploy, block_identifier: blockIdentifier }
          : { ...deploy }
      },
      props?.timeout
    );
  }
  /**
   * Retrieves all transfers for a block from the network
   * @param blockHash Hexadecimal block hash. If not provided, the last block added to the chain, known as the given node, will be used
   * @param props optional request props
   * @returns A `Promise` resolving to a `Transfers` containing block transfers
   */
  public async getBlockTransfers(
    blockHash?: string,
    props?: RpcRequestProps
  ): Promise<Transfers> {
    return this.client.request(
      {
        method: 'chain_get_block_transfers',
        params: blockHash
          ? [
              {
                Hash: blockHash
              }
            ]
          : []
      },
      props?.timeout
    );
  }

  /**
   * Retrieve era information at the block hash of a [switch block](https://docs.casperlabs.io/economics/consensus/#entry)
   * @param blockHash Hexadecimal block hash. If not provided, the last block added to the chain, known as the given node, will be used
   * @param props optional request props
   * @returns A `Promise` resolving to an `EraSummary` containing the era information
   */
  public async getEraInfoBySwitchBlock(
    blockIdentifier: BlockIdentifier,
    props?: RpcRequestProps
  ): Promise<EraSummary | undefined> {
    const params = {
      block_identifier: blockIdentifier
    };

    const res = await this.client.request(
      {
        method: 'chain_get_era_info_by_switch_block',
        params
      },
      props?.timeout
    );
    if (res.error) {
      throw res;
    } else {
      const serializer = new TypedJSON(EraSummary);
      return serializer.parse(res.era_summary);
    }
  }

  /**
   * Retrieve era summary information by block hash (if provided) or most recently added block
   * @param blockHash Hexadecimal block hash. If not provided, the last block added to the chain, known as the given node, will be used
   * @returns A `Promise` resolving to an `EraSummary` containing the era information
   */
  public async getEraSummary(
    blockIdentifier?: BlockIdentifier,
    props?: RpcRequestProps
  ): Promise<EraSummary> {
    const params = [];
    if (blockIdentifier) {
      params.push(blockIdentifier);
    }

    return this.client.request(
      {
        method: 'chain_get_era_summary',
        params
      },
      props?.timeout
    );
  }

  /**
   * Get a dictionary item by its URef
   * @param stateRootHash The state root hash at which the item will be queried
   * @param dictionaryItemKey The key at which the item is stored
   * @param seedUref The seed URef of the dictionary
   * @param opts.rawData Returns rawData if true, otherwise return parsed data
   * @param props optional request props
   * @returns A `Promise` resolving to a `StoredValue` containing the item
   */
  public async getDictionaryItemByURef(
    stateRootHash: string,
    dictionaryItemKey: string,
    seedUref: string,
    props?: RpcRequestProps & { rawData?: boolean }
  ): Promise<StoredValue> {
    const rawData = props?.rawData ?? false;
    const res = await this.client.request(
      {
        method: 'state_get_dictionary_item',
        params: [
          stateRootHash,
          {
            URef: {
              seed_uref: seedUref,
              dictionary_item_key: dictionaryItemKey
            }
          }
        ]
      },
      props?.timeout
    );
    if (res.error) {
      return res;
    } else {
      const storedValueJson = res.stored_value;
      if (!rawData) {
        const serializer = new TypedJSON(StoredValue);
        return serializer.parse(storedValueJson)!;
      }
      return storedValueJson;
    }
  }

  /**
   * Get a dictionary item by its name from within a contract
   * @param stateRootHash The state root hash at which the item will be queried
   * @param contractHash The contract hash of the contract that stores the queried dictionary
   * @param dictionaryName The name of the dictionary
   * @param dictionaryItemKey The key at which the item is stored
   * @param opts.rawData Returns rawData if true, otherwise return parsed data
   * @param props optional request props
   * @returns A `Promise` resolving to a `StoredValue` containing the item
   */
  public async getDictionaryItemByName(
    stateRootHash: string,
    contractHash: string,
    dictionaryName: string,
    dictionaryItemKey: string,
    props?: RpcRequestProps & { rawData?: boolean }
  ): Promise<StoredValue> {
    const rawData = props?.rawData ?? false;
    const payload = {
      method: 'state_get_dictionary_item',
      params: [
        stateRootHash,
        {
          EntityNamedKey: {
            key: contractHash,
            dictionary_name: dictionaryName,
            dictionary_item_key: dictionaryItemKey
          }
        }
      ]
    };

    const res = await this.client.request(payload, props?.timeout);
    if (res.error) {
      return res;
    } else {
      const storedValueJson = res.stored_value;
      if (!rawData) {
        const serializer = new TypedJSON(StoredValue);
        return serializer.parse(storedValueJson)!;
      }
      return storedValueJson;
    }
  }

  /**
   * Returns raw bytes for chainspec files.
   * @added casper-node 1.5
   * @param props optional request props
   * @returns chainspec files content in bytes
   */
  public async getChainSpec(
    props?: RpcRequestProps
  ): Promise<GetChainSpecResult> {
    return await this.client.request(
      {
        method: 'info_get_chainspec'
      },
      props?.timeout
    );
  }

  /**
   * Queries global state by block or state root hash.
   * @param key key to query
   * @param stateIdentifier state identifier
   * @param path path to query
   * @param props optional request props
   * @returns
   */
  public async queryGlobalState(
    key: string,
    stateIdentifier: StateIdentifier | null = null,
    path: string[] = [],
    props?: RpcRequestProps
  ): Promise<QueryGlobalStateResult> {
    return this.client.request(
      {
        method: 'query_global_state',
        params: [stateIdentifier, key, path]
      },
      props?.timeout
    );
  }
}

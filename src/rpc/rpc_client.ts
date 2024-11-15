import { TypedJSON } from 'typedjson';

import { IClient, IHandler } from './client';
import {
  ChainGetBlockResult,
  ChainGetBlockResultV1Compatible,
  ChainGetBlockTransfersResult,
  ChainGetEraInfoResult,
  ChainGetEraSummaryResult,
  ChainGetStateRootHashResult,
  InfoGetChainspecResult,
  InfoGetDeployResult,
  InfoGetPeerResult,
  InfoGetRewardResult,
  InfoGetStatusResult,
  InfoGetTransactionResult,
  InfoGetTransactionResultV1Compatible,
  InfoGetValidatorChangesResult,
  PutDeployResult,
  PutTransactionResult,
  QueryBalanceDetailsResult,
  QueryBalanceResult,
  QueryGlobalStateResult,
  RpcResponse,
  StateGetAccountInfo,
  StateGetAuctionInfoResult,
  StateGetBalanceResult,
  StateGetDictionaryResult,
  StateGetEntityResult,
  StateGetItemResult
} from './response';
import {
  AccountIdentifier,
  BlockIdentifier,
  EntityIdentifier,
  EraIdentifier,
  GlobalStateIdentifier,
  InfoGetRewardRequest,
  Method,
  ParamBlockIdentifier,
  ParamDeployHash,
  ParamDictionaryIdentifier,
  ParamDictionaryIdentifierURef,
  ParamGetAccountInfoBalance,
  ParamGetStateEntity,
  ParamQueryGlobalState,
  ParamStateRootHash,
  ParamTransactionHash,
  PurseIdentifier,
  PutDeployRequest,
  PutTransactionRequest,
  QueryBalanceDetailsRequest,
  QueryBalanceRequest,
  RpcRequest,
  StateGetBalanceRequest,
  StateGetDictionaryRequest
} from './request';
import { IDValue } from './id_value';
import {
  TransactionHash,
  TransactionV1,
  TransactionWrapper,
  Deploy,
  PublicKey,
  Hash
} from '../types';

export class RpcClient implements IClient {
  private handler: IHandler;

  constructor(handler: IHandler) {
    this.handler = handler;
  }

  async getDeploy(hash: string): Promise<InfoGetDeployResult> {
    const serializer = new TypedJSON(ParamDeployHash);
    const paramDeployHash = new ParamDeployHash(hash);

    const resp = await this.processRequest(
      Method.GetDeploy,
      serializer.toPlainJson(paramDeployHash)
    );

    const result = this.parseResponse(InfoGetDeployResult, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async getDeployFinalizedApproval(hash: string): Promise<InfoGetDeployResult> {
    const serializer = new TypedJSON(ParamDeployHash);
    const paramDeployHash = new ParamDeployHash(hash, true);

    const resp = await this.processRequest(
      Method.GetDeploy,
      serializer.toPlainJson(paramDeployHash)
    );

    const result = this.parseResponse(InfoGetDeployResult, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async getTransactionByTransactionHash(
    transactionHash: string
  ): Promise<InfoGetTransactionResult> {
    const serializer = new TypedJSON(ParamTransactionHash);
    const hash = Hash.fromHex(transactionHash);
    const transactionHashParam = new ParamTransactionHash(
      new TransactionHash(undefined, hash)
    );

    const resp = await this.processRequest<ParamTransactionHash>(
      Method.GetTransaction,
      serializer.toPlainJson(transactionHashParam) as ParamTransactionHash
    );

    const result = this.parseResponse(
      InfoGetTransactionResultV1Compatible,
      resp.result
    );
    result.rawJSON = resp.result;

    const txResult = InfoGetTransactionResultV1Compatible.newInfoGetTransactionResultFromV1Compatible(
      result,
      result.rawJSON
    );
    txResult.rawJSON = resp.result;

    return txResult;
  }

  async getTransactionByDeployHash(
    deployHash: string
  ): Promise<InfoGetTransactionResult> {
    const serializer = new TypedJSON(ParamTransactionHash);
    const hash = Hash.fromHex(deployHash);
    const transactionHashParam = new ParamTransactionHash(
      new TransactionHash(hash)
    );

    const resp = await this.processRequest<ParamTransactionHash>(
      Method.GetTransaction,
      serializer.toPlainJson(transactionHashParam) as ParamTransactionHash
    );

    const result = this.parseResponse(
      InfoGetTransactionResultV1Compatible,
      resp.result
    );
    result.rawJSON = resp.result;

    const txResult = InfoGetTransactionResultV1Compatible.newInfoGetTransactionResultFromV1Compatible(
      result,
      result.rawJSON
    );
    txResult.rawJSON = resp.result;

    return txResult;
  }

  async getTransactionFinalizedApprovalByTransactionHash(
    transactionHash: string
  ): Promise<InfoGetTransactionResult> {
    const serializer = new TypedJSON(ParamTransactionHash);
    const hash = Hash.fromHex(transactionHash);
    const transactionHashParam = new ParamTransactionHash(
      new TransactionHash(undefined, hash),
      true
    );

    const resp = await this.processRequest<ParamTransactionHash>(
      Method.GetTransaction,
      serializer.toPlainJson(transactionHashParam) as ParamTransactionHash
    );

    const result = this.parseResponse(
      InfoGetTransactionResultV1Compatible,
      resp.result
    );
    result.rawJSON = resp.result;

    const txResult = InfoGetTransactionResultV1Compatible.newInfoGetTransactionResultFromV1Compatible(
      result,
      result.rawJSON
    );
    txResult.rawJSON = resp.result;

    return txResult;
  }

  async getTransactionFinalizedApprovalByDeployHash(
    deployHash: string
  ): Promise<InfoGetTransactionResult> {
    const serializer = new TypedJSON(ParamTransactionHash);
    const hash = Hash.fromHex(deployHash);
    const transactionHashParam = new ParamTransactionHash(
      new TransactionHash(hash),
      true
    );

    const resp = await this.processRequest<ParamTransactionHash>(
      Method.GetTransaction,
      serializer.toPlainJson(transactionHashParam) as ParamTransactionHash
    );

    const result = this.parseResponse(
      InfoGetTransactionResultV1Compatible,
      resp.result
    );
    result.rawJSON = resp.result;

    const txResult = InfoGetTransactionResultV1Compatible.newInfoGetTransactionResultFromV1Compatible(
      result,
      result.rawJSON
    );
    txResult.rawJSON = resp.result;

    return txResult;
  }

  async getStateItem(
    stateRootHash: string | null,
    key: string,
    path: string[]
  ): Promise<StateGetItemResult> {
    let rootHash = stateRootHash;

    if (!rootHash) {
      const latestHashResult = await this.getStateRootHashLatest();
      rootHash = latestHashResult.stateRootHash.toHex();
    }

    const serializer = new TypedJSON(ParamStateRootHash);
    const stateRootHashParam = new ParamStateRootHash(rootHash, key, path);

    const resp = await this.processRequest<ParamStateRootHash>(
      Method.GetStateItem,
      serializer.toPlainJson(stateRootHashParam) as ParamStateRootHash
    );

    const result = this.parseResponse(StateGetItemResult, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async queryLatestGlobalState(
    key: string,
    path: string[]
  ): Promise<QueryGlobalStateResult> {
    const serializer = new TypedJSON(ParamQueryGlobalState);
    const queryGlobalStateParam = ParamQueryGlobalState.newQueryGlobalStateParam(
      key,
      path
    );

    const resp = await this.processRequest(
      Method.QueryGlobalState,
      serializer.toPlainJson(queryGlobalStateParam) as ParamQueryGlobalState
    );

    const result = this.parseResponse(QueryGlobalStateResult, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async queryGlobalStateByBlockHash(
    blockHash: string,
    key: string,
    path: string[]
  ): Promise<QueryGlobalStateResult> {
    const serializer = new TypedJSON(ParamQueryGlobalState);
    const queryGlobalStateParam = ParamQueryGlobalState.newQueryGlobalStateParam(
      key,
      path,
      { blockHash }
    );

    const resp = await this.processRequest(
      Method.QueryGlobalState,
      serializer.toPlainJson(queryGlobalStateParam) as ParamQueryGlobalState
    );

    const result = this.parseResponse(QueryGlobalStateResult, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async queryGlobalStateByBlockHeight(
    blockHeight: number,
    key: string,
    path: string[]
  ): Promise<QueryGlobalStateResult> {
    const serializer = new TypedJSON(ParamQueryGlobalState);
    const queryGlobalStateParam = ParamQueryGlobalState.newQueryGlobalStateParam(
      key,
      path,
      { blockHeight }
    );

    const resp = await this.processRequest(
      Method.QueryGlobalState,
      serializer.toPlainJson(queryGlobalStateParam) as ParamQueryGlobalState
    );

    const result = this.parseResponse(QueryGlobalStateResult, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async queryGlobalStateByStateHash(
    stateRootHash: string | null,
    key: string,
    path: string[]
  ): Promise<QueryGlobalStateResult> {
    const serializer = new TypedJSON(ParamQueryGlobalState);
    let resp: RpcResponse;

    if (!stateRootHash) {
      const queryGlobalStateParamWithoutRootHash = ParamQueryGlobalState.newQueryGlobalStateParam(
        key,
        path
      );
      resp = await this.processRequest(
        Method.QueryGlobalState,
        serializer.toPlainJson(
          queryGlobalStateParamWithoutRootHash
        ) as ParamQueryGlobalState
      );
    } else {
      const queryGlobalState = ParamQueryGlobalState.newQueryGlobalStateParam(
        key,
        path,
        {
          stateRootHash
        }
      );
      resp = await this.processRequest(
        Method.QueryGlobalState,
        serializer.toPlainJson(queryGlobalState) as ParamQueryGlobalState
      );
    }

    const result = this.parseResponse(QueryGlobalStateResult, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async getLatestEntity(
    entityIdentifier: EntityIdentifier
  ): Promise<StateGetEntityResult> {
    const serializer = new TypedJSON(ParamGetStateEntity);
    const getStateEntityParam = new ParamGetStateEntity(entityIdentifier);

    const resp = await this.processRequest<ParamGetStateEntity>(
      Method.GetStateEntity,
      serializer.toPlainJson(getStateEntityParam) as ParamGetStateEntity
    );

    const result = this.parseResponse(StateGetEntityResult, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async getEntityByBlockHash(
    entityIdentifier: EntityIdentifier,
    hash: string
  ): Promise<StateGetEntityResult> {
    const serializer = new TypedJSON(ParamGetStateEntity);
    const getStateEntityParam = new ParamGetStateEntity(
      entityIdentifier,
      new BlockIdentifier(hash)
    );

    const resp = await this.processRequest<ParamGetStateEntity>(
      Method.GetStateEntity,
      serializer.toPlainJson(getStateEntityParam) as ParamGetStateEntity
    );

    const result = this.parseResponse(StateGetEntityResult, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async getEntityByBlockHeight(
    entityIdentifier: EntityIdentifier,
    height: number
  ): Promise<StateGetEntityResult> {
    const serializer = new TypedJSON(ParamGetStateEntity);
    const getStateEntityParam = new ParamGetStateEntity(
      entityIdentifier,
      new BlockIdentifier(undefined, height)
    );

    const resp = await this.processRequest<ParamGetStateEntity>(
      Method.GetStateEntity,
      serializer.toPlainJson(getStateEntityParam) as ParamGetStateEntity
    );

    const result = this.parseResponse(StateGetEntityResult, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async getAccountInfoByBlockHash(
    blockHash: string,
    pub: PublicKey
  ): Promise<StateGetAccountInfo> {
    const serializer = new TypedJSON(ParamGetAccountInfoBalance);
    const accountInfoBalance = new ParamGetAccountInfoBalance(
      pub.toHex(),
      ParamBlockIdentifier.byHash(blockHash)
    );

    const resp = await this.processRequest<ParamGetAccountInfoBalance>(
      Method.GetStateAccount,
      serializer.toPlainJson(accountInfoBalance) as ParamGetAccountInfoBalance
    );

    const result = this.parseResponse(StateGetAccountInfo, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async getAccountInfoByBlockHeight(
    blockHeight: number,
    pub: PublicKey
  ): Promise<StateGetAccountInfo> {
    const serializer = new TypedJSON(ParamGetAccountInfoBalance);
    const accountInfoBalance = new ParamGetAccountInfoBalance(
      pub.toHex(),
      ParamBlockIdentifier.byHeight(blockHeight)
    );

    const resp = await this.processRequest<ParamGetAccountInfoBalance>(
      Method.GetStateAccount,
      serializer.toPlainJson(accountInfoBalance) as ParamGetAccountInfoBalance
    );

    const result = this.parseResponse(StateGetAccountInfo, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async getAccountInfo(
    blockIdentifier: ParamBlockIdentifier | null,
    accountIdentifier: AccountIdentifier
  ): Promise<StateGetAccountInfo> {
    const serializer = new TypedJSON(ParamGetAccountInfoBalance);
    let identifier = blockIdentifier;

    if (!identifier) {
      identifier = new ParamBlockIdentifier();
    }

    let accountParam: string;

    if (accountIdentifier.accountHash) {
      accountParam = accountIdentifier.accountHash.toPrefixedString();
    } else if (accountIdentifier.publicKey) {
      accountParam = accountIdentifier.publicKey.toHex();
    } else {
      throw new Error('account identifier is empty');
    }

    const accountInfoBalance = new ParamGetAccountInfoBalance(
      accountParam,
      identifier
    );

    const resp = await this.processRequest<ParamGetAccountInfoBalance>(
      Method.GetStateAccount,
      serializer.toPlainJson(accountInfoBalance) as ParamGetAccountInfoBalance
    );

    const result = this.parseResponse(StateGetAccountInfo, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async getDictionaryItem(
    stateRootHash: string | null,
    uref: string,
    key: string
  ): Promise<StateGetDictionaryResult> {
    return this.getDictionaryItemByIdentifier(
      stateRootHash,
      new ParamDictionaryIdentifier(
        undefined,
        undefined,
        new ParamDictionaryIdentifierURef(key, uref)
      )
    );
  }

  async getDictionaryItemByIdentifier(
    stateRootHash: string | null,
    identifier: ParamDictionaryIdentifier
  ): Promise<StateGetDictionaryResult> {
    const serializer = new TypedJSON(StateGetDictionaryRequest);
    let rootHash = stateRootHash;

    if (!rootHash) {
      const latestHashResult = await this.getStateRootHashLatest();

      rootHash = latestHashResult.stateRootHash.toHex();
    }

    const stateDictionaryParam = new StateGetDictionaryRequest(
      rootHash,
      identifier
    );
    const resp = await this.processRequest<StateGetDictionaryRequest>(
      Method.GetDictionaryItem,
      serializer.toPlainJson(stateDictionaryParam) as StateGetDictionaryRequest
    );

    const result = this.parseResponse(StateGetDictionaryResult, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async getLatestBalance(purseURef: string): Promise<StateGetBalanceResult> {
    const serializer = new TypedJSON(StateGetBalanceRequest);
    const latestHashResult = await this.getStateRootHashLatest();
    const stateBalance = new StateGetBalanceRequest(
      latestHashResult.stateRootHash.toHex(),
      purseURef
    );

    const resp = await this.processRequest<StateGetBalanceRequest>(
      Method.GetStateBalance,
      serializer.toPlainJson(stateBalance) as StateGetBalanceRequest
    );

    const result = this.parseResponse(StateGetBalanceResult, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async getBalanceByStateRootHash(
    purseURef: string,
    stateRootHash: string
  ): Promise<StateGetBalanceResult> {
    const serializer = new TypedJSON(StateGetBalanceRequest);
    const stateBalance = new StateGetBalanceRequest(stateRootHash, purseURef);

    const resp = await this.processRequest<StateGetBalanceRequest>(
      Method.GetStateBalance,
      serializer.toPlainJson(stateBalance) as StateGetBalanceRequest
    );

    const result = this.parseResponse(StateGetBalanceResult, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async getEraInfoLatest(): Promise<ChainGetEraInfoResult> {
    const resp = await this.processRequest(Method.GetEraInfo, null);

    const result = this.parseResponse(ChainGetEraInfoResult, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async getEraInfoByBlockHeight(
    height: number
  ): Promise<ChainGetEraInfoResult> {
    const serializer = new TypedJSON(ParamBlockIdentifier);
    const blockIdentifierParam = ParamBlockIdentifier.byHeight(height);

    const resp = await this.processRequest(
      Method.GetEraInfo,
      serializer.toPlainJson(blockIdentifierParam) as ParamBlockIdentifier
    );

    const result = this.parseResponse(ChainGetEraInfoResult, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async getEraInfoByBlockHash(hash: string): Promise<ChainGetEraInfoResult> {
    const serializer = new TypedJSON(ParamBlockIdentifier);
    const blockIdentifierParam = ParamBlockIdentifier.byHash(hash);

    const resp = await this.processRequest(
      Method.GetEraInfo,
      serializer.toPlainJson(blockIdentifierParam) as ParamBlockIdentifier
    );

    const result = this.parseResponse(ChainGetEraInfoResult, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async getLatestBlock(): Promise<ChainGetBlockResult> {
    const resp = await this.processRequest(Method.GetBlock, null);

    const result = this.parseResponse(
      ChainGetBlockResultV1Compatible,
      resp.result
    );
    result.rawJSON = resp.result;

    const blockResult = ChainGetBlockResult.newChainGetBlockResultFromV1Compatible(
      result,
      result.rawJSON
    );
    blockResult.rawJSON = result.rawJSON;

    return blockResult;
  }

  async getBlockByHash(hash: string): Promise<ChainGetBlockResult> {
    const serializer = new TypedJSON(ParamBlockIdentifier);
    const blockIdentifierParam = ParamBlockIdentifier.byHash(hash);

    const resp = await this.processRequest(
      Method.GetBlock,
      serializer.toPlainJson(blockIdentifierParam) as ParamBlockIdentifier
    );

    const result = this.parseResponse(
      ChainGetBlockResultV1Compatible,
      resp.result
    );
    result.rawJSON = resp.result;

    const blockResult = ChainGetBlockResult.newChainGetBlockResultFromV1Compatible(
      result,
      result.rawJSON
    );
    blockResult.rawJSON = resp.result;

    return blockResult;
  }

  async getBlockByHeight(height: number): Promise<ChainGetBlockResult> {
    const serializer = new TypedJSON(ParamBlockIdentifier);
    const blockIdentifierParam = ParamBlockIdentifier.byHeight(height);

    const resp = await this.processRequest(
      Method.GetBlock,
      serializer.toPlainJson(blockIdentifierParam) as ParamBlockIdentifier
    );

    const result = this.parseResponse(
      ChainGetBlockResultV1Compatible,
      resp.result
    );
    result.rawJSON = resp.result;

    const blockResult = ChainGetBlockResult.newChainGetBlockResultFromV1Compatible(
      result,
      result.rawJSON
    );
    blockResult.rawJSON = resp.result;

    return blockResult;
  }

  async getLatestBlockTransfers(): Promise<ChainGetBlockTransfersResult> {
    const resp = await this.processRequest(Method.GetBlockTransfers, null);

    const result = this.parseResponse(
      ChainGetBlockTransfersResult,
      resp.result
    );
    result.rawJSON = resp.result;

    return result;
  }

  async getBlockTransfersByHash(
    blockHash: string
  ): Promise<ChainGetBlockTransfersResult> {
    const serializer = new TypedJSON(ParamBlockIdentifier);
    const blockIdentifierParam = ParamBlockIdentifier.byHash(blockHash);

    const resp = await this.processRequest(
      Method.GetBlockTransfers,
      serializer.toPlainJson(blockIdentifierParam) as ParamBlockIdentifier
    );

    const result = this.parseResponse(
      ChainGetBlockTransfersResult,
      resp.result
    );
    result.rawJSON = resp.result;

    return result;
  }

  async getBlockTransfersByHeight(
    height: number
  ): Promise<ChainGetBlockTransfersResult> {
    const serializer = new TypedJSON(ParamBlockIdentifier);
    const blockIdentifierParam = ParamBlockIdentifier.byHeight(height);

    const resp = await this.processRequest(
      Method.GetBlockTransfers,
      serializer.toPlainJson(blockIdentifierParam) as ParamBlockIdentifier
    );

    const result = this.parseResponse(
      ChainGetBlockTransfersResult,
      resp.result
    );
    result.rawJSON = resp.result;

    return result;
  }

  async getEraSummaryLatest(): Promise<ChainGetEraSummaryResult> {
    const resp = await this.processRequest(Method.GetEraSummary, null);

    const result = this.parseResponse(ChainGetEraSummaryResult, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async getEraSummaryByHash(
    blockHash: string
  ): Promise<ChainGetEraSummaryResult> {
    const serializer = new TypedJSON(ParamBlockIdentifier);
    const blockIdentifierParam = ParamBlockIdentifier.byHash(blockHash);

    const resp = await this.processRequest(
      Method.GetEraSummary,
      serializer.toPlainJson(blockIdentifierParam) as ParamBlockIdentifier
    );

    const result = this.parseResponse(ChainGetEraSummaryResult, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async getEraSummaryByHeight(
    height: number
  ): Promise<ChainGetEraSummaryResult> {
    const serializer = new TypedJSON(ParamBlockIdentifier);
    const blockIdentifierParam = ParamBlockIdentifier.byHeight(height);

    const resp = await this.processRequest(
      Method.GetEraSummary,
      serializer.toPlainJson(blockIdentifierParam) as ParamBlockIdentifier
    );

    const result = this.parseResponse(ChainGetEraSummaryResult, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async getLatestAuctionInfo(): Promise<StateGetAuctionInfoResult> {
    const resp = await this.processRequest(Method.GetAuctionInfo, null);

    const result = this.parseResponse(StateGetAuctionInfoResult, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async getAuctionInfoByHash(
    blockHash: string
  ): Promise<StateGetAuctionInfoResult> {
    const serializer = new TypedJSON(ParamBlockIdentifier);
    const blockIdentifierParam = ParamBlockIdentifier.byHash(blockHash);

    const resp = await this.processRequest(
      Method.GetAuctionInfo,
      serializer.toPlainJson(blockIdentifierParam) as ParamBlockIdentifier
    );

    const result = this.parseResponse(StateGetAuctionInfoResult, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async getAuctionInfoByHeight(
    height: number
  ): Promise<StateGetAuctionInfoResult> {
    const serializer = new TypedJSON(ParamBlockIdentifier);
    const blockIdentifierParam = ParamBlockIdentifier.byHeight(height);

    const resp = await this.processRequest(
      Method.GetAuctionInfo,
      serializer.toPlainJson(blockIdentifierParam) as ParamBlockIdentifier
    );

    const result = this.parseResponse(StateGetAuctionInfoResult, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async getStateRootHashLatest(): Promise<ChainGetStateRootHashResult> {
    const resp = await this.processRequest(Method.GetStateRootHash, null);

    const result = this.parseResponse(ChainGetStateRootHashResult, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async getStateRootHashByHash(
    blockHash: string
  ): Promise<ChainGetStateRootHashResult> {
    const serializer = new TypedJSON(ParamBlockIdentifier);
    const blockIdentifierParam = ParamBlockIdentifier.byHash(blockHash);

    const resp = await this.processRequest(
      Method.GetStateRootHash,
      serializer.toPlainJson(blockIdentifierParam) as ParamBlockIdentifier
    );

    const result = this.parseResponse(ChainGetStateRootHashResult, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async getStateRootHashByHeight(
    height: number
  ): Promise<ChainGetStateRootHashResult> {
    const serializer = new TypedJSON(ParamBlockIdentifier);
    const blockIdentifierParam = ParamBlockIdentifier.byHeight(height);

    const resp = await this.processRequest(
      Method.GetStateRootHash,
      serializer.toPlainJson(blockIdentifierParam) as ParamBlockIdentifier
    );

    const result = this.parseResponse(ChainGetStateRootHashResult, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async getValidatorChangesInfo(): Promise<InfoGetValidatorChangesResult> {
    const resp = await this.processRequest(Method.GetValidatorChanges, null);

    const result = this.parseResponse(
      InfoGetValidatorChangesResult,
      resp.result
    );
    result.rawJSON = resp.result;

    return result;
  }

  async getStatus(): Promise<InfoGetStatusResult> {
    const resp = await this.processRequest(Method.GetStatus, null);

    const result = this.parseResponse(InfoGetStatusResult, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async getPeers(): Promise<InfoGetPeerResult> {
    const resp = await this.processRequest(Method.GetPeers, null);

    const result = this.parseResponse(InfoGetPeerResult, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async putDeploy(deploy: Deploy): Promise<PutDeployResult> {
    const serializer = new TypedJSON(PutDeployRequest);
    const deployRequestParam = new PutDeployRequest(deploy);

    const resp = await this.processRequest<PutDeployRequest>(
      Method.PutDeploy,
      serializer.toPlainJson(deployRequestParam) as PutDeployRequest
    );

    const result = this.parseResponse(PutDeployResult, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async putTransactionV1(
    transaction: TransactionV1
  ): Promise<PutTransactionResult> {
    const serializer = new TypedJSON(PutTransactionRequest);
    const transactionRequestParam = new PutTransactionRequest(
      new TransactionWrapper(undefined, transaction)
    );

    const resp = await this.processRequest<PutTransactionRequest>(
      Method.PutTransaction,
      serializer.toPlainJson(transactionRequestParam) as PutTransactionRequest
    );

    const result = this.parseResponse(PutTransactionResult, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async queryLatestBalance(
    identifier: PurseIdentifier
  ): Promise<QueryBalanceResult> {
    const serializer = new TypedJSON(QueryBalanceRequest);
    const queryBalanceParam = new QueryBalanceRequest(identifier);

    const resp = await this.processRequest<QueryBalanceRequest>(
      Method.QueryBalance,
      serializer.toPlainJson(queryBalanceParam) as QueryBalanceRequest
    );

    const result = this.parseResponse(QueryBalanceResult, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async queryBalanceByBlockHeight(
    purseIdentifier: PurseIdentifier,
    height: number
  ): Promise<QueryBalanceResult> {
    const serializer = new TypedJSON(QueryBalanceRequest);
    const queryBalanceParam = new QueryBalanceRequest(
      purseIdentifier,
      new GlobalStateIdentifier(undefined, height)
    );

    const resp = await this.processRequest<QueryBalanceRequest>(
      Method.QueryBalance,
      serializer.toPlainJson(queryBalanceParam) as QueryBalanceRequest
    );

    const result = this.parseResponse(QueryBalanceResult, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async queryBalanceByBlockHash(
    purseIdentifier: PurseIdentifier,
    blockHash: string
  ): Promise<QueryBalanceResult> {
    const serializer = new TypedJSON(QueryBalanceRequest);
    const queryBalanceParam = new QueryBalanceRequest(
      purseIdentifier,
      new GlobalStateIdentifier(blockHash)
    );

    const resp = await this.processRequest<QueryBalanceRequest>(
      Method.QueryBalance,
      serializer.toPlainJson(queryBalanceParam) as QueryBalanceRequest
    );

    const result = this.parseResponse(QueryBalanceResult, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async queryBalanceByStateRootHash(
    purseIdentifier: PurseIdentifier,
    stateRootHash: string
  ): Promise<QueryBalanceResult> {
    const serializer = new TypedJSON(QueryBalanceRequest);
    const queryBalanceParam = new QueryBalanceRequest(
      purseIdentifier,
      new GlobalStateIdentifier(undefined, undefined, stateRootHash)
    );

    const resp = await this.processRequest<QueryBalanceRequest>(
      Method.QueryBalance,
      serializer.toPlainJson(queryBalanceParam) as QueryBalanceRequest
    );

    const result = this.parseResponse(QueryBalanceResult, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async queryLatestBalanceDetails(
    purseIdentifier: PurseIdentifier
  ): Promise<QueryBalanceDetailsResult> {
    const serializer = new TypedJSON(QueryBalanceDetailsRequest);
    const queryBalanceParam = new QueryBalanceDetailsRequest(purseIdentifier);

    const resp = await this.processRequest<QueryBalanceDetailsRequest>(
      Method.QueryBalanceDetails,
      serializer.toPlainJson(queryBalanceParam) as QueryBalanceDetailsRequest
    );

    const result = this.parseResponse(QueryBalanceDetailsResult, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async queryBalanceDetailsByStateRootHash(
    purseIdentifier: PurseIdentifier,
    stateRootHash: string
  ): Promise<QueryBalanceDetailsResult> {
    const serializer = new TypedJSON(QueryBalanceDetailsRequest);
    const queryBalanceParam = new QueryBalanceDetailsRequest(
      purseIdentifier,
      new GlobalStateIdentifier(undefined, undefined, stateRootHash)
    );

    const resp = await this.processRequest<QueryBalanceDetailsRequest>(
      Method.QueryBalanceDetails,
      serializer.toPlainJson(queryBalanceParam) as QueryBalanceDetailsRequest
    );

    const result = this.parseResponse(QueryBalanceDetailsResult, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async queryBalanceDetailsByBlockHeight(
    purseIdentifier: PurseIdentifier,
    height: number
  ): Promise<QueryBalanceDetailsResult> {
    const serializer = new TypedJSON(QueryBalanceDetailsRequest);
    const queryBalanceParam = new QueryBalanceDetailsRequest(
      purseIdentifier,
      new GlobalStateIdentifier(undefined, height)
    );

    const resp = await this.processRequest<QueryBalanceDetailsRequest>(
      Method.QueryBalanceDetails,
      serializer.toPlainJson(queryBalanceParam) as QueryBalanceDetailsRequest
    );

    const result = this.parseResponse(QueryBalanceDetailsResult, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async queryBalanceDetailsByBlockHash(
    purseIdentifier: PurseIdentifier,
    blockHash: string
  ): Promise<QueryBalanceDetailsResult> {
    const serializer = new TypedJSON(QueryBalanceDetailsRequest);
    const queryBalanceParam = new QueryBalanceDetailsRequest(
      purseIdentifier,
      new GlobalStateIdentifier(blockHash)
    );

    const resp = await this.processRequest<QueryBalanceDetailsRequest>(
      Method.QueryBalanceDetails,
      serializer.toPlainJson(queryBalanceParam) as QueryBalanceDetailsRequest
    );

    const result = this.parseResponse(QueryBalanceDetailsResult, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async getChainspec(): Promise<InfoGetChainspecResult> {
    const resp = await this.processRequest(Method.InfoGetChainspec, null);

    const result = this.parseResponse(InfoGetChainspecResult, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async getValidatorRewardByEraID(
    validator: PublicKey,
    eraID: number
  ): Promise<InfoGetRewardResult> {
    const serializer = new TypedJSON(InfoGetRewardRequest);
    const rewardParam = new InfoGetRewardRequest(
      validator,
      undefined,
      new EraIdentifier(undefined, eraID)
    );

    const resp = await this.processRequest<InfoGetRewardRequest>(
      Method.GetReward,
      serializer.toPlainJson(rewardParam) as InfoGetRewardRequest
    );

    const result = this.parseResponse(InfoGetRewardResult, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async getValidatorRewardByBlockHash(
    validator: PublicKey,
    blockHash: string
  ): Promise<InfoGetRewardResult> {
    const serializer = new TypedJSON(InfoGetRewardRequest);
    const rewardParam = new InfoGetRewardRequest(
      validator,
      undefined,
      new EraIdentifier(new BlockIdentifier(blockHash))
    );

    const resp = await this.processRequest<InfoGetRewardRequest>(
      Method.GetReward,
      serializer.toPlainJson(rewardParam) as InfoGetRewardRequest
    );

    const result = this.parseResponse(InfoGetRewardResult, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async getValidatorRewardByBlockHeight(
    validator: PublicKey,
    height: number
  ): Promise<InfoGetRewardResult> {
    const serializer = new TypedJSON(InfoGetRewardRequest);
    const rewardParam = new InfoGetRewardRequest(
      validator,
      undefined,
      new EraIdentifier(new BlockIdentifier(undefined, height))
    );

    const resp = await this.processRequest<InfoGetRewardRequest>(
      Method.GetReward,
      serializer.toPlainJson(rewardParam) as InfoGetRewardRequest
    );

    const result = this.parseResponse(InfoGetRewardResult, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async getDelegatorRewardByEraID(
    validator: PublicKey,
    delegator: PublicKey,
    eraID: number
  ): Promise<InfoGetRewardResult> {
    const serializer = new TypedJSON(InfoGetRewardRequest);
    const rewardParam = new InfoGetRewardRequest(
      validator,
      delegator,
      new EraIdentifier(undefined, eraID)
    );

    const resp = await this.processRequest<InfoGetRewardRequest>(
      Method.GetReward,
      serializer.toPlainJson(rewardParam) as InfoGetRewardRequest
    );

    const result = this.parseResponse(InfoGetRewardResult, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async getDelegatorRewardByBlockHash(
    validator: PublicKey,
    delegator: PublicKey,
    blockHash: string
  ): Promise<InfoGetRewardResult> {
    const serializer = new TypedJSON(InfoGetRewardRequest);
    const rewardParam = new InfoGetRewardRequest(
      validator,
      delegator,
      new EraIdentifier(new BlockIdentifier(blockHash))
    );

    const resp = await this.processRequest<InfoGetRewardRequest>(
      Method.GetReward,
      serializer.toPlainJson(rewardParam) as InfoGetRewardRequest
    );

    const result = this.parseResponse(InfoGetRewardResult, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async getDelegatorRewardByBlockHeight(
    validator: PublicKey,
    delegator: PublicKey,
    height: number
  ): Promise<InfoGetRewardResult> {
    const serializer = new TypedJSON(InfoGetRewardRequest);
    const rewardParam = new InfoGetRewardRequest(
      validator,
      delegator,
      new EraIdentifier(new BlockIdentifier(undefined, height))
    );

    const resp = await this.processRequest<InfoGetRewardRequest>(
      Method.GetReward,
      serializer.toPlainJson(rewardParam) as InfoGetRewardRequest
    );

    const result = this.parseResponse(InfoGetRewardResult, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async getLatestValidatorReward(
    validator: PublicKey
  ): Promise<InfoGetRewardResult> {
    const serializer = new TypedJSON(InfoGetRewardRequest);
    const rewardParam = new InfoGetRewardRequest(validator);

    const resp = await this.processRequest(
      Method.GetReward,
      serializer.toPlainJson(rewardParam) as InfoGetRewardRequest
    );

    const result = this.parseResponse(InfoGetRewardResult, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  async getLatestDelegatorReward(
    validator: PublicKey,
    delegator: PublicKey
  ): Promise<InfoGetRewardResult> {
    const serializer = new TypedJSON(InfoGetRewardRequest);
    const rewardParam = new InfoGetRewardRequest(validator, delegator);

    const resp = await this.processRequest<InfoGetRewardRequest>(
      Method.GetReward,
      serializer.toPlainJson(rewardParam) as InfoGetRewardRequest
    );

    const result = this.parseResponse(InfoGetRewardResult, resp.result);
    result.rawJSON = resp.result;

    return result;
  }

  private parseResponse<T>(type: new (params: any) => T, response: any): T {
    const serializer = new TypedJSON(type);
    const parsed = serializer.parse(response);

    if (!parsed) throw new Error(`Error parsing ${type.name} response data`);

    return parsed as T;
  }

  private async processRequest<Request>(
    method: Method,
    params: Request,
    reqID = '0'
  ): Promise<RpcResponse> {
    const request = RpcRequest.defaultRpcRequest(method, params);

    if (reqID !== '0') {
      request.id = IDValue.fromString(reqID);
    }

    const resp = await this.handler.processCall(request);

    if (resp.error) {
      throw new Error(`RPC call failed, details: ${resp.error.message}`);
    }

    try {
      return resp;
    } catch (err) {
      throw new Error(`Error parsing result: ${err.message}`);
    }
  }
}

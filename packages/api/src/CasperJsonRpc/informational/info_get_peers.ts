import { Expose, Type } from 'class-transformer';

import {
  BaseJsonRpc,
  IRpcResult,
  JsonRpcOptions,
  RpcResult,
  ReturnType
} from '../../BaseJsonRpc';
import { DTO, ICamelToSnakeCase } from '../../utils';
import { JsonRpcResponse } from '../../ProviderTransport';

export class GetPeersResult extends RpcResult {
  @Type(() => Peer)
  peers: Peer[];
}

export class Peer {
  @Expose({ name: 'node_id' })
  nodeId: string;
  address: string;
}

export type IPeer = ICamelToSnakeCase<DTO<Peer>>;
export interface IGetPeersResult extends IRpcResult {
  peers: IPeer[];
}

export type GetPeersParams = string[];

export type InfoGetPeersReturnTypeMap = {
  [ReturnType.Raw]: IGetPeersResult;
  [ReturnType.Parsed]: GetPeersResult;
};

/**
 * Returns a list of peers connected to the node
 * @param baseJsonRPC
 * @param options
 * @returns
 */
export async function infoGetPeers<T extends keyof InfoGetPeersReturnTypeMap>(
  baseJsonRPC: BaseJsonRpc,
  returnType: T,
  params: GetPeersParams = [],
  options?: JsonRpcOptions
): Promise<JsonRpcResponse<InfoGetPeersReturnTypeMap[T]>> {
  return baseJsonRPC.requests<GetPeersParams>(
    GetPeersResult,
    returnType,
    {
      method: 'info_get_peers',
      params
    },
    options
  );
}

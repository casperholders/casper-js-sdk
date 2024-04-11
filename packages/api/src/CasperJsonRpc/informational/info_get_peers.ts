import { Expose, Type } from 'class-transformer';

import {
  BaseJsonRpc,
  IRpcResult,
  RpcRequestOptions,
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

export async function infoGetPeers(
  baseJsonRPC: BaseJsonRpc,
  returnType: ReturnType.Raw,
  params?: GetPeersParams,
  options?: RpcRequestOptions
): Promise<JsonRpcResponse<IGetPeersResult>>;

export async function infoGetPeers(
  baseJsonRPC: BaseJsonRpc,
  returnType?: ReturnType.Parsed,
  params?: GetPeersParams,
  options?: RpcRequestOptions
): Promise<JsonRpcResponse<GetPeersResult>>;

/**
 * Returns a list of peers connected to the node
 * @param baseJsonRPC
 * @param options
 * @returns
 */
export async function infoGetPeers(
  baseJsonRPC: BaseJsonRpc,
  returnType: ReturnType = ReturnType.Parsed,
  params: GetPeersParams = [],
  options?: RpcRequestOptions
) {
  // @ts-ignore
  return baseJsonRPC.requests<GetPeersParams, unknown>(
    GetPeersResult,
    returnType,
    {
      method: 'info_get_peers',
      params
    },
    options
  );
}

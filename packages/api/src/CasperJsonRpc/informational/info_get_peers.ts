import { Expose, Type } from 'class-transformer';
import { IsString, ValidateNested } from 'class-validator';

import {
  BaseJsonRpc,
  IRpcResult,
  JsonRpcOptions,
  RpcResult,
  ReturnType
} from '../../BaseJsonRpc';
import { DTO, ICamelToSnakeCase } from '../../utils';

export class Peer {
  @Expose({ name: 'node_id' })
  @IsString()
  nodeId: string;

  @IsString()
  address: string;
}

export type IPeer = ICamelToSnakeCase<DTO<Peer>>;

export class GetPeersResult extends RpcResult {
  @Type(() => Peer)
  @ValidateNested({ each: true })
  peers: Peer[];
}

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
  baseJsonRPC: BaseJsonRpc<T>,
  params: GetPeersParams = [],
  options?: JsonRpcOptions<T>
): Promise<InfoGetPeersReturnTypeMap[T]> {
  return baseJsonRPC.requests<GetPeersParams>(
    GetPeersResult,
    {
      method: 'info_get_peers',
      params
    },
    options
  );
}

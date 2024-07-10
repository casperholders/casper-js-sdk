import { BaseJsonRpc, JsonRpcOptions, ReturnType } from '../BaseJsonRpc';
import { SafeEventEmitterProvider } from '../ProviderTransport';
import {
  GetPeersParams,
  InfoGetPeersReturnTypeMap,
  infoGetPeers
} from './informational';

export class CasperJsonRpc<
  T extends ReturnType = ReturnType.Parsed
> extends BaseJsonRpc<T> {
  constructor(
    provider: string | SafeEventEmitterProvider,
    options?: JsonRpcOptions<T>
  ) {
    super(provider, options);
  }

  async infoGetPeers(
    params: GetPeersParams = [],
    options?: JsonRpcOptions<T>
  ): Promise<InfoGetPeersReturnTypeMap[T]> {
    return infoGetPeers(this, params, options);
  }
}

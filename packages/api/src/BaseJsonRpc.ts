import {
  RequestManager,
  HTTPTransport,
  Client,
  JSONRPCError
} from '@open-rpc/client-js';
import { ClassConstructor, Expose, plainToClass } from 'class-transformer';
import mergeOptions from 'merge-options';
import 'reflect-metadata';

import ProviderTransport, {
  JsonRpcResponse,
  RequestArguments,
  SafeEventEmitterProvider
} from './ProviderTransport';
import { DTO, ICamelToSnakeCase } from './utils';

export class JsonRpcError extends JSONRPCError {}

export interface RpcRequestOptions {
  timeout?: number;
}

export class RpcResult {
  @Expose({ name: 'api_version' })
  apiVersion: string;
}
export type IRpcResult = ICamelToSnakeCase<DTO<RpcResult>>;

export enum ReturnType {
  Raw = 'raw',
  Parsed = 'parsed'
}

export class BaseJsonRpc extends Client {
  options?: RpcRequestOptions;

  constructor(
    provider: string | SafeEventEmitterProvider,
    options?: RpcRequestOptions
  ) {
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

    super(requestManager);
    this.options = options;
  }

  private async _request<T extends readonly unknown[] | object, U = unknown>(
    requestObject: RequestArguments<T>,
    options?: RpcRequestOptions
  ): Promise<JsonRpcResponse<U>> {
    const mergedOptions: RpcRequestOptions = mergeOptions(
      this.options,
      options
    );

    // TODO: Handle options properly

    return this.request(requestObject, mergedOptions?.timeout);
  }

  async requests<T extends readonly unknown[] | object, U = any>(
    cls: undefined | ClassConstructor<U>,
    returnType: ReturnType = ReturnType.Parsed,
    requestObject: RequestArguments<T>,
    options?: RpcRequestOptions
  ): Promise<JsonRpcResponse<U>> {
    const response = await this._request<T, U>(requestObject, options);

    if (returnType === ReturnType.Raw || cls === undefined) return response;

    return {
      ...response,
      result: plainToClass(cls, response.result)
    };
  }
}

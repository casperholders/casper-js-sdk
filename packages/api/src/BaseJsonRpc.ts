import {
  RequestManager,
  HTTPTransport,
  Client,
  JSONRPCError
} from '@open-rpc/client-js';
import { ClassConstructor, Expose, plainToInstance } from 'class-transformer';
import { IsString, validateOrReject, ValidatorOptions } from 'class-validator';
import mergeOptions from 'merge-options';
import 'reflect-metadata';

import ProviderTransport, {
  JsonRpcResponse,
  RequestArguments,
  SafeEventEmitterProvider
} from './ProviderTransport';
import { DTO, ICamelToSnakeCase } from './utils';

export class JsonRpcError extends JSONRPCError {}

export interface JsonRpcOptions<T = ReturnType> {
  returnType?: T;
  timeout?: number;
  validateParsedData?: boolean;
  validatorOptions?: ValidatorOptions;
}

export class RpcResult {
  @Expose({ name: 'api_version' })
  @IsString()
  apiVersion: string;
}
export type IRpcResult = ICamelToSnakeCase<DTO<RpcResult>>;

export enum ReturnType {
  Raw = 'raw',
  Parsed = 'parsed'
}

export class BaseJsonRpc<
  T extends ReturnType = ReturnType.Parsed
> extends Client {
  options: JsonRpcOptions;

  constructor(
    provider: string | SafeEventEmitterProvider,
    options?: JsonRpcOptions<T>
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

    // TODO: Handle default option
    const defaultJsonRpcOptions: JsonRpcOptions = {
      returnType: ReturnType.Parsed,
      validateParsedData: false,
      validatorOptions: {
        whitelist: true,
        forbidNonWhitelisted: true
      }
    };

    this.options = mergeOptions(defaultJsonRpcOptions, options);
  }

  private async _request<R extends readonly unknown[] | object, U = unknown>(
    requestObject: RequestArguments<R>,
    options: JsonRpcOptions
  ): Promise<JsonRpcResponse<U>> {
    // TODO: Handle options properly

    return this.request(requestObject, options.timeout);
  }

  async requests<R extends readonly unknown[] | object, U = any>(
    cls: undefined | ClassConstructor<U>,
    requestObject: RequestArguments<R>,
    options?: JsonRpcOptions
  ): Promise<JsonRpcResponse<U>> {
    const mergedOptions: JsonRpcOptions = mergeOptions(this.options, options);
    const response = await this._request<R, U>(requestObject, mergedOptions);

    if (mergedOptions.returnType === ReturnType.Raw || cls === undefined)
      return response;

    const parsed = plainToInstance(cls, response.result);
    if (mergedOptions.validateParsedData) {
      await validateOrReject(parsed as object, mergedOptions.validatorOptions);
    }

    return {
      ...response,
      result: parsed
    };
  }
}

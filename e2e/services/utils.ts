import { CasperServiceByJsonRPC } from '../../src/services';
import { CLPublicKey } from '../../src/index';

export const getAccountInfo: any = async (
  nodeAddress: string,
  publicKey: CLPublicKey
) => {
  const client = new CasperServiceByJsonRPC(nodeAddress);
  return client.getAccountInfo(publicKey);
};

export const sleep = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

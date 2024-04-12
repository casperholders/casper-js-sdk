import { HTTPTransport } from '@open-rpc/client-js';
import { expect, should } from 'chai';
import sinon from 'sinon';

should();

import { BaseJsonRpc, ReturnType } from '../../BaseJsonRpc';
import { IGetPeersResult, infoGetPeers, Peer } from './info_get_peers';

describe('info_get_peers', () => {
  const baseJsonRPC = new BaseJsonRpc('http://localhost:7777/rpc');

  const mockedResponse: IGetPeersResult = {
    api_version: '2.0.0',
    peers: [
      {
        node_id: 'tls:0101..0101',
        address: '127.0.0.1:54321'
      }
    ]
  };

  before(() => {
    sinon.stub(HTTPTransport.prototype, 'sendData').callsFake(async () => ({
      id: 1,
      jsonrpc: '2.0',
      result: mockedResponse
    }));
  });

  it('should return a list of peers connected to the node - raw', async () => {
    // baseJsonRPC ReturnType is Parsed by default, so type case - <ReturnType.Raw> is required with modified options.
    const { result } = await infoGetPeers<ReturnType.Raw>(baseJsonRPC, [], {
      returnType: ReturnType.Raw
    });

    expect(result).to.deep.equal(mockedResponse);
  });

  it('should return a list of peers connected to the node - parsed', async () => {
    const { result } = await infoGetPeers(baseJsonRPC, []);
    expect(result.apiVersion).to.eq(mockedResponse.api_version);
    expect(result.peers.length).to.eq(1);
    result.peers[0].should.be.instanceof(Peer);
  });
});

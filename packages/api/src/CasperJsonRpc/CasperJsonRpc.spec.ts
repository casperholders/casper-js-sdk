import { ReturnType } from '../BaseJsonRpc';
import { CasperJsonRpc } from './CasperJsonRpc';
import { Peer } from './informational';

// TODO: Run this test after running the node CI/CD pipeline
describe('CasperJsonRpc', () => {
  const casperJsonRpc = new CasperJsonRpc<ReturnType.Parsed>(
    'http://localhost:7777/rpc',
    { validateParsedData: true }
  );

  it('should return a list of peers connected to the node - raw', async () => {
    const result = await (
      casperJsonRpc as unknown as CasperJsonRpc<ReturnType.Raw>
    ).infoGetPeers([], {
      returnType: ReturnType.Raw
    });
    result.api_version.should.be.a('string');
    result.peers.should.be.a('array');
  });

  it('should return a list of peers connected to the node - parsed', async () => {
    const result = await casperJsonRpc.infoGetPeers([]);
    result.apiVersion.should.be.a('string');
    result.peers.should.be.a('array');
    expect(result.peers.length).to.be.greaterThan(0);
    result.peers[0].should.be.instanceOf(Peer);
  });
});

# Casper JS SDK

The Casper JS SDK provides a convenient way to interact with the Casper Network using JavaScript.

## Get started

```bash
# Basic Node.JS installation
npm install casper-js-sdk --save
```

## Base usage

- [Public and private keys](#public-and-private-keys)
- [RPC client](#rpc-client)
- [SSE](#sse)
- [Creating a transaction](#creating-a-transaction)
- [Creating a legacy deploy](#creating-a-legacy-deploy)
- [Creating and sending CSPR transfer deploy](#creating-and-sending-cspr-transfer-deploy)
- [Creating and sending Auction manager deploy](#creating-and-sending-auction-manager-deploy)

## Migration guides

### [v2 to v3](./migration-guide-v2-v3.md)

## Usage examples

### Public and private keys

Provides functionality for working with public and private key cryptography in Casper. [See more details here](src/types/keypair/README.md)

```ts
import { KeyAlgorithm, PrivateKey, PublicKey } from 'casper-js-sdk';

const privateKeyAlgoritm = KeyAlgorithm.SECP256K1;

// Generate new
const privateKey = await PrivateKey.generate(privateKeyAlgoritm);

// Recreate from hex string
const privateHex = 'PRIVATE-KEY-HEX...';
const privateKeyFromHex = await PrivateKey.fromHex(
  privateHex,
  privateKeyAlgoritm
);

// Public key from PrivateKey
const publicKey = privateKey.publicKey;

// Public key from hex string
const publicKeyHex =
  '02039daee95ef2cd54a23bd201febc495dc1404bc300c572e77dc55cf8ff53ac4823';
const publicKeyFromHex = PublicKey.fromHex(publicKeyHex);
```

### RPC client

Provides access to the exported methods of RPC Client and data structures where the response is serialized. [See more details here](src/rpc/README.md)

Example:

```ts
import { HttpHandler, RpcClient } from 'casper-js-sdk';

const rpcHandler = new HttpHandler('http://<Node Address>:7777/rpc');
const rpcCient = new RpcClient(rpcHandler);
const deployHash =
  '3facbc4133e722c5c5630b6ad2331383ba849ef719da582cc026e9dd85e72ac9';

try {
  const deployResult = await rpcCient.getDeploy(deployHash);
} catch (e) {}
```

### SSE

Provides basic functionality to work with Casper events that streamed by SSE server. [See more details here](src/sse/README.md)

Example:

```ts
import { SseClient, EventType } from 'casper-js-sdk';

const sseClient = new SseClient(
  'http://<Node Address>:9999/events/main'
);
sseClient.registerHandler(
  EventType.DeployProcessedEventType,
  async rawEvent => {
    try {
      const deployEvent = rawEvent.parseAsDeployProcessedEvent();
      console.log(
        `Deploy hash: ${deployEvent.deployProcessed.deployHash}`
      );
    } catch (error) {
      console.error('Error processing event:', error);
    }
  }
);

// Start the client with the last known event ID
const lastEventID = 1234;

sseClient.start(lastEventID).catch(error => {
  console.error('Error starting SSE client:', error);
});
```

### Creating a transaction

Example of how to construct a transaction and push it to the network:

```ts
import {
  Args,
  CLValue,
  CLValueOption,
  CLValueUInt64,
  CLValueUInt512,
  Duration,
  FixedMode,
  HttpHandler,
  InitiatorAddr,
  KeyAlgorithm,
  PricingMode,
  PrivateKey,
  PublicKey,
  RpcClient,
  SessionTarget,
  Timestamp,
  TransactionEntryPoint,
  TransactionScheduling,
  TransactionTarget,
  TransactionV1,
  TransactionV1Body,
  TransactionV1Header
} from 'casper-js-sdk-new';

const rpcHandler = new HttpHandler('http://<Node Address>:7777/rpc');
const rpcClient = new RpcClient(rpcHandler);

const privateKey = await PrivateKey.generate(KeyAlgorithm.ED25519);
const timestamp = new Timestamp(new Date());
const paymentAmount = '20000000000000';

const pricingMode = new PricingMode();
const fixedMode = new FixedMode();
fixedMode.gasPriceTolerance = 3;
pricingMode.fixed = fixedMode;

const transactionHeader = TransactionV1Header.build({
  chainName: 'casper-net-1',
  timestamp,
  ttl: new Duration(1800000),
  initiatorAddr: new InitiatorAddr(privateKey.publicKey),
  pricingMode
});

const args = Args.fromMap({
  target: CLValue.newCLPublicKey(
    PublicKey.fromHex(
      '0202f5a92ab6da536e7b1a351406f3744224bec85d7acbab1497b65de48a1a707b64'
    )
  ),
  amount: CLValueUInt512.newCLUInt512(paymentAmount),
  id: CLValueOption.newCLOption(CLValueUInt64.newCLUint64(3))
});

const transactionTarget = new TransactionTarget(new SessionTarget());
const entryPoint = new TransactionEntryPoint(undefined, {});
const scheduling = new TransactionScheduling({});

const transactionBody = TransactionV1Body.build({
  args: args,
  target: transactionTarget,
  transactionEntryPoint: entryPoint,
  transactionScheduling: scheduling,
  transactionCategory: 2
});

const transaction = TransactionV1.makeTransactionV1(
  transactionHeader,
  transactionBody
);
await transaction.sign(privateKey);

const result = await rpcClient.putTransactionV1(transaction);

console.log(`Transaction Hash: ${result.transactionHash}`);
```

### Creating a legacy deploy

Example of how to construct a deploy and push it to the network:

```ts
import {
  Deploy,
  DeployHeader,
  ExecutableDeployItem,
  HttpHandler,
  PublicKey,
  KeyAlgorithm,
  PrivateKey,
  RpcClient,
  TransferDeployItem
} from 'casper-js-sdk';

const rpcHandler = new HttpHandler('http://<Node Address>:7777/rpc');
const rpcClient = new RpcClient(rpcHandler);

const senderKey = await PrivateKey.generate(KeyAlgorithm.ED25519);
const recipientKey = PublicKey.fromHex(
  '010068920746ecf5870e18911EE1fC5db975E0e97fFFcBBF52f5045Ad6C9838D2F'
);
const paymentAmount = '10000000000000';
const transferAmount = '10';
const transferId = 35;

const session = new ExecutableDeployItem();

session.transfer = TransferDeployItem.newTransfer(
  transferAmount,
  recipientKey,
  undefined,
  transferId
);

const payment = ExecutableDeployItem.standardPayment(paymentAmount);

const deployHeader = DeployHeader.default();
deployHeader.account = senderKey.publicKey;
deployHeader.chainName = 'casper-test';

const deploy = Deploy.makeDeploy(deployHeader, payment, session);
await deploy.sign(senderKey);

const result = await rpcClient.putDeploy(deploy);

console.log(`Deploy Hash: ${result.deployHash}`);
```

### Creating and sending CSPR transfer deploy

Example of how to construct a CSPR transfer deploy and push it to the network:

```ts
import {
  HttpHandler,
  RpcClient,
  KeyAlgorithm,
  PrivateKey,
  makeCsprTransferDeploy
} from 'casper-js-sdk';

// get private key fromHex, fromPem or generate it
const privateKey = await PrivateKey.fromHex(
  'privateKeyHex',
  KeyAlgorithm.SECP256K1 // or KeyAlgorithm.ED25519, depends on your private key
);

const deploy = makeCsprTransferDeploy({
  senderPublicKeyHex: privateKey.publicKey.toHex(),
  recipientPublicKeyHex: '0123456789abcdef...',
  transferAmount: '2500000000' // 2.5 CSPR
});

await deploy.sign(privateKey);

const rpcHandler = new HttpHandler('http://<Node Address>:7777/rpc');
const rpcClient = new RpcClient(rpcHandler);

const result = await rpcClient.putDeploy(deploy);

console.log(`Deploy Hash: ${result.deployHash}`);
```

### Creating and sending Auction manager deploy

Example of how to construct a Auction manager deploy (delegate/undelegate/redelegate CSPR) and push it to the network:

```ts
import {
  HttpHandler,
  RpcClient,
  KeyAlgorithm,
  PrivateKey,
  makeAuctionManagerDeploy,
  AuctionManagerEntryPoint
} from 'casper-js-sdk';

// get private key fromHex, fromPem or generate it
const privateKey = await PrivateKey.fromHex(
  'privateKeyHex',
  KeyAlgorithm.SECP256K1 // or KeyAlgorithm.ED25519, depends on your private key
);

const deploy = makeAuctionManagerDeploy({
  contractEntryPoint: AuctionManagerEntryPoint.delegate,
  delegatorPublicKeyHex: privateKey.publicKey.toHex(),
  validatorPublicKeyHex: '0123456789awedef...',
  amount: '500000000000' // 500 CSPR
});

await deploy.sign(privateKey);

const rpcHandler = new HttpHandler('http://<Node Address>:7777/rpc');
const rpcClient = new RpcClient(rpcHandler);

const result = await rpcClient.putDeploy(deploy);

console.log(`Deploy Hash: ${result.deployHash}`);
```

const fs = require('node:fs');

async function downloadRpcSchema() {
  const schema = await fetch(
    'https://raw.githubusercontent.com/casper-network/casper-sidecar/feat-2.0/resources/test/rpc_schema.json'
  );

  const schemaJson = await schema.json();

  const primitiveCLTypes = [
    {
      description: '`bool` primitive.',
      type: 'string',
      enum: ['Bool']
    },
    {
      description: '`i32` primitive.',
      type: 'string',
      enum: ['I32']
    },
    {
      description: '`i64` primitive.',
      type: 'string',
      enum: ['I64']
    },
    {
      description: '`u8` primitive.',
      type: 'string',
      enum: ['U8']
    },
    {
      description: '`u32` primitive.',
      type: 'string',
      enum: ['U32']
    },
    {
      description: '`u64` primitive.',
      type: 'string',
      enum: ['U64']
    },
    {
      description: '[`U128`] large unsigned integer type.',
      type: 'string',
      enum: ['U128']
    },
    {
      description: '[`U256`] large unsigned integer type.',
      type: 'string',
      enum: ['U256']
    },
    {
      description: '[`U512`] large unsigned integer type.',
      type: 'string',
      enum: ['U512']
    },
    {
      description: '`()` primitive.',
      type: 'string',
      enum: ['Unit']
    },
    {
      description: '`String` primitive.',
      type: 'string',
      enum: ['String']
    },
    {
      description: '[`Key`] system type.',
      type: 'string',
      enum: ['Key']
    },
    {
      description: '[`URef`] system type.',
      type: 'string',
      enum: ['URef']
    },
    {
      description: '[`PublicKey`](crate::PublicKey) system type.',
      type: 'string',
      enum: ['PublicKey']
    }
  ];

  // Remove complex CLType due to the mock server doesn't support it
  schemaJson['components']['schemas']['CLType']['oneOf'] = primitiveCLTypes;

  fs.writeFileSync('./rpc-schema.json', JSON.stringify(schemaJson));
}

downloadRpcSchema().catch(console.error);

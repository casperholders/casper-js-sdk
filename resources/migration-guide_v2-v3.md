# v2 to v3 migration guide

The `v3` release made several breaking changes to inputs, outputs that were present in `v2`. All of them are attempts to follow how the API of the node changed. `V3` does not introduce any changes to the behavior of the sdk outside of those that were forced by the changes in the node. This document will explain changes on an endpoint by endpoint basis.

## Breaking changes

### getAccountInfo

This util function will be usable only to fetch unmigrated data from the node. All legacy `Account` data in the noe will be gradually migrated to the new `AddressableEntity` format. This is a lazy process and will happen once someone deploys a `Transaction` using an `Account`. To fetch accounts created after node 2.x migration or ones that were migrated to the new format, use `CasperServiceByJsonRPC.getEntity`.

### CasperServiceByJsonRPC

#### getDeployInfo

The output data for this endpoint changed. The `GetDeployResult` used to have `deploy` and `execution_results` fields. `deploy` should not have changed, but the `execution_results` field was removed. It was replaced by optional `execution_info` field of `ExecutionInfo` type. `ExecutionInfo` contains `execution_result` (singular, not an array as previously) of `ExecutionResult` type. `ExecutionResult` type changed to be a union of either `ExecutionResultV1` or `ExecutionResultV2`. `ExecutionResultV1` corresponds to `ExecutionResult` prior to the discussed changes.

The `getDeployInfo` should return `ExecutionResultV1` for deploys that were executed before the changes in the node. For deploys that were executed after the changes in the node, the `getDeployInfo` should return `ExecutionResultV2`. Anyone using `getDeployInfo` should be prepared to handle both variants of `ExecutionResult`.

**PLEASE NOTE** This method is considered deprecated and will be removed in the future. It is recommended to use `getTransactionInfo` instead.

#### getBlockInfo

This method change it's output data (`GetBlockResult`). Currently it returns a structure with one field `block_with_signatures` which is of type `JsonBlockWithSignatures`. `JsonBlockWithSignatures.signatures` are the signatures of the block, `JsonBlockWithSignatures.block` is a union type that represents the block data. It should be of the structure:

```
{ Version1: BlockV1 }
```

for blocks that were produced prior to `condor` migration, and

```
{ Version2: BlockV2 }
```

for blocks produced after the migration. `BlockV1` is the same as type `JsonBlock` in `v2` of casper-js-sdk.

#### getBlockInfoByHeight

All the changes that were made to output data of `getBlockInfo` were also made to `getBlockInfoByHeight`.

#### getLatestBlockInfo

All the changes that were made to output data of `getBlockInfo` were also made to `getLatestBlockInfo`.

#### getEraInfoBySwitchBlock

The input parameter to this method is no longer a string. It's a union type that has either the structure of:

```
{ Hash: string } | { Height: number }
```

So `v2` usage like this:

```typescript
const eraInfo = await client.getEraInfoBySwitchBlock(
  '565d7147e28be402c34208a133fd59fde7ac785ae5f0298cb5fb7adfb1b054a8'
);
```

will now be:

```typescript
const eraInfo = await client.getEraInfoBySwitchBlock({
  Hash:
    '565d7147e28be402c34208a133fd59fde7ac785ae5f0298cb5fb7adfb1b054a8'
});
```

It's also possible to fetch by height now:

```typescript
const eraInfo = await client.getEraInfoBySwitchBlock({
  Height: 123
});
```

#### getEraSummary

The input parameter to this method is no longer an optional string. It's an optional union type that has either the structure of:

```
{ Hash: string } | { Height: number }
```

So `v2` usage like this:

```typescript
const eraInfo = await client.getEraSummary(
  '565d7147e28be402c34208a133fd59fde7ac785ae5f0298cb5fb7adfb1b054a8'
);
```

will now be:

```typescript
const eraInfo = await client.getEraSummary({
  Hash:
    '565d7147e28be402c34208a133fd59fde7ac785ae5f0298cb5fb7adfb1b054a8'
});
```

It's also possible to fetch by height now:

```typescript
const eraInfo = await client.getEraSummary({
  Height: 123
});
```

## Non-breaking changes

### CasperServiceByJsonRPC

#### getStatus

Response `GetStatusResult` has a new field: `latest_switch_block_hash`

#### getTransactionInfo

This endpoint was added in `v3`. It is used to retrieve the new data format which is a union type of either a `Deploy` or `Transaction`. Example usage would be:

- for fetching a `Deploy` variant:

  ```typescript
  const transaction = await client.getTransactionInfo({
    Deploy:
      '565d7147e28be402c34208a133fd59fde7ac785ae5f0298cb5fb7adfb1b054a8'
  });
  ```

  **PLEASE NOTE** The above is identical to

  ```typescript
  const deploy = await client.getDeployInfo(
    '565d7147e28be402c34208a133fd59fde7ac785ae5f0298cb5fb7adfb1b054a8'
  );
  ```

- for fetching a `Version1` variant:

  ```typescript
  const transaction = await client.getTransactionInfo({
    Version1:
      '565d7147e28be402c34208a133fd59fde7ac785ae5f0298cb5fb7adfb1b054a8'
  });
  ```

#### transaction

This method is used to send a `Transaction` for execution. A `Transaction` is a union of either a `Deploy` or a `Version1`. `Deploy` is the same as the `Deploy` type in `v2` of casper-js-sdk. Currently it's still possible to use the `deploy` method to send a `Deploy` to the node.

## BalanceServiceByJsonRPC

This service was removed from 3.0.0 release. It has only one method - `getAccountBalance`. Please use `CasperServiceByJsonRPC.getAccountBalance` instead.

## Speculative endpoints

#TODO

```

```

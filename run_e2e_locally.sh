export FAUCET_PRIV_KEY="MC4CAQAwBQYDK2VwBCIEIM0OhegYkU4zxgXeZggBdAR6+XkByue+3iZbznGbCUkM"
export NODE_URL="http://10.20.3.114:8003/rpc"
export HTTP_EVENT_STREAM_URL="http://127.0.0.1:9999/events/main"
export HTTPS_EVENT_STREAM_URL="https://events.mainnet.casperlabs.io/events/main"
export NETWORK_NAME="casper-net-1"
export RUST_LOG="INFO"
export VERSION_QUERY='{"jsonrpc": "2.0", "id": "1", "method": "info_get_status"}'
export MAINNET_NODE_URL='https://rpc.mainnet.casperlabs.io/rpc'
export TESTNET_NODE_URL='https://rpc.testnet.casperlabs.io/rpc'

yarn cross-env NODE_ENV=test TS_NODE_FILES=true mocha -r ts-node/register \"e2e/**/*.test.ts\" --timeout 50000 --exit
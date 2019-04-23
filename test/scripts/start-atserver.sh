set -e

# Copy empty project db
mkdir -p test/tmp/atserver
cp test/fixtures/atserver/nodes.db test/tmp/atserver/nodes.db

# Start atserver in tmp dir
docker run --name test-atserver -dt \
  --mac-address $ATSERVER_MAC_ADDRESS \
  -p "${ATSCM_PROJECT__PORT__OPC:-4840}:4840" \
  -p "${ATSCM_PROJECT__PORT__HTTP:-9000}:80" \
  -e ATSERVER_LICENSE="$ATSERVER_LICENSE" \
  -v "$(pwd)/test/tmp/atserver:/atvise/project" \
  lukashechenberger/test-atvise-server:3

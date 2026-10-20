#!/bin/sh
# Uso: LH_USER=... LH_PASSWORD=... sh audit/runs/suite.sh <label> <outdir>
# Requiere backend en :8000, Backoffice en :3000 y Tracker en :3001, y lighthouse@13.4.1,
# puppeteer-core y chrome-launcher instalados fuera del repo (NODE_PATH o carpeta temporal).
L=$1; O=$2; mkdir -p "$O"
DIR=$(cd "$(dirname "$0")" && pwd)
for n in 1 2 3; do
  for dev in mobile desktop; do
    node "$DIR/run.mjs" tracker http://localhost:3001/ $dev "$O/talent-pipeline-tracker-$dev-$n.html" "$O/results.jsonl" "$L"
    node "$DIR/run.mjs" tracker http://localhost:3001/account/profile $dev "$O/talent-pipeline-tracker-profile-$dev-$n.html" "$O/results.jsonl" "$L"
    node "$DIR/run.mjs" backoffice http://localhost:3000/ $dev "$O/backoffice-dashboard-$dev-$n.html" "$O/results.jsonl" "$L"
  done
done

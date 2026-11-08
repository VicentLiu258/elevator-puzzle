#!/bin/sh
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
CREATOR=${CREATOR_BIN:-/Applications/Cocos/Creator/3.8.8/CocosCreator.app/Contents/MacOS/CocosCreator}
set +e
"$CREATOR" --project "$ROOT/cocos" --build "configPath=$ROOT/cocos/build-config.json" > "$ROOT/docs/last-build.log" 2>&1
CODE=$?
set -e
if [ "$CODE" -ne 36 ] && [ "$CODE" -ne 0 ]; then cat "$ROOT/docs/last-build.log"; exit "$CODE"; fi
rg 'build Task.*Finished' "$ROOT/docs/last-build.log"
python3 "$ROOT/scripts/package-release.py"

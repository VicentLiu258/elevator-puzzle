#!/bin/sh
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
TSC="$ROOT/node_modules/typescript/bin/tsc"
if [ ! -f "$TSC" ]; then
  TSC="/Applications/Cocos/Creator/3.8.8/CocosCreator.app/Contents/Resources/app.asar.unpacked/node_modules/typescript/bin/tsc"
fi
if [ ! -f "$TSC" ]; then
  echo 'TypeScript compiler not found; install project dependencies or provide Creator 3.8.8.' >&2
  exit 1
fi
TMPDIR_TEST=$(mktemp -d "${TMPDIR:-/tmp}/elevator-test.XXXXXX")
trap 'rm -rf "$TMPDIR_TEST"' EXIT
mkdir "$TMPDIR_TEST/types"
node "$TSC" "$ROOT/prototype/cocos/assets/scripts/core/"*.ts --target es2020 --module commonjs --strict --typeRoots "$TMPDIR_TEST/types" --outDir "$TMPDIR_TEST/out"
node "$ROOT/prototype/tests/core.test.cjs" "$TMPDIR_TEST/out/game.js"

node "$ROOT/prototype/tests/traffic.test.cjs" "$TMPDIR_TEST/out/traffic.js"

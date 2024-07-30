#!/usr/bin/env bash
set -xeou pipefail

version="$(jq -r .version <manifest.json)"
inputs=(icons manifest.json service_worker.js popup.html popup-animation.gif)
output="kagi_chrome_${version}.zip"

rm -f "$output"
zip -r "$output" "${inputs[@]}"
unzip -d unpacked "$output" # test from this dir to ensure full asset capture

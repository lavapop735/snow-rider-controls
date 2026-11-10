#!/bin/sh
# Double-click to copy the bundled extension and open its folder.
set -eu

task_bundle_root=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
task_source="$task_bundle_root/Extension"
task_copy_root=${1:-"$HOME/Downloads"}

for task_file in manifest.json content.js movement.js panel.js loadouts.js invincibility.js wasm-patch.js 'START HERE.html'; do
  if [ ! -f "$task_source/$task_file" ]; then
    printf 'Missing file: %s\nKeep this setup file beside the Extension folder.\n' "$task_file" >&2
    exit 1
  fi
done

mkdir -p "$task_copy_root"
task_destination=$(mktemp -d "$task_copy_root/Snow Rider Controls.XXXXXX")
cp -R "$task_source/." "$task_destination/"

printf '\nCopied Snow Rider Controls to:\n%s\n\n' "$task_destination"
printf 'In Chrome: chrome://extensions -> Developer mode -> Load unpacked.\nSelect the folder above. Keep it on the computer after removing the USB.\n'
open "$task_destination"
open "$task_destination/START HERE.html"

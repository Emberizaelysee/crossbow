#!/usr/bin/env bash
# S1 disk footprint: Electron's dist as shipped, then trimmed the way a
# Crossbow package would be, then packed as an AppImage-style squashfs.
#   ./disk.sh [path/to/electron/dist]
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
dist="${1:-$here/../node_modules/electron/dist}"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

mb() { du -sm "$1" | cut -f1; }
echo "dist as shipped:            $(mb "$dist") MB"
echo "  locales/:                 $(mb "$dist/locales") MB"
du -sm "$dist"/* | sort -rn | head -8 | sed 's/^/  /'

cp -a "$dist" "$work/app"
# Keep only en-US (a real build keeps the locales the user picks).
find "$work/app/locales" -name '*.pak' ! -name 'en-US.pak' -delete
# Electron's demo app isn't shipped. LICENSES.chromium.html must stay (licence notices).
rm -f "$work/app/resources/default_app.asar"
echo "trimmed (installed size):   $(mb "$work/app") MB"

mksquashfs "$work/app" "$work/app.squashfs" -comp zstd -Xcompression-level 19 -quiet -no-progress >/dev/null
echo "squashfs zstd-19 (AppImage): $(( $(stat -c %s "$work/app.squashfs") / 1048576 )) MB"
mksquashfs "$work/app" "$work/app-xz.squashfs" -comp xz -quiet -no-progress >/dev/null
echo "squashfs xz:                $(( $(stat -c %s "$work/app-xz.squashfs") / 1048576 )) MB"

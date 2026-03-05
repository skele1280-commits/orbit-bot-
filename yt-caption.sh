#!/bin/bash
URL=$1
TMPDIR=$(mktemp -d)
yt-dlp --write-auto-sub --skip-download --sub-langs "en" --cookies-from-browser chrome -o "$TMPDIR/caption" "$URL" 2>/dev/null
for f in "$TMPDIR"/*.vtt; do
    [ -f "$f" ] && grep -v "^WEBVTT\|^Kind:\|^Language:\|^[0-9]\|^$\| --> " "$f" | sed 's/<[^>]*>//g' | awk '!seen[$0]++' 
done
rm -rf "$TMPDIR"

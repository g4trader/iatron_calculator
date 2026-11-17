#!/usr/bin/env bash
# Run inside a trusted worker with ffmpeg, curl, openssl and gcloud installed.
set -euo pipefail
umask 077
: "${MENTORY_HLS_BUCKET:?Private HLS bucket required}"
: "${DRIVE_ACCESS_TOKEN:?Drive read-only OAuth token required}"
file_id="${1:?Drive file ID required}"
asset_id="${2:?New asset UUID required}"
[[ "$file_id" =~ ^[a-zA-Z0-9_-]+$ ]]
[[ "$asset_id" =~ ^[0-9a-f-]{36}$ ]]
[[ "$MENTORY_HLS_BUCKET" =~ ^[a-z0-9][a-z0-9._-]+$ ]]
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
cd "$work"
curl --fail --silent --show-error --location --header "Authorization: Bearer $DRIVE_ACCESS_TOKEN" "https://www.googleapis.com/drive/v3/files/$file_id?alt=media&supportsAllDrives=true" --output source.mp4
unset DRIVE_ACCESS_TOKEN
openssl rand 16 > video.key
printf 'video.key\n%s/video.key\n' "$work" > keyinfo
ffmpeg -nostdin -hide_banner -loglevel error -i source.mp4 -map 0:v:0 -map '0:a:0?' -c:v libx264 -preset medium -crf 22 -vf 'scale=-2:trunc(min(720,ih)/2)*2' -c:a aac -b:a 128k -force_key_frames 'expr:gte(t,n_forced*6)' -f hls -hls_time 6 -hls_playlist_type vod -hls_flags independent_segments -hls_key_info_file keyinfo -hls_segment_filename 'segment_%06d.ts' index.m3u8
dest="gs://$MENTORY_HLS_BUCKET/mentory-hls/$asset_id"
gcloud storage cp --if-generation-match=0 --content-type=application/octet-stream --cache-control=private,no-store video.key "$dest/video.key"
gcloud storage cp --if-generation-match=0 --content-type=video/mp2t --cache-control=private,no-store segment_*.ts "$dest/"
# Publish manifest last; incomplete uploads cannot be played.
gcloud storage cp --if-generation-match=0 --content-type=application/vnd.apple.mpegurl --cache-control=private,no-store index.m3u8 "$dest/index.m3u8"
printf 'hls_%s\n' "$asset_id"

#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ASSET_DIR="$ROOT_DIR/assets/images"
CREDITS_DIR="$ROOT_DIR/assets/credits"
mkdir -p "$ASSET_DIR" "$CREDITS_DIR"

# Load .env (with UNSPLASH_ACCESS_KEY, PEXELS_API_KEY)
if [[ -f "$ROOT_DIR/.env" ]]; then
  # shellcheck disable=SC1090
  source "$ROOT_DIR/.env"
fi

query="${1:-}"
basename="${2:-}"
provider="${3:-unsplash}" # unsplash | pexels | wikimedia

if [[ -z "$query" || -z "$basename" ]]; then
  echo "Usage: $0 \"query terms\" out_basename [unsplash|pexels|wikimedia]"
  exit 1
fi

out_img="$ASSET_DIR/${basename}.jpg"
out_credit="$CREDITS_DIR/${basename}.json"
tmp_json="$(mktemp)"
trap 'rm -f "$tmp_json"' EXIT

download() { curl -fsSL "$1" -o "$out_img"; }
credit_json() {
  local provider="$1" title="$2" author="$3" source_url="$4" license="$5"
  jq -n \
    --arg provider "$provider" \
    --arg title "$title" \
    --arg author "$author" \
    --arg source "$source_url" \
    --arg license "$license" \
    '{provider:$provider,title:$title,author:$author,source:$source,license:$license,image:env.out_img}' \
    > "$out_credit"
}

search_unsplash() {
  [[ -n "${UNSPLASH_ACCESS_KEY:-}" ]] || { echo "UNSPLASH_ACCESS_KEY missing"; exit 2; }
  curl -fsSL -G "https://api.unsplash.com/search/photos" \
    --data-urlencode "query=$query" --data "per_page=1" \
    -H "Accept-Version: v1" -H "Authorization: Client-ID $UNSPLASH_ACCESS_KEY" > "$tmp_json"

  local raw_url author link name
  raw_url=$(jq -r '.results[0].urls.raw // empty' "$tmp_json")
  author=$(jq -r '.results[0].user.name // empty' "$tmp_json")
  link=$(jq -r '.results[0].links.html // empty' "$tmp_json")
  name=$(jq -r '.results[0].description // .results[0].alt_description // "Unsplash Photo"' "$tmp_json")
  [[ -n "$raw_url" ]] || { echo "No Unsplash result"; return 1; }

  download "${raw_url}&w=2000"
  credit_json "Unsplash" "$name" "$author" "$link" "Unsplash License"
}

search_pexels() {
  [[ -n "${PEXELS_API_KEY:-}" ]] || { echo "PEXELS_API_KEY missing"; exit 2; }
  curl -fsSL -G "https://api.pexels.com/v1/search" \
    --data-urlencode "query=$query" --data "per_page=1" \
    -H "Authorization: $PEXELS_API_KEY" > "$tmp_json"

  local url author link name
  url=$(jq -r '.photos[0].src.original // empty' "$tmp_json")
  author=$(jq -r '.photos[0].photographer // empty' "$tmp_json")
  link=$(jq -r '.photos[0].url // empty' "$tmp_json")
  name=$(jq -r '.photos[0].alt // "Pexels Photo"' "$tmp_json")
  [[ -n "$url" ]] || { echo "No Pexels result"; return 1; }

  download "$url"
  credit_json "Pexels" "$name" "$author" "$link" "Pexels License"
}

search_wikimedia() {
  curl -fsSL "https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&generator=search&gsrsearch=$(python - <<PY
import urllib.parse; print(urllib.parse.quote_plus("$query"))
PY
)&gsrnamespace=6&gsrlimit=1&iiprop=url|extmetadata" > "$tmp_json"

  local url title author license pageurl
  url=$(jq -r '.query.pages[]?.imageinfo[0]?.url // empty' "$tmp_json")
  title=$(jq -r '.query.pages[]?.title // "Wikimedia Commons Image"' "$tmp_json")
  author=$(jq -r '.query.pages[]?.imageinfo[0]?.extmetadata.Artist.value // ""' "$tmp_json")
  license=$(jq -r '.query.pages[]?.imageinfo[0]?.extmetadata.LicenseShortName.value // "CC License"' "$tmp_json")
  pageurl=$(jq -r '.query.pages[]?.imageinfo[0]?.descriptionurl // empty' "$tmp_json")
  [[ -n "$url" ]] || { echo "No Wikimedia result"; return 1; }

  download "$url"
  credit_json "Wikimedia Commons" "$title" "$author" "$pageurl" "$license"
}

case "$provider" in
  unsplash)  search_unsplash ;;
  pexels)    search_pexels ;;
  wikimedia) search_wikimedia ;;
  *) echo "Unknown provider $provider"; exit 1 ;;
esac

echo "Saved: $out_img"
echo "Credit: $out_credit"

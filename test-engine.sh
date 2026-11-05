#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE="$(mktemp -d)"
trap 'rm -rf "$BASE"' EXIT
mkdir -p "$BASE/live/assets" "$BASE/stages/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/dist/assets" "$BASE/backups"
WEB="$BASE/live"
DIST="$BASE/stages/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/dist"
cat > "$WEB/index.html" <<'I'
<script src="./assets/index-old123.js"></script><link href="./assets/index-old123.css">
I
cat > "$DIST/index.html" <<'I'
<script src="./assets/index-new456.js"></script><link href="./assets/index-new456.css">
I
for f in robots.txt site.webmanifest; do echo old > "$WEB/$f"; echo new > "$DIST/$f"; done
for f in index-old123.js index-old123.css; do echo old > "$WEB/assets/$f"; done
for f in index-new456.js index-new456.css; do echo new > "$DIST/assets/$f"; done
echo old-image > "$WEB/hero-1.jpg"; echo new-image > "$DIST/hero-1.jpg"
(cd "$BASE/stages/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" && find dist -type f -print0 | sort -z | xargs -0 sha256sum > release-checksums.txt)
python - "$BASE" "$SCRIPT_DIR" <<'PY'
import sys
from pathlib import Path
s=(Path(sys.argv[2])/'.github/scripts/tlv-frontend-deploy.sh').read_text()
base=Path(sys.argv[1])
s=s.replace('WEB="/webroots/www"',f'WEB="{base}/live"')
s=s.replace('STAGES="$HOME/tlv-github-staging"',f'STAGES="{base}/stages"')
s=s.replace('BACKUPS="$HOME/tlv-github-backups"',f'BACKUPS="{base}/backups"')
s=s.replace('LOCK="$HOME/tlv-github-release.lock"',f'LOCK="{base}/lock"')
(base/'deploy.sh').write_text(s)
PY
SHA=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
bash "$BASE/deploy.sh" preflight "$SHA"
bash "$BASE/deploy.sh" backup "$SHA"
TLV_ENABLE_LIVE=yes TLV_FUNCTIONAL_TEST_OK=yes bash "$BASE/deploy.sh" publish "$SHA"
grep -q index-new456 "$WEB/index.html"
LATEST="$(ls -t "$BASE"/backups/*.tar.gz | tail -1)"
# The earliest backup also contains the original 5 files plus changed hero image.
LATEST="$(ls -t "$BASE"/backups/*.tar.gz | head -1)"
HASH="$(sha256sum "$LATEST" | cut -d ' ' -f1)"
TLV_ENABLE_LIVE=yes TLV_FUNCTIONAL_TEST_OK=yes bash "$BASE/deploy.sh" rollback "$(basename "$LATEST")" "$HASH"
grep -q index-old123 "$WEB/index.html"
[[ "$(cat "$WEB/hero-1.jpg")" == old-image ]]
# Deliberately fail after replacing robots.txt to verify real EXIT recovery.
python - "$BASE/deploy.sh" <<'PYFAULT'
from pathlib import Path
import sys
p=Path(sys.argv[1]); s=p.read_text()
anchor='  mv "${newtemps[0]}" "$WEB/robots.txt"'
assert s.count(anchor)==1
s=s.replace(anchor,anchor+'\n  false  # simulated failure immediately after first changed live file')
p.write_text(s)
PYFAULT
if TLV_ENABLE_LIVE=yes TLV_FUNCTIONAL_TEST_OK=yes bash "$BASE/deploy.sh" publish "$SHA"; then
  echo 'EXPECTED FAULT DID NOT FAIL' >&2; exit 1
fi
grep -q index-old123 "$WEB/index.html"
[[ "$(cat "$WEB/robots.txt")" == old ]]
[[ "$(cat "$WEB/hero-1.jpg")" == old-image ]]
echo 'ISOLATED PUBLISH, ROLLBACK AND FAILURE RECOVERY PASSED'

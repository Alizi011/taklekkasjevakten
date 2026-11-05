#!/usr/bin/env bash
set -Eeuo pipefail

# One.com TLV: approved frontend files only; no backend/database operations.
ACTION="${1:-}"
ARG="${2:-}"
EXPECTED="${3:-}"
WEB="/webroots/www"
STAGES="$HOME/tlv-github-staging"
BACKUPS="$HOME/tlv-github-backups"
LOCK="$HOME/tlv-github-release.lock"

fail() { printf 'STOPP: %s\n' "$*" >&2; exit 1; }
valid_sha() { [[ "$1" =~ ^[a-f0-9]{40}$ ]]; }
valid_backup() { [[ "$1" =~ ^tlv-before-github-[0-9]{8}-[0-9]{6}(-[0-9]+)?\.tar\.gz$ ]]; }

# Explicit separation: unsafe actions cannot start without two independent gates.
require_live_approval() {
  [[ "${TLV_ENABLE_LIVE:-no}" == "yes" ]] || fail 'Live actions disabled (TLV_ENABLE_LIVE)'
  [[ "${TLV_FUNCTIONAL_TEST_OK:-no}" == "yes" ]] || fail 'Functional test approval missing'
}

lock_release() {
  mkdir "$LOCK" 2>/dev/null || fail "Another operation is active: $LOCK"
  trap 'rmdir "$LOCK" 2>/dev/null || true' EXIT
}

get_active() {
  [[ -s "$WEB/index.html" && -d "$WEB/assets" ]] || fail 'Live frontend missing'
  for f in index.html robots.txt site.webmanifest; do
    [[ -f "$WEB/$f" && ! -L "$WEB/$f" ]] || fail "Unsafe live root file: $f"
  done
  OLD_JS="$(grep -oE 'assets/index-[A-Za-z0-9_-]+\.js' "$WEB/index.html" | head -1)"
  OLD_CSS="$(grep -oE 'assets/index-[A-Za-z0-9_-]+\.css' "$WEB/index.html" | head -1)"
  [[ -n "$OLD_JS" && -n "$OLD_CSS" ]] || fail 'Live asset names missing'
  [[ -s "$WEB/$OLD_JS" && -s "$WEB/$OLD_CSS" ]] || fail 'Live asset files missing'
}

validate_archive() {
  local archive="$1" sha="$2" item kind
  [[ -f "$archive" && ! -L "$archive" && -s "$archive" ]] || fail 'Archive missing or symlink'
  [[ "$sha" =~ ^[a-f0-9]{64}$ ]] || fail 'Invalid archive SHA256'
  [[ "$(sha256sum "$archive" | cut -d ' ' -f1)" == "$sha" ]] || fail 'Archive SHA256 mismatch'
  tar -tzf "$archive" >/dev/null || fail 'Archive unreadable'
  mapfile -t ARCHIVE_FILES < <(tar -tzf "$archive")
  [[ "${#ARCHIVE_FILES[@]}" -ge 5 ]] || fail 'Archive incomplete'
  local index=0 robots=0 manifest=0 js=0 css=0
  local -A found=()
  for item in "${ARCHIVE_FILES[@]}"; do
    [[ -z "${found[$item]:-}" ]] || fail 'Duplicate archive path'
    found[$item]=1
    case "$item" in
      index.html) ((index+=1)) ;;
      robots.txt) ((robots+=1)) ;;
      site.webmanifest) ((manifest+=1)) ;;
      assets/index-*.js) [[ "$item" =~ ^assets/index-[A-Za-z0-9_-]+\.js$ ]] || fail 'Bad JS name'; ((js+=1)) ;;
      assets/index-*.css) [[ "$item" =~ ^assets/index-[A-Za-z0-9_-]+\.css$ ]] || fail 'Bad CSS name'; ((css+=1)) ;;
      *.png|*.jpg|*.jpeg|*.webp|*.svg|*.ico) [[ "$item" != */* ]] || fail 'Image path outside root' ;;
      *) fail "Unexpected archive path: $item" ;;
    esac
  done
  [[ $index -eq 1 && $robots -eq 1 && $manifest -eq 1 && $js -eq 1 && $css -eq 1 ]] || fail 'Archive lacks required files'
  # tar -tv reports file type first; reject symlinks, hardlinks and special files.
  while IFS= read -r kind; do [[ "$kind" == -* ]] || fail 'Non-regular entry in archive'; done < <(tar -tvzf "$archive" | cut -c1)
  local html ajs acss
  html="$(tar -xOzf "$archive" index.html)"
  ajs="$(grep -oE 'assets/index-[A-Za-z0-9_-]+\.js' <<< "$html" | head -1)"
  acss="$(grep -oE 'assets/index-[A-Za-z0-9_-]+\.css' <<< "$html" | head -1)"
  [[ -n "${found[$ajs]:-}" && -n "${found[$acss]:-}" ]] || fail 'Archive index references missing resources'
  printf 'BACKUP VERIFIED: %s\n' "$(basename "$archive")"
}

validate_stage() {
  valid_sha "$ARG" || fail 'Invalid release SHA'
  STAGE="$STAGES/$ARG"
  DIST="$STAGE/dist"
  MANIFEST="$STAGE/release-checksums.txt"
  [[ -s "$DIST/index.html" && -s "$MANIFEST" ]] || fail 'Staged release missing'
  [[ -z "$(find "$DIST" -type l -print -quit)" ]] || fail 'Symlink in stage'
  local file relative line
  local -A files=() hashes=()
  while IFS= read -r -d '' file; do
    relative="${file#"$DIST/"}"
    case "$relative" in
      index.html|robots.txt|site.webmanifest) ;;
      assets/index-*.js|assets/index-*.css) [[ "$relative" =~ ^assets/index-[A-Za-z0-9_-]+\.(js|css)$ ]] || fail 'Bad asset path' ;;
      *.png|*.jpg|*.jpeg|*.webp|*.svg|*.ico) [[ "$relative" != */* ]] || fail 'Bad image path' ;;
      *) fail "Unexpected staged file: $relative" ;;
    esac
    files["dist/$relative"]=1
  done < <(find "$DIST" -type f -print0)
  while IFS= read -r line; do
    [[ "$line" =~ ^[a-f0-9]{64}\ \ dist/[A-Za-z0-9_./-]+$ ]] || fail 'Unsafe checksum manifest line'
    local p="${line:66}"
    [[ -n "${files[$p]:-}" && -z "${hashes[$p]:-}" ]] || fail 'Manifest does not match release'
    hashes[$p]=1
  done < "$MANIFEST"
  [[ ${#hashes[@]} -eq ${#files[@]} ]] || fail 'Checksum file count mismatch'
  ( cd "$STAGE"; sha256sum --check release-checksums.txt >/dev/null ) || fail 'Stage checksum mismatch'
  NEW_JS="$(grep -oE 'assets/index-[A-Za-z0-9_-]+\.js' "$DIST/index.html" | head -1)"
  NEW_CSS="$(grep -oE 'assets/index-[A-Za-z0-9_-]+\.css' "$DIST/index.html" | head -1)"
  [[ -n "$NEW_JS" && -n "$NEW_CSS" && -s "$DIST/$NEW_JS" && -s "$DIST/$NEW_CSS" ]] || fail 'Release assets missing'
  echo 'STAGING VERIFIED'
}

# Back up every file that might be overwritten, plus live index and its exact active assets.
make_backup() {
  local item name tmp final
  local -a paths=(index.html robots.txt site.webmanifest "$OLD_JS" "$OLD_CSS")
  if [[ -n "${DIST:-}" ]]; then
    while IFS= read -r -d '' item; do
      name="${item#"$DIST/"}"
      [[ "$name" == index.html || "$name" == robots.txt || "$name" == site.webmanifest || "$name" == "$NEW_JS" || "$name" == "$NEW_CSS" ]] && continue
      if [[ -f "$WEB/$name" ]] && ! cmp -s "$item" "$WEB/$name"; then paths+=("$name"); fi
    done < <(find "$DIST" -maxdepth 1 -type f -print0)
  fi
  mkdir -p "$BACKUPS"
  name="tlv-before-github-$(date -u +%Y%m%d-%H%M%S)-$$"
  tmp="$BACKUPS/$name.tar.gz.tmp"
  final="$BACKUPS/$name.tar.gz"
  [[ ! -e "$tmp" && ! -e "$final" ]] || fail 'Backup collision'
  tar -czf "$tmp" -C "$WEB" "${paths[@]}" || fail 'Backup creation failed'
  tar -tzf "$tmp" >/dev/null || fail 'Backup corrupt'
  for item in "${paths[@]}"; do tar -xOzf "$tmp" "$item" | cmp -s - "$WEB/$item" || fail "Backup mismatch: $item"; done
  mv "$tmp" "$final"
  BACKUP="$final"
  BACKUP_SHA="$(sha256sum "$BACKUP" | cut -d ' ' -f1)"
  echo "BACKUP CREATED: $(basename "$BACKUP")"
  echo "BACKUP SHA256: $BACKUP_SHA"
}

# Copy data into separate verified temp paths, then activate index last.
apply_files() {
  local source="$1" item rel tmp
  local -a roots=(robots.txt site.webmanifest)
  local -a newtemps=()
  while IFS= read -r -d '' item; do
    rel="${item#"$source/"}"
    [[ "$rel" == index.html || "$rel" == robots.txt || "$rel" == site.webmanifest ]] && continue
    [[ ! -L "$WEB/$rel" ]] || fail "Symlink target forbidden: $rel"
    if [[ -e "$WEB/$rel" ]]; then
      cmp -s "$item" "$WEB/$rel" || {
        tmp="$WEB/$rel.tlv-$$"; cp "$item" "$tmp"; cmp -s "$item" "$tmp" || fail 'Asset copy mismatch'; mv "$tmp" "$WEB/$rel";
      }
    else
      tmp="$WEB/$rel.tlv-$$"; cp "$item" "$tmp"; cmp -s "$item" "$tmp" || fail 'Asset copy mismatch'; mv "$tmp" "$WEB/$rel"
    fi
  done < <(find "$source" -type f -print0)
  for rel in "${roots[@]}" index.html; do
    tmp="$WEB/$rel.tlv-$$"
    [[ ! -e "$tmp" && ! -L "$WEB/$rel" ]] || fail 'Unsafe root file state'
    cp "$source/$rel" "$tmp"
    cmp -s "$source/$rel" "$tmp" || fail 'Root file copy mismatch'
    newtemps+=("$tmp")
  done
  mv "${newtemps[0]}" "$WEB/robots.txt"
  mv "${newtemps[1]}" "$WEB/site.webmanifest"
  mv "${newtemps[2]}" "$WEB/index.html"
  for rel in "${roots[@]}" index.html; do cmp -s "$source/$rel" "$WEB/$rel" || fail "Activation failed: $rel"; done
}

# Rollback from archive; uses a separate restore folder. Never untar directly to public webroot.
restore_archive() {
  local archive="$1" sha="$2" tmp item
  validate_archive "$archive" "$sha"
  tmp="$(mktemp -d "$HOME/tlv-restore-XXXXXXXX")"
  tar -xzf "$archive" -C "$tmp" || fail 'Extraction failed'
  # Dynamic archive whitelist has already been validated.
  apply_files "$tmp"
  while IFS= read -r -d '' item; do
    rel="${item#"$tmp/"}"
    cmp -s "$item" "$WEB/$rel" || fail "Restore mismatch: $rel"
  done < <(find "$tmp" -type f -print0)
  rm -rf -- "$tmp"
  echo 'ROLLBACK COMPLETED'
}

# On a failed publish/rollback restore the just-created snapshot. Report any failure explicitly.
recover_on_error() {
  local code=$?
  trap - EXIT
  if [[ $code -ne 0 && -n "${BACKUP:-}" ]]; then
    echo 'OPERATION FAILED - ATTEMPTING RESTORE' >&2
    set +e
    for f in index.html robots.txt site.webmanifest; do rm -f "$WEB/$f.tlv-$$"; done
    restore_archive "$BACKUP" "$BACKUP_SHA"
    local recovered=$?
    if [[ $recovered -ne 0 ]]; then
      echo 'CRITICAL: MANUAL RECOVERY REQUIRED' >&2
    else
      echo 'PREVIOUS FRONTEND RESTORED' >&2
    fi
  fi
  rmdir "$LOCK" 2>/dev/null || true
  exit "$code"
}

case "$ACTION" in
  preflight)
    validate_stage; get_active; echo 'PREFLIGHT PASSED - LIVE WEBSITE UNCHANGED' ;;
  backup)
    validate_stage; get_active; lock_release; make_backup; echo 'LIVE WEBSITE UNCHANGED' ;;
  publish)
    require_live_approval
    validate_stage; get_active; lock_release
    make_backup
    trap recover_on_error EXIT
    apply_files "$DIST"
    echo "PUBLISH COMPLETED: $ARG"
    echo "ROLLBACK USING: $(basename "$BACKUP") $BACKUP_SHA"
    ;;
  rollback)
    require_live_approval
    valid_backup "$ARG" || fail 'Invalid backup name'
    validate_archive "$BACKUPS/$ARG" "$EXPECTED"
    get_active; lock_release; make_backup
    trap recover_on_error EXIT
    restore_archive "$BACKUPS/$ARG" "$EXPECTED"
    echo "ROLLBACK SAFETY BACKUP: $(basename "$BACKUP") $BACKUP_SHA"
    ;;
  test)
    # Isolated test will be driven by dedicated local test harness; never change live webroot.
    echo 'LIVE TEST DISABLED; USE ISOLATED TEST HARNESS'
    ;;
  *) fail 'Unknown action' ;;
esac

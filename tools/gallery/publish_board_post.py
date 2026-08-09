"""게시판 글 발행 — 검증 → 사용자 세션으로 insert → 되읽기 확인까지 한 번에.

    python tools/gallery/publish_board_post.py post.json            # 예행연습(기본, 아무것도 쓰지 않는다)
    python tools/gallery/publish_board_post.py post.json --commit   # 실제 발행

## 왜 형제 도구(publish_post.py)와 경로가 다른가

갤러리 글은 `publish_private_post` RPC 로 간다. 그 함수는 본문에 `kind='portfolio'` 를
**하드코딩**하고 있어서 게시판 글을 만들 수 없다(20260729000000 의 의도적 설계다).

그 벽을 넘는 방법은 둘이었다.

  ① 마이그레이션으로 service_role 이 만들 수 있는 글의 종류를 넓힌다.
  ② 계정 주인의 **세션 토큰을 발급받아** `authenticated` 로서 자기 글을 쓴다.

②를 골랐다. ①은 "service_role 이 아무 계정 명의로 아무 글이나 만들 수 있는" 표면을 영구히
넓히는 반면, ②는 앱이 쓰는 것과 **똑같은 GRANT·RLS 경로**를 그대로 지난다. 권한을 새로
열지 않고, 글의 소유자가 실제로 그 사용자라는 점에서도 이쪽이 옳다. 이 흐름을 위한 도구
(`mint_user_access_token` / `rest_insert_as_user`)는 `_supabase.py` 에 이미 있었다.

## 🔴 대신 비공개 보장의 위치가 달라진다

RPC 경로에서는 **DB 함수 본문**이 `is_public=false` 를 하드코딩해 도구 코드를 고쳐도 공개될 수
없었다. 사용자 세션은 자기 글을 공개로도 쓸 수 있으므로, 여기서는 그 보장이 **이 파일**로
내려온다. 그래서 두 겹으로 막는다:

  · `build_row` 가 입력이 뭐라 하든 `is_public=False` 로 덮어쓴다.
  · `validate_row` 가 `is_public is not False` 를 오류로 잡는다(보내기 전에).
  · insert 뒤 **소유자 세션으로 되읽어** 실제 저장값이 false 인지 눈으로 확인한다.

공개 전환은 사용자가 앱에서 직접 한다. 무엇을 공개할지는 도구가 대신 정할 일이 아니다.

입력 JSON 예시:

    {
      "email": "<계정 이메일 — 이 계정의 세션으로 쓴다>",
      "user_id": "<check_account.py 가 출력한 값>",
      "title": "...",
      "description": "목록 카드에 보이는 요약",
      "body": "<p>Tiptap 리치 HTML</p>",
      "kind": "board",
      "category": "insight",
      "is_public": false
    }

⚠ `body` 는 앱의 편집기가 만드는 것과 같은 태그만 쓴다(정본: shared/lib/richtext/sanitize.ts
  ALLOWED_TAGS). 그 밖의 태그는 화면에 그릴 때 정화 단계에서 떨어져 나간다 — 저장은 되고
  보이지만 않는 상태가 되므로, 넣기 전에 여기서 걸러 준다.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

from _supabase import SupabaseError, mint_user_access_token, rest_get_as_user, rest_insert_as_user
from validate_post import validate_row

# insert 에 실어 보낼 컬럼만 통과시킨다. 나머지(생성 컬럼·집계 컬럼)는 DB 소유라
# 보내면 거부되거나 조용히 무시된다 — 애초에 보내지 않는다.
INSERTABLE = ("user_id", "title", "description", "body", "payload", "kind", "category", "is_public")

# 앱의 편집기가 만들 수 있는 태그 (정본: shared/lib/richtext/sanitize.ts ALLOWED_TAGS).
# 여기 없는 태그는 렌더 시 사라지므로 발행 전에 알려 준다.
ALLOWED_TAGS = {
    "p", "br", "strong", "b", "em", "i", "s", "u", "h2", "h3",
    "ul", "ol", "li", "a", "blockquote", "code", "pre", "hr",
    "table", "tbody", "tr", "th", "td",
}

TAG_PATTERN = re.compile(r"<\s*/?\s*([a-zA-Z][a-zA-Z0-9]*)")


def unsupported_tags(body: str | None) -> list[str]:
    """본문에서 정화 단계에 떨어져 나갈 태그를 찾는다(빈 리스트 = 전부 살아남는다)."""
    if not body:
        return []
    return sorted({tag.lower() for tag in TAG_PATTERN.findall(body)} - ALLOWED_TAGS)


def build_row(source: dict[str, Any]) -> dict[str, Any]:
    row = {key: source[key] for key in INSERTABLE if key in source}
    row["is_public"] = False  # 도구 차원의 강제. 입력이 뭐라 하든 비공개다.
    row.setdefault("kind", "board")
    return row


def publish(path: Path, commit: bool) -> int:
    source = json.loads(path.read_text(encoding="utf-8"))
    email = source.get("email")
    row = build_row(source)

    print(f"[1/4] 로컬 검증 — {path.name}")
    errors = validate_row(row)
    if not email:
        errors.append("email 이 없다 — 이 계정의 세션으로 써야 하므로 필수다")
    if row.get("kind") != "board":
        errors.append(f"kind 가 {row.get('kind')!r} — 이 도구는 게시판 글 전용이다(갤러리는 publish_post.py)")
    if errors:
        print(f"  ✗ {len(errors)}건 — DB 에 보내지 않는다")
        for error in errors:
            print(f"    · {error}")
        return 1

    stray = unsupported_tags(row.get("body"))
    if stray:
        # 실패로 막지는 않는다 — 저장은 되고 그 태그만 안 보인다. 다만 조용히 넘어가면
        # "올렸는데 표가 사라진" 상태를 나중에 사람이 발견하게 된다.
        print(f"  ⚠ 화면에서 사라질 태그: {', '.join(stray)}")
        print("    (shared/lib/richtext/sanitize.ts 의 허용 목록에 없다 — 저장은 되지만 렌더에서 빠진다)")
    print("  ✓ 통과")

    if not commit:
        print("[2/4] 예행연습 — 아무것도 쓰지 않았다")
        print(json.dumps({**row, "body": f"<{len((row.get('body') or '').encode('utf-8'))} bytes 생략>"},
                         ensure_ascii=False, indent=2))
        print()
        print("  실제로 넣으려면 --commit 을 붙여라.")
        return 0

    print(f"[2/4] 세션 발급 — {email}")
    # 매직링크를 생성해 토큰으로 교환한다. 메일은 발송되지 않고, 토큰은 이 프로세스 밖으로 나가지 않는다.
    token = mint_user_access_token(email)
    print("  ✓ 발급됨 (기록하지 않는다)")

    print("[3/4] 발행 — 사용자 세션으로 insert (RLS 그대로 적용)")
    inserted = rest_insert_as_user("posts", row, token)
    if not inserted or not isinstance(inserted, list):
        print("  ✗ insert 응답이 비었다")
        return 1
    post_id = inserted[0].get("id")
    print(f"  ✓ id = {post_id}")

    print("[4/4] 되읽기 확인 — 소유자 세션으로 실제 저장값을 본다")
    # 값을 만든 쪽의 응답을 믿지 않고 다시 읽는다. 비공개 글은 소유자 세션이라야 보이므로,
    # 이 조회가 성공한다는 것 자체가 "내 글로 들어갔다"는 확인이기도 하다.
    rows = rest_get_as_user("posts", f"id=eq.{post_id}&select=id,title,kind,category,is_public,created_at", token)
    if not rows:
        print("  ✗ 되읽기 실패 — 방금 넣은 행이 조회되지 않는다")
        return 1

    saved = rows[0]
    print(f"  is_public : {saved.get('is_public')}")
    print(f"  kind      : {saved.get('kind')}")
    print(f"  category  : {saved.get('category')}")
    print(f"  title     : {saved.get('title')}")

    if saved.get("is_public") is not False:
        print("  ✗ 비공개가 아니다 — 즉시 확인이 필요하다")
        return 1
    if saved.get("category") != row.get("category"):
        print(f"  ✗ 분류가 {saved.get('category')!r} 로 들어갔다 — 의도({row.get('category')!r})와 다르다")
        return 1

    print()
    print(f"POST_ID={post_id}")
    print("비공개로 저장됐다. 앱의 '내 글' 에서 확인한 뒤 공개 여부를 직접 결정해라.")
    return 0


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    commit = "--commit" in sys.argv[1:]

    if len(args) != 1:
        print(__doc__)
        return 2

    path = Path(args[0])
    if not path.exists():
        print(f"✗ 파일이 없다: {path}")
        return 1

    try:
        return publish(path, commit)
    except SupabaseError as error:
        print(f"✗ {error}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

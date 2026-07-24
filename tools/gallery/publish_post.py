"""갤러리 글 발행 — 검증 → 발행 RPC → 되읽기 확인까지 한 번에.

    python tools/gallery/publish_post.py post.json            # 예행연습(기본, 아무것도 쓰지 않는다)
    python tools/gallery/publish_post.py post.json --commit   # 실제 발행

**기본이 dry-run 인 이유**: 실수로 실행됐을 때 아무 일도 일어나지 않는 쪽이 안전하다.
쓰려면 `--commit` 을 명시해야 한다.

`is_public` 은 **항상 false** 다. 이 스크립트가 값을 false 로 강제하고, 그와 별개로
`publish_private_post` RPC 본문이 false 를 하드코딩한다 — 즉 도구 코드를 고쳐도 공개될 수 없다.
공개 전환은 사용자가 앱에서 직접 한다. 포트폴리오는 개인 금융정보이고, 무엇을 공개할지는
도구가 대신 정할 일이 아니다.

입력 JSON 예시:

    {
      "user_id": "<check_account.py 가 출력한 값>",
      "title": "...",
      "description": "...",
      "body": "...",
      "kind": "portfolio",
      "is_public": false,
      "payload": { "portfolio": {...}, "investmentSettings": {...} },
      "sim_summary": null
    }
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any
from urllib.parse import quote

from _supabase import SupabaseError, rest_get, rpc
from validate_post import validate_row

# insert 에 실어 보낼 컬럼만 통과시킨다. 나머지(생성 컬럼·집계 컬럼)는 DB 소유라
# 보내면 거부되거나 조용히 무시된다 — 애초에 보내지 않는다.
INSERTABLE = ("user_id", "title", "description", "body", "payload", "kind", "category", "is_public", "sim_summary")

# 발행 RPC 이름 — 정본은 supabase/migrations/20260729000000_publish_private_post_rpc.sql.
# service_role 은 posts 테이블 GRANT 가 없어서 직접 insert 하지 못한다(42501). 이 함수만 열려 있고,
# 함수 본문이 is_public=false 와 kind='portfolio' 를 고정하므로 여기로 공개 글을 만들 수는 없다.
PUBLISH_RPC = "publish_private_post"


def build_row(source: dict[str, Any]) -> dict[str, Any]:
    row = {key: source[key] for key in INSERTABLE if key in source}
    row["is_public"] = False  # 도구 차원의 강제. 입력이 뭐라 하든 비공개다.
    row.setdefault("kind", "portfolio")
    return row


def publish(path: Path, commit: bool) -> int:
    source = json.loads(path.read_text(encoding="utf-8"))
    row = build_row(source)

    print(f"[1/3] 로컬 검증 — {path.name}")
    errors = validate_row(row)
    if errors:
        print(f"  ✗ {len(errors)}건 — DB 에 보내지 않는다")
        for error in errors:
            print(f"    · {error}")
        return 1
    print("  ✓ 통과")

    if not commit:
        print("[2/3] 예행연습 — insert 하지 않았다")
        print(json.dumps({**row, "payload": "<생략>", "body": "<생략>"}, ensure_ascii=False, indent=2))
        print()
        print("  실제로 넣으려면 --commit 을 붙여라.")
        return 0

    print(f"[2/3] 발행 — rpc {PUBLISH_RPC} (is_public 은 함수가 false 로 고정한다)")
    post_id = rpc(
        PUBLISH_RPC,
        {
            "p_user_id": row["user_id"],
            "p_title": row["title"],
            "p_description": row.get("description"),
            "p_body": row.get("body"),
            "p_payload": row["payload"],
            "p_sim_summary": row.get("sim_summary"),
        },
    )

    if not post_id:
        print("  ✗ RPC 가 id 를 돌려주지 않았다")
        return 1
    print(f"  ✓ id = {post_id}")

    print("[3/3] 되읽기 확인")
    # 값을 만든 쪽(RPC 응답)을 믿지 않고 다시 읽는다 — 트리거·기본값이 실제로 무엇을 남겼는지 본다.
    # 단 service_role 은 posts SELECT GRANT 가 없어서(설계상) 여기서 막히는 게 정상이다.
    # 그 경우는 실패가 아니다 — is_public=false 보장은 되읽기가 아니라 **함수 본문**이 한다.
    try:
        rows = rest_get("posts", f"id=eq.{quote(str(post_id))}&select=id,title,kind,category,is_public,created_at")
    except SupabaseError as error:
        if "42501" in str(error) or "permission denied" in str(error):
            print("  · service_role 에 posts SELECT 권한이 없어 되읽기를 건너뛴다(설계상 정상).")
            print("    is_public=false 는 RPC 본문이 하드코딩으로 보장한다 — 앱에서 눈으로 확인해라.")
            rows = None
        else:
            raise
    else:
        if not rows:
            print("  ✗ 되읽기 실패 — 방금 넣은 행이 조회되지 않는다")
            return 1

    if rows:
        saved = rows[0]
        print(f"  is_public : {saved.get('is_public')}")
        print(f"  kind      : {saved.get('kind')}")
        print(f"  category  : {saved.get('category')}")
        print(f"  title     : {saved.get('title')}")

        if saved.get("is_public") is not False:
            print("  ✗ 비공개가 아니다 — 즉시 확인이 필요하다")
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

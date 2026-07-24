"""발행 전 로컬 검증 — DB 에 보내기 **전에** 제약 위반을 잡는다.

DB CHECK 제약(`is_valid_scenario_payload`, 길이 제한, kind/category enum)을 파이썬으로 미러링한다.
왜 미리 보나: PostgREST 가 돌려주는 CHECK 위반 메시지는 "어느 조건이 깨졌는지"를 말해주지 않아
디버깅이 오래 걸린다. 여기서 걸러내면 무엇이 왜 틀렸는지 바로 알 수 있다.

    python tools/gallery/validate_post.py post.json

⚠ 이 검증은 **DB 제약의 미러**다. 마이그레이션이 바뀌면 여기도 같이 고쳐야 한다.
   정본은 supabase/migrations/ 이고, 이 파일은 편의를 위한 사전 점검일 뿐이다.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

# import 만으로 콘솔이 UTF-8 로 바뀐다(Windows cp949 에서 한국어 출력이 죽는 걸 막는다).
# 이 모듈은 네트워크를 타지 않으므로 import 자체는 부작용이 없다.
import _supabase  # noqa: F401

# ── DB 제약 미러 (정본: supabase/migrations/) ──────────────────────────────────
TITLE_MAX = 80  # 20260714000000: char_length(btrim(title)) between 1 and 80
DESCRIPTION_MAX = 500  # description is null or char_length <= 500
BODY_MAX = 65536  # posts_body_len
PAYLOAD_MAX_BYTES = 65536  # is_valid_scenario_payload: octet_length(p::text) <= 65536
SIM_SUMMARY_MAX_BYTES = 2048  # scenarios_sim_summary_shape
TICKER_PROFILES_MAX = 50  # jsonb_array_length(portfolio.tickerProfiles) <= 50
NAME_MAX = 80  # payload.name 이 있으면 <= 80

KINDS = ("portfolio", "board")  # 20260724000000
CATEGORIES = ("free", "question", "insight", "suggestion", "notice")  # 20260727000000


def _byte_len(value: Any) -> int:
    """DB 의 `octet_length(p::text)` 에 대응. 정확히 같지는 않지만(공백 표기 차이) 상한 판정엔 충분하다."""
    return len(json.dumps(value, ensure_ascii=False, separators=(",", ":")).encode("utf-8"))


def validate_payload(payload: Any, errors: list[str]) -> None:
    """`public.is_valid_scenario_payload` 미러."""
    if not isinstance(payload, dict):
        errors.append("payload 가 object 가 아니다")
        return

    size = _byte_len(payload)
    if size > PAYLOAD_MAX_BYTES:
        errors.append(f"payload 가 {size}바이트로 상한 {PAYLOAD_MAX_BYTES} 초과")

    for key in ("portfolio", "investmentSettings"):
        if key not in payload:
            errors.append(f"payload.{key} 키가 없다 (필수)")
        elif not isinstance(payload[key], dict):
            errors.append(f"payload.{key} 가 object 가 아니다")

    portfolio = payload.get("portfolio")
    if isinstance(portfolio, dict):
        profiles = portfolio.get("tickerProfiles")
        if not isinstance(profiles, list):
            errors.append("payload.portfolio.tickerProfiles 가 배열이 아니다")
        elif len(profiles) > TICKER_PROFILES_MAX:
            errors.append(f"tickerProfiles 가 {len(profiles)}개로 상한 {TICKER_PROFILES_MAX} 초과")

        if not isinstance(portfolio.get("includedTickerIds"), list):
            errors.append("payload.portfolio.includedTickerIds 가 배열이 아니다")

    if "id" in payload and not isinstance(payload["id"], str):
        errors.append("payload.id 는 string 이어야 한다")

    if "name" in payload:
        name = payload["name"]
        if not isinstance(name, str):
            errors.append("payload.name 은 string 이어야 한다")
        elif len(name) > NAME_MAX:
            errors.append(f"payload.name 이 {len(name)}자로 상한 {NAME_MAX} 초과")


def validate_row(row: dict[str, Any]) -> list[str]:
    """insert 할 posts 행 하나를 검증하고 문제 목록을 돌려준다(빈 리스트 = 통과)."""
    errors: list[str] = []

    title = row.get("title")
    if not isinstance(title, str) or not title.strip():
        errors.append("title 이 비어 있다 (1자 이상 필수)")
    elif len(title.strip()) > TITLE_MAX:
        errors.append(f"title 이 {len(title.strip())}자로 상한 {TITLE_MAX} 초과")

    description = row.get("description")
    if description is not None:
        if not isinstance(description, str):
            errors.append("description 이 string 도 null 도 아니다")
        elif len(description) > DESCRIPTION_MAX:
            errors.append(f"description 이 {len(description)}자로 상한 {DESCRIPTION_MAX} 초과")

    body = row.get("body")
    if body is not None:
        if not isinstance(body, str):
            errors.append("body 가 string 도 null 도 아니다")
        elif len(body.encode("utf-8")) > BODY_MAX:
            errors.append(f"body 가 {len(body.encode('utf-8'))}바이트로 상한 {BODY_MAX} 초과")

    if "user_id" not in row or not row.get("user_id"):
        errors.append("user_id 가 없다 — check_account.py 로 먼저 확인해라")

    kind = row.get("kind")
    if kind is not None and kind not in KINDS:
        errors.append(f"kind 가 {kind!r} — 허용: {KINDS}")

    category = row.get("category")
    if category is not None and category not in CATEGORIES:
        errors.append(f"category 가 {category!r} — 허용: {CATEGORIES}")

    # 발행 규율: 공개 여부는 사용자가 앱에서 판단한다. 도구는 비공개만 넣는다.
    if row.get("is_public") is not False:
        errors.append("is_public 이 false 가 아니다 — 이 도구는 비공개 발행 전용이다")

    if "payload" not in row:
        errors.append("payload 가 없다 (NOT NULL)")
    else:
        validate_payload(row["payload"], errors)

    sim_summary = row.get("sim_summary")
    if sim_summary is not None:
        if not isinstance(sim_summary, dict):
            errors.append("sim_summary 가 object 가 아니다")
        else:
            size = _byte_len(sim_summary)
            if size > SIM_SUMMARY_MAX_BYTES:
                errors.append(f"sim_summary 가 {size}바이트로 상한 {SIM_SUMMARY_MAX_BYTES} 초과")

    return errors


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__)
        return 2

    path = Path(sys.argv[1])
    if not path.exists():
        print(f"✗ 파일이 없다: {path}")
        return 1

    row = json.loads(path.read_text(encoding="utf-8"))
    errors = validate_row(row)

    if errors:
        print(f"✗ 검증 실패 — {len(errors)}건")
        for error in errors:
            print(f"  · {error}")
        return 1

    print("✓ 검증 통과 — DB 제약(길이·enum·payload 구조·비공개)을 모두 만족한다")
    print(f"  title      : {row['title']}")
    print(f"  payload    : {_byte_len(row['payload'])} bytes")
    print(f"  is_public  : {row.get('is_public')}")
    print(f"  kind       : {row.get('kind')}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

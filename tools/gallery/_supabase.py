"""Supabase 접근 공용 모듈 — 갤러리 발행 도구들이 공유한다.

설계 원칙 세 가지.

1. **외부 의존성 0** — 표준 라이브러리만 쓴다(`urllib`). `tools/indexer` 와 같은 규율이라
   새 clone 에서 `pip install` 없이 바로 돈다.
2. **비밀값은 절대 출력하지 않는다** — service_role 키는 RLS 를 통째로 우회한다. 이 모듈은
   키를 반환하지도, repr 에 담지도 않는다. 에러 메시지에 응답 본문을 실을 때도 키는 헤더에만 있어
   본문에는 섞이지 않는다.
3. **읽기와 쓰기를 분리** — 쓰기 함수는 호출부가 명시적으로 부르게 두고, 기본 동작은 읽기다.
   실수로 import 만으로 무언가 써지는 일이 없어야 한다.
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
ENV_FILE = ROOT / ".env"


def _force_utf8_console() -> None:
    """Windows 기본 콘솔은 cp949 라 한국어 로그가 `UnicodeEncodeError` 로 죽는다.

    도구가 자기 출력 때문에 실패하는 건 말이 안 되므로 import 시점에 한 번 바꿔 둔다.
    (이 폴더의 CLI 는 전부 이 모듈을 import 하므로 여기 한 곳이면 충분하다.)
    """
    for stream in (sys.stdout, sys.stderr):
        reconfigure = getattr(stream, "reconfigure", None)
        if reconfigure is not None:
            try:
                reconfigure(encoding="utf-8", errors="replace")
            except (ValueError, OSError):
                pass


_force_utf8_console()


class SupabaseError(RuntimeError):
    """Supabase 호출 실패. 메시지에 **키는 절대 담지 않는다**."""


def load_env(path: Path = ENV_FILE) -> dict[str, str]:
    """`.env` 를 파싱한다. `python-dotenv` 를 쓰지 않는 이유는 의존성 0 원칙.

    - `KEY=VALUE` 형태만 읽는다. `export ` 접두는 떼고, 주석(`#`)과 빈 줄은 건너뛴다.
    - 값의 감싼 따옴표는 벗긴다.
    - 실제 프로세스 환경변수가 있으면 **그쪽을 우선**한다(CI/Vercel 에서 파일 없이 주입하는 경우).
    """
    values: dict[str, str] = {}

    if path.exists():
        for raw in path.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            if line.startswith("export "):
                line = line[len("export ") :]
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip()
            if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
                value = value[1:-1]
            if key:
                values[key] = value

    for key in (
        "VITE_SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "SUPABASE_ANON_KEY",
        "VITE_SUPABASE_PUBLISHABLE_KEY",
        "VITE_SUPABASE_ANON_KEY",
    ):
        if os.environ.get(key):
            values[key] = os.environ[key]

    return values


def require_credentials() -> tuple[str, str]:
    """(base_url, service_role_key) 를 돌려준다. 없으면 **무엇이 없는지만** 알리고 죽는다."""
    env = load_env()
    url = (env.get("VITE_SUPABASE_URL") or "").rstrip("/")
    key = env.get("SUPABASE_SERVICE_ROLE_KEY") or ""

    missing = [name for name, value in (("VITE_SUPABASE_URL", url), ("SUPABASE_SERVICE_ROLE_KEY", key)) if not value]
    if missing:
        raise SupabaseError(
            f"자격증명이 없다: {', '.join(missing)} — {ENV_FILE} 또는 환경변수에 설정해라."
        )

    return url, key


def _request(
    method: str,
    url: str,
    key: str,
    *,
    body: Any = None,
    extra_headers: dict[str, str] | None = None,
) -> Any:
    """service_role 로 REST 호출. 응답이 JSON 이면 파싱해 돌려준다.

    ⚠ 이 키는 RLS 를 우회한다. 호출부는 **정확히 필요한 한 건**만 요청해라.
    """
    payload = None if body is None else json.dumps(body).encode("utf-8")

    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    if extra_headers:
        headers.update(extra_headers)

    request = urllib.request.Request(url, data=payload, headers=headers, method=method)

    try:
        with urllib.request.urlopen(request) as response:
            raw = response.read().decode("utf-8")
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")
        # detail 에는 우리가 보낸 본문/DB 에러만 담긴다 — 키는 헤더에만 있어 새지 않는다.
        raise SupabaseError(f"{method} {url.split('?')[0]} → HTTP {error.code}\n{detail}") from None
    except urllib.error.URLError as error:
        raise SupabaseError(f"{method} 실패 — 네트워크/호스트 오류: {error.reason}") from None

    if not raw:
        return None

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return raw


def mint_user_access_token(email: str) -> str:
    """이메일 계정의 **사용자 세션 토큰**을 admin 권한으로 발급받는다.

    왜 필요한가: 이 프로젝트는 `service_role` 에 테이블 GRANT 를 주지 않는다
    (`20260714000000_community.sql` 은 `anon`/`authenticated` 에만 GRANT 한다).
    service_role 은 RLS 를 우회하지만 **GRANT 까지 우회하지는 못해서** posts 쓰기가 42501 로 막힌다.

    그래서 권한을 새로 열어 보안 설계를 바꾸는 대신, 계정 주인의 세션을 발급받아
    `authenticated` 로서 자기 글을 쓴다 — 글의 소유자가 실제로 그 사용자라는 점에서도 이쪽이 옳다.

    흐름: admin `generate_link`(매직링크 발급) → `verify`(토큰 교환) → access_token.
    메일은 발송되지 않는다(링크만 생성). 토큰은 **반환만** 하고 어디에도 기록하지 않는다.
    """
    url, key = require_credentials()

    link = _request(
        "POST",
        f"{url}/auth/v1/admin/generate_link",
        key,
        body={"type": "magiclink", "email": email},
    )

    properties = link.get("properties", link) if isinstance(link, dict) else {}
    hashed_token = properties.get("hashed_token")
    if not hashed_token:
        raise SupabaseError("generate_link 응답에 hashed_token 이 없다 — Supabase 버전 확인 필요")

    session = _request(
        "POST",
        f"{url}/auth/v1/verify",
        key,
        body={"type": "magiclink", "token_hash": hashed_token},
    )

    token = session.get("access_token") if isinstance(session, dict) else None
    if not token:
        raise SupabaseError("verify 응답에 access_token 이 없다")

    return token


def rpc(name: str, args: dict[str, Any]) -> Any:
    """service_role 로 RPC 를 호출한다.

    이 프로젝트는 service_role 에 테이블 GRANT 를 주지 않는다(`20260714000000`). 대신
    `20260729000000_publish_private_post_rpc.sql` 이 **행위 하나**(비공개 글 1건 생성)만
    service_role 에 열어 두었다 — 그래서 발행은 테이블 insert 가 아니라 이 경로로 간다.
    """
    url, key = require_credentials()
    return _request("POST", f"{url}/rest/v1/rpc/{name}", key, body=args)


def rest_insert_as_user(path: str, row: dict[str, Any], access_token: str) -> Any:
    """사용자 세션(`authenticated`)으로 insert. RLS 정책이 그대로 적용된다 — 그게 의도다."""
    url, key = require_credentials()
    return _request(
        "POST",
        f"{url}/rest/v1/{path}",
        key,
        body=row,
        extra_headers={"Prefer": "return=representation", "Authorization": f"Bearer {access_token}"},
    )


def rest_get_as_user(path: str, query: str, access_token: str) -> Any:
    """사용자 세션으로 읽기. 비공개 글은 소유자 세션이라야 보인다(RLS)."""
    url, key = require_credentials()
    suffix = f"?{query}" if query else ""
    return _request(
        "GET",
        f"{url}/rest/v1/{path}{suffix}",
        key,
        extra_headers={"Authorization": f"Bearer {access_token}"},
    )


def require_public_credentials() -> tuple[str, str]:
    """(base_url, 공개키) 를 돌려준다. 공개키는 `anon` 롤로 붙는 키다.

    키 이름은 Supabase 세대에 따라 다르다 — 신형은 `sb_publishable_…`(PUBLISHABLE), 구형은 anon 키.
    api/*.js 가 쓰는 것과 **같은 폴백 순서**를 따른다(한쪽만 채운 환경에서도 도구가 돌아야 한다).
    """
    env = load_env()
    url = (env.get("VITE_SUPABASE_URL") or "").rstrip("/")
    key = (
        env.get("SUPABASE_ANON_KEY")
        or env.get("VITE_SUPABASE_PUBLISHABLE_KEY")
        or env.get("VITE_SUPABASE_ANON_KEY")
        or ""
    )

    if not url or not key:
        raise SupabaseError(
            "공개키 자격증명이 없다: VITE_SUPABASE_URL 과 "
            "SUPABASE_ANON_KEY / VITE_SUPABASE_PUBLISHABLE_KEY / VITE_SUPABASE_ANON_KEY 중 하나가 필요하다."
        )

    return url, key


def rest_get_public(path: str, query: str = "") -> Any:
    """**anon 롤**로 PostgREST 읽기.

    왜 service_role 이 아니라 이쪽인가: 이 프로젝트는 service_role 에 테이블 GRANT 를 주지 않는다
    (`20260714000000_community.sql`). service_role 은 RLS 는 우회해도 **GRANT 는 우회하지 못해서**
    `profiles` 같은 공개 테이블조차 42501 로 막힌다. `profiles` 는 애초에 `anon` 에게 select 가
    열린 완전 공개 테이블이므로(같은 마이그레이션) 공개키로 읽는 게 정답이다.

    ⚠ RLS 는 그대로 적용된다 — 비공개 행은 이 경로로 보이지 않는다.
    """
    url, key = require_public_credentials()
    suffix = f"?{query}" if query else ""
    return _request("GET", f"{url}/rest/v1/{path}{suffix}", key)


def rest_get(path: str, query: str = "") -> Any:
    """PostgREST 읽기. `path` 는 테이블명(예: `posts`).

    ⚠ service_role 키로 붙는다 — 공개 테이블 읽기에는 **`rest_get_public` 을 써라**(위 설명 참고).
    """
    url, key = require_credentials()
    suffix = f"?{query}" if query else ""
    return _request("GET", f"{url}/rest/v1/{path}{suffix}", key)


def rest_insert(path: str, row: dict[str, Any]) -> Any:
    """PostgREST 단건 insert. 삽입된 행을 돌려받는다(`Prefer: return=representation`)."""
    url, key = require_credentials()
    return _request(
        "POST",
        f"{url}/rest/v1/{path}",
        key,
        body=row,
        extra_headers={"Prefer": "return=representation"},
    )


def admin_get(path: str, query: str = "") -> Any:
    """Auth Admin API 읽기(`/auth/v1/admin/...`). `auth.users` 는 PostgREST 로 못 읽어서 필요하다."""
    url, key = require_credentials()
    suffix = f"?{query}" if query else ""
    return _request("GET", f"{url}/auth/v1/admin/{path}{suffix}", key)


def find_user_by_email(email: str) -> dict[str, Any] | None:
    """이메일로 auth 사용자를 찾는다. 없으면 None.

    `profiles` 에는 이메일이 없다(PII 금지 설계 — profiles 는 anon 도 읽는 공개 테이블).
    그래서 이메일 → id 해석은 Admin API 를 거쳐야 한다.
    """
    target = email.strip().lower()

    # 필터 지원 여부가 버전마다 달라 목록을 훑는다. 페이지를 넉넉히 돌되 무한루프는 막는다.
    for page in range(1, 51):
        result = admin_get("users", f"page={page}&per_page=200")
        users = result.get("users", []) if isinstance(result, dict) else (result or [])
        if not users:
            return None
        for user in users:
            if (user.get("email") or "").strip().lower() == target:
                return user
        if len(users) < 200:
            return None

    return None

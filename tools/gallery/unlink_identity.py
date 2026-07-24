"""계정에 연결된 소셜 identity 하나를 끊는다 (Auth Admin API).

    python tools/gallery/unlink_identity.py <email> <provider>            # 예행연습(기본)
    python tools/gallery/unlink_identity.py <email> <provider> --commit   # 실제 해제

배경: Supabase 는 새 소셜 로그인이 **기존 계정과 같은 이메일**을 들고 오고 그 이메일이 공급자에
의해 **검증된** 경우, 새 계정을 만들지 않고 기존 계정에 identity 를 붙인다(automatic identity
linking). 그래서 구글로 만든 계정에 카카오로 로그인해도 같은 user_id 가 되고 프로필·닉네임·글이
전부 공유된다.

⚠ **끊어도 영구 분리가 아니다.** 다음에 같은 공급자로 로그인하면 조건(검증된 동일 이메일)이 그대로라
   다시 연결된다. 분리를 유지하려면 그 조건 자체를 없애야 한다(공급자에서 이메일 scope 미요청 등).

⚠ 남은 identity 가 0 이 되는 해제는 하지 않는다 — 계정에 로그인 수단이 사라진다.
   이 스크립트가 먼저 막는다(서버도 거부하지만, 여기서 사유를 분명히 알려준다).

데이터 귀속: 해제해도 **글·댓글·좋아요는 원래 계정에 그대로 남는다**(posts.user_id 는 그 계정을
가리킨다). 즉 "지금까지 쓴 글은 남은 계정 소유"가 자동으로 성립한다.
"""

from __future__ import annotations

import sys

from _supabase import SupabaseError, admin_get, find_user_by_email, require_credentials, _request


def unlink(email: str, provider: str, commit: bool) -> int:
    print(f"[1/3] 계정 조회 — {email}")
    user = find_user_by_email(email)
    if user is None:
        print(f"  ✗ 계정이 없다: {email}")
        return 1

    user_id = user["id"]
    detail = admin_get(f"users/{user_id}")
    identities = (detail.get("identities") if isinstance(detail, dict) else None) or []

    print(f"  ✓ user_id = {user_id} · 연결된 identity {len(identities)}개")
    for identity in identities:
        data = identity.get("identity_data") or {}
        print(f"      · {identity.get('provider')} / email={data.get('email')} / verified={data.get('email_verified')}")

    target = next((i for i in identities if i.get("provider") == provider), None)
    if target is None:
        print(f"  ✗ '{provider}' identity 가 이 계정에 없다 — 이미 분리됐거나 연결된 적이 없다.")
        return 1

    if len(identities) <= 1:
        print("  ✗ 마지막 남은 identity 라 끊을 수 없다 — 계정에 로그인 수단이 사라진다.")
        return 1

    remaining = [i.get("provider") for i in identities if i is not target]
    print(f"[2/3] 해제 대상 — {provider} (해제 후 남는 수단: {', '.join(str(r) for r in remaining)})")
    print("      글·댓글·좋아요는 이 계정에 그대로 남는다(소유자 변경 없음).")

    if not commit:
        print("[3/3] 예행연습 — 아무것도 바꾸지 않았다. 실제로 끊으려면 --commit 을 붙여라.")
        return 0

    url, key = require_credentials()
    # ⚠ 경로에 들어갈 값은 `identity_id`(GoTrue 가 만든 UUID)다. `id` 는 **공급자 쪽 사용자 id**
    #   (카카오 `4995106957`, 구글 `1041822…`)라서 그걸 쓰면 라우트가 매칭되지 않아 404 가 난다.
    identity_id = target.get("identity_id")
    if not identity_id:
        print("  ✗ identity_id 가 없다 — 이 GoTrue 버전은 identity 해제를 지원하지 않을 수 있다.")
        return 1

    _request("DELETE", f"{url}/auth/v1/admin/users/{user_id}/identities/{identity_id}", key)

    print("[3/3] 해제 후 재조회")
    after = admin_get(f"users/{user_id}")
    left = (after.get("identities") if isinstance(after, dict) else None) or []
    print(f"  ✓ 남은 identity {len(left)}개: {', '.join(str(i.get('provider')) for i in left)}")

    if any(i.get("provider") == provider for i in left):
        print(f"  ✗ '{provider}' 가 아직 남아 있다 — 해제가 반영되지 않았다.")
        return 1

    print()
    print(f"'{provider}' 를 분리했다. 다만 같은 이메일로 다시 로그인하면 재연결될 수 있다(문서 상단 경고 참고).")
    return 0


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    commit = "--commit" in sys.argv[1:]

    if len(args) != 2:
        print(__doc__)
        return 2

    try:
        return unlink(args[0], args[1], commit)
    except SupabaseError as error:
        print(f"✗ {error}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

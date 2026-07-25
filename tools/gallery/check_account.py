"""계정 확인 — 이메일이 실제로 존재하는지, 프로필과 글 쿼터 상태가 어떤지 본다.

**읽기 전용.** 발행 전에 먼저 돌려서 "글을 넣을 대상"이 실재하는지 확인한다.

    python tools/gallery/check_account.py headtotoe1205@gmail.com

성공하면 exit 0 과 함께 user_id 를 출력한다(다음 단계 insert 에 그대로 쓴다).
계정이 없거나 프로필이 없으면 exit 1 — 그 상태로 insert 하면 FK 위반으로 실패한다.
"""

from __future__ import annotations

import sys
from urllib.parse import quote

from _supabase import SupabaseError, admin_get, find_user_by_email, rest_get, rest_get_public

# posts 테이블의 1인당 상한 (마이그레이션 20260714000000 의 enforce_scenario_quota 트리거).
POST_QUOTA = 30


def check(email: str) -> int:
    print(f"[1/3] auth 사용자 조회 — {email}")
    user = find_user_by_email(email)

    if user is None:
        print(f"  ✗ 계정이 없다: {email}")
        print("    → 이 이메일로 앱에 한 번 로그인해 계정을 만든 뒤 다시 실행해라.")
        return 1

    user_id = user.get("id")
    print(f"  ✓ user_id = {user_id}")
    print(f"    가입: {user.get('created_at')} / 최근 로그인: {user.get('last_sign_in_at')}")

    providers = (user.get("app_metadata") or {}).get("providers")
    if providers:
        print(f"    로그인 수단: {', '.join(providers)}")

    # 연결된 identity 들. Supabase 는 **검증된 이메일이 같으면** 여러 소셜 로그인을 한 계정에 묶는다
    # (identity linking). 그래서 구글로 만든 계정에 카카오로 로그인해도 같은 user_id 가 되고,
    # 프로필(닉네임)도 하나를 공유한다. 아래 출력이 그 사실을 눈으로 확인시켜 준다.
    #
    # ⚠ 목록 엔드포인트(`admin/users`)의 항목에는 identities 가 실려오지 않는다 — 단건 조회로 다시 읽는다.
    detail = admin_get(f"users/{user_id}")
    identities = (detail.get("identities") if isinstance(detail, dict) else None) or []
    if identities:
        print(f"    연결된 identity {len(identities)}개:")
        for identity in identities:
            data = identity.get("identity_data") or {}
            print(
                f"      · {identity.get('provider')}"
                f" / email={data.get('email')}"
                f" / verified={data.get('email_verified')}"
                f" / 연결일={identity.get('created_at')}"
            )

    print("[2/3] profiles 행 조회")
    # posts.user_id 의 FK 대상은 auth.users 가 아니라 profiles 다 — 여기가 비면 insert 가 깨진다.
    #
    # ⚠ 여기는 **공개키(anon)** 로 읽는다. service_role 로 읽으면 42501 로 막힌다 —
    #   이 프로젝트는 service_role 에 테이블 GRANT 를 주지 않고, profiles 는 anon 에게
    #   select 가 열린 공개 테이블이기 때문이다(20260714000000_community.sql).
    profiles = rest_get_public("profiles", f"id=eq.{quote(str(user_id))}&select=id,display_name,created_at")

    if not profiles:
        print("  ✗ profiles 행이 없다 — posts.user_id 의 FK 대상이라 이 상태로는 insert 가 실패한다.")
        print("    → 앱에 한 번 로그인하면 트리거가 프로필을 자동 생성한다.")
        return 1

    profile = profiles[0]
    print(f"  ✓ display_name = {profile.get('display_name')}")

    print("[3/3] 글 쿼터 확인")
    # 정확한 쿼터는 **비공개 글까지** 세야 한다. service_role 은 GRANT 가 없어 42501 로 막히고,
    # 공개키는 RLS 상 공개 글만 본다 — 즉 어느 경로로도 소유자 시점의 정확한 수를 얻을 수 없다.
    # 그래서 세어지는 만큼만 세고, **하한선임을 분명히 밝힌다**(모르면서 아는 척하지 않는다).
    try:
        posts = rest_get("posts", f"user_id=eq.{quote(str(user_id))}&select=id,kind,is_public")
    except SupabaseError as error:
        if "42501" not in str(error) and "permission denied" not in str(error):
            raise
        posts = rest_get_public("posts", f"user_id=eq.{quote(str(user_id))}&select=id,kind,is_public")
        total = len(posts or [])
        print(f"  · 공개 글 {total}개 확인 (비공개는 anon 권한으로 보이지 않는다 — RLS)")
        print(f"    → 쿼터({POST_QUOTA}개) 정확 판정 불가. 넘었다면 insert 시 트리거가 거부한다.")
        print()
        print(f"USER_ID={user_id}")
        return 0

    total = len(posts or [])
    private_count = sum(1 for post in (posts or []) if not post.get("is_public"))
    print(f"  ✓ 보유 글 {total}/{POST_QUOTA}개 (비공개 {private_count}개)")

    if total >= POST_QUOTA:
        print(f"  ✗ 쿼터가 찼다 — 트리거가 새 insert 를 거부한다. 기존 글을 지우고 다시 시도해라.")
        return 1

    print()
    print(f"USER_ID={user_id}")
    return 0


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__)
        return 2

    try:
        return check(sys.argv[1])
    except SupabaseError as error:
        print(f"✗ {error}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

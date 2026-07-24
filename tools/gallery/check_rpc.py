"""발행용 RPC 가 실제로 존재하는지 확인한다 — **읽기 전용**(함수를 호출하지 않는다).

PostgREST 는 루트(`/rest/v1/`)에서 OpenAPI 스펙을 준다. 거기에 노출된 RPC 목록과 파라미터를
읽어, 마이그레이션이 의도대로 적용됐는지 **행을 만들지 않고** 검증한다.

    python tools/gallery/check_rpc.py                        # 전체 RPC 목록
    python tools/gallery/check_rpc.py publish_private_post   # 특정 RPC 시그니처

RPC 호출로 확인하면 글이 실제로 생겨 버린다. 그래서 스펙을 읽는 이 방법을 쓴다.
"""

from __future__ import annotations

import sys
from typing import Any

from _supabase import SupabaseError, require_credentials, _request


def fetch_spec() -> dict[str, Any]:
    url, key = require_credentials()
    spec = _request("GET", f"{url}/rest/v1/", key)
    if not isinstance(spec, dict):
        raise SupabaseError("OpenAPI 스펙을 읽지 못했다 — 응답이 object 가 아니다")
    return spec


def list_rpcs(spec: dict[str, Any]) -> dict[str, Any]:
    return {
        path[len("/rpc/") :]: body
        for path, body in (spec.get("paths") or {}).items()
        if path.startswith("/rpc/")
    }


def describe(spec: dict[str, Any], name: str) -> int:
    rpcs = list_rpcs(spec)

    if name not in rpcs:
        print(f"✗ RPC 가 없다: {name}")
        print("  → 마이그레이션이 적용되지 않았거나, service_role 에 execute 권한이 없다.")
        print(f"  현재 노출된 RPC: {', '.join(sorted(rpcs)) or '(없음)'}")
        return 1

    print(f"✓ RPC 존재: {name}")

    # 파라미터는 POST body 스키마의 definitions 에 들어온다. 버전에 따라 위치가 달라
    # 찾지 못해도 실패로 치지 않는다 — 존재 확인이 이 스크립트의 목적이다.
    for method, operation in (rpcs[name] or {}).items():
        for parameter in operation.get("parameters", []):
            schema = parameter.get("schema") or {}
            ref = schema.get("$ref", "")
            definition = (spec.get("definitions") or {}).get(ref.rsplit("/", 1)[-1], {})
            properties = definition.get("properties") or {}
            if properties:
                print(f"  [{method.upper()}] 파라미터:")
                for key, value in properties.items():
                    print(f"    · {key}: {value.get('format') or value.get('type')}")
    return 0


def main() -> int:
    try:
        spec = fetch_spec()
    except SupabaseError as error:
        print(f"✗ {error}")
        return 1

    if len(sys.argv) == 1:
        rpcs = list_rpcs(spec)
        print(f"노출된 RPC {len(rpcs)}개:")
        for name in sorted(rpcs):
            print(f"  · {name}")
        return 0

    return describe(spec, sys.argv[1])


if __name__ == "__main__":
    raise SystemExit(main())

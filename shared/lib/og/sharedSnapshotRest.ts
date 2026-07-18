import type { SharedSnapshotEnvelope } from '@/shared/lib/supabase';

/**
 * 서버(api/) 전용 공유 스냅샷 조회 — `get_shared_snapshot` RPC 를 **anon 키 plain REST** 로 호출한다.
 *
 * api/og.tsx 와 api/share-html.ts 가 공유한다. 앱의 IO 레이어(shared/lib/supabase/sharedSnapshots.ts)는
 * `@supabase/supabase-js` 클라이언트를 받지만, 여기선 SDK 를 끌어오지 않고 fetch 로 직접 호출한다:
 *   - get RPC 는 SECURITY DEFINER + anon 실행 GRANT 라 service_role 이 필요 없다(익명 조회 의도).
 *   - SDK 를 import 하면 함수 번들이 무거워지고, api/og 는 이미 satori/wasm 로 빠듯하다.
 *
 * ## 서버 세이프 규약 (og.tsx 함정)
 * `import.meta.env` 를 **모듈 스코프에서 읽지 않는다** — Vercel Node 런타임엔 import.meta.env 가 없어
 * import 되는 순간 TypeError 로 함수가 죽는다(try/catch 로도 못 잡는 모듈 평가 단계). 그래서 env 는 전부
 * 핸들러 실행 중 `process.env` 로 읽는다(api/naver-auth.ts / api/account-delete.ts 와 동일 패턴).
 * `SharedSnapshotEnvelope` 는 **타입만** import 하므로(런타임 소거) supabase 배럴 코드가 딸려오지 않는다.
 */

type SupabaseRestConfig = {
  url: string;
  anonKey: string;
};

const readServerEnv = (name: string): string | undefined => {
  const value = process.env[name];
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
};

/**
 * Supabase REST 조회 설정을 process.env 에서 읽는다. 하나라도 없으면 null → 호출자는 조회를 건너뛰고
 * 폴백(기본 카드/무치환 셸)한다. anon 키는 공개값이라 새 서버 시크릿을 만들지 않고 기존 VITE_ 값을 재사용한다.
 * (SUPABASE_URL/ANON_KEY 는 서버 변수, VITE_* 는 앱 번들용 — 서버에도 존재하면 폴백으로 받는다.)
 */
export const readSupabaseRestConfig = (): SupabaseRestConfig | null => {
  const url = readServerEnv('SUPABASE_URL') ?? readServerEnv('VITE_SUPABASE_URL');
  const anonKey =
    readServerEnv('SUPABASE_ANON_KEY') ??
    readServerEnv('VITE_SUPABASE_PUBLISHABLE_KEY') ??
    readServerEnv('VITE_SUPABASE_ANON_KEY');
  if (!url || !anonKey) return null;
  return { url, anonKey };
};

/**
 * key 로 공유 스냅샷 payload 를 읽는다. **어떤 실패도 throw 하지 않는다** — 미설정/네트워크 실패/부재/만료/
 * 스키마 드리프트는 전부 null 로 흡수한다(크롤러가 미리보기를 포기하지 않도록 상위가 5xx 를 못 내게 하는 계약).
 */
export const fetchSharedSnapshotByKey = async (key: string): Promise<SharedSnapshotEnvelope | null> => {
  const config = readSupabaseRestConfig();
  if (!config) return null;

  try {
    const response = await fetch(`${config.url}/rest/v1/rpc/get_shared_snapshot`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        apikey: config.anonKey,
        authorization: `Bearer ${config.anonKey}`
      },
      body: JSON.stringify({ p_key: key })
    });
    if (!response.ok) return null;

    // get_shared_snapshot 은 jsonb 를 그대로 돌려준다 → 본문 = envelope({v,scenario}) 또는 null.
    const data = (await response.json().catch(() => null)) as SharedSnapshotEnvelope | null;
    return data ?? null;
  } catch {
    return null;
  }
};

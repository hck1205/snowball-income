import type { CommunityClient } from './queries';
import type { UserPortfolioStateRow, UserPortfolioCloudPayload } from './types';

/**
 * 내 포트폴리오 클라우드 슬롯 IO (`user_portfolio_states`).
 *
 * `userAppStates.ts` 와 같은 규율: **로직을 두지 않는다.** client 를 인자로 받아(테스트에 가짜 주입
 * 가능) PostgREST 호출만 조립한다. 정규화·정책·상태 전이는 상위(`pages/Portfolio/hooks`)가 한다.
 *
 * ⚠ 시뮬레이터(`user_app_states`)와 **다른 테이블**을 쓰는 이유
 *  - 시뮬레이터 슬롯은 `name = null` 한 행이고, `name != null` 은 사용자가 이름 붙인 저장이다.
 *    포트폴리오를 예약어 이름으로 끼워 넣으면 그 "내 저장" 목록에 섞여 나온다.
 *  - 이 레포는 이미 "포트폴리오는 자기 저장소만 만진다"(별도 IndexedDB `snowball-portfolio`)를
 *    지키고 있다. 클라우드에서도 같은 경계를 유지한다.
 *  - 테이블이 `user_id` 를 primary key 로 두어 **1인 1행이 스키마로 강제**된다.
 *
 * ⚠ payload 는 서버에서 신뢰하지 않는다 — 읽기 결과는 호출자가 정규화해야 한다
 *   (이 계층은 행을 그대로 돌려줄 뿐이다).
 */

const PORTFOLIO_STATE_COLUMNS = 'user_id,payload,updated_at';

const unwrap = <T>(result: { data: T | null; error: { message: string } | null }): T => {
  if (result.error) throw new Error(result.error.message);
  if (result.data === null) throw new Error('Supabase 응답이 비어 있습니다');
  return result.data;
};

/** 내 슬롯을 읽는다. 없으면 `null`(첫 로그인·미저장). RLS 가 내 행만 준다. */
export const fetchCloudPortfolio = async (client: CommunityClient): Promise<UserPortfolioStateRow | null> => {
  const rows = unwrap(
    await client
      .from('user_portfolio_states')
      .select(PORTFOLIO_STATE_COLUMNS)
      .limit(1)
      .returns<UserPortfolioStateRow[]>()
  );
  return rows[0] ?? null;
};

/**
 * 내 슬롯 upsert.
 *
 * `user_id` 가 primary key 라 `onConflict` upsert 가 깔끔하게 동작한다
 * (시뮬레이터 쪽은 partial unique index 라 존재 확인 → update/insert 로 나눠야 했다).
 *
 * ⚠ **`user_id` 를 넣지 않는다.** 이 레포는 위조를 막으려고 컬럼 단위로 GRANT 하고
 * (`grant insert (payload)`), 값은 `default auth.uid()` 가 채운다. 넣으면 그 컬럼에 쓰기 권한이
 * 없어 `permission denied for column user_id` 로 **전체 요청이 실패한다** — 2026-07-29 에 실제로
 * 그렇게 넣어서 화면이 "클라우드와 맞추지 못했습니다"에 갇혔다. `userAppStates.ts` 도 같은 이유로
 * `insert({ payload, name: null })` 만 보낸다.
 */
export const pushCloudPortfolio = async (
  client: CommunityClient,
  payload: UserPortfolioCloudPayload
): Promise<UserPortfolioStateRow> =>
  unwrap(
    await client
      .from('user_portfolio_states')
      .upsert({ payload }, { onConflict: 'user_id' })
      .select(PORTFOLIO_STATE_COLUMNS)
      .single()
      .returns<UserPortfolioStateRow>()
  );

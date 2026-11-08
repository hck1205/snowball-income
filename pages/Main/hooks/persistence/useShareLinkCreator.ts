import { useCallback } from 'react';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import { encodeSharedScenario, SHARE_LENGTH_LIMIT } from './shareLink';
import { buildShareUrl } from './shareUrl';
import { useWorkspaceSnapshot } from './useWorkspaceSnapshot';

/** 공유 링크 생성 결과. `copied` 가 거짓이면 클립보드가 막혀 URL 을 화면에 보여 줘야 한다. */
export type ShareLinkResult = { ok: true; url: string; copied: boolean } | { ok: false; message: string };

const copyShareUrl = async (url: string) => {
  try {
    await navigator.clipboard.writeText(url);
    return { ok: true as const, url, copied: true as const };
  } catch {
    return { ok: true as const, url, copied: false as const };
  }
};

/**
 * 지금 탭을 담은 공유 링크를 만들어 복사하는 함수(2026-11-09 분리).
 *
 * `usePortfolioPersistence` 의 `createShareLink` 를 **글자 그대로** 옮겼다 — 저장 훅은 이 훅을 불러 같은 이름으로
 * 계속 내보낸다(기존 호출부 무변경). 분리한 이유는 시뮬레이터 상단의 "결과 공유" 버튼이 저장 훅을 다시 부르지
 * 않고 이 기능만 쓰기 위해서다(저장 훅을 두 번 부르면 하이드레이션·자동 저장 효과가 두 번 돈다).
 * 🔴 링크 형식(`?share=` lz-string)은 바꾸지 않았다 — 공유 URL 은 사용자 자산이다.
 */
export const useShareLinkCreator = (): (() => Promise<ShareLinkResult>) => {
  const { buildCurrentScenariosSnapshot } = useWorkspaceSnapshot();

  /**
   * 공유 링크를 만든다 — **URL 에 담는 lz-string `?share=` 한 길뿐이다.**
   *
   * ## 🔴 DB 저장 경로를 왜 없앴나 (2026-08-09)
   *
   * 예전에는 활성 시나리오를 `shared_snapshots` 테이블에 넣고 짧은 `?s=<key>` URL 을 주는 길이
   * **먼저** 있었고, 그게 실패하면 이 lz-string 경로로 떨어졌다. 그 길을 판단 근거째로 걷어냈다.
   *
   * 붙였던 이유가 둘이었는데 실측해 보니 둘 다 서 있지 않았다:
   *
   * 1. **"URL 이 길어져 터진다"** — 아니다. `test/share/shareLengthCensus.test.ts` 로 실제 인코더에
   *    실제 프리셋을 넣어 재 보니 4000자 상한을 넘기려면 **73종목**이 필요하다. 30종목이 1823자
   *    (상한의 46%), 50종목이 2790자다. 배당 포트폴리오에서 73종목은 사실상 안 나온다.
   *    ⚠ v3 압축 인코딩(2026-02-18)이 DB 경로(2026-07-18)보다 **다섯 달 먼저** 들어와 있었다 —
   *      "옛날엔 인코딩이 뚱뚱했다"는 설명도 성립하지 않는다.
   * 2. **"OG 카드를 그리려면 서버가 payload 를 읽어야 한다"** — 아니다. `?share=` 링크도 카드가
   *    정상으로 그려진다. 서버리스 함수가 lz-string 을 직접 푼다(server/handlers/Og 의 `resolveCardModel`).
   *
   * 반면 대가는 실재했다. 생성 RPC 는 **로그인 없이 누구나** 부를 수 있고(공개 anon 키), 저장분에
   * 만료도 정리도 없었다. 한 건 64KB 이므로 반복 호출로 무료 용량을 채울 수 있는 상태였다.
   * 얻는 것이 "URL 이 짧아 보기 좋다" 하나뿐인데 치르는 값이 그것이라 길을 닫았다.
   *
   * ## ⚠ 기존 `?s=` 링크는 계속 열린다
   *
   * 닫은 것은 **쓰기뿐**이다. 이미 나간 링크를 읽는 세 경로(앱의 `applySharedScenario`,
   * 미들웨어의 메타 치환, OG 카드)는 그대로다 — 공유 URL 은 사용자 자산이라 끊지 않는다.
   * DB 쪽도 `create_shared_snapshot` 만 EXECUTE 를 회수했고 `get_shared_snapshot` 은 살아 있다
   * (supabase/migrations/20260811000000_close_shared_snapshot_writes.sql).
   */
  const createShareLink = async (): Promise<ShareLinkResult> => {
    const { scenarios, activeScenarioId: currentActiveScenarioId } = buildCurrentScenariosSnapshot();
    const activeScenario = scenarios.find((scenario) => scenario.id === currentActiveScenarioId) ?? null;
    if (!activeScenario) {
      return {
        ok: false as const,
        message: '공유할 탭을 찾을 수 없습니다.'
      };
    }

    const encoded = encodeSharedScenario(activeScenario);
    if (encoded.length > SHARE_LENGTH_LIMIT) {
      /*
       * 실측상 73종목 이상이라야 여기 닿는다. 폴백이 사라졌으므로 이 자리가 곧 **공유 실패**다 —
       * 그래서 조용히 넘어가지 않고 계측한다. 이 이벤트가 실제로 찍히기 시작하면 상한을 올릴지
       * (브라우저는 4000자보다 훨씬 긴 URL 을 받는다) 판단할 근거가 된다.
       */
      trackEvent(ANALYTICS_EVENT.OPERATION_ERROR, {
        operation: 'create_share_link',
        reason: 'payload_too_large'
      });
      return {
        ok: false as const,
        message: `공유 데이터가 너무 큽니다. (현재 ${encoded.length}자, 최대 ${SHARE_LENGTH_LIMIT}자)`
      };
    }
    return copyShareUrl(buildShareUrl(window.location.href, encoded));
  };

  // 렌더마다 새 함수(옮기기 전과 같다). 메모는 스냅샷 빌더가 렌더 값을 닫아 두므로 의미가 없다.
  return useCallback(createShareLink, [createShareLink]);
};

import type { CloudReconciliationSummary } from '@/jotai/snowball/cloud';

/**
 * 충돌 화해 모달의 뷰 계약 — **props만 받아 렌더하는 순수 뷰**다.
 * 화해 액션(디바이스/클라우드/블렌드)·이연은 전부 콜백으로 위임하고, 무거운 시뮬 계산은 하지 않는다.
 * 요약(summary)·블렌드 미리보기(blendTabCount)는 순수 함수(summarizeReconciliation/previewBlend)가
 * 만든 값을 소비 측이 넘긴다.
 *
 * ⚠ merge-base 덕분에 이 모달은 **진짜 동시편집(양쪽 다 base에서 변함)일 때만, 세션당 1회** 뜬다 —
 *   단방향 변경은 엔진이 조용히 fast-forward하므로 여기 오지 않는다(위압적으로 자주 뜨지 않게 하는 핵심).
 */
export type CloudReconcileModalProps = {
  /** 좌(이 기기)/우(클라우드) 요약 — 탭 개수·이름 목록·마지막 편집 시각. */
  summary: CloudReconciliationSummary;
  /** previewBlend 결과 탭 개수("합치면 N개 탭"). */
  blendTabCount: number;
  /** now 주입(결정적 상대시간 테스트). 기본 new Date(). */
  now?: Date;
  /** 화해 IO 진행 중 — 선택지를 잠가 중복 실행을 막는다. */
  isResolving?: boolean;
  /** 직전 화해가 실패했는지 — 오류를 보여주고 같은 버튼을 재시도 경로로 안내한다(무음 실패 금지). */
  hasResolveFailed?: boolean;
  /** 이 기기 데이터로 맞추기(로컬 채택 → 클라우드 덮어씀). */
  onUseDevice: () => void;
  /** 클라우드 데이터로 맞추기(클라우드 채택 → 앱 적용+로컬 미러). */
  onUseCloud: () => void;
  /** 둘 다 합치기(합집합 병합 → 양쪽 반영, 비파괴·권장). */
  onBlend: () => void;
  /** 이연(결정 없이 닫기 = Esc·바깥클릭·닫기). 디바이스 유지 + 세션 push 정지 + 헤더 표면화. */
  onDefer: () => void;
};

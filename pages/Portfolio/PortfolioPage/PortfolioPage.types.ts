import type { PortfolioHoldingRowModel } from '../components';
import type { PortfolioAddInput, PortfolioAddResult } from '../hooks';
import type { PortfolioUniverseEntry } from '../utils';

export type PortfolioPageProps = {
  /** '오늘' 주입(테스트 전용). 미지정이면 컨테이너가 마운트 시점의 시각을 고정해 쓴다. */
  now?: Date;
};

/** 요약 타일 1개. 값·힌트 모두 **이미 포맷된 문자열**이다 — 뷰는 계산하지 않는다. */
export type PortfolioTileModel = {
  label: string;
  value: string;
  hint?: string;
};

/**
 * 표의 행 모델은 `HoldingsTable` 이 소유한다(그 컴포넌트가 그리는 계약이므로) — 여기서는 재사용만 한다.
 * 페이지가 컴포넌트 타입을 쓰는 방향(페이지 → 컴포넌트)이라 순환이 생기지 않는다.
 */
export type PortfolioRowModel = PortfolioHoldingRowModel;

/**
 * CTA 1개. `disabled` 면 `hint` 는 **반드시** 사유를 담는다(무음 비활성 금지).
 * 활성 상태에서도 결과가 왜곡될 수 있으면 hint 로 먼저 말한다(유니버스 밖 종목 제외 등).
 */
export type PortfolioCtaModel = {
  disabled: boolean;
  hint: string | null;
};

export type PortfolioAssumptionRow = { label: string; value: string };

/**
 * 뷰가 그대로 그리는 화면 모델. **여기 없는 필드는 화면에 없다.**
 *
 * 상태 8종(A 로딩 / B 빈 상태 / C 정상 / D 수량 전부 미입력 / E 읽기 실패 / F 쓰기 실패 /
 * G FX / H 실행 취소)이 전부 명시적으로 표현된다 — 빈 화면으로 넘어가는 경로가 없다.
 */
export type PortfolioViewModel = {
  /** A — 저장소를 읽는 중. 값 자리는 골격, 카드는 `aria-busy`. */
  isLoading: boolean;
  /** B — 보유 0종(로드 완료). 요약·목록 카드를 빈 상태가 **대체**한다(카드 안 카드 금지). */
  showEmptyState: boolean;
  asOfLine: string;
  /** E·F — 저장소 실패. `role="alert"` 배너 문구. */
  storageError: string | null;
  /** G — 환율 실패. `role="status"` 배너 문구(달러로 계속 쓸 수 있으므로 낭독을 끊지 않는다). */
  fxError: string | null;
  heroTile: PortfolioTileModel;
  tiles: PortfolioTileModel[];
  /** #3(월 평균)과 #6(이번 달)의 개념 차이 안내. 이번 달이 0인데 월 평균이 있을 때만. */
  showMonthlyVsThisMonthNote: boolean;
  /** 요약 하단 "무엇이 빠졌는가" 줄들. */
  summaryNotes: string[];
  rows: PortfolioRowModel[];
  holdingsCount: number;
  simulateCta: PortfolioCtaModel;
  goalCta: PortfolioCtaModel;
  calendarCta: PortfolioCtaModel;
  assumptions: { summaryLabel: string; rows: PortfolioAssumptionRow[] };
  /** H — 직전 삭제 1건(8초). 값이 있으면 실행 취소 배너를 띄운다. */
  undoMessage: string | null;
};

export type PortfolioPickerModel = {
  isOpen: boolean;
  keyword: string;
  /** 검색어로 걸러진 유니버스 목록. */
  options: PortfolioUniverseEntry[];
  /** 이미 보유 중인 심볼(결과 행을 "보유 중"으로 바꾼다). */
  heldTickers: readonly string[];
};

export type PortfolioViewProps = {
  viewModel: PortfolioViewModel;
  /** 항상 마운트되는 라이브 리전 문구. */
  liveMessage: string;
  picker: PortfolioPickerModel;
  /** 세율 입력의 제어값(빈 문자열 중간 상태를 허용하려고 문자열로 쥔다). */
  taxInput: string;
  onTaxInputChange: (raw: string) => void;
  onTaxInputBlur: () => void;
  onOpenPicker: () => void;
  onClosePicker: () => void;
  onKeywordChange: (keyword: string) => void;
  /** 추가. **중복이면 추가하지 않고 사유를 돌려준다** — 뷰가 그 행으로 포커스를 옮긴다. */
  onAdd: (input: string | PortfolioAddInput) => PortfolioAddResult;
  onQuantityChange: (ticker: string, raw: string) => void;
  onQuantityBlur: (ticker: string) => void;
  onRemove: (ticker: string) => void;
  /** 실행 취소. 복원한 티커(없으면 `null`)를 돌려준다 — 뷰가 그 행의 수량 입력으로 포커스를 옮긴다. */
  onUndo: () => string | null;
  onSimulate: () => void;
  onOpenGoal: () => void;
  onOpenCalendar: () => void;
};

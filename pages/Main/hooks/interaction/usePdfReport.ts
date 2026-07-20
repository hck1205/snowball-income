import { useCallback, useRef, useState } from 'react';
import { useStore } from 'jotai/react';
import { selectAtom } from 'jotai/utils';
import { useAtomValue } from '@/jotai/atom';
import {
  activeScenarioIdAtom,
  fixedByTickerIdAtom,
  includedProfilesAtom,
  includedTickerIdsAtom,
  normalizedAllocationAtom,
  palettePresetAtom,
  scenarioTabsAtom,
  selectedTickerIdAtom,
  showPortfolioDividendCenterAtom,
  tickerProfilesAtom,
  validationAtom,
  weightByTickerIdAtom,
  yieldFormAtom
} from '@/jotai';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import { toPdfReportFailure, toPdfReportFailureReason } from './pdfReportError';
import type { PdfReportFailure } from './pdfReportError';

/**
 * 헤더 "더보기" 메뉴의 **PDF 리포트 저장** 배선.
 *
 * 두 가지를 지킨다:
 *
 * 1. **구독 최소화.** 메뉴는 헤더 크롬이라 타건마다 리렌더되면 안 된다. 그래서 폼/포트폴리오 원자를
 *    통째로 구독하지 않고 `selectAtom`으로 **불리언 두 개**(포트폴리오 비었나 / 입력이 유효한가)만
 *    구독한다 — 값이 실제로 뒤집힐 때만 리렌더된다. 리포트에 필요한 나머지 값은 **클릭 시점에**
 *    store에서 스냅샷으로 읽는다(구독 0).
 *
 * 2. **초기 번들 격리.** 생성 파이프라인(jspdf·html2canvas·echarts·react-dom/client)은
 *    `await import()`로만 로드한다. 메뉴를 열기만 해서는 아무것도 받지 않는다.
 */

/** 포트폴리오가 비었나 — 불리언만 구독해 타건 리렌더를 막는다. */
const isPortfolioEmptyAtom = selectAtom(includedProfilesAtom, (profiles) => profiles.length === 0);
/** 입력값이 유효하지 않나(= 결과 없음). */
const isInputInvalidAtom = selectAtom(validationAtom, (validation) => !validation.isValid);

/**
 * 비활성 사유는 **하나로 뭉치지 않는다** — 사용자가 취해야 할 행동이 다르기 때문이다
 * (종목을 담아야 하는가 vs 잘못 입력한 값을 고쳐야 하는가).
 */
export const PDF_REPORT_BLOCKED_EMPTY = '포트폴리오를 구성하면 리포트를 만들 수 있어요';
export const PDF_REPORT_BLOCKED_INVALID = '입력값 오류를 수정하면 리포트를 만들 수 있어요';

export type PdfReportController = {
  /** 생성 중 — 메뉴 항목을 비활성/aria-busy로 만들고, 메뉴는 닫지 않는다. */
  isGenerating: boolean;
  /**
   * 직전 시도의 실패 안내(없으면 null). 메뉴 안 인라인 알림(role=alert)으로 표면화한다.
   *
   * **불리언이 아니라 사유별 문구**인 이유: payload로 리포트를 만들 수 없는 실패(`report-unavailable`)에
   * "잠시 후 다시 시도해 주세요"는 틀린 안내다 — 몇 번을 눌러도 같은 결과다. 그 경우 `canRetry=false`로
   * 재시도 버튼 자체를 감춘다.
   */
  failure: PdfReportFailure | null;
  /** 비활성 사유(없으면 null). */
  blockedReason: string | null;
  /** 성공 시 true를 돌려준다(호출부가 메뉴를 닫고 포커스를 되돌리는 신호). */
  downloadPdfReport: () => Promise<boolean>;
};

export const usePdfReport = (): PdfReportController => {
  const store = useStore();
  const isPortfolioEmpty = useAtomValue(isPortfolioEmptyAtom);
  const isInputInvalid = useAtomValue(isInputInvalidAtom);

  const [isGenerating, setIsGenerating] = useState(false);
  const [failure, setFailure] = useState<PdfReportFailure | null>(null);
  /** 더블클릭으로 파이프라인이 두 번 도는 것을 막는다(state는 비동기라 게이트로 못 쓴다). */
  const inFlightRef = useRef(false);

  const blockedReason = isPortfolioEmpty
    ? PDF_REPORT_BLOCKED_EMPTY
    : isInputInvalid
      ? PDF_REPORT_BLOCKED_INVALID
      : null;

  const downloadPdfReport = useCallback(async (): Promise<boolean> => {
    if (inFlightRef.current) return false;
    inFlightRef.current = true;
    setIsGenerating(true);
    setFailure(null);

    try {
      // 클릭 시점 스냅샷 — 구독하지 않고 읽는다.
      const values = store.get(yieldFormAtom);
      const activeId = store.get(activeScenarioIdAtom);
      const scenarioName = store.get(scenarioTabsAtom).find((tab) => tab.id === activeId)?.name ?? '';

      const payload = {
        portfolio: {
          tickerProfiles: store.get(tickerProfilesAtom),
          includedTickerIds: store.get(includedTickerIdsAtom),
          weightByTickerId: store.get(weightByTickerIdAtom),
          fixedByTickerId: store.get(fixedByTickerIdAtom),
          selectedTickerId: store.get(selectedTickerIdAtom)
        },
        investmentSettings: {
          initialInvestment: values.initialInvestment,
          monthlyContribution: values.monthlyContribution,
          targetMonthlyDividend: values.targetMonthlyDividend,
          investmentStartDate: values.investmentStartDate,
          durationYears: values.durationYears,
          reinvestDividends: values.reinvestDividends,
          reinvestDividendPercent: values.reinvestDividendPercent,
          taxRate: values.taxRate,
          reinvestTiming: values.reinvestTiming,
          dpsGrowthMode: values.dpsGrowthMode
        }
      };

      const { generatePdfReport } = await import('./pdfReportPipeline');
      await generatePdfReport({
        payload,
        normalizedAllocation: store.get(normalizedAllocationAtom),
        scenarioName,
        presetId: store.get(palettePresetAtom),
        showPortfolioDividendCenter: store.get(showPortfolioDividendCenterAtom)
      });

      trackEvent(ANALYTICS_EVENT.CTA_CLICK, { cta_name: 'pdf_report', placement: 'header_overflow' });
      return true;
    } catch (error) {
      // 무음 실패 금지 — 메뉴 안 인라인 알림으로 **사유와 함께** 보여준다.
      // 계측에도 사유를 실어야 "계산 불가"와 "렌더 실패"의 발생 비율을 나눠 볼 수 있다.
      const reason = toPdfReportFailureReason(error);
      trackEvent(ANALYTICS_EVENT.OPERATION_ERROR, { operation: 'pdf_report', reason });
      setFailure(toPdfReportFailure(reason));
      return false;
    } finally {
      inFlightRef.current = false;
      setIsGenerating(false);
    }
  }, [store]);

  return { isGenerating, failure, blockedReason, downloadPdfReport };
};

import { formatSummaryKRW } from '@/shared/utils';
import type { ScenarioSimSummary } from '@/shared/lib/snowball';

/**
 * 투입 대비 배수 — §H 규칙: 파생값은 저장하지 않고 **표시 시점에** 계산한다(반올림 소수 1자리).
 * 투입 0원(스키마상 가능) 등 나눗셈이 성립하지 않으면 null → 호출부가 항목째 뺀다.
 */
export const toContributionMultiple = (
  summary: Pick<ScenarioSimSummary, 'finalAssetValue' | 'totalContribution'>
): number | null => {
  if (summary.totalContribution <= 0) return null;

  const multiple = Math.round((summary.finalAssetValue / summary.totalContribution) * 10) / 10;
  return Number.isFinite(multiple) ? multiple : null;
};

/** `×2.6` — 정수 배수도 자릿수를 유지해(×3.0) 목록에서 숫자 폭이 흔들리지 않게 한다. */
export const formatMultiple = (multiple: number): string => `×${multiple.toFixed(1)}`;

/**
 * card variant 전용 "조건 컨텍스트 줄"(스펙 §2·§5) — 결과(hero·보조)가 나온 **전제**를
 * 가장 약한 위계로 한 줄에 압축한다. 저장된 미표시 필드(초기·월 투입·기간·티커/목표)를
 * **표시만** 늘린다(재계산·백필 없음). 반환 순서 = 클램프 시 우선순위(초기·월 > 기간 > 티커/목표):
 * 좁은 카드에서 2줄을 넘기면 뒤 항목부터 잘린다.
 *
 * 목표 항목 분기:
 * - 달성(`targetReachedInYears !== null`): 목표는 **배지**가 말하므로 컨텍스트엔 **티커 수**를 넣는다.
 * - 미달성 + 목표 설정됨(`targetMonthlyDividend > 0`): **"목표 월 …"** 를 넣고 티커는 생략(줄 길이 관리).
 * - 목표 미설정(`targetMonthlyDividend <= 0`): 목표 항목 자체 생략(달성이면 티커만, 미달성이면 조건 3개).
 */
export const buildContextItems = (summary: ScenarioSimSummary): string[] => {
  const items = [
    `초기 ${formatSummaryKRW(summary.initialInvestment)}`,
    `월 ${formatSummaryKRW(summary.monthlyContribution)}`,
    `${summary.durationYears}년`
  ];

  if (summary.targetReachedInYears !== null) {
    items.push(`티커 ${summary.tickerCount}개`);
  } else if (summary.targetMonthlyDividend > 0) {
    items.push(`목표 월 ${formatSummaryKRW(summary.targetMonthlyDividend)}`);
  }

  return items;
};

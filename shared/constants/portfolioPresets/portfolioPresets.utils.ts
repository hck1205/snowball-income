import {
  PORTFOLIO_PRESET_GROUPS,
  PORTFOLIO_PRESET_PLACEHOLDERS,
  PORTFOLIO_PRESET_VISIBLE_PER_GROUP,
  type PortfolioPresetGroup,
  type PortfolioPresetPlaceholder
} from './portfolioPresets.constants';

export type PortfolioPresetGroupSection = {
  group: PortfolioPresetGroup;
  /** 처음부터 보이는 카드(그룹당 `PORTFOLIO_PRESET_VISIBLE_PER_GROUP` 장). */
  visible: PortfolioPresetPlaceholder[];
  /** "더 보기"가 여는 나머지. 비어 있으면 버튼 자체를 그리지 않는다. */
  hidden: PortfolioPresetPlaceholder[];
};

/**
 * 프리셋 목록을 **데이터에서** 성향 묶음으로 접는다.
 *
 * 🔴 어떤 프리셋이 어느 묶음인지는 **각 프리셋의 `group` 필드**가 유일한 출처다 —
 *    화면에 id 배열을 하드코딩하면 프리셋을 하나 추가할 때마다 두 곳이 어긋난다.
 * `visiblePerGroup` 은 **처음부터 펼쳐 두는 장수**다. 0 이면 그룹 이름만 서고 카드는 "더 보기"가 연다
 * (결과가 이미 있는 화면에서 프리셋 벽이 결과보다 길어지지 않게 하는 자리 — `variant='browse'`).
 * 그룹 순서는 `PORTFOLIO_PRESET_GROUPS` 순서, 그룹 안 순서는 원본 배열 순서를 그대로 따른다.
 * 어느 그룹에도 속하지 않는(=레지스트리에 없는 group 을 가진) 프리셋은 조용히 사라지지 않도록
 * **마지막 그룹**에 붙인다 — 타입이 먼저 막지만, 런타임에서도 카드가 증발하지 않게 한다.
 */
export const groupPortfolioPresets = (
  visiblePerGroup: number = PORTFOLIO_PRESET_VISIBLE_PER_GROUP,
  presets: readonly PortfolioPresetPlaceholder[] = PORTFOLIO_PRESET_PLACEHOLDERS,
  groups: readonly PortfolioPresetGroup[] = PORTFOLIO_PRESET_GROUPS
): PortfolioPresetGroupSection[] => {
  const known = new Set(groups.map((group) => group.id as string));
  const lastGroupId = groups.length > 0 ? groups[groups.length - 1].id : undefined;

  return groups.map((group) => {
    const members = presets.filter((preset) => {
      if (preset.group === group.id) return true;
      return group.id === lastGroupId && !known.has(preset.group);
    });

    const cut = Math.max(0, visiblePerGroup);
    return { group, visible: members.slice(0, cut), hidden: members.slice(cut) };
  });
};

/**
 * 프리셋 카드가 보여 주는 지표.
 *
 * 🔴 **`expectedMonthlyDividend`("약 40~50만원")를 여기 넣지 마라** — 그 값은 엔진이 계산한 결과가
 * 아니라 **손으로 적은 큐레이션 문구**다. 적용 전 카드에 얹으면 "이걸 고르면 월 40~50만원을 받는다"는
 * **근거 없는 수익 약속**으로 읽힌다(2026-08-01 사용자 결정 — 랜딩에서 막은 규칙을 시뮬레이터에도 적용).
 * 실제 숫자는 프리셋을 적용한 뒤 **결과 카드가 말한다**. 그게 유일하게 계산에서 나온 값이다.
 *
 * 남은 `investmentPeriod` 는 약속이 아니라 **그 구성이 전제하는 조건**이라 적용 전에도 참이다.
 * 나머지 조건도 마찬가지로 적용 후 결과가 말한다(4행 스펙표로 되돌아가지 마라 — 13장이 다시 같은 모양이 된다).
 */
export const buildPresetMetrics = (
  preset: PortfolioPresetPlaceholder
): { label: string; value: string }[] => [{ label: '투자 기간', value: preset.investmentPeriod }];

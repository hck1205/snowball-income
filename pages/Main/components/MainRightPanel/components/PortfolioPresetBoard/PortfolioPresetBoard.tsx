import { useCallback, useId, useMemo, useState } from 'react';
import { Card } from '@/components';
import { TOUR_TARGET } from '@/shared/constants';
import {
  PORTFOLIO_PRESET_VISIBLE_PER_GROUP,
  PRESET_ICON_BY_ID,
  PRESET_ICON_FALLBACK,
  PRESET_ICON_STROKE,
  buildPresetMetrics,
  groupPortfolioPresets,
  type PortfolioPresetGroupId,
  type PortfolioPresetPlaceholder
} from '@/shared/constants/portfolioPresets';
import {
  PortfolioPresetAppliedTag,
  PortfolioPresetCardButton,
  PortfolioPresetCore,
  PortfolioPresetDesc,
  PortfolioPresetFallbackText,
  PortfolioPresetGrid,
  PortfolioPresetGroupBadge,
  PortfolioPresetGroupHead,
  PortfolioPresetGroupHint,
  PortfolioPresetGroups,
  PortfolioPresetGroupSection,
  PortfolioPresetGroupTitle,
  PortfolioPresetIcon,
  PortfolioPresetMetric,
  PortfolioPresetMetricLabel,
  PortfolioPresetMetrics,
  PortfolioPresetMetricValue,
  PortfolioPresetMoreButton,
  PortfolioPresetTitle,
  PortfolioPresetTitleRow,
  type PresetTone
} from './PortfolioPresetBoard.styled';
import type { PortfolioPresetBoardProps } from './PortfolioPresetBoard.types';

const BOARD_COPY = {
  onboarding: {
    title: '추천 포트폴리오로 시작해보세요',
    subtitle: '하나를 고르면 설정이 자동으로 채워집니다. 언제든 투자 설정에서 바꿀 수 있습니다.'
  },
  browse: {
    title: '다른 구성으로 바꿔 보세요',
    subtitle: '성향을 펼쳐 고르면 위 결과가 그 구성으로 다시 계산됩니다.'
  }
} as const;

/**
 * 처음부터 펼쳐 두는 카드 수.
 * `browse` 는 **0** 이다 — 결과가 이미 있는 화면에서 프리셋 벽이 결과보다 길어지면 화면의 주인이 바뀐다.
 * 그룹 이름 네 줄만 남기고 카드는 사용자가 펼칠 때 그린다.
 */
const VISIBLE_PER_GROUP_BY_VARIANT = { onboarding: PORTFOLIO_PRESET_VISIBLE_PER_GROUP, browse: 0 } as const;

/**
 * 시뮬레이션 결과가 없을 때의 대체 카드이자, **결과가 있을 때 아래에 붙는 "다른 구성" 고르개**다.
 *
 * 2026-07-31 리워크 V1 로 세 가지가 바뀌었다.
 *  ① 13지선다 → **성향 4묶음 × 2장 + 더 보기**(묶음은 데이터에서 파생 — `groupPortfolioPresets`).
 *  ② 카드의 4행 스펙표 → **지표 2개**(목표 월배당·투자 기간). 나머지는 적용 후 결과가 말한다.
 *  ③ `variant='browse'` — 첫 방문 프리필처럼 **결과가 이미 있는 화면**에서도 쓰인다.
 *     그때는 장식 워시(`wash`)가 아니라 평범한 본문 카드다(한 화면 틴트 면 상한 보호).
 *
 * 🔴 `TOUR_TARGET.portfolioPresets` 앵커는 그룹 스택에 붙어 있다 — 이 보드를 옮기거나 갈아끼울 때
 *    앵커를 함께 옮겨라. 앵커가 사라져도 화면은 멀쩡하고 전 스위트가 그린이다(투어만 조용히 건너뛴다).
 */
function PortfolioPresetBoard({
  isPortfolioEmpty,
  onPresetSelect,
  variant = 'onboarding',
  appliedPresetId = null
}: PortfolioPresetBoardProps) {
  const headingIdPrefix = useId();
  const sections = useMemo(() => groupPortfolioPresets(VISIBLE_PER_GROUP_BY_VARIANT[variant]), [variant]);
  const [expandedGroups, setExpandedGroups] = useState<readonly PortfolioPresetGroupId[]>([]);

  const toggleGroup = useCallback((groupId: PortfolioPresetGroupId) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]
    );
  }, []);

  const copy = BOARD_COPY[variant];
  const visiblePerGroup = VISIBLE_PER_GROUP_BY_VARIANT[variant];

  if (!isPortfolioEmpty && variant === 'onboarding') {
    return (
      <Card title="결과">
        <PortfolioPresetFallbackText>입력값 오류를 수정하면 결과가 표시됩니다.</PortfolioPresetFallbackText>
      </Card>
    );
  }

  const renderCard = (preset: PortfolioPresetPlaceholder, tone: PresetTone) => {
    const PresetIcon = PRESET_ICON_BY_ID[preset.id] ?? PRESET_ICON_FALLBACK;
    const isApplied = appliedPresetId === preset.id;

    return (
      <PortfolioPresetCardButton
        key={preset.id}
        type="button"
        aria-label={`${preset.title} 구성 적용`}
        onClick={() => onPresetSelect(preset)}
      >
        <PortfolioPresetTitleRow>
          <PortfolioPresetIcon tone={tone}>
            <PresetIcon size={18} strokeWidth={PRESET_ICON_STROKE} aria-hidden focusable={false} />
          </PortfolioPresetIcon>
          <PortfolioPresetTitle>{preset.title}</PortfolioPresetTitle>
          {isApplied ? <PortfolioPresetAppliedTag>지금 적용됨</PortfolioPresetAppliedTag> : null}
        </PortfolioPresetTitleRow>
        <PortfolioPresetDesc>{preset.hook}</PortfolioPresetDesc>
        <PortfolioPresetCore>{preset.coreType}</PortfolioPresetCore>
        <PortfolioPresetMetrics>
          {buildPresetMetrics(preset).map((metric) => (
            <PortfolioPresetMetric key={metric.label}>
              <PortfolioPresetMetricLabel>{metric.label}</PortfolioPresetMetricLabel>
              <PortfolioPresetMetricValue>{metric.value}</PortfolioPresetMetricValue>
            </PortfolioPresetMetric>
          ))}
        </PortfolioPresetMetrics>
      </PortfolioPresetCardButton>
    );
  };

  return (
    <Card
      /* 빈 상태는 이 앱의 첫인상이다 — 회색 면이 아니라 "여기서 시작하세요"라고 말하는
         장식 표면(파스텔 워시)으로 둔다. 결과가 이미 있는 화면(browse)에서는 평범한 본문 카드다:
         결과 카드들 아래에 2,000px 짜리 틴트 면이 또 깔리면 한 화면 틴트 상한을 넘는다. */
      tone={variant === 'onboarding' ? 'wash' : 'default'}
      title={copy.title}
      subtitle={copy.subtitle}
    >
      {/* `role="group"` 을 명시한다 — 이름표를 단 평범한 div 는 접근성 트리에서 이름이 **무시된다**
          (제네릭 역할엔 접근명이 붙지 않는다). 앵커도 이 요소가 갖는다. */}
      <PortfolioPresetGroups
        role="group"
        data-tour={TOUR_TARGET.portfolioPresets}
        aria-label="포트폴리오 프리셋 목록"
      >
        {sections.map(({ group, visible, hidden }) => {
          const headingId = `${headingIdPrefix}-${group.id}`;
          const isExpanded = expandedGroups.includes(group.id);
          const GroupIcon = group.icon;
          const shown = isExpanded ? [...visible, ...hidden] : visible;

          return (
            <PortfolioPresetGroupSection key={group.id} aria-labelledby={headingId}>
              <PortfolioPresetGroupHead>
                <PortfolioPresetGroupBadge tone={group.tone}>
                  <GroupIcon size={14} strokeWidth={PRESET_ICON_STROKE} aria-hidden focusable={false} />
                </PortfolioPresetGroupBadge>
                <PortfolioPresetGroupTitle id={headingId}>{group.label}</PortfolioPresetGroupTitle>
                <PortfolioPresetGroupHint>{group.hint}</PortfolioPresetGroupHint>
                {hidden.length > 0 ? (
                  <PortfolioPresetMoreButton
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() => toggleGroup(group.id)}
                  >
                    {isExpanded
                      ? '접기'
                      : `${hidden.length}개 ${visiblePerGroup > 0 ? '더 ' : ''}보기`}
                  </PortfolioPresetMoreButton>
                ) : null}
              </PortfolioPresetGroupHead>

              {shown.length > 0 ? (
                <PortfolioPresetGrid>{shown.map((preset) => renderCard(preset, group.tone))}</PortfolioPresetGrid>
              ) : null}
            </PortfolioPresetGroupSection>
          );
        })}
      </PortfolioPresetGroups>
    </Card>
  );
}

export default PortfolioPresetBoard;

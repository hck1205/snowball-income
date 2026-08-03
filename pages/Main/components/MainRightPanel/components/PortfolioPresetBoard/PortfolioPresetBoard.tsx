import { useCallback, useId, useMemo, useState } from 'react';
import { Card } from '@/components';
import { PickCard } from '@/components/common';
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
  PortfolioPresetCore,
  PortfolioPresetDesc,
  PortfolioPresetFacts,
  PortfolioPresetFallbackText,
  PortfolioPresetGrid,
  PortfolioPresetGroupBadge,
  PortfolioPresetGroupHead,
  PortfolioPresetGroupHint,
  PortfolioPresetGroups,
  PortfolioPresetGroupSection,
  PortfolioPresetGroupTitle,
  PortfolioPresetMetric,
  PortfolioPresetMetricLabel,
  PortfolioPresetMetrics,
  PortfolioPresetMetricValue,
  PortfolioPresetMoreButton,
  type PresetTone
} from './PortfolioPresetBoard.styled';
import { PRESET_CAP_AXIS } from './PortfolioPresetBoard.utils';
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

  /**
   * 카드 한 장. 껍데기(면·라운드 30~34px·6px 레일 캡·40px 글리프 배지·제목 크기·hover 부상)는
   * 공용 `PickCard` 가 소유한다 — 이 화면은 **무엇을 담을지**만 정한다.
   *
   * 🔴 **6요소 전부 그대로다**: 아이콘(캡 글리프) · 제목 · [지금 적용됨] 태그 · 훅 · coreType ·
   *    지표 2개. 하나라도 빠지면 "고르는 근거"가 카드 밖으로 나간다.
   *
   * `selected` 를 쓰지 않고 태그를 `titleRight` 로 넘기는 이유: 부품의 기본 배지는 "선택됨"이라고
   * 말하는데, 이 화면에서 정확한 말은 **"지금 적용됨"**(고른 것이 이미 계산에 반영돼 있다)이다.
   * 둘을 함께 켜면 같은 자리에 배지가 두 개 뜬다.
   */
  const renderCard = (preset: PortfolioPresetPlaceholder, tone: PresetTone) => {
    const PresetIcon = PRESET_ICON_BY_ID[preset.id] ?? PRESET_ICON_FALLBACK;
    const isApplied = appliedPresetId === preset.id;

    return (
      <PickCard
        key={preset.id}
        /* h3(묶음) → h4(카드). 레벨을 건너뛰지 않는다. */
        titleAs="h4"
        title={preset.title}
        ariaLabel={`${preset.title} 구성 적용`}
        onClick={() => onPresetSelect(preset)}
        titleRight={isApplied ? <PortfolioPresetAppliedTag>지금 적용됨</PortfolioPresetAppliedTag> : null}
        cap={{
          ...PRESET_CAP_AXIS[tone],
          kind: 'rail',
          /* 🔴 글리프는 타입상 필수다 — 레일 색이 단독 채널이 되면 회색조에서 묶음이 사라진다.
             프리셋마다 다른 모양이 색과 같은 것을 말한다. */
          glyph: <PresetIcon size={20} strokeWidth={PRESET_ICON_STROKE} aria-hidden focusable={false} />
        }}
      >
        <PortfolioPresetFacts>
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
        </PortfolioPresetFacts>
      </PickCard>
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

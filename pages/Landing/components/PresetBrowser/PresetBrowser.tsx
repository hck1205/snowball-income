import { useCallback, useId, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { PickCard } from '@/components/common';
import {
  PRESET_ICON_STROKE,
  groupPortfolioPresets,
  type PortfolioPresetGroupId
} from '@/shared/constants/portfolioPresets';
import { SIMULATOR_PATH } from '@/shared/constants/routes';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import { LANDING_COPY } from '../../copy';
import { PRESET_CAP_AXIS, buildAllocationSegments, formatAllocationText } from './PresetBrowser.utils';
import {
  AllocationBar,
  AllocationSegment,
  AllocationText,
  BrowserCta,
  BrowserCtaLine,
  BrowserRoot,
  GroupBadge,
  GroupHead,
  GroupHint,
  GroupSection,
  GroupTitle,
  MoreButton,
  PresetFacts,
  PresetGrid,
  PresetHook
} from './PresetBrowser.styled';

const copy = LANDING_COPY.presets;

/**
 * S6 — 전략·대가 포트폴리오 둘러보기.
 *
 * ## 데이터 규율 (🔴 여기서 사고가 난다)
 * 이 화면이 렌더하는 프리셋 필드는 **`title`·`hook`·`allocations` 뿐**이다.
 * `expectedMonthlyDividend`("목표 월배당 약 40~50만원")·`monthlyInvestment`·`targetInvestment`·
 * `investmentPeriod` 는 엔진이 계산한 값이 아니라 **사람이 손으로 적은 큐레이션 문구**라,
 * 로그인 없이 크롤러가 읽는 이 지면에 쓰면 근거 없는 수익 약속이 된다.
 * `coreType` 도 쓰지 않는다 — `allocations` 의 사본이라 어긋날 때 어느 쪽이 맞는지 알 수 없다.
 *
 * ## 묶음은 데이터에서 파생된다
 * 어떤 프리셋이 어느 묶음인지는 각 프리셋의 `group` 필드가 유일한 출처다(`groupPortfolioPresets`).
 * 여기에 id 배열을 적으면 프리셋을 하나 추가할 때 두 곳이 어긋나고, 어긋난 쪽은 조용히 사라진다.
 *
 * ## 카드는 공용 부품이다 (2026-08-03)
 * 껍데기(면·라운드 30~34px·레일 캡·40px 글리프 배지·제목 크기)는 `components/common/PickCard` 가
 * 소유한다 — 이 화면은 **내용물만** 넘긴다. 같은 모양의 "고르는 카드"가 레포에 7벌 복제돼 있었고
 * 이 화면이 8번째가 될 뻔했다.
 *
 * 🔴 **레일 캡만 쓴다.** 틴트 캡은 `tintscan` 이 면으로 세고, 랜딩의 면 예산 2개는 히어로와
 * 마무리 브랜드 패널이 이미 쓴다. 근거·매핑은 `PresetBrowser.utils.ts` 의 `PRESET_CAP_AXIS`.
 * (레일 캡이라 `PickCardGrid cluster` 표식도 필요 없다 — 6px 은 애초에 세어지지 않는다.)
 *
 * ## 모션
 * "더 보기"는 **즉시 표시**다. 높이 전이를 넣지 않는다 — 랜딩의 모션 예산은 호버·누름·아코디언
 * 펼침까지이고, 이 디스클로저는 스크롤 위치에서 문서 길이를 바꾸므로 애니메이션이 되레 방해가 된다.
 */
export default function PresetBrowser() {
  const headingIdPrefix = useId();
  const sections = useMemo(() => groupPortfolioPresets(), []);
  const [expanded, setExpanded] = useState<readonly PortfolioPresetGroupId[]>([]);

  const toggle = useCallback((groupId: PortfolioPresetGroupId) => {
    setExpanded((prev) => (prev.includes(groupId) ? prev.filter((id) => id !== groupId) : [...prev, groupId]));
  }, []);

  return (
    <BrowserRoot>
      {sections.map(({ group, visible, hidden }) => {
        const headingId = `${headingIdPrefix}-${group.id}`;
        const panelId = `${headingIdPrefix}-${group.id}-panel`;
        const isExpanded = expanded.includes(group.id);
        const GroupIcon = group.icon;
        const shown = isExpanded ? [...visible, ...hidden] : visible;

        return (
          <GroupSection key={group.id} aria-labelledby={headingId}>
            <GroupHead $tone={group.tone}>
              <GroupBadge $tone={group.tone} aria-hidden>
                <GroupIcon size={14} strokeWidth={PRESET_ICON_STROKE} aria-hidden focusable={false} />
              </GroupBadge>
              <GroupTitle id={headingId}>{group.label}</GroupTitle>
              <GroupHint>{group.hint}</GroupHint>
              {hidden.length > 0 ? (
                <MoreButton
                  type="button"
                  aria-expanded={isExpanded}
                  aria-controls={panelId}
                  onClick={() => toggle(group.id)}
                >
                  {isExpanded ? copy.collapse : copy.more(group.label, hidden.length)}
                </MoreButton>
              ) : null}
            </GroupHead>

            <PresetGrid id={panelId}>
              {shown.map((preset) => {
                const segments = buildAllocationSegments(preset);

                return (
                  <PickCard
                    key={preset.id}
                    as="li"
                    /* h2(섹션) → h3(묶음) → h4(카드). 레벨을 건너뛰지 않는다. */
                    titleAs="h4"
                    title={preset.title}
                    cap={{
                      ...PRESET_CAP_AXIS[group.tone],
                      kind: 'rail',
                      /* 🔴 글리프는 타입상 필수다 — 레일 색이 단독 채널이 되면 회색조에서 묶음이 사라진다.
                         묶음마다 다른 모양(지갑·꺾은선·저울·반짝임)이 색과 같은 것을 말한다. */
                      glyph: (
                        <GroupIcon size={20} strokeWidth={PRESET_ICON_STROKE} aria-hidden focusable={false} />
                      )
                    }}
                  >
                    <PresetFacts>
                      <PresetHook>{preset.hook}</PresetHook>
                      {/* 막대는 장식 — 같은 사실을 아래 텍스트가 전부 말한다. */}
                      <AllocationBar aria-hidden>
                        {segments.map((segment) => (
                          <AllocationSegment
                            key={segment.ticker}
                            $weight={segment.weight}
                            $color={segment.colorVar}
                          />
                        ))}
                      </AllocationBar>
                      <AllocationText>
                        {copy.allocationLabel} — {formatAllocationText(segments)}
                      </AllocationText>
                    </PresetFacts>
                  </PickCard>
                );
              })}
            </PresetGrid>
          </GroupSection>
        );
      })}

      <BrowserCtaLine>
        <BrowserCta
          to={SIMULATOR_PATH}
          onClick={() => trackEvent(ANALYTICS_EVENT.CTA_CLICK, { cta_name: 'landing_preset_browse' })}
        >
          {copy.cta}
          <ArrowRight size={16} strokeWidth={1.8} aria-hidden focusable={false} />
        </BrowserCta>
      </BrowserCtaLine>
    </BrowserRoot>
  );
}

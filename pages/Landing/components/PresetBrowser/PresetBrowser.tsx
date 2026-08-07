import { useId, useMemo } from 'react';
import { ArrowRight } from 'lucide-react';
import { Carousel, PickCard } from '@/components/common';
import { PRESET_ICON_STROKE, groupPortfolioPresets } from '@/shared/constants/portfolioPresets';
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
  GroupTitleRow,
  PresetFacts,
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
 * ## 🔴 묶음마다 **가로 한 줄**이다 (2026-08-07 사용자 지시)
 * 종전에는 묶음마다 격자로 쌓이고 나머지는 "더 보기"로 접혀 있었다. 그 배치의 문제는 길이다 —
 * 네 묶음이 세로로 이어지면 이 장 하나가 화면 몇 개를 먹고, **처음 온 사람은 그 길이만 보고
 * 나간다**("정보가 너무 많이 보이면 이탈한다"는 사용자 판단).
 * 캐러셀은 같은 정보를 화면 한 칸으로 접는다. 덤으로 "더 보기" 가 사라졌다 — 모든 카드가
 * 궤도 위에 있어 접을 것이 없고, 디스클로저가 문서 길이를 바꾸던 문제도 함께 없어졌다.
 * ⚠ 자동 넘김은 켜지 않는다. 이 카드는 **고르는 것**이라, 읽는 중에 넘어가면 방해가 된다 —
 *   움직임이 필요한 자리와 고르는 자리는 다르다(Carousel 의 autoAdvanceSeconds 기본값 주석).
 */
export default function PresetBrowser() {
  const headingIdPrefix = useId();
  const sections = useMemo(() => groupPortfolioPresets(), []);

  return (
    <BrowserRoot>
      {sections.map(({ group, visible, hidden }) => {
        const headingId = `${headingIdPrefix}-${group.id}`;
        const GroupIcon = group.icon;
        /* 🔴 접지 않는다 — 전부 궤도에 올린다. 캐러셀이 곧 "더 보기"의 자리를 대신한다. */
        const shown = [...visible, ...hidden];

        return (
          <GroupSection key={group.id} aria-labelledby={headingId}>
            <GroupHead $tone={group.tone}>
              <GroupTitleRow>
                <GroupBadge $tone={group.tone} aria-hidden>
                  <GroupIcon size={16} strokeWidth={PRESET_ICON_STROKE} aria-hidden focusable={false} />
                </GroupBadge>
                <GroupTitle id={headingId}>{group.label}</GroupTitle>
              </GroupTitleRow>
              <GroupHint>{group.hint}</GroupHint>
            </GroupHead>

            <Carousel ariaLabel={copy.carouselLabel(group.label, shown.length)}>
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
            </Carousel>
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

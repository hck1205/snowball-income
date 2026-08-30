import { useRef } from 'react';
import { ArrowRight, Compass, RotateCcw, Sparkles } from 'lucide-react';
import { PageHero } from '@/components/common';
import { ICON } from '@/shared/styles';
import { HOME_COPY } from '../copy';
import { GoalPicker } from '../components';
import type { HomePageViewProps } from './HomePage.types';
import {
  BrowseCard,
  ExtraAction,
  ExtraBadge,
  ExtraBody,
  ExtraChevron,
  ExtraLead,
  HeroBlock,
  HeroExtras,
  HomeDisclaimer,
  HomeStack,
  QuizCard,
  ResumeCard
} from './HomePage.styled';

const copy = HOME_COPY;

/**
 * 첫 화면(`/`)의 **순수 뷰**.
 *
 * ## 수직 순서가 이 화면의 전부다
 * ① 제목 → ② 리드 → ③ **목표 여섯**(`GoalPicker`) → ④ 출구 → ⑤ (조건부) 이어서 → ⑥ 면책.
 * ①~② 는 `PageHero` 가 준다. ③~⑥ 은 히어로 **밖**, 바로 아래 형제다 — 공용 히어로에 이 화면
 * 하나를 위한 슬롯을 뚫지 않는다(`pages/Landing` 이 같은 판단을 했고 그 근거가 그쪽 주석에 있다).
 *
 * 🔴 **③ 위에 새 요소를 넣지 마라.** 390×664 접힘 예산이 여섯 칸에 걸려 있다
 * (`GoalPicker.styled.ts` 머리말). 배지 줄·공지 배너·시장 지표가 하나만 들어와도 배당 세 칸이
 * 접힘 아래로 내려간다.
 *
 * ## 🔴 이 화면은 계산하지 않는다
 * 시뮬레이션 엔진도 폼 atom 도 건드리지 않는다. 카드의 숫자는 순수 산수(`shared/lib/goalPlan`)이고,
 * 진짜 계산은 사용자가 도착한 `/simulator` 가 한다. 여기서 엔진을 부르기 시작하면 첫 화면 번들에
 * 시뮬레이션 코드가 통째로 실린다.
 *
 * ## 모션 0 · 모달 0
 * 스크롤 진입 애니메이션·패럴랙스·카운트업·`role="dialog"` 전부 금지다. `/about` 에서 이어받은
 * 규율이고 이유도 같다(초기 `opacity:0` 이 콘텐츠를 영영 숨긴 사고 이력).
 */
export default function HomePageView({ viewModel, onSelectGoal, onQuiz, onBrowse, onResume }: HomePageViewProps) {
  /**
   * 이 화면에는 "맨 위로"가 없다(문서가 한 화면이라 돌아올 길이 필요 없다). ref 는 히어로가
   * 문서의 시작임을 표시하는 용도로만 둔다 — `tabIndex={-1}` 이 있어야 훗날 포커스를 넘길 수 있다.
   */
  const heroRef = useRef<HTMLDivElement>(null);

  return (
    <HomeStack>
      <HeroBlock ref={heroRef} tabIndex={-1}>
        {/* 헤더 워드마크는 span 이므로(AppHeader 기본값) 이 제목이 문서의 유일한 h1 이다. */}
        <PageHero title={copy.hero.title} titleAs="h1" lede={copy.hero.lede} />

        <GoalPicker onSelectGoal={onSelectGoal} />

        {/* 🔴 둘 다 **카드**다. 목표 여섯이 카드로 선 화면에서 맨 글줄은 잔여물로 읽힌다
            (2026-08-27 사용자 지적). 다만 목표보다 약한 중립 면이다 — styled 머리말의 이유. */}
        <HeroExtras>
          {/* 🔴 출구. 이 카드가 없으면 여섯 중 자기 것이 없는 사람이 갈 곳을 잃는다(copy 주석의 이유). */}
          {/* `data-home-cta` 는 테스트·접힘 프로브의 앵커다. 문구가 바뀌어도 같은 곳을 가리킨다. */}
          {/* 🔴 성향 테스트가 **먼저**다. 둘 다 "아직 모르는 사람"용이지만 이쪽은 답을 주고
              (유형 → 구성 예시 → 계산기), 둘러보기는 읽을 거리를 준다 — 행동이 앞선다. */}
          <QuizCard to={copy.quiz.to} data-home-cta="investor-type" onClick={onQuiz}>
            <ExtraBadge data-extra-badge>
              <Sparkles size={ICON.lg} strokeWidth={1.8} aria-hidden focusable={false} />
            </ExtraBadge>
            <ExtraBody>
              <ExtraLead data-extra-lead>{copy.quiz.lede}</ExtraLead>
              <ExtraAction data-extra-action>{copy.quiz.action}</ExtraAction>
            </ExtraBody>
            <ExtraChevron data-extra-chevron>
              <ArrowRight size={ICON.md} strokeWidth={2} aria-hidden focusable={false} />
            </ExtraChevron>
          </QuizCard>

          <BrowseCard to={copy.browse.to} data-home-cta="about" onClick={onBrowse}>
            <ExtraBadge data-extra-badge>
              <Compass size={ICON.lg} strokeWidth={1.8} aria-hidden focusable={false} />
            </ExtraBadge>
            <ExtraBody>
              <ExtraLead data-extra-lead>{copy.browse.lede}</ExtraLead>
              <ExtraAction data-extra-action>{copy.browse.action}</ExtraAction>
            </ExtraBody>
            <ExtraChevron data-extra-chevron>
              <ArrowRight size={ICON.md} strokeWidth={2} aria-hidden focusable={false} />
            </ExtraChevron>
          </BrowseCard>

          {viewModel.hasStoredWorkspace ? (
            <ResumeCard type="button" data-home-cta="resume" onClick={onResume}>
              <ExtraBadge data-extra-badge>
                <RotateCcw size={ICON.lg} strokeWidth={1.8} aria-hidden focusable={false} />
              </ExtraBadge>
              <ExtraBody>
                <ExtraLead data-extra-lead>{copy.resume.notice}</ExtraLead>
                <ExtraAction data-extra-action>{copy.resume.action}</ExtraAction>
              </ExtraBody>
              <ExtraChevron data-extra-chevron>
                <ArrowRight size={ICON.md} strokeWidth={2} aria-hidden focusable={false} />
              </ExtraChevron>
            </ResumeCard>
          ) : null}
        </HeroExtras>
      </HeroBlock>

      <HomeDisclaimer>{copy.disclaimer}</HomeDisclaimer>
    </HomeStack>
  );
}

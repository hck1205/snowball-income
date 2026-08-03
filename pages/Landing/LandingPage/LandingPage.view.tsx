import { useId } from 'react';
import { BookOpen, CalendarDays, HelpCircle, LayoutGrid, ListChecks, Repeat } from 'lucide-react';
import { Button } from '@/components';
import { BrandGlyph, PageFooter, PageHero } from '@/components/common';
import { PORTFOLIO_PRESET_PLACEHOLDERS } from '@/shared/constants/portfolioPresets';
import { LANDING_COPY, LANDING_HERO_CTAS } from '../copy';
import {
  ClosingCta,
  CompoundExplainer,
  ConceptLadder,
  LandingFaq,
  LandingSearch,
  LandingSection,
  PayoutRhythm,
  PresetBrowser,
  StartChecklist
} from '../components';
import type { LandingPageViewProps } from './LandingPage.types';
import {
  HeroBlock,
  HeroExtras,
  LandingGroup,
  LandingStack,
  ResumeNotice,
  ResumeRow
} from './LandingPage.styled';

const copy = LANDING_COPY;

/**
 * 랜딩 8섹션의 **순수 뷰**.
 *
 * ## 히어로 수직 순서가 이 화면의 핵심이다
 * ① 제목 → ② **CTA** → ③ 리드 → ④ 검색 → ⑤ (조건부) 이어서 계산하기.
 * ①~③ 은 `PageHero`(`제목+actions` → `lede`) 가 그대로 준다. ④⑤ 는 히어로 **밖**, 바로 아래
 * 형제다 — 히어로에 랜딩 전용 슬롯·prop 을 뚫지 않기 위해서이고, 그래야 `meta` 슬롯의 hue 밑줄이
 * 검색 아래에 남지 않는다(`LandingPage.styled.ts` HeroExtras 주석에 실측 근거).
 *
 * 🔴 **CTA 줄 *위*에 새 요소를 넣지 마라.** 390x664(iOS Safari 의 100svh 최소 상태)에서 시뮬레이터
 * CTA 의 bounding box 하단이 239px 이고, 제목 위 배지 줄·"NEW" 리본·소개 문구 한 줄이 하나만
 * 들어와도 그 예산이 깨진다. 리드·검색·지수는 전부 CTA **아래**다.
 *
 * ## 모션 0
 * 스크롤 진입 애니메이션(IntersectionObserver 리빌·fade-in-on-scroll·스태거 등장)·패럴랙스·
 * 스크롤 스냅·자동 재생·숫자 카운트업은 **확정 금지**다. 허용은 호버·누름·아코디언 펼침뿐이고
 * 전부 기존 토큰(motion.ease 200ms / motion.exit 120ms) 안에서만 쓴다.
 * ⚠ "너무 정적이다"는 요청이 와도 IO 리빌을 제안하지 마라 — 초기 opacity:0 이 테스트 스텁·
 * reduced-motion 에서 콘텐츠를 영영 숨긴 사고 이력이 있다.
 *
 * ## 모달 0
 * 랜딩에 `role="dialog"` 는 0개여야 한다. 투어(`components/TourGuide`)를 재사용하지 않는다 —
 * 그것이 정확히 사용자가 거부한 형태다.
 *
 * ## 서사 그룹 (2026-08-01 시각 언어 리워크)
 * `LandingStack` 의 직계 자식은 이제 **섹션이 아니라 묶음**이다:
 * `히어로 → G2 배우기(개념·복리·리듬) → G3 고르기(프리셋·시작 전) → G4 참조와 마무리(FAQ·지수·CTA) → 푸터`.
 * before 는 9블록 사이 간격이 8곳 전부 같은 값이라 그룹이 표현될 수 없었다.
 * `LandingGroup` 은 순수 div 다 — 랜드마크·헤딩을 주지 마라(섹션마다 이미 있다).
 *
 * ## 등급(emphasis)
 * 본론 두 장(**복리 · 프리셋**)만 `chapter` 다 — 그 둘만 제목 아래 2px 페이지 hue 룰을 갖는다.
 * **한 화면에 강조는 하나**라는 원칙의 집행이고, 등급을 늘리면 그 순간 위계가 아니라 소음이 된다.
 */
export default function LandingPageView({ viewModel, onHeroCta, onResume }: LandingPageViewProps) {
  const sectionIdPrefix = useId();
  const sectionId = (key: string) => `${sectionIdPrefix}-${key}`;

  return (
    <LandingStack>
      {/* S1 — 히어로. 헤더 워드마크는 span 이므로(AppHeader 기본값) 이 제목이 문서의 유일한 h1 이다. */}
      <HeroBlock>
        <PageHero
          /* 🔴 브랜드 마스코트가 이 앱에서 **처음 등장하는 자리**다(before 는 범용 새싹 아이콘이었다).
             절제해서 쓴다 — 20px 라인아트 한 개이고, 색은 배지가 주는 페이지 hue(currentColor)를 따른다.
             크게 쓰지 않는 이유: 히어로는 접힘 위 예산이 바이트 단위로 잡혀 있어(CTA 하단 239px)
             240px 짜리 그림이 들어올 자리가 없다. 큰 마스코트는 마무리 패널이 가져간다.
             ⚠ 배지는 span[aria-hidden] 하나여야 한다(landingHeroOverrideCoupling 이 잠근다) —
                BrandGlyph 는 기본이 aria-hidden 인 svg 라 그 계약을 건드리지 않는다. */
          icon={<BrandGlyph size={20} />}
          title={copy.hero.title}
          titleAs="h1"
          lede={copy.hero.lede}
          actions={LANDING_HERO_CTAS.map((cta) => (
            <Button
              key={cta.id}
              variant={cta.variant}
              size="md"
              /* 접힘 위 CTA 프로브가 이 속성으로 요소를 찾는다 — 배열 순서가 뒤집혀도 같은 곳을 가리킨다. */
              data-landing-cta={cta.id}
              onClick={() => onHeroCta(cta.id)}
            >
              {cta.label}
            </Button>
          ))}
        />
        {/* 🔴 히어로 **밖**이다(`meta` 슬롯 아님). 이유는 `LandingPage.styled.ts` 의 HeroExtras 주석 —
            그 슬롯은 hue 밑줄과 내용 폭을 갖는 자리라 검색 폼을 담을 수 없다. */}
        <HeroExtras>
          <LandingSearch />
          {viewModel.hasStoredWorkspace ? (
            <ResumeRow>
              <ResumeNotice>{copy.hero.resumeNotice}</ResumeNotice>
              <Button variant="ghost" size="sm" onClick={onResume}>
                {copy.hero.resumeAction}
              </Button>
            </ResumeRow>
          ) : null}
        </HeroExtras>

      </HeroBlock>

      {/* G2 배우기 — 단어(S3) → 원리(S4) → 시간(S5). 이 순서가 이 페이지의 학습 경로다. */}
      <LandingGroup>
        {/* S3 */}
        <LandingSection
          id={sectionId('concept')}
          title={copy.concept.title}
          icon={<BookOpen size={18} strokeWidth={1.8} aria-hidden focusable={false} />}
          tone="accent"
          emphasis="support"
        >
          <ConceptLadder />
        </LandingSection>

        {/* S4 — 등급 B. "왜 하는가"를 말하는 장이다. */}
        <LandingSection
          id={sectionId('compound')}
          title={copy.compound.title}
          icon={<Repeat size={18} strokeWidth={1.8} aria-hidden focusable={false} />}
          tone="identity"
          emphasis="chapter"
        >
          <CompoundExplainer />
        </LandingSection>

        {/* S5 */}
        <LandingSection
          id={sectionId('payout')}
          title={copy.payout.title}
          lede={copy.payout.lede}
          icon={<CalendarDays size={18} strokeWidth={1.8} aria-hidden focusable={false} />}
          tone="accentAlt"
          emphasis="support"
        >
          <PayoutRhythm />
        </LandingSection>
      </LandingGroup>

      {/* G3 고르기 — 무엇을 고르는가(S6) → 고르기 전에 확인할 것(S7). */}
      <LandingGroup>
        {/* S6 — 등급 B. 제목의 개수는 데이터에서 센다(프리셋이 늘면 문장이 따라온다). */}
        <LandingSection
          id={sectionId('presets')}
          title={copy.presets.title(PORTFOLIO_PRESET_PLACEHOLDERS.length)}
          lede={copy.presets.lede}
          icon={<LayoutGrid size={18} strokeWidth={1.8} aria-hidden focusable={false} />}
          tone="identity"
          emphasis="chapter"
        >
          <PresetBrowser />
        </LandingSection>

        {/* S7 */}
        <LandingSection
          id={sectionId('checklist')}
          title={copy.checklist.title}
          icon={<ListChecks size={18} strokeWidth={1.8} aria-hidden focusable={false} />}
          tone="accent"
          emphasis="support"
        >
          <StartChecklist />
        </LandingSection>
      </LandingGroup>

      {/* G4 참조와 마무리 — 남은 질문(S8) → 오늘의 시세(S2) → 닫는 액션. */}
      <LandingGroup>
        {/* S8 */}
        <LandingSection
          id={sectionId('faq')}
          title={copy.faq.title}
          icon={<HelpCircle size={18} strokeWidth={1.8} aria-hidden focusable={false} />}
          tone="accentAlt"
          emphasis="reference"
        >
          <LandingFaq />
        </LandingSection>

        <ClosingCta />
      </LandingGroup>

      <PageFooter notesTitle={copy.footnotesTitle} notes={copy.footnotes} />
    </LandingStack>
  );
}

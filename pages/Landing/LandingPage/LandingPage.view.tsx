import { useId, useRef } from 'react';
import { BookOpen, CalendarDays, Compass, HelpCircle, LayoutGrid, ListChecks, Repeat } from 'lucide-react';
import { Button } from '@/components';
import { HippoCoinScene, PageFooter, PageHero } from '@/components/common';
import { PORTFOLIO_PRESET_PLACEHOLDERS } from '@/shared/constants/portfolioPresets';
import { LANDING_COPY, landingChapter } from '../copy';
import {
  ClosingCta,
  CompoundExplainer,
  ConceptLadder,
  LandingFaq,
  LandingSearch,
  LevelPicker,
  StartPath,
  LandingSection,
  PayoutRhythm,
  PresetBrowser,
  StartChecklist
} from '../components';
import type { LandingPageViewProps } from './LandingPage.types';
import {
  HeroArt,
  HeroBlock,
  HeroExtras,
  LandingGroup,
  LandingStack,
  ResumeNotice,
  ResumeRow
} from './LandingPage.styled';

const copy = LANDING_COPY;

/**
 * 랜딩 여섯 장의 **순수 뷰**.
 *
 * ## 히어로 수직 순서가 이 화면의 핵심이다
 * ① 제목 → ② 리드 → ③ **수준 4갈래**(`LevelPicker`) → ④ 그림 → ⑤ 검색 → ⑥ (조건부) 이어서 계산하기.
 * ①~② 는 `PageHero` 가 준다(2026-08-17 부터 `actions` 는 비어 있다). ③~⑥ 은 히어로 **밖**, 바로 아래
 * 형제다 — 히어로에 랜딩 전용 슬롯·prop 을 뚫지 않기 위해서이고, 그래야 `meta` 슬롯의 hue 밑줄이
 * 검색 아래에 남지 않는다(`LandingPage.styled.ts` HeroExtras 주석에 실측 근거).
 *
 * 🔴 **4갈래 그리드 *위*에 새 요소를 넣지 마라.** 390x664(iOS Safari 의 100svh 최소 상태) 예산이다.
 * 예전에는 이 자리가 CTA 줄이었고 그 bounding box 하단이 239px 이었다 — 지금은 리드 한 줄이 위에
 * 붙었으므로 여유가 더 좁다. 제목 위 배지 줄·"NEW" 리본이 하나만 들어와도 네 번째 칸이 접힘
 * 아래로 내려간다. 그림·검색은 전부 그리드 **아래**다 — 2026-08-04 에 들어온 히어로
 * 그림도 이 규칙 때문에 좁은 폭에서 카드 아래에 앉는다(넓은 폭에서만 카드 오른쪽으로 겹쳐 올라간다).
 *
 * ## 차례는 걷었다 (2026-08-04, 사용자 지시)
 * 히어로 아래 여섯 줄짜리 차례가 있었지만 지금은 없다. 대신 문서 끝까지 내려간 사용자를 위해
 * **"맨 위로"(`ScrollTopButton`)** 하나만 둔다 — 내려가는 길은 스크롤이 이미 주고, 없던 것은
 * 돌아오는 길이었다. 부품(`components/ChapterIndex`)과 `LANDING_CHAPTERS` 는 각 장의 번호·앵커
 * 출처로 계속 쓰이므로 남아 있다.
 *
 * ## 모션 0
 * 스크롤 진입 애니메이션(IntersectionObserver 리빌·fade-in-on-scroll·스태거 등장)·패럴랙스·
 * 스크롤 스냅·자동 재생·숫자 카운트업은 **확정 금지**다. 허용은 호버·누름·아코디언 펼침뿐이고
 * 전부 기존 토큰(motion.ease 200ms / motion.exit 120ms) 안에서만 쓴다.
 * ⚠ "너무 정적이다"는 요청이 와도 IO 리빌을 제안하지 마라 — 초기 opacity:0 이 테스트 스텁·
 * reduced-motion 에서 콘텐츠를 영영 숨긴 사고 이력이 있다. 차례 앵커도 **브라우저 기본 스크롤**을
 * 쓴다(`scroll-margin-top` 은 `LandingSection.styled.ts` 가 소유).
 *
 * ## 모달 0
 * 랜딩에 `role="dialog"` 는 0개여야 한다. 투어(`components/TourGuide`)를 재사용하지 않는다 —
 * 그것이 정확히 사용자가 거부한 형태다.
 *
 * ## 서사 그룹
 * `LandingStack` 의 직계 자식은 섹션이 아니라 묶음이다:
 * `히어로 → G2 배우기(개념·복리·리듬) → G3 고르기(프리셋·시작 전) → G4 참조와 마무리(FAQ·CTA) → 푸터`.
 * `LandingGroup` 은 순수 div 다 — 랜드마크·헤딩을 주지 마라(섹션마다 이미 있다).
 *
 * ## 등급(emphasis)
 * 본론 두 장(**복리 · 프리셋**)만 `chapter` 다 — 그 둘만 장 머리 룰이 2px 페이지 hue 다(나머지는
 * 1px 중립). **한 화면에 강조는 하나**라는 원칙의 집행이고, 등급을 늘리면 그 순간 위계가 아니라
 * 소음이 된다.
 */
export default function LandingPageView({ viewModel, onSelectLevel, onDirect, onResume }: LandingPageViewProps) {
  const sectionIdPrefix = useId();
  const sectionId = (key: string) => `${sectionIdPrefix}-${key}`;

  /**
   * "맨 위로"가 이동한 **뒤 포커스를 넘길 곳**.
   *
   * 🔴 커뮤니티 상세는 글 제목 `h1` 에 ref 를 건다. 랜딩은 그럴 수 없다 — 이 화면의 `h1` 은 공용
   * `PageHero` 안이고 그 부품은 이번 트랙 편집 대상이 아니다. 그래서 **그 `h1` 을 품은 히어로 묶음**을
   * 대신 받는다. 포커스는 문서 맨 위(히어로)로 돌아가고, 다음 Tab 이 히어로 CTA 에서 이어진다.
   * `tabIndex={-1}` 은 필수다(없으면 `focus()` 가 조용히 아무 일도 하지 않는다). 포커스 링은
   * 전역 규칙이 `[tabindex='-1']` 을 대상에서 제외하므로 생기지 않는다(shared/styles/globalStyles.ts).
   */
  const heroRef = useRef<HTMLDivElement>(null);

  return (
    <LandingStack>
      {/* S1 — 히어로. 헤더 워드마크는 span 이므로(AppHeader 기본값) 이 제목이 문서의 유일한 h1 이다. */}
      <HeroBlock ref={heroRef} tabIndex={-1}>
        {/* 🔴 **`actions` 를 비워 두었다**(2026-08-17). 히어로 CTA 두 버튼이 아래 `LevelPicker` 로
            대체됐다 — 그 둘은 "배당 계산 시작하기"·"보유 종목으로 계산"이라 **이미 무엇을 할지 아는
            사람**만 쓸 수 있었고, 그것이 이 지면의 후킹이 약했던 원인이었다(사용자 지적).
            직행로는 사라지지 않았다 — `LevelPicker` 안의 "바로 계산기로" 글줄이 받는다.
            ⚠ 되살리려면 `LANDING_HERO_CTAS` 가 아직 `copy` 에 있다. 다만 되살리기 전에 GA4 의
              level_selected 분포를 먼저 봐라(그 데이터를 만들려고 바꾼 것이다). */}
        <PageHero title={copy.hero.title} titleAs="h1" lede={copy.hero.lede} />

        {/* 🔴 히어로 **밖**, 바로 아래 형제다. `PageHero` 의 `actions` 슬롯에 넣지 않은 것은 그 자리가
            제목 옆 버튼용 flex 행이라(`flex: 0 0 auto` + 자식 광학 정렬 transform) 2×2 카드 그리드가
            넓은 폭에서 제목 옆에 끼어 찌그러지기 때문이다. 공용 히어로는 전 페이지가 쓰므로
            여기 하나를 위해 슬롯을 뚫지 않는다(2026-08-17 사용자 결정: 리드가 카드 위에 서도 좋다).
            ⚠ 그래서 화면 순서는 **제목 → 리드 → 4갈래**다. 접힘 예산(390×664)은 여전히 네 칸을
              전부 담는다 — 카드에 줄을 더하기 전에 그 폭에서 다시 재라. */}
        <LevelPicker onSelectLevel={onSelectLevel} onDirect={onDirect} />
        {/* 🔴 **DOM 순서가 좁은 폭의 화면 순서다**(제목 → CTA → 리드 → 그림 → 검색). 그림을 CTA 줄
            위로 올리면 접힘 예산이 깨진다(위 머리말). 넓은 폭에서는 `HeroArt` 가 히어로 카드와 같은
            그리드 셀로 올라가 카드 오른쪽 안쪽에 선다 — 배치 근거는 `LandingPage.styled.ts` 의 HeroArt.

            ⚠ 접힘 **위**라 `eager` 다(390 에서도 그림 하단 y=519 < iOS 최소 664).
            🔴 첫 페인트 비용은 **0바이트**다 — 실측: 이 지면의 `<img>` 는 6개지만 **src 는 2개뿐**
            (`/hippo.png`·`/coin.png`)이고, 그 둘은 헤더 로고(44px)가 이미 `eager` 로 받는다
            (`components/AppHeader/AppHeader.tsx` "첫 화면 상단이라 eager 다"). 즉 히어로 그림은
            **새 요청을 하나도 만들지 않고** 같은 캐시 항목을 재사용한다. `lazy` 로 바꿔도 아낄 것이
            없고 오히려 첫 화면이 늦게 채워진다.
            ⚠ `size={280}` 은 **상한값**이다(실제 폭은 CSS clamp 가 정한다). 이 숫자가 img 의
            width/height 속성으로 내려가 레이아웃 예약에 쓰인다. */}
        {/* 🔴 금화가 무대 오른쪽으로 13% 나가는 것이 이 연출의 핵심이다(HeroArt/HERO_ART_INSET 주석).
            그 돌출은 결함이 아니라 의도이므로 overflowprobe 에 그렇게 선언한다. */}
        <HeroArt data-decorative-overflow="true">
          <HippoCoinScene size={280} loading="eager" />
        </HeroArt>

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

      {/* G2 배우기 — 길(S2.5) → 단어(S3) → 원리(S4) → 시간(S5). 이 순서가 이 페이지의 학습 경로다. */}
      <LandingGroup>
        {/*
          🔴 **처음 온 사람의 길**이 이 묶음의 첫 장이다(2026-08-06 사용자 지시). 이 아래 장들은
          전부 "배당을 안다"를 전제로 서 있는데, 그 전제를 만드는 자리가 없었다 — 계좌를 여는 법도,
          지수추종이 무엇인지도, 배당이 무엇인지도. 그 넷을 가이드로 쓰고 여기서 순서를 준다.
          ⚠ 이 블록은 **링크만** 갖는다. 본문을 여기 옮기면 랜딩이 교과서가 되고 첫 화면이 사라진다.
        */}
        <LandingSection
          id={sectionId('start')}
          anchorId={landingChapter('start').anchorId}
          ordinal={landingChapter('start').ordinal}
          title={copy.startPath.title}
          lede={copy.startPath.lede}
          icon={<Compass size={18} strokeWidth={1.8} aria-hidden focusable={false} />}
          tone="identity"
          /* 🔴 support 다. 이 장이 먼저 오지만 **본론은 아니다** — 본론은 복리(왜 하는가)와
             프리셋(무엇을 고르는가) 둘뿐이라는 계약을 지킨다(셋이 되면 강조가 강조가 아니다). */
          emphasis="support"
        >
          <StartPath />
        </LandingSection>

        {/* S3 */}
        <LandingSection
          id={sectionId('concept')}
          anchorId={landingChapter('concept').anchorId}
          ordinal={landingChapter('concept').ordinal}
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
          anchorId={landingChapter('compound').anchorId}
          ordinal={landingChapter('compound').ordinal}
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
          anchorId={landingChapter('payout').anchorId}
          ordinal={landingChapter('payout').ordinal}
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
          anchorId={landingChapter('presets').anchorId}
          ordinal={landingChapter('presets').ordinal}
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
          anchorId={landingChapter('checklist').anchorId}
          ordinal={landingChapter('checklist').ordinal}
          title={copy.checklist.title}
          icon={<ListChecks size={18} strokeWidth={1.8} aria-hidden focusable={false} />}
          tone="accent"
          emphasis="support"
        >
          <StartChecklist />
        </LandingSection>
      </LandingGroup>

      {/* G4 참조와 마무리 — 남은 질문(S8) → 닫는 액션. */}
      <LandingGroup>
        {/* S8 */}
        <LandingSection
          id={sectionId('faq')}
          anchorId={landingChapter('faq').anchorId}
          ordinal={landingChapter('faq').ordinal}
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

      {/* 🔴 이 지면은 실측 @1280 4893px 짜리 문서다 — 여섯 장을 다 읽고 위로 돌아갈 길이 필요하다.
          차례 블록을 걷은 자리를 이 버튼이 대신한다(차례는 "내려가는 길", 이건 "돌아오는 길").
          부품은 커뮤니티 상세와 **같은 한 벌**이다(2026-08-04 에 components/common 으로 승격).
          임계(뷰포트 1개분)·포커스 이동 계약은 그 부품이 소유하므로 여기서 다시 정하지 않는다. */}
    </LandingStack>
  );
}

import styled from '@emotion/styled';
import {
  DATA_RADIUS,
  PICK_RADIUS,
  appHeaderHeight,
  cardElevation,
  color,
  elevation,
  font,
  media,
  motion,
  pageHue,
  pageHueMix,
  radius,
  sectionTitleFontSize,
  space
} from '@/shared/styles';

/**
 * ── 이 화면의 골격 (2026-08-03 2차 리워크) ────────────────────────────────────
 *
 * 🔴 **무엇이 바뀌었나 — 배치다.** 1차 리워크는 격자의 면 채움을 링·밑줄로 바꿨을 뿐 구성은
 * 그대로였고, 실측하면 이랬다(1280px · 5종 선택):
 *
 * ```
 *   히어로 174 · 달력 보드 978(문서의 45%) · 상세(목록+범례) 405 · 푸터 221   → 문서 2165px
 * ```
 *
 * 즉 이 화면의 질문("이번 달 언제 들어오나")에 대한 **답은 스크롤 아래**에 있었고, 화면의 절반은
 * 42칸짜리 격자가 먹고 있었다. 격자는 "언제"를 공간으로 보여 주지만 "무엇이 며칠에"는 목록만 말한다.
 *
 * 그래서 세 층으로 다시 짰다.
 *
 * ```
 *  ┌ MonthDeck  (raised · 화면의 유일한 주역 면) ────────────────────────────┐
 *  │  [◀] 2026년 7월(h2) [▶] [오늘]                       [종목 선택 ⑤]     │  조작 줄
 *  │  ┌ NextLead (버튼 — 누르면 그 날 일정으로) ───────────────────────────┐ │
 *  │  │ 다음 예상 지급          D-3                                       │ │  ← 이 화면의 답
 *  │  │ 7월 28일 (화)   JEPI · KO                                         │ │
 *  │  └───────────────────────────────────────────────────────────────────┘ │
 *  │  2026년 7월 지급 예정 6건 · 날짜 미정 1종            (MonthSummaryLine) │  요약 한 줄
 *  └─────────────────────────────────────────────────────────────────────────┘
 *  ┌ Workbench (>980px 2열) ─────────────────────────────────────────────────┐
 *  │  LedgerCard  (주역 열 · 넓다)        │  MapCard   (개관 열 · sticky)     │
 *  │   지급 일정 / 날짜 미정 전환          │   월간 지급 지도(달력 격자)        │
 *  │   날짜 블록 타임라인                  │   (13열 범례표는 폭이 필요해       │
 *  │   연간 지급 리듬(범례 표)             │    왼쪽 열에 있다)                 │
 *  └─────────────────────────────────────────────────────────────────────────┘
 * ```
 *
 * **DOM 순서 = 목록 → 지도**다. 좁은 폭에서 답이 먼저 오고(달력을 626px 지나서야 목록이 나오던 것을
 * 뒤집었다), 넓은 폭에서는 그 순서가 좌 → 우가 된다. 그래서 이동 버튼 카피에서 방향어("아래")를 뺐다.
 *
 * ── 면 배치 (SurfaceKind) ─────────────────────────────────────────────────────
 *
 * | 면 | 종류 | 처방 |
 * |---|---|---|
 * | 데크 | **data** | `raised` — 화면에 하나뿐인 주역 면. 그 안의 NextLead 는 중립 침강면 |
 * | 목록 카드 · 지도 카드 | **data** | `base`(테두리) + `DATA_RADIUS`. 채도는 선·점(L1)에만 |
 * | 시작 카드(빈 상태) | **brand** | 이 화면의 유일한 "고르는 면" + `PICK_RADIUS` + 6px 레일 캡 |
 *
 * 🔴 색면 예산은 **히어로 + 공용 푸터 패널 = 2**로 이미 차 있다(라우트 기준선). 위의 새 면은
 * 전부 **중립 토큰**(surface / surfaceRaised / surfaceMuted / surfaceSunken)이라 예산 밖이다.
 * 색을 쓰고 싶으면 면이 아니라 **6px 이하의 줄**(`pageHueMix`)이나 **180px 미만의 조각**으로 써라.
 */
export const PageStack = styled.div`
  display: grid;
  gap: clamp(16px, 2.4vw, 24px);
  min-width: 0;
`;

/** 두 본문 카드가 공유하는 패딩. 값이 갈리면 두 열이 다른 부품처럼 보인다 — 한 자리에서 소유한다. */
const SURFACE_PAD = 'clamp(16px, 2vw, 24px)';

/**
 * 라이브 리전은 **처음부터 끝까지 마운트 상태를 유지**한다. 시각적으로만 숨기고 텍스트만 바꾼다 —
 * `display:none`이나 조건부 언마운트는 접근성 트리에서 노드를 지워 이후 변경이 낭독되지 않는다.
 */
export const LiveRegion = styled.p`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
`;

/* -------------------------------------------------------------------------- */
/* 1층 — 요약 데크                                                              */
/* -------------------------------------------------------------------------- */

/**
 * 화면의 **주역 면**. 위계 수단은 그림자 하나뿐이다(`raised`) — 아래 두 열은 테두리로 간다.
 * 구 처방에서는 달력 보드가 이 자리를 차지했는데, 달력은 답이 아니라 지도다.
 */
export const MonthDeck = styled.section`
  min-width: 0;
  display: grid;
  gap: ${space[4]};
  align-content: start;
  padding: ${SURFACE_PAD};
  border-radius: ${DATA_RADIUS};
  ${cardElevation('raised')}
`;

/**
 * 데크의 조작 줄 — 월 이동 묶음(왼쪽)과 종목 선택(오른쪽).
 *
 * 구 화면에서는 이 둘이 서로 다른 층에 있었다(선택은 카드 머리 띠, 월 이동은 그 아래 툴바).
 * 조작은 한 줄에 모은다 — "무엇을 보는가(종목)"와 "언제를 보는가(달)"는 같은 종류의 결정이다.
 */
export const DeckBar = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[3]};
  flex-wrap: wrap;
`;

/** 조작 줄·카드 머리에서 오른쪽 끝으로 밀어 두는 슬롯. */
export const HeadSpacer = styled.span`
  flex: 1 1 auto;
  min-width: 0;
`;

/**
 * 드로어를 여는 주 진입점 — 이 화면에서 **유일한 솔리드 브랜드 면(L3)** 이다.
 * "여기서 고르면 화면이 바뀐다"를 말하는 자리라 색면 사다리의 맨 위를 여기에 쓴다.
 * 🔴 L3 는 화면당 하나다. 다른 곳에 brand 채움을 만들지 마라.
 * ⚠ 폭이 180px 미만이라 틴트 면 판정 밖이다.
 */
export const FilterButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  height: 40px;
  padding: 0 ${space[4]};
  border: 1px solid transparent;
  border-radius: ${radius.pill};
  background: ${color.brand};
  color: ${color.onBrand};
  font-family: inherit;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  cursor: pointer;
  transition:
    background ${motion.fast} ${motion.ease},
    box-shadow ${motion.fast} ${motion.ease},
    transform ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.brandHover};
    box-shadow: ${elevation[2]};
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: background ${motion.fast} ${motion.ease};

    &:hover {
      transform: none;
    }
  }

  /*
   * 좁은 폭에서는 **줄을 통째로 쓴다.** 그냥 두면 월 이동 묶음과 이 버튼이 한 줄을 억지로 나눠
   * 갖다가 넘치는 쪽만 아래로 떨어져, 오른쪽 끝에 있던 버튼이 갑자기 왼쪽에 홀로 서는 어중간한
   * 모양이 된다. 어차피 줄이 갈릴 폭이면 의도적으로 갈라 손가락이 닿는 폭을 준다.
   */
  ${media.down('mobileWide')} {
    flex: 1 1 100%;
    justify-content: center;
  }
`;

/**
 * 선택 수 배지. 숫자만으론 의미가 안 서므로 버튼 접근명(`picker.open`)이 문장으로 다시 말한다.
 * 솔리드 브랜드 면 위에 앉으므로 **반전**한다 — 검증 쌍(brand-text / surface)만 쓴다.
 */
export const FilterCount = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 ${space[1]};
  border-radius: ${radius.pill};
  background: ${color.surface};
  color: ${color.brandText};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  ${font.numeric}
`;

/**
 * **다음 예상 지급 판** — 이 화면의 답이 서는 자리.
 *
 * 버튼인 이유: 누르면 목록의 그 날짜 블록으로 간다(달력 칸을 찾아 누르지 않아도 된다).
 * 접근명은 달력 칸의 이동 버튼과 **다른 문장**이다(`deck.jumpToDay`) — 같으면 한 화면에 같은 이름의
 * 버튼이 둘이 되어 소리로 구분되지 않는다.
 *
 * 🔴 면은 **중립**이다(`surfaceSunken`). 폭이 데크 전폭이라 여기에 틴트를 깔면 라우트 색면 예산
 * (히어로 + 푸터 패널로 이미 2)이 즉시 터진다. 색은 왼쪽 4px 레일과 종목 점만 진다.
 */
const leadPanel = `
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: ${space[2]} ${space[4]};
  width: 100%;
  padding: clamp(14px, 1.6vw, 20px) clamp(16px, 1.8vw, 22px);
  padding-left: clamp(20px, 2.2vw, 28px);
  border: 1px solid ${color.border};
  border-radius: ${radius.lg};
  background: ${color.surfaceSunken};
  font-family: inherit;
  text-align: left;
  overflow: hidden;

  /* 라우트 얼굴색 레일. 폭 4px 이라 면이 아니라 선이다(틴트 판정 하한은 높이 8px · 폭 180px). */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 4px;
    background: ${pageHue};
  }

  ${media.down('mobileWide')} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const NextLead = styled.button`
  ${leadPanel}
  cursor: pointer;
  transition:
    background ${motion.fast} ${motion.ease},
    border-color ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.surfaceHover};
    border-color: ${color.borderStrong};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

/** 버튼이 **아닌** 판(선택 0종·이 달 지급 없음). 같은 기하를 쓰되 누를 수 있는 척하지 않는다. */
export const NextLeadStatic = styled.div`
  ${leadPanel}
`;

/** 판의 왼쪽 — 라벨 → 날짜 → 종목 칩 순서. */
export const NextLeadMain = styled.span`
  display: grid;
  gap: ${space[2]};
  min-width: 0;
`;

/** "다음 예상 지급" — 작고 조용한 라벨이 큰 숫자에 이름을 준다. */
export const NextLeadLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.08em;
  color: ${color.textMuted};
`;

/**
 * 날짜 줄. 이 화면에서 **두 번째로 큰 글자**다(가장 큰 것은 오른쪽 카운트다운).
 * 타이포 대비를 벌리는 자리라 굵기가 아니라 크기로 간다(헤딩 서체는 Bold 한 벌뿐).
 */
export const NextLeadDate = styled.span`
  font-size: clamp(${font.size.xl}, 2.2vw, ${font.size['3xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.02em;
  color: ${color.text};
  ${font.numeric}
`;

/** 그 날 들어오는 종목 칩 줄. */
export const NextLeadTickers = styled.span`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${space[1]};
  min-width: 0;
`;

/**
 * 종목 칩 — **버튼이 아니다**(누를 실체가 없고, 옆의 판 전체가 이미 눌린다).
 * 색 점은 달력 칩·아젠다 막대·범례 점과 같은 사전에서 온다.
 */
export const NextLeadTicker = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  padding: 2px ${space[2]};
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  background: ${color.surface};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${color.text};
  ${font.numeric}
`;

export const NextLeadDot = styled.span`
  display: inline-block;
  flex: 0 0 auto;
  width: 6px;
  height: 6px;
  border-radius: 50%;
`;

/**
 * 카운트다운 — **이 화면의 주인공 숫자 한 곳**이다(`font.heroNumeric` 은 화면당 한 자리 규칙).
 * 중립 면 위 중립 글자다: 파생 색(pageHue)은 대비 검증 밖이라 텍스트로 쓰지 않는다.
 */
export const NextLeadCountdown = styled.span`
  justify-self: end;
  font-family: ${font.heroNumeric};
  font-size: clamp(${font.size['3xl']}, 4vw, ${font.size['6xl']});
  font-weight: ${font.weight.extrabold};
  line-height: 1;
  letter-spacing: -0.03em;
  white-space: nowrap;
  color: ${color.text};
  ${font.numeric}

  ${media.down('mobileWide')} {
    justify-self: start;
  }
`;

/** 이미 지난 일정·지급 없음처럼 "지금 기다릴 것이 없는" 상태의 카운트다운 자리. */
export const NextLeadNote = styled.span`
  justify-self: end;
  padding: ${space[1]} ${space[3]};
  border-radius: ${radius.pill};
  background: ${color.surfaceMuted};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${color.textSecondary};
  white-space: nowrap;

  ${media.down('mobileWide')} {
    justify-self: start;
  }
`;

/** 선택이 없을 때 판이 대신 하는 안내 한 줄. */
export const NextLeadBody = styled.span`
  font-size: ${font.size.sm};
  color: ${color.textSecondary};
  line-height: ${font.leading.snug};
`;

/**
 * 데크의 마지막 줄 — 그 달의 집계를 **문장**으로 한 번 더 말한다.
 *
 * 위의 판이 "다음 한 건"만 말하므로 전체 건수는 여기서만 나온다(같은 사실을 두 무게로 적지 않는다).
 * 왼쪽 4px 캡슐이 라우트 얼굴색을 찍는다(선이라 면 예산과 무관하다).
 */
export const MonthSummaryLine = styled.p`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  margin: 0;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${color.textSecondary};
  ${font.numeric}

  &::before {
    content: '';
    flex: 0 0 auto;
    width: 4px;
    height: 14px;
    border-radius: ${radius.pill};
    background: ${pageHue};
  }
`;

/* -------------------------------------------------------------------------- */
/* 2층 — 작업대(목록 열 + 지도 열)                                              */
/* -------------------------------------------------------------------------- */

/**
 * **주역은 왼쪽 열이다.** 오른쪽 지도 열의 폭을 `clamp` 로 묶어 달력이 아무리 넓은 화면에서도
 * 화면을 지배하지 못하게 한다 — 남는 폭은 전부 목록이 가져간다.
 *
 * 1열 전환은 `layout`(980px) — 이 레포의 좌/우 2단 경계다.
 */
export const Workbench = styled.div`
  display: grid;
  gap: clamp(16px, 1.8vw, 20px);
  min-width: 0;
  align-items: start;

  ${media.up('layout')} {
    grid-template-columns: minmax(0, 1fr) clamp(360px, 35vw, 500px);
  }
`;

/** 목록 열(주역)과 지도 열이 공유하는 본문 카드. 위계 수단은 테두리 하나뿐이다. */
const bodyCard = `
  min-width: 0;
  display: grid;
  gap: ${space[4]};
  align-content: start;
  padding: ${SURFACE_PAD};
  border-radius: ${DATA_RADIUS};
  ${cardElevation('base')}
`;

export const LedgerCard = styled.section`
  ${bodyCard}
`;

/**
 * 지도 열은 **따라붙는다**(sticky). 목록이 길어져도 달력이 화면에 남아 있어야 "이 달 어디쯤을
 * 보고 있나"를 잃지 않는다. 1열에서는 그냥 흐른다(붙일 여백이 없다).
 */
export const MapCard = styled.section<{ $solo?: boolean }>`
  ${bodyCard}

  ${media.up('layout')} {
    /* 🔴 solo = 옆에 목록이 없는 상태(고른 종목에 놓을 일정이 하나도 없을 때). 그때 이 카드는
       작업대 밖에서 전폭으로 서고, 붙을 상대가 없으므로 sticky 도 끈다 — 혼자 있는 요소가
       스크롤에 붙으면 "무엇을 따라다니는지"가 없어 그냥 안 움직이는 것처럼 읽힌다. */
    position: ${({ $solo }) => ($solo ? 'static' : 'sticky')};
    /*
     * 🔴 붙는 기준은 **실측 헤더 높이**다 — appHeaderHeight (AppHeader 가 리사이즈마다 써 넣는
     * CSS 변수). 상수를 적으면 안 된다: 앱 헤더는 그 자신이 sticky top 0 이고 1280 실측 97px 이라,
     * 24px 같은 값으로 붙이면 카드 머리("월간 지급 지도")와 요일 줄이 헤더 뒤로 들어가 스크롤 중에
     * 영영 안 보인다. 레포에 같은 처방이 이미 둘 있다
     * (pages/Ledger/…/ScopeRail, pages/Portfolio/…/RailColumn).
     *
     * ⚠ Portfolio 레일과 달리 max-height + overflow-y 는 붙이지 않는다 — 이 카드 안에는 날짜 칩
     *   **툴팁**(절대 배치, 포털 아님)이 살아서 스크롤 상자를 만들면 가장자리 칸의 말풍선이 잘린다
     *   (같은 이유로 위 CardHead 에서 3변 bleed 도 포기했다).
     */
    top: calc(${appHeaderHeight} + ${space[3]});
  }
`;

/**
 * 카드 머리 — 글리프 배지 + 이름 + 오른쪽 슬롯.
 *
 * 🔴 3변 bleed(음수 마진으로 카드 세 변에 붙이기)를 **일부러 쓰지 않았다**: bleed 를 깔끔히
 * 자르려면 카드에 `overflow: hidden` 이 필요한데, 지도 카드 안에는 날짜 칩 **툴팁**(절대 배치,
 * 포털 아님)이 산다 — 가장자리 칸의 말풍선이 잘린다. 대신 아래 1px 구분선이 머리를 만든다.
 */
export const CardHead = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[3]};
  flex-wrap: wrap;
  padding-bottom: ${space[3]};
  border-bottom: 1px solid ${color.border};
`;

/**
 * 카드 머리의 **글리프 배지**. 라우트 얼굴색에서 파생한 옅은 면 + 같은 hue 의 아이콘.
 * 폭 34px 이라 틴트 면 판정(≥180px) 밖이고, 🔴 **파생 면 위에 텍스트를 얹지 않는다** —
 * 여기 들어가는 것은 aria-hidden 아이콘뿐이고, 카드 이름은 옆의 중립색 글자가 말한다.
 */
export const SectionGlyph = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  border-radius: ${radius.md};
  border: 1px solid ${pageHueMix(38, 'transparent')};
  background: ${pageHueMix(14)};
  color: ${pageHue};
`;

/**
 * 열 제목(h3). 구 처방은 `font.size.sm`(13px) 이라 본문과 거의 같은 무게였다 —
 * 공통 `sectionTitleFontSize`(16~18px)로 올려 제목·본문·캡션의 대비를 벌린다.
 */
export const CardTitle = styled.h3`
  margin: 0;
  font-size: ${sectionTitleFontSize};
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.02em;
  color: ${color.text};
`;

/** 제목 옆 개수 — 제목과 같은 줄에서 "몇 건짜리 목록인가"를 먼저 말한다. */
export const CardCount = styled.span`
  padding: 2px ${space[2]};
  border-radius: ${radius.pill};
  background: ${color.surfaceMuted};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  color: ${color.textSecondary};
  ${font.numeric}
`;

/**
 * 날짜 미정 보기 토글(구 2버튼 탭의 후신 — "지급 일정 목록" 탭은 제목과 중복이라 폐기).
 * `role="tab"` 대신 `aria-pressed` — 레포 관례이고, 탭 롤은 화살표 키 이동 계약을 동반하는데
 * 이 화면은 그것을 구현하지 않는다.
 *
 * 눌린 상태는 **틴트 + 2px 테두리 + 굵기** 세 채널이다. 이 화면의 솔리드 브랜드 면(L3)은 종목 선택
 * 버튼 하나뿐이라 여기까지 채우면 "가장 강한 면"이 둘이 되어 어느 쪽도 주역이 아니게 된다.
 * ⚠ 폭 180px 미만이라 브랜드 틴트를 써도 면 예산 밖이다.
 */
export const UndatedToggleButton = styled.button<{ $active: boolean }>`
  border: ${({ $active }) => ($active ? '2px' : '1px')} solid
    ${({ $active }) => ($active ? color.brandBorder : color.border)};
  border-radius: ${radius.pill};
  padding: ${({ $active }) =>
    $active ? `calc(${space[1]} - 1px) calc(${space[3]} - 1px)` : `${space[1]} ${space[3]}`};
  font-family: inherit;
  font-size: ${font.size.xs};
  font-weight: ${({ $active }) => ($active ? font.weight.bold : font.weight.semibold)};
  cursor: pointer;
  color: ${({ $active }) => ($active ? color.brandText : color.textSecondary)};
  background: ${({ $active }) => ($active ? color.brandSubtle : color.surface)};
  transition:
    background ${motion.fast} ${motion.ease},
    border-color ${motion.fast} ${motion.ease},
    color ${motion.fast} ${motion.ease};

  &:hover {
    background: ${({ $active }) => ($active ? color.brandSubtleHover : color.surfaceHover)};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

/**
 * 지도 카드 안의 **구역 이름**(연간 지급 리듬). 카드 제목(h3)보다 한 단 아래 무게로, 위에 실선을
 * 그어 "여기서부터 다른 이야기"를 말한다 — 카드를 하나 더 만들면 오른쪽 열이 카드 탑이 된다.
 *
 * 헤딩 태그로 올리지 않는다: 이 페이지의 헤딩 순서는 h1 히어로 → h2 월 → h3 카드 제목으로 이미
 * 완결돼 있고, 바로 아래 `details`의 `summary`가 이 표의 접근성 진입점을 이미 갖고 있다.
 */
export const MapZoneLabel = styled.p`
  margin: ${space[1]} 0 0;
  padding-top: ${space[4]};
  border-top: 1px solid ${color.border};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.08em;
  color: ${color.textMuted};
`;

/**
 * 달력 바로 아래 한 줄 힌트 — "날짜 칸을 누를 수 있다"는 것은 터치에서 보이지 않는다.
 * 데스크톱에서는 커서와 호버 링이 이미 말하므로 좁은 폭에서만 띄운다.
 */
export const BoardHint = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  color: ${color.textMuted};
  line-height: ${font.leading.snug};

  ${media.up('tabletSm')} {
    display: none;
  }
`;

/* -------------------------------------------------------------------------- */
/* 빈 상태 — "고르는 면"이 화면의 절반을 갖는다                                   */
/* -------------------------------------------------------------------------- */

/**
 * 구 처방은 예시 격자 **위에 카드를 절대 배치로 띄웠다**(top 33%, 반투명 아님). 겹침은 두 층이 서로를
 * 가리고, 좁은 폭에서는 겹치지 않게 다시 분기해야 했다. 이제는 겹치지 않는다 —
 * **왼쪽에 고르는 카드, 오른쪽에 흐린 예시 달력**으로 나란히 선다(작업대와 같은 2열 골격).
 */
export const StartBench = styled.div`
  display: grid;
  gap: clamp(16px, 1.8vw, 20px);
  min-width: 0;
  align-items: start;

  ${media.up('layout')} {
    grid-template-columns: minmax(0, 1fr) clamp(360px, 35vw, 500px);
  }
`;

/**
 * 빈 상태도 하나의 화면이다. 이 화면의 **유일한 "고르는 면"**(brand)이라 `PICK_RADIUS`(30~34px)를
 * 쓴다 — 옆에 선 data 면(24~28px)과 반경이 갈려 "고르는 것 / 읽는 것"이 형태로 읽힌다.
 *
 * 🔴 면색은 **쓰지 않는다.** 라우트의 색면 예산 2개가 히어로와 공용 푸터 패널로 이미 차 있다.
 * 대신 **6px 레일 캡**을 쓴다(면 판정 하한 8px 바로 아래).
 */
export const StartCard = styled.div`
  position: relative;
  display: grid;
  gap: ${space[4]};
  align-content: start;
  padding: clamp(22px, 3vw, 32px);
  border-radius: ${PICK_RADIUS};
  ${cardElevation('raised')}
  /* 아래 레일을 카드 모서리에서 잘라낸다. 이 카드 안에는 툴팁·팝오버가 없으므로 안전하다. */
  overflow: hidden;

  /* ⚠ 레일에 반경을 주지 않는다 — 6px 짜리 띠의 비균일 반경은 브라우저가 그려 주지 않는다
     (test/shared/radiusShape.test.ts). 부모의 overflow 로 자르는 것이 이 레포의 처방이다. */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 6px;
    background: ${color.gradientAurora};
  }
`;

/**
 * 빈 상태 카드의 얼굴 — 48px 글리프 배지.
 * 폭 48px 이라 틴트 면 판정(≥180px) 밖이고, 대비는 검증 쌍(brand-text / brand-subtle)만 쓴다.
 */
export const EmptyGlyph = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  justify-self: start;
  width: 48px;
  height: 48px;
  border-radius: ${radius.lg};
  border: 1px solid ${color.brandBorder};
  background: ${color.brandSubtle};
  color: ${color.brandText};
`;

/**
 * "예시 · 실제 데이터가 아닙니다" 라벨.
 *
 * 🔴 **색만으로 구분하지 않기 위한 장치다** — 흐린 칩은 시각 신호일 뿐이라 고대비 모드·스크린리더에
 * 아무것도 전하지 못한다. 이 텍스트가 그 자리를 메운다(표 접근명·캡션이 같은 말을 한 번 더 한다).
 * 지우지 마라: 지우는 순간 예시가 실제 지급 예정으로 읽힌다.
 */
export const PreviewBadge = styled.p`
  justify-self: start;
  margin: 0;
  padding: ${space[1]} ${space[3]};
  border: 1px dashed ${color.border};
  border-radius: ${radius.pill};
  background: ${color.surfaceMuted};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  letter-spacing: 0.01em;
  color: ${color.textSecondary};
`;

/** 고르는 면의 제목이라 본문과의 대비를 크게 벌린다(굵기가 아니라 크기로 — 헤딩 서체는 Bold 한 벌). */
export const EmptyTitle = styled.p`
  margin: 0;
  font-size: clamp(${font.size['2xl']}, 2.6vw, ${font.size['4xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.03em;
  line-height: ${font.leading.tight};
  color: ${color.text};
`;

export const EmptyBody = styled.p`
  margin: 0;
  font-size: ${font.size.md};
  color: ${color.textSecondary};
  line-height: ${font.leading.snug};
  max-width: 44ch;
`;

export const QuickPickLabel = styled.p`
  margin: 0;
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.08em;
  color: ${color.textMuted};
`;

export const QuickPickList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]};
`;

/** 색 점 + 칩 한 벌. 폭이 180px 을 넘지 않으므로 여기서 색을 써도 면 예산과 무관하다. */
export const QuickPickItem = styled.li`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
`;

/**
 * 추천 칩 앞의 종목 색 점 — **누르기 전에 이미 그 종목의 색을 보여 준다.**
 * 옆에 깔린 예시 달력의 같은 종목 칩이 같은 색 점을 달고 있어, 누르면 그 색이 그대로 선명해진다.
 * 색은 인라인 style 로 들어온다(화면 전체가 공유하는 색 사전). 장식이라 aria-hidden 이다.
 */
export const QuickPickDot = styled.span`
  display: inline-block;
  flex: 0 0 auto;
  width: 8px;
  height: 8px;
  border-radius: 50%;
`;

/**
 * 예시 달력이 앉는 판. 실제 지도 카드와 **같은 기하**를 쓰되 한 겹 뒤로 물러난다 —
 * "여기 이런 것이 뜬다"는 자리 표시이지 읽을 데이터가 아니다.
 */
export const PreviewPane = styled.div`
  ${bodyCard}
  background: ${color.surfaceSunken};
`;

/* -------------------------------------------------------------------------- */
/* 드로어 안쪽 — 지급월 데이터가 없는 종목 접이식                                 */
/* -------------------------------------------------------------------------- */

export const UnavailableDetails = styled.details`
  flex: 0 0 auto;
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surface};
  padding: ${space[3]};

  &[open] > summary svg {
    transform: rotate(90deg);
  }
`;

export const UnavailableSummary = styled.summary`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  cursor: pointer;
  list-style: none;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${color.textSecondary};
  border-radius: ${radius.xs};

  &::-webkit-details-marker {
    display: none;
  }

  svg {
    transition: transform ${motion.fast} ${motion.ease};
  }

  &:hover {
    color: ${color.text};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

export const UnavailableBody = styled.p`
  margin: ${space[3]} 0 0;
  font-size: ${font.size.xs};
  color: ${color.textMuted};
  line-height: ${font.leading.snug};
`;

export const UnavailableList = styled.ul`
  list-style: none;
  margin: ${space[2]} 0 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: ${space[1]};
  font-size: ${font.size.xs};
  color: ${color.textSecondary};
  ${font.numeric}
`;

export const UnavailableItem = styled.li`
  padding: 2px ${space[2]};
  border-radius: ${radius.pill};
  background: ${color.surfaceMuted};
`;

/*
 * 각주(`FootNoteCard`)와 히어로는 여기 없다 — 공용 `components/common/PageFooter` / `PageHero` 로
 * 수렴했다(2026-07-31). 다시 복제하지 마라.
 */

import { keyframes } from '@emotion/react';
import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { PickCard } from '@/components/common';
import {
  DATA_RADIUS,
  DATA_SURFACE,
  PICK,
  PICK_RADIUS,
  appHeaderHeight,
  cardElevation,
  color,
  font,
  iconOpticalAlign,
  media,
  motion,
  radius,
  space
} from '@/shared/styles';

/**
 * ── `/ticker/:name` 의 면 설계 ────────────────────────────────────────────────
 *
 * 이 화면은 **긴 서사 문서**다. 검색으로 처음 들어온 사람이 착지하는 지면이라 구조가 곧 신뢰다.
 * 그래서 두 축을 분리했다.
 *
 *  · **brand 면(고르는 면)** — 히어로 캡 · CTA · 관련 티커 카드. 색·큰 라운드·부상이 여기 산다.
 *  · **data 면(읽는 면)**   — 히어로 지표판 · 스탯 밴드 · 스펙 표 · 보유 종목 표 · FAQ.
 *    L1(선·점·귀) 외의 채도면을 두지 않는다. 숫자의 신뢰감을 지키는 자리다.
 *
 * ## 틴트 면 예산 (tintscan: 화면당 2면)
 * 개편 전 이 라우트는 **5면**이었다(실측 2026-08-03, 1280·390 동일):
 * 히어로 전면 틴트 1 + 섹션 `StatHighlight` 틴트 4. 상한의 2.5배다.
 * 개편 후는 정확히 둘이고, 그중 하나는 이 화면 것이 아니다.
 *   ① 히어로 캡 — **이 티커 자신의 색**으로 칠한 면(`--tk-active-bg` 면 + `--tk-text` 잉크).
 *      🔴 2026-08-03: 허브 카드 캡은 흰 캔버스 전환에서 중립 판이 됐다(`TickerHubPage.styled.ts`
 *      의 CardScope 주석). 그래서 두 지면을 잇는 것은 이제 **면색이 아니라 잉크와 리본**이다 —
 *      허브 카드의 심볼·캡 글자·6px 리본이 그대로 이 히어로의 심볼·캡 글자·6px 리본이 된다.
 *      이 면을 남긴 이유는 개수다: 여기서는 **한 페이지에 한 장**이라 반복이 없고, 면색과 잉크가
 *      같은 hue 라 서로 싸우지도 않는다(허브에서는 brand 민트 면 위에 티커 hue 잉크였다).
 *   ② 공용 `PageFooter`(브랜드 패널) — 페이지 공통으로 딸려오는 면.
 *
 * 🔴 그래서 **히어로 본체는 채도 면이 아니다.** 색은 상단 6px 티커 그라디언트 리본 · 캡 ·
 * 심볼 글자 · 레일(4px)이 말한다 — 넷 다 면 판정(폭 ≥180px · 높이 ≥8px · 비중립 배경)에 걸리지 않는다.
 * 새 색면을 하나라도 더 얹고 싶어지면 먼저 tintscan 을 돌려라.
 */

/** 얇은 액센트 레일 폭. 얇은 막대라 반경을 주지 않는다(radiusShape 가드 §②). */
const RAIL = '4px';

/** 리더 레일(목차) 열 폭. 번호 + 두 줄 라벨이 접히지 않는 최소값. */
const RAIL_COLUMN = '248px';

/** 본문 문단의 읽기 폭. 68ch 를 넘기면 줄 끝에서 다음 줄 시작을 놓친다. */
const MEASURE = '68ch';

/* -------------------------------------------------------------------------- */
/* 액센트 스코프 + 리빌 공통                                                     */
/* -------------------------------------------------------------------------- */

/**
 * 잉크를 자기 면에 섞는 비율. `--tk-soft`(아웃라인 버튼 hover)와 `--tk-active-bg`(히어로 캡 ·
 * 목차 활성)가 **같은 값을 쓴다** — 두 자리 모두 그 면 위에 `--tk-text` 를 그대로 얹기 때문이다.
 *
 * 🔴 **이 숫자를 올리지 마라.** 자기 잉크를 섞은 면은 잉크가 진할수록 면도 진해져 **대비가 같이
 * 깎인다.** 16% 였을 때 sunset 다크에서 VYM 잉크(#e0808f)가 **4.47:1** 로 AA(4.5)를 미달했다
 * (2026-08-03, `test/ticker/tickerAccentContrast.test.ts` 를 새로 세우자마자 잡힌 실측 결함).
 * 12% 로 내려 최악값이 **4.81:1** 이 됐고, 면 자체는 여전히 서피스 대비 1.18~1.25:1 로 판이 보인다
 * (허브 카드의 중립 캡 `surface-sunken` 1.11~1.25 와 같은 대역이다 — 두 지면의 캡이 같은 무게로 앉는다).
 * 실측 곡선: 8% → AA 5.15 / 면 1.11 · 12% → 4.81 / 1.18 · 14% → 4.65 / 1.22 · 16% → **4.47** / 1.25.
 */
const INK_WASH = '12%';

/**
 * 티커별 액센트를 페이지 루트에 주입하는 스코프.
 *
 * 인라인 style 로 원시 값(`--tk-from/to/text-light/text-dark`)만 받고, 여기서 테마-인지 파생 변수
 * (`--tk-text/gradient/soft/border/active-bg/solid`)를 만든다. 장식 컴포넌트는 이 파생 변수만 참조하므로
 * **액센트 미지정 티커는 기본 브랜드 팔레트로 자동 폴백**한다(아래 기본값). soft/border 는 `--tk-text` 를
 * 서피스와 color-mix 해 파생해 라이트/다크 전환을 리렌더 없이 따라간다.
 */
export const AccentScope = styled.div`
  /* 기본(액센트 미지정) = 앱 브랜드 팔레트 */
  --tk-gradient: ${color.gradientAurora};
  --tk-text: ${color.brandText};
  --tk-soft: ${color.brandSubtle};
  --tk-border: ${color.brandBorder};
  --tk-active-bg: ${color.brandSubtle};
  --tk-solid: ${color.brand};

  &[data-accent='true'] {
    --tk-text: var(--tk-text-light);
    --tk-gradient: linear-gradient(120deg, var(--tk-from), var(--tk-to));
    --tk-solid: var(--tk-from);
    --tk-soft: color-mix(in srgb, var(--tk-text) ${INK_WASH}, ${color.surface});
    --tk-border: color-mix(in srgb, var(--tk-text) 40%, transparent);
    /* 🔴 두 워시는 같은 비율을 쓴다 — 위 INK_WASH 주석의 실측(16% 는 AA 미달)이 그 이유다. */
    --tk-active-bg: color-mix(in srgb, var(--tk-text) ${INK_WASH}, ${color.surface});

    /* 다크 서피스에서는 액센트 기준색을 밝은 쪽으로 — soft/border 는 --tk-text 참조라 자동 반영. */
    @media (prefers-color-scheme: dark) {
      --tk-text: var(--tk-text-dark);
    }
    /*
     * 팔레트 시스템의 강제 테마 오버라이드(data-theme)와도 정합을 맞춘다.
     *
     * 🔴 조상 선택자는 반드시 html[...] 로 쓴다 — :root[...] & 는 **동작하지 않는다.**
     * stylis 는 콜론으로 시작하는 중첩 선택자를 "부모에 붙는 의사선택자"로 보고 부모를 앞에
     * 덧붙이는데, 그 결과가 .css-x[data-accent]:root[data-theme='dark'] .css-x[data-accent] 라
     * **영원히 매치되지 않는다**(2026-07-30 실측: 앱 토글로 강제 다크를 켜면 액센트 텍스트가
     * 라이트 값으로 남아 대비가 약 2.0:1 까지 떨어졌다). html 은 콜론으로 시작하지 않아
     * 그대로 조상 선택자로 나간다. 허브 카드(TickerHubPage.styled.ts)가 같은 처방을 쓴다.
     */
    html[data-theme='light'] & {
      --tk-text: var(--tk-text-light);
    }
    html[data-theme='dark'] & {
      --tk-text: var(--tk-text-dark);
    }
  }
`;

/** Apple 마케팅 페이지풍 이징 — 초기 가속 없이 길게 감속하며 안착. */
const REVEAL_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

/**
 * 등장 키프레임 — **시간 기반 마운트 리빌(히어로)과 스크롤 기반 리빌(섹션)이 같은 키프레임을 공유**한다.
 * 은은하게: opacity 0→1, translateY 24px→0. 과한 점프·바운스·블러 없음
 * (blur 는 중간 스크롤 구간에 텍스트가 흐릿하게 남아 사용자 요청으로 제거 — 2026-07-22).
 */
const revealIn = keyframes`
  from {
    opacity: 0;
    transform: translate3d(0, 24px, 0);
  }
  to {
    opacity: 1;
    transform: translate3d(0, 0, 0);
  }
`;

/** 목차 진행 레일 — 스크롤 타임라인에 매여 위에서 아래로 자란다(스크롤 진행도 = 애니메이션 진행도). */
const scrollRail = keyframes`
  from {
    transform: scaleY(0);
  }
  to {
    transform: scaleY(1);
  }
`;

/**
 * 히어로(첫 화면·above-the-fold) 요소용 **시간 기반 마운트 리빌**.
 *
 * `view()` 스크롤 타임라인은 로드 시점에 이미 뷰포트 안에 있는 요소를 애니메이트하지 못한다(entry 구간이
 * 이미 지나 있어 곧장 종료 상태로 스냅된다). 그래서 히어로는 스크롤 연동 대신 마운트 애니메이션으로
 * `$delay` stagger 한다 — CSS 애니메이션이라 JS 트리거가 필요 없고 전 브라우저에서 동작한다.
 */
export const HeroReveal = styled.div<{ $delay?: number }>`
  animation: ${revealIn} 620ms ${REVEAL_EASE} both;
  animation-delay: ${({ $delay = 0 }) => $delay}ms;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/* -------------------------------------------------------------------------- */
/* 빵부스러기 — 히어로 **밖**의 페이지 레벨 내비                                  */
/* -------------------------------------------------------------------------- */

/**
 * 🔴 히어로 안에 두지 않는다. 빵부스러기는 "이 페이지가 사이트 어디에 있나"를 말하는 **페이지 레벨**
 * 내비이고, 히어로는 "이 티커가 무엇인가"를 말하는 콘텐츠다. 둘을 한 상자에 넣으면 히어로의 첫 줄이
 * 티커가 아니라 경로가 되어, 착지 직후 0.3초의 시선이 가장 덜 중요한 정보에 먼저 닿는다.
 */
export const Breadcrumb = styled.nav`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  margin-bottom: ${space[3]};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  color: ${color.textMuted};

  a {
    color: ${color.textSecondary};
    text-decoration: none;

    &:hover {
      color: var(--tk-text);
      text-decoration: underline;
    }
  }
`;

/* -------------------------------------------------------------------------- */
/* 히어로 — 중립 면 + 티커 리본 + 캡 + 2열(정체성 | 지표판)                        */
/* -------------------------------------------------------------------------- */

/**
 * 히어로 본체는 **중립 면**이다(위 파일 머리말의 예산 설명을 보라). 경계는 상단 6px 티커 리본과
 * 1px 액센트 테두리가 만든다 — 라이트 테마에서 surface 와 bg 차이가 거의 없기 때문이다.
 */
export const Hero = styled.section`
  position: relative;
  overflow: hidden;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0;
  padding: 0;
  border: 1px solid var(--tk-border);
  border-radius: ${PICK_RADIUS};
  background: ${color.surface};

  /* ⚠ 얇은 막대(6px)라 반경을 주지 않는다 — 부모 overflow 가 잘라낸다(radiusShape 가드 §②). */
  &::before {
    content: '';
    position: absolute;
    inset: 0 0 auto 0;
    height: ${PICK.railHeight};
    z-index: 1;
    background: var(--tk-gradient);
  }
`;

/**
 * 히어로 캡 — 이 화면이 스스로 만드는 **유일한 채도 면**.
 *
 * 이 티커가 어느 카테고리에 속하는지 첫 줄에서 말하는 자리다. 색이 단독 채널이 되지 않도록
 * 글리프가 함께 선다.
 *
 * 🔴 면(`--tk-active-bg`)과 잉크(`--tk-text`)가 **같은 hue** 다 — 면은 잉크를 16% 섞어 만든다
 * (`AccentScope`). 그래서 이 캡은 색이 하나뿐인 면이고, 그 점이 허브 카드 캡을 중립으로 내린
 * 판단과 모순되지 않는다(거기서는 brand 민트 면 위에 티커 hue 잉크라 축이 둘이었다).
 * 실측 대비 최악값은 4.79:1(navy-gold 라이트 · DGRW) — AA(4.5) 여유가 이 앱에서 가장 얇은
 * 지점이라 `test/ticker/tickerAccentContrast.test.ts` 가 티커 27종 × 8프리셋으로 잠근다.
 * 🔴 잉크를 더 옅게(밝게) 만들면 면도 함께 옅어지지만 대비는 **떨어진다** — 새 티커 액센트를
 * 들일 때 그 테스트를 먼저 돌려라.
 */
export const HeroCap = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${space[2]} ${space[3]};
  padding: ${space[3]} clamp(20px, 3vw, 32px);
  padding-top: calc(${space[3]} + ${PICK.railHeight});
  background: var(--tk-active-bg);
  color: var(--tk-text);
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.01em;
`;

export const HeroCapGlyph = styled.span`
  ${iconOpticalAlign('sans', font.size.sm)}
  display: inline-flex;
  flex: 0 0 auto;
`;

/** 캡 오른쪽 보조 정보(장 수). 밀어내기로 오른쪽 끝에 붙는다. */
export const HeroCapMeta = styled.span`
  margin-left: auto;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${color.text};
  ${font.numeric};
`;

/**
 * 히어로 본문 — **2열**이다(정체성 | 지표판).
 *
 * 종전에는 제목 아래 4칸 스탯 격자가 같은 무게로 깔려 "이 화면에서 가장 먼저 읽어야 할 숫자"가
 * 없었다. 이제 오른쪽 판이 배당률 하나를 히어로 크기로 세우고 나머지 셋은 그 아래 줄로 눕는다.
 */
export const HeroBody = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(300px, 1fr);
  gap: clamp(20px, 3vw, 40px);
  align-items: start;
  padding: clamp(22px, 3.2vw, 40px);

  ${media.down('tablet')} {
    grid-template-columns: minmax(0, 1fr);
    gap: ${space[5]};
  }
`;

export const HeroMain = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${space[4]};
  min-width: 0;
`;

/** 페이지의 유일 `<h1>` — 서버 렌더러(renderHero)의 h1 과 대칭(위계 h1→h2→h3 유지). */
export const TickerBadge = styled.h1`
  margin: 0;
  display: grid;
  gap: ${space[2]};
  min-width: 0;
`;

/**
 * 티커 심볼 — 이 페이지에서 **가장 큰 글자**다. 종전 상한 36px 에서 52px 로 올렸다.
 * 49개 페이지가 같은 템플릿을 쓰므로, 첫 화면에서 티커를 크게 세우는 것이 얼굴을 가르는 수단이다.
 *
 * 🔴 **그라디언트 글자(background-clip: text)를 버리고 `--tk-text` 솔리드로 갔다.** 두 이유다.
 *
 *  ① **허브와 색이 정확히 이어진다.** 허브 카드의 심볼(`TickerHubPage.styled.ts` 의 CardSymbol)이
 *     `color: var(--tk-text)` 다 — 카드를 눌러 들어온 사람이 **같은 색의 같은 글자**를 다시 만난다.
 *     그라디언트는 그 연속성을 끊는다(허브에는 그라디언트 심볼이 없다).
 *  ② **tintscan 이 그라디언트 글자를 면으로 센다.** `background-image !== none` 이 판정 기준이라
 *     글자를 칠하려고 얹은 배경도 면이다. 실측(2026-08-03, 1280px): display:block · 64px 에서
 *     607×52 로 잡혀 3면(상한 2), `justify-self: start` 로 상자를 글자 폭까지 줄여도
 *     **DGRW 는 183px** 로 하한(180px)을 3px 넘겼다. 즉 글자 수에 따라 가드가 켜졌다 꺼졌다 한다 —
 *     그런 규칙은 가드로 못 쓴다. 솔리드는 그 불확실성이 원천적으로 없다.
 *
 * 그라디언트는 사라지지 않았다 — 히어로 상단 6px 리본과 목차 진행 레일이 계속 그 색을 낸다.
 * 🔴 되살리고 싶으면 먼저 tintscan 을 티커 여러 종으로 돌려라(한 종만 보면 통과한다).
 */
export const TickerSymbol = styled.span`
  display: block;
  font-size: clamp(34px, 5vw, 52px);
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.05em;
  line-height: 1;
  color: var(--tk-text);
  ${font.numeric};
`;

/** 한글명 · 영문명 — 심볼 아래 한 단 낮은 위계. 긴 영문명이 히어로를 넘기지 않게 줄바꿈을 허용한다. */
export const TickerNames = styled.span`
  display: block;
  font-size: ${font.size.md};
  font-weight: ${font.weight.semibold};
  line-height: ${font.leading.snug};
  color: ${color.textSecondary};
  min-width: 0;
  overflow-wrap: anywhere;
`;

/** 영문명 — 한글명과 같은 줄에 서지만 한 단 더 옅다(같은 무게면 둘 다 안 읽힌다). */
export const TickerEnglishName = styled.span`
  color: ${color.textMuted};
  font-weight: ${font.weight.medium};
`;

export const HeroTagline = styled.p`
  margin: 0;
  font-size: clamp(${font.size.lg}, 1.6vw, ${font.size['2xl']});
  font-weight: ${font.weight.semibold};
  line-height: ${font.leading.snug};
  color: ${color.text};
  /* 40ch — 34ch 에서는 SCHD 카피의 마지막 두 글자가 홀로 다음 줄로 떨어졌다(실측 1280px). */
  max-width: 40ch;
  /* 제목급 문장은 한국어를 음절이 아니라 **어절** 단위로 꺾는다(공용 Card·PageHero 와 같은 처방).
     실측: VYM 카피가 '고배/당 ETF' 로 갈렸다. 긴 영문 토큰은 anywhere 가 마지막 방어. */
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

/* -------------------------------------------------------------------------- */
/* 히어로 지표판 — data 면                                                       */
/* -------------------------------------------------------------------------- */

/**
 * 히어로 오른쪽 **읽는 면**. 채도면이 아니라 중립 면 + 1px 테두리다(SurfaceKind 2분법) —
 * 숫자가 앉는 자리에는 색면을 깔지 않는다.
 */
export const HeroMetric = styled.dl`
  margin: 0;
  display: grid;
  gap: ${space[3]};
  padding: ${DATA_SURFACE.pad};
  border-radius: ${DATA_RADIUS};
  ${cardElevation('base')}
  min-width: 0;

  animation: ${revealIn} 640ms ${REVEAL_EASE} both;
  animation-delay: 160ms;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const HeroMetricLead = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

export const HeroMetricLabel = styled.dt`
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${color.textMuted};
`;

/** 이 화면의 히어로 숫자. 오른쪽 정렬하지 않는다 — 라벨과 같은 축에서 시작해야 한 덩어리로 읽힌다. */
export const HeroMetricValue = styled.dd`
  margin: 0;
  font-size: clamp(${font.size['4xl']}, 4.4vw, ${font.size['6xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.04em;
  line-height: 1;
  color: ${color.text};
  ${font.numeric};
  overflow-wrap: anywhere;
`;

export const HeroMetricCaption = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  color: ${color.textMuted};
  line-height: ${font.leading.snug};
`;

/** 보조 지표 3줄. 라벨 좌 · 값 우 — 표의 문법이라 세로로 훑으며 비교된다. */
export const HeroMetricRows = styled.div`
  display: grid;
  gap: 0;
  border-top: 1px solid ${color.border};
`;

export const HeroMetricRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${space[3]};
  padding: ${space[2]} 0;
  min-width: 0;

  & + & {
    border-top: 1px solid ${color.border};
  }
`;

export const HeroMetricRowLabel = styled.dt`
  font-size: ${font.size.xs};
  color: ${color.textMuted};
  font-weight: ${font.weight.medium};
  min-width: 0;
`;

export const HeroMetricRowValue = styled.dd`
  margin: 0;
  text-align: right;
  font-size: ${font.size.md};
  font-weight: ${font.weight.bold};
  color: ${color.text};
  ${font.numeric};
  white-space: nowrap;
`;

/* -------------------------------------------------------------------------- */
/* CTA 버튼(링크)                                                               */
/* -------------------------------------------------------------------------- */

export const CtaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]};
  align-items: center;
`;

const ctaBase = `
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  padding: 11px ${space[5]};
  border-radius: ${radius.pill};
  font-size: ${font.size.md};
  font-weight: ${font.weight.bold};
  text-decoration: none;
  transition: background ${motion.fast} ${motion.ease}, transform ${motion.fast} ${motion.ease};

  @media (hover: hover) and (pointer: fine) {
    &:hover {
      transform: translateY(-1px);
    }
  }
`;

/**
 * 이 페이지의 **최종 목적지** — 시뮬레이터로 넘어가는 링크.
 *
 * 허브 lede 가 "바로 시뮬레이터로 가져가 내 조건에서 계산해 보세요"라고 약속하는데 두 지면 어디에도
 * 그 링크가 없었다(2026-07-30 감사). SEO 유입 = 첫 방문자 비중이 가장 높은 지면이라 여기가 비면
 * 페이지 전체가 막다른 길이 된다.
 *
 * 🔴 솔리드 채움은 **brand 축 하나만** 합법이다 — 티커 액센트를 솔리드로 채우고 흰 글자를 얹으면
 * 티커마다 색이 달라 대비를 보장할 수 없다(그 값들은 비텍스트 3:1 로만 검증돼 있다).
 * 그래서 이 버튼만은 티커 색이 아니라 brand + onBrand 고정이고, 티커 색은 그 옆·위에서 말한다.
 * ⚠ 알약 버튼이라 폭이 180px 을 넘어도 배경이 brand 솔리드다 — tintscan 은 면으로 세지만
 *   `main` 안 폭이 좁아(약 170px) 실측상 걸리지 않는다. 라벨이 길어지면 다시 재보라.
 */
export const PrimaryCta = styled(Link)`
  ${ctaBase}
  background: ${color.brand};
  color: ${color.onBrand};
  border: 1px solid transparent;

  &:hover {
    background: ${color.brandHover};
  }
`;

/** 보조 액션(다른 티커 보기) — 위 primary 와 위계를 가르기 위해 테두리만 남긴다. */
export const SecondaryCta = styled(Link)`
  ${ctaBase}
  background: transparent;
  color: var(--tk-text);
  border: 1px solid var(--tk-border);

  &:hover {
    background: var(--tk-soft);
  }
`;

/* -------------------------------------------------------------------------- */
/* 2단 레이아웃: 리더 레일 + 본문                                                */
/* -------------------------------------------------------------------------- */

export const Layout = styled.div`
  margin-top: clamp(28px, 4vw, 48px);
  display: grid;
  grid-template-columns: ${RAIL_COLUMN} minmax(0, 1fr);
  gap: clamp(24px, 4vw, 56px);
  align-items: start;

  ${media.down('layout')} {
    grid-template-columns: 1fr;
    /* 모바일: 히어로와 sticky 목차 가로바 사이 상단 여백 축소. 데스크톱 2단은 그대로. */
    margin-top: ${space[3]};
    gap: ${space[4]};
  }
`;

/**
 * 리더 레일 — 종전 "목차"의 자리지만 하는 일이 다르다.
 *
 * 종전 목차는 **본문 장만** 담아 문서의 앞 60%만 가리켰다(참고 지표·FAQ·관련 티커로 내려가면
 * 활성 표시가 마지막 장에 멈춰 있었다). 이제 부록까지 담고, 장에는 번호가 붙고, 맨 아래에
 * 상시 CTA 가 붙어 긴 문서 어디에서도 다음 행동이 한 화면 안에 있다.
 */
export const TocAside = styled.nav`
  position: sticky;
  /* 데스크톱 사이드바 — 앱 헤더 **실측 높이** + 약간의 여백 아래에 붙는다(AppHeader 가 발행). */
  top: calc(${appHeaderHeight} + ${space[3]});
  align-self: start;
  min-width: 0;

  ${media.down('layout')} {
    position: sticky;
    /* ⚠ 앱 헤더 높이에 정확히 맞물린다 — 하드코딩(구 57px·88px)은 헤더 줄 수가 바뀔 때마다 어긋나
       헤더와 이 목차 바 사이에 빈 띠(갭)를 만들었다. 이제 실측값이라 항상 딱 붙는다. */
    top: ${appHeaderHeight};
    z-index: 5;
    padding: ${space[2]} 0;
    background: ${color.surfaceGlassFallback};
    border-bottom: 1px solid ${color.border};
  }

  ${media.up('layout')} {
    position: sticky;
    display: grid;
    gap: ${space[3]};
    padding: ${space[4]};
    border-radius: ${DATA_RADIUS};
    ${cardElevation('base')}
    overflow: hidden;

    /*
     * 읽은 분량 진행 레일 — 문서 스크롤 진행도에 매인다(JS 0). 레일 왼쪽 끝에 붙어 자란다.
     * ⚠ 얇은 막대라 반경을 주지 않는다(radiusShape §②). 미지원 브라우저에서는 그냥 꽉 찬 레일.
     */
    &::before {
      content: '';
      position: absolute;
      inset: 0 auto 0 0;
      width: 3px;
      background: var(--tk-gradient);
      transform-origin: 0 0;

      @supports (animation-timeline: scroll(root block)) {
        animation: ${scrollRail} linear both;
        animation-timeline: scroll(root block);
      }
      @media (prefers-reduced-motion: reduce) {
        animation: none;
      }
    }
  }
`;

/** 레일 머리 — "목차" 라벨 + 장 수. 모바일 가로바에서는 자리를 먹으므로 숨긴다. */
export const TocHead = styled.p`
  margin: 0;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${space[2]};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${color.textMuted};

  ${media.down('layout')} {
    display: none;
  }
`;

export const TocCount = styled.span`
  letter-spacing: 0;
  text-transform: none;
  color: ${color.textSecondary};
  ${font.numeric};
`;

export const TocList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 1px;

  ${media.down('layout')} {
    /* 가로 스크롤 대신 줄바꿈 — 좁은 화면에서 목차 칩이 여러 줄로 접혀 전부 보인다(사용자 요청). */
    display: flex;
    flex-wrap: wrap;
    gap: ${space[1]};
  }
`;

/** 부록 항목 앞의 구분선 — 본문 장과 부록이 한 목록 안에서 갈린다(글자 크기가 아니라 선으로). */
export const TocDivider = styled.li`
  height: 1px;
  margin: ${space[2]} 0;
  background: ${color.border};

  ${media.down('layout')} {
    display: none;
  }
`;

/**
 * 목차 항목.
 *
 * 데스크톱은 **번호 + 라벨 2열**이고, 활성 항목만 액센트 면을 입는다(폭 <180px 라 면으로 세어지지
 * 않는다). 모바일은 같은 요소가 줄바꿈 칩이 된다 — 형태가 둘이라 각자의 규칙이 있다.
 */
export const TocButton = styled.button<{ $active: boolean }>`
  width: 100%;
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  align-items: baseline;
  gap: ${space[2]};
  text-align: left;
  border: none;
  cursor: pointer;
  padding: 7px ${space[2]};
  border-radius: ${radius.sm};
  background: ${({ $active }) => ($active ? 'var(--tk-active-bg)' : 'transparent')};
  color: ${({ $active }) => ($active ? 'var(--tk-text)' : color.textSecondary)};
  font-size: ${font.size.sm};
  font-weight: ${({ $active }) => ($active ? font.weight.bold : font.weight.medium)};
  line-height: ${font.leading.snug};
  transition: background ${motion.fast} ${motion.ease}, color ${motion.fast} ${motion.ease};

  &:hover {
    background: ${({ $active }) => ($active ? 'var(--tk-active-bg)' : color.surfaceHover)};
    color: ${({ $active }) => ($active ? 'var(--tk-text)' : color.text)};
  }

  ${media.down('layout')} {
    /* 줄바꿈 칩 — 내용 폭으로 줄어 한 줄에 여러 개가 들어가고 넘치면 다음 줄로 접힌다.
       (base의 width:100%를 auto로 풀지 않으면 flex 자식이 줄을 통째로 차지해 세로로만 쌓인다.)

       ⚠ 이 바는 **sticky** 다 — 줄이 늘면 늘어난 만큼 화면이 영구히 좁아진다. 부록 4항목이
       목차에 들어오면서 390px 에서 3줄이 됐고, 그만큼 본문이 밀렸다. 그래서 모바일 칩만
       한 단 작게(12px·좁은 패딩) 잡아 두 줄 대역으로 되돌린다. */
    width: auto;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    white-space: nowrap;
    padding: 3px ${space[2]};
    font-size: ${font.size.xs};
    border-radius: ${radius.pill};
    border: 1px solid ${({ $active }) => ($active ? 'var(--tk-solid)' : color.border)};
  }
`;

/** 장 번호. 등폭 숫자라 세로로 줄이 선다 — 번호가 곧 문서의 뼈대다. */
export const TocIndex = styled.span<{ $active: boolean }>`
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0;
  color: ${({ $active }) => ($active ? 'var(--tk-text)' : color.textMuted)};
  ${font.numeric};
`;

/** 부록 항목의 표식 — 번호 자리에 서는 점(장이 아니라는 뜻을 모양으로 말한다). */
export const TocDot = styled.span<{ $active: boolean }>`
  justify-self: center;
  width: 5px;
  height: 5px;
  border-radius: ${radius.pill};
  background: ${({ $active }) => ($active ? 'var(--tk-solid)' : color.borderStrong)};

  ${media.down('layout')} {
    width: 4px;
    height: 4px;
  }
`;

export const TocLabel = styled.span`
  min-width: 0;
  overflow-wrap: anywhere;
`;

/**
 * 레일 바닥의 상시 CTA — 긴 문서 어디에서도 다음 행동이 한 화면 안에 있다.
 * 🔴 데스크톱 전용이다. 모바일에서 sticky 가로바에 버튼을 더하면 헤더 아래 띠가 두 줄이 된다.
 */
export const TocCta = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: ${space[2]} ${space[3]};
  border-radius: ${radius.sm};
  border: 1px solid var(--tk-border);
  background: transparent;
  color: var(--tk-text);
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  text-decoration: none;
  transition: background ${motion.fast} ${motion.ease};

  &:hover {
    background: var(--tk-soft);
  }

  ${media.down('layout')} {
    display: none;
  }
`;

export const Content = styled.div`
  display: grid;
  gap: clamp(36px, 5vw, 64px);
  min-width: 0;
`;

/* -------------------------------------------------------------------------- */
/* 섹션 — 번호 붙은 장                                                          */
/* -------------------------------------------------------------------------- */

export const Section = styled.section<{ $revealed: boolean }>`
  scroll-margin-top: 96px;
  display: grid;
  gap: ${space[4]};

  /*
   * ── 폴백: scroll-driven 미지원 브라우저(구형 Safari 등)용 IntersectionObserver one-shot 리빌 ──
   * useInView 가 준 $revealed 로 한 번 등장하고 유지한다. 지원 브라우저에서는 아래 @supports 블록이
   * opacity/transform/transition 을 통째로 덮어써 이 값들은 무시된다(JS 는 무해하게 계속 돈다).
   */
  opacity: ${({ $revealed }) => ($revealed ? 1 : 0)};
  transform: ${({ $revealed }) => ($revealed ? 'none' : 'translate3d(0, 24px, 0)')};
  transition:
    opacity 720ms ${REVEAL_EASE},
    transform 720ms ${REVEAL_EASE};

  /* 프로그램적 포커스 타깃(목차 점프 시 focus) — 얇은 링을 남긴다(outline:none 금지 규칙 취지). */
  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 8px;
    border-radius: ${radius.sm};
  }

  /*
   * ── scroll-driven: 뷰포트 진입 스크롤 진행도에 매여 서서히 안착(위로 되감으면 자연 역재생) ──
   * duration 은 지정하지 않는다 — 스크롤 타임라인에서는 auto 가 곧 "animation-range 전체에 매핑"이다.
   */
  @supports (animation-timeline: view()) {
    opacity: 1;
    transform: none;
    transition: none;
    animation-name: ${revealIn};
    animation-fill-mode: both;
    animation-timing-function: ease-out;
    animation-timeline: view();
    animation-range: entry 0% cover 34%;
  }

  /* ── reduced-motion: 완전 정지(위 두 경로를 모두 덮도록 마지막에 둔다) ── */
  @media (prefers-reduced-motion: reduce) {
    opacity: 1;
    transform: none;
    transition: none;
    animation: none;
  }

  ${media.down('layout')} {
    scroll-margin-top: 120px;
  }
`;

/**
 * 장 머리 — 번호 줄 + 제목.
 *
 * 종전에는 제목 왼쪽 4px 레일 하나가 전부였다. 레일은 "여기가 제목"만 말하고 **문서가 몇 장으로
 * 이뤄졌는지**는 말하지 못한다. 번호 + 가로 헤어라인이 그 일을 한다(목차의 번호와 같은 값).
 */
export const SectionHead = styled.div`
  display: grid;
  gap: ${space[3]};
  min-width: 0;
`;

export const SectionEyebrow = styled.p`
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${space[3]};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--tk-text);
  ${font.numeric};

  /* 번호 뒤로 뻗는 헤어라인 — 장의 시작을 가로선으로도 말한다. */
  &::after {
    content: '';
    flex: 1 1 auto;
    height: 1px;
    background: ${color.border};
  }
`;

export const SectionHeading = styled.h2`
  margin: 0;
  font-size: clamp(${font.size['3xl']}, 3.2vw, ${font.size['5xl']});
  font-weight: ${font.weight.bold};
  letter-spacing: -0.035em;
  line-height: ${font.leading.tight};
  color: ${color.text};
  max-width: 22ch;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

/**
 * 첫 문단은 **리드**다 — 한 단 크고 진하다. 나머지 문단과 같은 무게면 장이 어디서 시작하는지
 * 눈이 못 잡는다(굵기로는 위계를 만들 수 없다 — display 서체가 Bold 한 벌뿐이라 600/700/800 이
 * 같게 렌더된다. 위계는 크기·색·간격뿐이다).
 */
export const Lead = styled.p`
  margin: 0;
  max-width: ${MEASURE};
  font-size: clamp(${font.size.lg}, 1.3vw, ${font.size.xl});
  line-height: ${font.leading.relaxed};
  color: ${color.text};
`;

export const Paragraph = styled.p`
  margin: 0;
  max-width: ${MEASURE};
  font-size: ${font.size.lg};
  line-height: ${font.leading.relaxed};
  color: ${color.textSecondary};
`;

/**
 * 근거 불릿 — 기본 disc 마커를 버리고 액센트 사각 마커를 쓴다. 마커가 티커 색이라 본문 안에서
 * "이 목록은 이 티커 이야기"라는 신호가 되고, 회색조에서도 모양(사각)이 남는다.
 */
export const BulletList = styled.ul`
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: ${space[3]};
  max-width: ${MEASURE};

  li {
    position: relative;
    padding-left: ${space[5]};
    color: ${color.textSecondary};
    font-size: ${font.size.lg};
    line-height: ${font.leading.relaxed};
  }

  li::before {
    content: '';
    position: absolute;
    left: 0;
    /* 첫 줄 잉크 중심에 맞춘 값 — 폰트 크기 × 줄간의 절반에서 마커 절반을 뺀다. */
    top: calc(${font.size.lg} * ${font.leading.relaxed} / 2 - 3px);
    width: 6px;
    height: 6px;
    border-radius: 2px;
    background: var(--tk-solid);
  }
`;

/**
 * 섹션 숫자 하이라이트 — **틴트 면에서 중립 밴드로** 바꿨다.
 *
 * 🔴 종전에는 이것이 티커 틴트 면이었고, SCHD 기준 한 화면에 4개가 서서 tintscan 5면(상한 2)의
 * 직접 원인이었다. 색을 뺀 자리는 **기하와 타이포**가 채운다 — 왼쪽 4px 레일, 값·라벨의 2열 배치,
 * 값의 히어로급 크기. 색면 없이도 이 블록이 문단 사이에서 가장 먼저 눈에 들어온다.
 */
export const StatBand = styled.figure`
  margin: 0;
  display: grid;
  grid-template-columns: minmax(0, auto) minmax(0, 1fr);
  align-items: center;
  gap: clamp(16px, 2.4vw, 32px);
  padding: clamp(16px, 2vw, 24px) clamp(18px, 2.4vw, 28px);
  border-radius: ${DATA_RADIUS};
  ${cardElevation('base')}
  border-left: ${RAIL} solid var(--tk-solid);
  max-width: ${MEASURE};

  ${media.down('mobileWide')} {
    grid-template-columns: minmax(0, 1fr);
    gap: ${space[2]};
  }
`;

export const StatBandValue = styled.p`
  margin: 0;
  font-size: clamp(${font.size['4xl']}, 4vw, ${font.size['6xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.04em;
  line-height: 1;
  color: ${color.text};
  ${font.numeric};
  overflow-wrap: anywhere;
`;

export const StatBandBody = styled.div`
  display: grid;
  gap: ${space[1]};
  min-width: 0;
`;

export const StatBandLabel = styled.figcaption`
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  color: var(--tk-text);
`;

export const StatBandCaption = styled.p`
  margin: 0;
  font-size: ${font.size.sm};
  color: ${color.textMuted};
  line-height: ${font.leading.snug};
`;

/* -------------------------------------------------------------------------- */
/* 부록 — 보유 종목 / 참고 지표 / FAQ / 관련 티커                                 */
/* -------------------------------------------------------------------------- */

/**
 * 부록 블록.
 *
 * 🔴 **카드(떠 있는 패널)를 걷어냈다.** 종전에는 셋 다 `surfaceRaised` + 그림자 패널이라
 * "화면에 raised 는 하나뿐"이라는 위계 규칙을 셋이 동시에 어기고 있었고, 본문(카드 없음)과
 * 부록(카드 셋)이 다른 문서처럼 보였다. 이제 부록도 본문과 같은 지면 위에 서고, 상단 헤어라인과
 * 라벨이 구획을 만든다 — 문서가 한 장의 종이로 읽힌다.
 */
export const Appendix = styled.section`
  scroll-margin-top: 96px;
  display: grid;
  gap: ${space[5]};
  padding-top: clamp(20px, 3vw, 28px);
  border-top: 2px solid ${color.borderStrong};

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 8px;
    border-radius: ${radius.sm};
  }

  ${media.down('layout')} {
    scroll-margin-top: 120px;
  }
`;

export const AppendixHead = styled.div`
  display: grid;
  gap: ${space[2]};
  min-width: 0;
`;

export const AppendixHeading = styled.h2`
  margin: 0;
  font-size: clamp(${font.size['2xl']}, 2.2vw, ${font.size['4xl']});
  font-weight: ${font.weight.bold};
  letter-spacing: -0.03em;
  line-height: ${font.leading.tight};
  color: ${color.text};
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

export const AppendixNote = styled.p`
  margin: 0;
  max-width: ${MEASURE};
  font-size: ${font.size.base};
  line-height: ${font.leading.snug};
  color: ${color.textMuted};
`;

/* ── 참고 지표: 타일 격자 → 스펙 표 ─────────────────────────────────────────── */

/**
 * 참고 지표.
 *
 * 종전에는 타일 8개가 각자 테두리를 갖는 격자였다 — 값 하나하나가 카드가 되면 **비교**가 안 된다
 * (읽는 눈이 카드 경계를 넘느라 값의 축을 잃는다). 스펙 시트는 표의 문법이 맞다: 라벨 좌 · 값 우 ·
 * 행 사이 헤어라인. 값이 한 축에 정렬돼 위에서 아래로 훑힌다.
 */
export const SpecTable = styled.dl`
  margin: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: clamp(24px, 3vw, 48px);
  border-top: 1px solid ${color.border};

  ${media.down('mobileWide')} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const SpecRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${space[4]};
  padding: ${space[3]} 0;
  border-bottom: 1px solid ${color.border};
  min-width: 0;
`;

export const SpecLabel = styled.dt`
  flex: 0 0 auto;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  color: ${color.textMuted};
`;

export const SpecValue = styled.dd`
  margin: 0;
  min-width: 0;
  text-align: right;
  font-size: ${font.size.md};
  font-weight: ${font.weight.bold};
  color: ${color.text};
  ${font.numeric};
  overflow-wrap: anywhere;
`;

/**
 * 섹터 비중 — 나란한 칩에서 **순위 목록**으로.
 *
 * 데이터가 가진 정보는 "비중 큰 순서"뿐인데(정확한 %가 없다), 같은 크기 칩을 늘어놓으면 그 순서가
 * 사라진다. 앞에 순위 숫자를 세우면 데이터가 실제로 가진 정보가 화면에도 남는다.
 */
export const SectorRank = styled.ol`
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]};
`;

export const SectorRankItem = styled.li`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px ${space[3]} 5px ${space[2]};
  border-radius: ${radius.pill};
  border: 1px solid ${color.border};
  background: ${color.surface};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${color.text};
`;

export const SectorRankNumber = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  border-radius: ${radius.pill};
  background: ${color.surfaceMuted};
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  ${font.numeric};
`;

export const SectorRankLabel = styled.p`
  margin: 0;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${color.textMuted};
`;

/** 기준 시점·출처 각주. 본문 폭보다 좁게 두고 한 단 옅게 — 읽히되 먼저 읽히지 않는다. */
export const AsOfNote = styled.p`
  margin: 0;
  max-width: ${MEASURE};
  padding-left: ${space[3]};
  border-left: 2px solid ${color.border};
  font-size: ${font.size.xs};
  color: ${color.textMuted};
  line-height: ${font.leading.relaxed};
`;

/* ── 상위 보유 종목 (신설) ──────────────────────────────────────────────────── */

/**
 * 상위 보유 종목 표 — **서버 렌더 HTML 에는 있었는데 화면에는 없던 블록**이다
 * (`server/handlers/TickerHtml` 의 renderTopHoldings). 크롤러만 보던 정보를 사람도 보게 한다.
 *
 * 막대는 최대 비중을 100 으로 정규화한 **상대 길이**다(뷰모델이 계산한다). 칸 폭이 좁아
 * 180px 를 넘지 않으므로 tintscan 의 면 판정에 걸리지 않는다.
 */
export const HoldingsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: ${font.size.base};

  caption {
    caption-side: top;
    text-align: left;
    padding-bottom: ${space[2]};
    font-size: ${font.size.xs};
    color: ${color.textMuted};
  }

  th,
  td {
    padding: ${space[3]} ${space[2]};
    border-bottom: 1px solid ${color.border};
    text-align: left;
    vertical-align: middle;
  }

  thead th {
    padding-top: 0;
    font-size: ${font.size['2xs']};
    font-weight: ${font.weight.bold};
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: ${color.textMuted};
    border-bottom: 1px solid ${color.borderStrong};
  }

  tfoot td {
    border-bottom: none;
    border-top: 1px solid ${color.borderStrong};
    font-weight: ${font.weight.bold};
    color: ${color.text};
  }

  /*
   * 🔴 좁은 폭에서는 **고정 칸을 줄여 종목명에 폭을 돌려준다.**
   * 실측(390px, DGRO): 순위 36 + 티커 88 + 비중 148 = 272px 이 고정이라 종목명에 94px 만 남아
   * 행 높이가 88px(세 줄)까지 부풀었다 — 20행이면 표 하나가 1,760px 다.
   * 좌우 패딩과 고정 칸을 줄이면 같은 20행이 눈에 띄게 짧아진다(값·막대는 그대로 남는다).
   */
  ${media.down('mobileWide')} {
    font-size: ${font.size.sm};

    th,
    td {
      padding: ${space[2]} ${space[1]};
    }
  }
`;

export const HoldingRank = styled.td`
  width: 36px;
  color: ${color.textMuted};
  font-size: ${font.size.sm};
  ${font.numeric};

  ${media.down('mobileWide')} {
    width: 24px;
  }
`;

export const HoldingSymbol = styled.td`
  width: 88px;
  font-weight: ${font.weight.bold};
  color: ${color.text};
  ${font.numeric};

  ${media.down('mobileWide')} {
    width: 62px;
  }
`;

export const HoldingName = styled.td`
  color: ${color.textSecondary};
  overflow-wrap: anywhere;
`;

/** 비중 칸 — 숫자와 막대가 한 칸 안에 함께 선다(막대만 있으면 값을 못 읽는다). */
export const HoldingWeight = styled.td`
  width: 148px;
  text-align: right;

  ${media.down('mobileWide')} {
    width: 88px;
  }
`;

export const HoldingWeightValue = styled.span`
  display: block;
  font-weight: ${font.weight.bold};
  color: ${color.text};
  ${font.numeric};
`;

/**
 * 비중 막대 트랙. 높이 6px 이라 면이 아니라 선으로 남는다(radiusShape §② — 반경 없음).
 *
 * 🔴 막대는 **오른쪽에 앵커**된다. 위 숫자가 우측정렬(tabular)이므로 막대가 왼쪽에서 자라면
 * 한 칸 안에 축이 둘이 생겨 눈이 두 번 움직인다. 오른쪽 끝을 공유하면 숫자와 막대가 같은 세로선
 * 위에 서고, 길이 차이만 남는다.
 */
export const HoldingBar = styled.span`
  display: flex;
  justify-content: flex-end;
  margin-top: 5px;
  height: 6px;
  background: ${color.progressTrack};
  overflow: hidden;
`;

export const HoldingBarFill = styled.span<{ $percent: number }>`
  display: block;
  height: 100%;
  flex: 0 0 auto;
  width: ${({ $percent }) => Math.max(0, Math.min(100, $percent))}%;
  background: var(--tk-solid);
`;

export const SourceLine = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  color: ${color.textMuted};
  line-height: ${font.leading.snug};

  a {
    color: var(--tk-text);
    font-weight: ${font.weight.semibold};
  }
`;

/* ── FAQ: 상자 목록 → 헤어라인 아코디언 ────────────────────────────────────── */

export const FaqList = styled.div`
  display: grid;
  border-top: 1px solid ${color.border};
`;

/**
 * FAQ 한 항목.
 *
 * 종전에는 항목마다 테두리 상자였다 — 8개가 세로로 쌓이면 상자 경계가 질문보다 강해 목록 전체가
 * 회색 격자로 읽혔다. 헤어라인 하나로 줄이면 질문 글자가 이 블록의 주인공이 된다.
 *
 * 🔴 펼친 항목의 면이 `surfaceMuted` → `surfaceSunken` 이다(2026-08-03 흰 캔버스). 이 목록은
 * 카드 안이 아니라 **페이지 캔버스 위에 바로** 서는데, 캔버스가 흰색이 되면서 muted 는
 * 1.02~1.08:1 이 됐다 — vivid·grape·sunset 에서는 펼친 항목의 면이 아예 없는 것과 같다.
 * sunken(1.11~1.22:1)이 "열려서 들어간 자리"를 8프리셋 전부에서 만든다.
 * ⚠ `summary` 는 컨트롤이지만 hover 가 **글자색만** 바꾸므로, sunken 과 `surfaceHover` 가 같은
 *   값인 프리셋(velog 라이트)에서도 피드백이 겹치지 않는다.
 */
export const FaqItem = styled.details`
  border-bottom: 1px solid ${color.border};

  &[open] {
    background: ${color.surfaceSunken};
  }
`;

export const FaqSummary = styled.summary`
  cursor: pointer;
  list-style: none;
  padding: ${space[4]} ${space[3]};
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr) 20px;
  align-items: baseline;
  gap: ${space[2]};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.01em;
  color: ${color.text};
  word-break: keep-all;
  overflow-wrap: anywhere;

  &::-webkit-details-marker {
    display: none;
  }

  &::after {
    content: '+';
    justify-self: end;
    font-size: ${font.size.xl};
    font-weight: ${font.weight.regular};
    color: ${color.textMuted};
  }

  details[open] &::after {
    content: '−';
    color: var(--tk-text);
  }

  &:hover {
    color: var(--tk-text);
  }
`;

/** 질문 번호 — 목록이 몇 개인지, 지금 몇 번째를 열었는지 말한다. */
export const FaqIndex = styled.span`
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  color: ${color.textMuted};
  ${font.numeric};
`;

export const FaqAnswer = styled.div`
  padding: 0 ${space[3]} ${space[4]} calc(26px + ${space[2]} + ${space[3]});
  max-width: ${MEASURE};
  font-size: ${font.size.md};
  line-height: ${font.leading.relaxed};
  color: ${color.textSecondary};
`;

/* ── 관련 티커: 평면 카드 → 고르는 카드(PickCard) ──────────────────────────── */

/**
 * 관련 티커 하나의 **색 스코프**이자 격자 셀.
 *
 * 허브 카드(`TickerHubPage.styled.ts` 의 CardScope)와 **같은 변수 이름**을 쓴다 — 같은 티커가
 * 허브 격자·상세 히어로·이 카드에서 모두 같은 색으로 읽힌다.
 * 🔴 `--tk-*` 를 재정의하므로 이 스코프 안은 **현재 티커 색이 아니라 그 관련 티커 색**이다.
 */
export const RelatedScope = styled.li`
  display: grid;
  min-width: 0;

  --tk-ink: var(--tk-related-series, ${color.brandText});
  --tk-text: var(--tk-text-light, var(--tk-ink));
  --tk-solid: var(--tk-from, var(--tk-ink));

  @media (prefers-color-scheme: dark) {
    --tk-text: var(--tk-text-dark, var(--tk-ink));
  }

  /* 🔴 조상 선택자는 반드시 html[...] 로 쓴다 — 근거는 위 AccentScope 주석과 같다. */
  html[data-theme='light'] & {
    --tk-text: var(--tk-text-light, var(--tk-ink));
  }
  html[data-theme='dark'] & {
    --tk-text: var(--tk-text-dark, var(--tk-ink));
  }
`;

/** 링크가 걸린 관련 티커 카드. 캡은 **레일**이라 면으로 세어지지 않는다(6px < 8px 하한). */
export const RelatedPickCard = styled(PickCard)`
  height: 100%;
`;

/**
 * 콘텐츠 없는 관련 티커 — 데드엔드 링크 대신 **점선 카드**다(서버 렌더러와 같은 판정).
 * 점선이 "아직 페이지가 없다"를 모양으로 말한다 — 색이나 흐림으로 말하지 않는다.
 */
export const RelatedStaticCard = styled(PickCard)`
  height: 100%;
  border-style: dashed;
  background: ${color.surfaceMuted};

  &:hover {
    ${cardElevation('base')}
    border-style: dashed;
    background: ${color.surfaceMuted};
    transform: none;
  }
`;

export const RelatedSymbol = styled.span`
  font-size: ${font.size['2xl']};
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.03em;
  color: var(--tk-text);
  ${font.numeric};
`;

export const RelatedKorean = styled.span`
  font-size: ${font.size.xs};
  color: ${color.textSecondary};
  overflow-wrap: anywhere;
`;

export const RelatedRelation = styled.p`
  margin: 0;
  font-size: ${font.size.base};
  line-height: ${font.leading.snug};
  color: ${color.textSecondary};
`;

/** 페이지가 없는 티커임을 **글자로** 말하는 배지(색이 단독 채널이 되지 않게). */
export const RelatedPendingBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px ${space[2]};
  border-radius: ${radius.pill};
  border: 1px dashed ${color.borderStrong};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  color: ${color.textMuted};
  white-space: nowrap;
`;

/**
 * 관련 티커가 하나도 없을 때의 **빈 상태**.
 *
 * 종전에는 목록이 비면 블록 자체가 사라져 페이지가 고지문으로 끝났다 — 검색 유입의 주 착지점에서
 * 가장 나쁜 마무리다. 이제 허브로 돌아가는 목적지 카드가 그 자리를 대신한다.
 */
export const RelatedEmpty = styled.div`
  display: grid;
  gap: ${space[3]};
  justify-items: start;
  padding: clamp(20px, 3vw, 28px);
  border-radius: ${PICK_RADIUS};
  border: 1px dashed ${color.borderStrong};
  background: ${color.surfaceMuted};
`;

export const RelatedEmptyText = styled.p`
  margin: 0;
  font-size: ${font.size.md};
  color: ${color.textSecondary};
  line-height: ${font.leading.snug};
`;

/* -------------------------------------------------------------------------- */
/* 마무리 고지                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * 고지문. 🔴 `footer` 가 아니라 `section` 이다 — 이 페이지는 이제 공용 `PageFooter` 를 달았고,
 * 문서에 footer 랜드마크가 둘이면 스크린리더 사용자가 어느 쪽이 사이트 푸터인지 알 수 없다.
 */
export const Disclaimer = styled.section`
  display: grid;
  gap: ${space[2]};
  padding-top: ${space[5]};
  border-top: 1px solid ${color.border};
`;

export const DisclaimerText = styled.p`
  margin: 0;
  max-width: ${MEASURE};
  font-size: ${font.size.xs};
  line-height: ${font.leading.relaxed};
  color: ${color.textMuted};
`;

export const UpdatedAt = styled.p`
  margin: 0;
  font-size: ${font.size['2xs']};
  color: ${color.textMuted};
  ${font.numeric};
`;

/* -------------------------------------------------------------------------- */
/* 격자 폭 상수                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * 관련 티커 격자의 최소 열 폭.
 *
 * 300px 인 이유는 **개수**다. 관련 티커는 보통 4종이라 260px(3열)에서는 3 + 1 로 한 장이 홀로
 * 남는다. 300px 이면 본문 열(약 880px)에서 2열이 되어 2 + 2 로 떨어진다.
 */
export const RELATED_MIN_WIDTH = '300px';

import styled from '@emotion/styled';
import {
  DATA_RADIUS,
  DATA_SURFACE,
  PICK,
  PICK_RADIUS,
  cardElevation,
  color,
  font,
  iconOpticalAlign,
  media,
  space
} from '@/shared/styles';
import { REVEAL_EASE, revealIn } from './motion';

/* -------------------------------------------------------------------------- */
/* 히어로 — 중립 면 + 티커 리본 + 캡 + 2열(정체성 | 지표판)                        */
/* -------------------------------------------------------------------------- */

/**
 * 히어로 본체는 **중립 면**이다(styled/index.ts 머리말의 예산 설명을 보라). 경계는 상단 6px 티커 리본과
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
 *  ① **허브와 색이 정확히 이어진다.** 허브 카드의 심볼(`TickerHubPage/styled/` 의 CardSymbol)이
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

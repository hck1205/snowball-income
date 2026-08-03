import styled from '@emotion/styled';
import { PickCardGrid } from '@/components/common';
import {
  DATA_RADIUS,
  PICK,
  PICK_RADIUS,
  appHeaderHeight,
  cardElevation,
  color,
  font,
  iconFirstLineAlign,
  media,
  radius,
  sectionTitleFontSize,
  space,
  subtleScrollbar,
  topRail
} from '@/shared/styles';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * `/dividend/portfolio` 의 **레이아웃 골격** (2026-08-03 2차 리워크)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * ## 무엇이 틀렸었나
 * 1차 리워크는 색(귀·도넛·링)만 얹고 **구조를 그대로 뒀다** — 1280px 에서 폭 1160px 짜리 카드
 * 다섯 장이 세로로 쌓여 문서 길이가 2,300px 이었고, 이 화면의 질문("지금 얼마 받나 / 목표까지
 * 얼마 남았나")의 답인 요약 카드는 **y≈1,200 에 있었다.** 스크롤 두 번 아래가 답이면 위계가 없는 것이다.
 *
 * ## 지금의 골격 — 데크 + 작업대(2열)
 * ```
 *  [시세 스트립]
 *  ┌ Deck ─────────────────────────────────┬ 다음 지급 ─┐   ← 히어로와 D-Day 가 한 줄
 *  │ h1 · 리드 · 기준일                     │  D-12      │
 *  └───────────────────────────────────────┴────────────┘
 *  [라이브 리전 · 클라우드 고지 · 배너]
 *  ┌ Workbench ────────────────────────────┬ Rail ──────┐
 *  │ ① 보유 종목 (표 — 이 화면의 본체)      │ ③ 지금 받는│  ← 레일은 sticky.
 *  │ ② 목표 달성                            │    배당    │     수량을 고치는 동안
 *  │                                        │  (raised)  │     답이 화면에 남는다
 *  └───────────────────────────────────────┴────────────┘
 *  [진입 격자: 배당 캘린더 · 가계부]  [가정]  [푸터]
 * ```
 *
 * 🔴 **DOM 순서는 보유 종목 → 목표 달성 → 지금 받는 배당 그대로다**(사용자 확정 2026-07-29,
 * `test/portfolio/portfolioCardOrder.test.tsx` 가 잠근다). 2열은 **래퍼 두 개**(`MainColumn` ·
 * `RailColumn`)로 만들었고 `grid-area` 로 순서를 뒤집지 않는다 — 시각 순서와 낭독 순서가 갈리면
 * 그 테스트가 지키려던 것이 무의미해진다.
 *
 * ## 색면 예산 (실측: 히어로 + 푸터 = 2/2, 여유 0)
 * 이 파일이 새로 만드는 면은 **전부 중립 토큰**이다(`surface` · `surfaceMuted` · `surfaceSunken`).
 * 위계는 색이 아니라 **레이아웃 · 크기 대비 · 밀도 · 형태**가 만든다. 🔴 여기에 `accentSubtle`
 * 같은 채도면을 얹지 마라 — `tools/dev/tintscan.mjs` 가 즉시 exit 1 이다.
 */

/** 2열이 서는 최소 폭. 이 아래는 한 줄로 접힌다(레일이 표를 눌러 죽이지 않게). */
const WORKBENCH_UP = media.up('headerStack');

export const PageStack = styled.div`
  display: grid;
  gap: clamp(16px, 2.4vw, 24px);
  min-width: 0;
`;

/* -------------------------------------------------------------------------- */
/* 데크 — 히어로 + 다음 지급일                                                  */
/* -------------------------------------------------------------------------- */

/**
 * 페이지 첫 줄. 종전에는 히어로 하나가 전폭을 먹고 D-Day 는 그 안의 **작은 회색 한 줄**이었다.
 * 지금은 히어로 오른쪽에 **자기 자리를 가진 패널**로 선다 — 이 화면이 약속한 두 가지 중 하나
 * ("다음 배당은 언제")가 첫 화면에서 숫자로 읽힌다.
 *
 * 🔴 2열 트랙은 **패널이 실제로 있을 때만** 깐다(`$split`). 트랙을 상시로 깔면 D-Day 가 없는 화면
 * (보유 0종 · 지급일 미상 · 로딩)에서 히어로가 첫 트랙으로 눌리고 오른쪽 260px 이 **빈 채로 남는다**
 * — 실측으로 잡은 결함이다(1280px 에서 히어로 1160 → 895px). 빈 격자 칸은 레이아웃이 아니라 구멍이다.
 */
export const Deck = styled.div<{ $split: boolean }>`
  display: grid;
  gap: ${space[3]};
  min-width: 0;
  align-items: stretch;

  ${media.up('tabletSm')} {
    grid-template-columns: ${({ $split }) => ($split ? 'minmax(0, 1fr) clamp(200px, 20vw, 260px)' : 'minmax(0, 1fr)')};
  }
`;

/**
 * 다음 배당 지급 예정일 패널.
 *
 * `role="note"` 는 뷰가 붙인다 — 종전 히어로 `notice` 슬롯이 갖던 역할을 그대로 이어받는다
 * (`test/portfolio/portfolioHeroDDay.test.tsx` 가 `queryByRole('note')` 로 존재/부재를 잠근다).
 *
 * 면은 `sunken`(중립) 이다. 🔴 색을 넣지 마라 — 남은 일수는 손익이 아니고, 이 화면의 채도면
 * 예산은 히어로와 푸터가 이미 다 쓰고 있다. 위계는 **숫자 크기 하나**로 만든다.
 */
export const NextPayoutPanel = styled.aside`
  ${cardElevation('sunken')}
  display: grid;
  align-content: center;
  justify-items: start;
  gap: ${space[1]};
  min-width: 0;
  padding: clamp(16px, 2vw, 22px);
  border-radius: ${DATA_RADIUS};
`;

export const NextPayoutLabel = styled.span`
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  letter-spacing: 0.04em;
  line-height: ${font.leading.snug};
  color: ${color.textMuted};
`;

/**
 * 남은 일수. 데이터 서체 + 큰 크기로만 위계를 만든다.
 *
 * 🔴 **색을 넣지 않는다**(구 `DDayValue` 주석의 결정 그대로) — 이 앱에서 색이 붙은 숫자는 손익을
 * 뜻하는데 남은 일수는 손익이 아니다. 바뀐 것은 크기(16px 배지 → 30~44px 표제)뿐이다.
 *
 * 🔴 상한은 `6xl`(44px) 이다. 종전 하드코딩 `48px` 은 **타이포 스케일 밖**이었고, 그 값이면 이
 * 제품에서 가장 큰 글자가 된다(랜딩·티커 허브의 h1 과 캘린더의 D-N 이 전부 44px 이다).
 * 캘린더의 `NextLeadCountdown` 이 같은 역할(다음 지급까지 D-N)로 `clamp(3xl, 4vw, 6xl)` 을
 * 쓰므로 상한을 맞춘다 — 같은 것을 묻는 숫자가 화면마다 다른 크기로 서면 안 된다.
 */
export const NextPayoutValue = styled.strong`
  font-family: ${font.dataNumeric};
  font-size: clamp(${font.size['4xl']}, 4.2vw, ${font.size['6xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.03em;
  line-height: ${font.leading.tight};
  color: ${color.text};
  ${font.numeric}
`;

export const NextPayoutTickers = styled.span`
  font-size: ${font.size.xs};
  color: ${color.textSecondary};
  overflow-wrap: anywhere;
`;

/* -------------------------------------------------------------------------- */
/* 라이브 리전                                                                  */
/* -------------------------------------------------------------------------- */

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
/* 작업대 — 표(본체) + 답 레일                                                  */
/* -------------------------------------------------------------------------- */

/**
 * 2열 작업대. 왼쪽이 **일하는 곳**(보유 표 · 목표), 오른쪽이 **답**(지금 받는 배당)이다.
 *
 * 레일 폭이 `clamp` 인 이유: 고정폭이면 1024px 에서 표가 남는 폭 600px 로 눌리고 1440px 에서는
 * 레일만 허전해진다. 26vw 는 1280 에서 333px · 1440 에서 374px 로 도넛(148) + 범례가 겨우 서는 대역이다.
 */
export const Workbench = styled.div`
  display: grid;
  gap: clamp(16px, 2.4vw, 24px);
  min-width: 0;
  align-items: start;

  ${WORKBENCH_UP} {
    grid-template-columns: minmax(0, 1fr) clamp(300px, 26vw, 380px);
  }
`;

export const MainColumn = styled.div`
  display: grid;
  gap: clamp(16px, 2.4vw, 24px);
  align-content: start;
  min-width: 0;
`;

/**
 * 레일이 **주역 카드의 그림자를 잘라먹지 않도록** 안쪽에 두는 여백(음수 마진으로 되돌린다).
 *
 * 🔴 2026-08-03 실측으로 잡은 결함이다. 흰 캔버스 전환 뒤 `/dividend/portfolio` 의 주역 카드
 * (`SummaryCard` = `cardElevation('raised')`)가 **화면에서 통째로 사라져 있었다** — 네 변을
 * 1px 씩 쓸어도 전부 `#ffffff`(1.000:1), 즉 경계가 물리적으로 없었다.
 *
 * 원인은 토큰이 아니라 **레이아웃**이다. `raised` 의 유일한 채널은 그림자인데(`surfaces.ts`:
 * 층마다 수단은 하나 — 주역은 그림자, 테두리 없음), 그 카드를 담은 이 레일이 아래에서
 * `overflow-y: auto` 로 **스크롤 컨테이너**가 된다. 스크롤 컨테이너는 패딩 박스 밖을 자르고,
 * 레일의 폭·높이는 카드와 **정확히 같았다**(실측 884,527 329×751 두 박스 동일). 그림자가
 * 스밀 자리가 0px 이라 그려지자마자 전부 잘려나갔다. 흰 배경이 만든 결함이 아니라, 흰 배경이
 * **드러낸** 결함이다 — 종전에는 회색 캔버스(#f8f9fa) 위 흰 면이라 면색이 카드를 세워 줬다.
 *
 * 값: 라이트 `shadow-2` 최대치가 `0 6px 18px`(aurora·forest·grape·navyGold·sunset·vivid)이라
 * 좌우 9px · 아래 15px · 위 3px 이 필요하다. 16px 이면 전 프리셋을 덮는다.
 *
 * ⚠ 이 여백은 **음수 마진으로 정확히 상쇄**해야 한다. 상쇄하지 않으면 카드가 32px 좁아져 위아래
 *   히어로·진입 격자와 좌우 정렬이 깨진다. `top`(sticky 기준선)과 `max-height` 도 같은 양만큼
 *   되돌려야 스크롤 개시 지점이 종전과 같다 — 아래 세 곳이 한 벌이다.
 * ⚠ 2열 구간(≥1024px)에서 열 간 간격은 `clamp(16px, 2.4vw, 24px)` = 항상 24px 이므로(1024px 에서
 *   2.4vw ≈ 24.6px) 왼쪽으로 번진 16px 는 본문 카드와 8px 여유를 두고 떨어진다 — 겹치지 않는다.
 */
const RAIL_SHADOW_GUTTER = '16px';

/**
 * 답 레일. 2열 구간에서만 **스크롤을 따라온다** — 수량을 고치는 동안 그 결과(월 배당)가 화면에서
 * 사라지지 않게 하는 것이 이 레이아웃의 핵심 이득이다.
 *
 * 🔴 `max-height` + `overflow-y` 가 함께 있어야 한다. sticky 요소가 뷰포트보다 높으면 아래쪽이
 * **영원히 도달 불가**가 된다(그 안에 1급 CTA 가 있다). 짧은 화면에서는 레일 안에서 스크롤된다.
 * ⚠ `overflow` 는 `transform` 과 달리 fixed 자손의 컨테이닝 블록을 만들지 않는다 — 드로어는 안전하다.
 * 🔴 그 `overflow-y` 가 주역 카드의 그림자를 자른다 — `RAIL_SHADOW_GUTTER` 주석을 반드시 읽어라.
 *   패딩·음수 마진·`top`·`max-height` 네 줄은 한 벌이고, 하나만 지우면 카드가 다시 사라진다.
 */
export const RailColumn = styled.div`
  display: grid;
  gap: clamp(16px, 2.4vw, 24px);
  align-content: start;
  min-width: 0;

  ${WORKBENCH_UP} {
    position: sticky;
    top: calc(${appHeaderHeight} + ${space[3]} - ${RAIL_SHADOW_GUTTER});
    max-height: calc(
      100vh - ${appHeaderHeight} - ${space[6]} + (${RAIL_SHADOW_GUTTER} * 2)
    );
    overflow-y: auto;
    padding: ${RAIL_SHADOW_GUTTER};
    margin: calc(-1 * ${RAIL_SHADOW_GUTTER});
    ${subtleScrollbar}
  }
`;

/* -------------------------------------------------------------------------- */
/* 카드 공통                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * 카드의 **기하**만 담는다 — 배경·테두리·그림자(위계)는 `cardElevation` 이 층별로 준다.
 * (`test/shared/cardElevationHierarchy.test.ts` 가 이 블록에 border/box-shadow/background 가
 * 적히지 않는지 소스로 검사한다.)
 */
const cardGeometry = `
  min-width: 0;
  display: grid;
  gap: ${space[4]};
  align-content: start;
  padding: clamp(16px, 2vw, 24px);
  border-radius: ${DATA_RADIUS};
`;

/**
 * 이 화면의 **주역 카드**(화면당 하나) — hero 타일(`emphasis="hero"`)을 가진 바로 그 카드다.
 * 2열 구간에서는 레일에 서고, 한 줄로 접히면 보유·목표 아래에 그대로 이어진다.
 */
export const SummaryCard = styled.section`
  ${cardGeometry}
  ${cardElevation('raised')}
`;

export const HoldingsCard = styled.section`
  ${cardGeometry}
  ${cardElevation('base')}
  gap: ${space[3]};
`;

/**
 * 카드 머리 = **툴바**. 제목 덩어리(배지 + 제목 + 카운트)와 액션을 양 끝으로 벌리고, 아래로
 * 얇은 구분선을 그어 "여기까지가 머리"를 형태로 말한다(종전에는 제목과 표가 그냥 붙어 있었다).
 */
export const CardHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[3]};
  flex-wrap: wrap;
  padding-bottom: ${space[3]};
  border-bottom: 1px solid ${color.border};
`;

/** 구분선 없는 머리(레일 카드처럼 바로 아래에 큰 숫자가 오는 경우). */
export const CardHeadPlain = styled(CardHead)`
  padding-bottom: 0;
  border-bottom: 0;
`;

/** 제목 + 부가 배지를 한 덩어리로 묶는다(우측 액션 버튼과 갈라놓는다). */
export const CardTitleGroup = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${space[2]};
  min-width: 0;
`;

/**
 * 섹션 제목.
 *
 * 크기는 전 페이지 공통 규칙인 `sectionTitleFontSize`(clamp 16~18px)를 쓴다 — 카드마다 다른
 * 축소 곡선을 두지 않는다는 2026-07-29 결정이다. 종전 고정 `font.size.base` 는 그 규칙 밖에 있었다.
 * 위계는 여기서 끝나지 않는다: 그 아래 값(hero 44px · D-Day 48px)과의 **크기 대비**가 위계다.
 */
export const CardTitle = styled.h2`
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${space[2]};
  font-size: ${sectionTitleFontSize};
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.01em;
  color: ${color.text};
`;

export const CardTitleBadge = styled.span`
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: ${radius.md};
  background: ${color.identitySubtle};
  color: ${color.identityText};
`;

/** 제목 옆 종수 배지("3종"). 숫자라 데이터 서체 + tabular 로 쓴다. */
export const CountBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px ${space[2]};
  border-radius: ${radius.pill};
  border: 1px solid ${color.border};
  background: ${color.surfaceSunken};
  color: ${color.textSecondary};
  font-family: ${font.dataNumeric};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  white-space: nowrap;
  ${font.numeric}
`;

/** 카드 제목 아래 한 줄(로컬 저장 고지). 제목과 경쟁하지 않게 한 단계 작고 흐리다. */
export const CardSubtitle = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  color: ${color.textMuted};
`;

/* -------------------------------------------------------------------------- */
/* 요약 카드 안쪽 — 큰 숫자 하나 + 촘촘한 지표 목록                              */
/* -------------------------------------------------------------------------- */

export const HeroSlot = styled.div`
  min-width: 0;
  display: grid;
`;

/**
 * 🔴 **타일 격자 → 정의 목록**(이번 리워크의 밀도 결정).
 *
 * 종전에는 지표 다섯이 각자 테두리 있는 200px 박스였다(전폭 5열 → 400px 높이). 레일 폭에서는
 * 그 박스들이 한 줄씩 쌓여 800px 가 되고, 무엇보다 **다섯 개가 전부 같은 무게**라 hero 숫자와
 * 경쟁했다. 지금은 라벨/값이 한 줄에 마주 보는 **행**이고, 행 사이는 헤어라인 하나다:
 * 높이가 절반 이하로 줄고 위계가 hero → 목록 순으로 분명해진다.
 *
 * `dl` 인 것은 시맨틱이다 — 라벨과 값의 쌍이 다섯이다.
 */
export const FigureList = styled.dl`
  margin: 0;
  display: grid;
  gap: 0;
  min-width: 0;
`;

export const FigureRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: baseline;
  column-gap: ${space[3]};
  row-gap: 2px;
  padding: ${space[3]} 0;
  border-bottom: 1px solid ${color.border};

  &:last-of-type {
    border-bottom: 0;
    padding-bottom: 0;
  }
`;

export const FigureTerm = styled.dt`
  min-width: 0;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.medium};
  color: ${color.textSecondary};
`;

export const FigureValue = styled.dd`
  margin: 0;
  grid-column: 2;
  grid-row: 1;
  justify-self: end;
  text-align: end;
  font-family: ${font.dataNumeric};
  font-size: ${font.size.base};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.02em;
  color: ${color.text};
  white-space: nowrap;
  ${font.numeric}
`;

/**
 * 값 아래 한 줄(단위·전제). 라벨 열에 붙여 값과 시선을 다투지 않게 한다.
 *
 * ⚠ `p` 가 아니라 **두 번째 `dd`** 인 것은 시맨틱이다 — `dl > div` 안에는 `dt`/`dd` 만 올 수 있다
 * (한 `dt` 에 `dd` 가 여럿인 것은 규격상 정상이다). `p` 를 끼우면 DOM 이 무효가 된다.
 */
export const FigureHint = styled.dd`
  margin: 0;
  grid-column: 1 / -1;
  font-size: ${font.size['2xs']};
  line-height: ${font.leading.snug};
  color: ${color.textMuted};
`;

/**
 * 요약 카드 안의 가름선 — hero 숫자 / 지표 목록 / 비중 도넛이 **세 문단**임을 말한다.
 * 카드를 더 쪼개지 않는 이유: 카드 안 카드 금지 규칙(그리고 화면당 주역 카드는 하나다).
 */
export const CardDivider = styled.hr`
  margin: 0;
  border: 0;
  border-top: 1px solid ${color.border};
`;

/**
 * 인포 아이콘 + 여러 줄 설명. 아이콘은 **문단 가운데가 아니라 첫 줄**에 맞춘다
 * (`align-items: center` 는 두 줄 이상에서 아이콘을 문단 한복판으로 내린다).
 * 보정값은 손으로 적은 `margin-top: 2px` 대신 공용 `iconFirstLineAlign` 이 글자 크기·행간에서 계산한다.
 */
export const NoteLine = styled.p`
  margin: 0;
  display: flex;
  align-items: flex-start;
  gap: ${space[2]};
  padding: ${space[3]};
  border-radius: ${radius.md};
  background: ${color.surfaceSunken};
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};

  svg {
    ${iconFirstLineAlign(font.size.xs, font.leading.snug)}
  }
`;

/**
 * 요약 하단의 "무엇이 빠졌는가" 줄.
 *
 * 🔴 종전에는 `warningSurface` **면**이었다 — 폭이 카드 전체라 `tintscan` 의 면 판정(폭 ≥180 AND
 * 높이 ≥8)을 넘겨 히어로·푸터와 함께 예산 2를 깨는 세 번째 면이 될 수 있었다. 지금은 **왼쪽
 * 3px 경고선 + 중립 면**이다: 색은 선(L1 파생, 폭 3px)으로 남고 문장은 그대로 경고 색 글자다.
 *
 * ⚠ 면이 `surface-muted` 인 이유는 대비다 — `warning` 은 `surface-muted` 위에서 8프리셋 ×
 * 라이트/다크 전수 최저 **4.88:1**(AA 통과)이지만 `surface-sunken` 위에서는 **4.18 로 미달**이다
 * (2026-08-03 실측). 이 쌍은 `shared/styles/contrast.test.ts` 순회 목록에 없으므로 여기 근거를 남긴다.
 */
export const ExcludedNote = styled.p`
  margin: 0;
  padding: ${space[2]} ${space[3]};
  border-left: 3px solid ${color.warning};
  border-radius: 0 ${radius.sm} ${radius.sm} 0;
  background: ${color.surfaceMuted};
  color: ${color.warning};
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};
`;

/**
 * 카드 하단 액션.
 *
 * 레일에 서는 카드라 **버튼은 전폭**이다 — 좁은 열에서 좌측 정렬된 버튼은 허공을 남기고,
 * 이 화면의 1급 행동(시뮬레이션)은 크게 보여야 한다.
 */
export const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]};

  > * {
    flex: 1 1 200px;
    justify-content: center;
  }
`;

/** 버튼 아래 사유 1줄. **무음 비활성 금지** — 비활성 버튼 옆에는 언제나 이유가 있다. */
export const ActionHint = styled.p`
  margin: 0;
  font-size: ${font.size['2xs']};
  color: ${color.textMuted};
  line-height: ${font.leading.snug};
`;

/* -------------------------------------------------------------------------- */
/* 빈 상태 — 첫 방문자가 보는 유일한 화면                                        */
/* -------------------------------------------------------------------------- */

/**
 * 🔴 **빈 상태는 "없음"을 알리는 자리가 아니라 이 화면의 첫인상이다.**
 *
 * 종전에는 1160×406px 짜리 흰 판 한가운데에 96px 마스코트와 버튼 하나가 떠 있었다 — 넓이의
 * 대부분이 빈 공간이었다. 지금은 **2열 보드**다: 왼쪽이 권유(마스코트 · 제목 · 본문 · CTA),
 * 오른쪽이 근거(등록하면 무엇을 보는가 3줄 + 빠른 시작 칩). 같은 높이에서 정보가 세 배다.
 *
 * 면은 중립이고 색은 상단 6px accent 레일 하나다(높이 6 < 면 하한 8 → 예산 무침범).
 * 🔴 배경을 채우지 마라 — 세 번째 면이 되는 순간 `tools/dev/tintscan.mjs` 가 exit 1 이다.
 *
 * 🔴 아래 `overflow: hidden` **이 레일을 자르는 유일한 장치다.** 지우면 6px 띠가 둥근 모서리
 *    밖으로 나간다 — 이 레포에서 최소 세 번 재발한 결함이라 처방을 `topRail()` 한 곳으로 모았고
 *    (`shared/styles/surfaces.ts`), `shared/styles/geometry.test.ts` 가 소스로 감시한다.
 *    ⚠ 레일에 같은 반경을 주는 우회는 오답이다 — 6px 짜리 띠에서는 CSS 가 반경을 비례축소해
 *      오히려 모서리에 틈이 생긴다(근거는 `topRail` 주석).
 */
export const EmptyBoard = styled.section`
  ${cardElevation('base')}
  position: relative;
  overflow: hidden;
  display: grid;
  gap: clamp(24px, 4vw, 40px);
  align-items: center;
  padding: clamp(28px, 4vw, 44px) clamp(20px, 3vw, 36px);
  border-radius: ${PICK_RADIUS};

  ${media.up('tabletSm')} {
    grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  }

  &::before {
    ${topRail(PICK.railHeight)}
    background: ${color.accent};
  }
`;

export const EmptyLead = styled.div`
  display: grid;
  justify-items: start;
  gap: ${space[4]};
  min-width: 0;
`;

/**
 * 빈 상태의 마스코트(96px). **빈 상태 세 곳에만** 사는 크기다 — 값이 있는 화면에 캐릭터를 세우면
 * 숫자와 시선을 다툰다. `BrandGlyph` 는 `currentColor` 계약이라 색은 여기서 준다(`identity`).
 */
export const EmptyMascot = styled.div`
  display: inline-flex;
  color: ${color.identity};
`;

/**
 * 빈 상태 제목 — 전 화면 공통 곡선 `clamp(2xl, 2.6vw, 4xl)`(20~30px)을 쓴다.
 *
 * 종전 값은 `clamp(26px, 3.4vw, 34px)` 이었다. 두 가지가 틀렸다:
 *  ① **하드코딩 px** 이라 타이포 스케일 밖이다(34·26 은 스케일에 없는 값이다).
 *  ② @1280 에서 34px 이 되어 **이 페이지의 h1(30px)보다 커졌다** — 빈 상태 제목이 페이지 제목을
 *     이기는 위계 역전이다. 시뮬레이터·캘린더의 빈 상태는 이미 20~30 곡선을 쓰고 있었고,
 *     같은 역할이 화면마다 18·20·30·34 로 흩어져 있던 것을 이 값으로 모았다.
 */
export const EmptyTitle = styled.h2`
  margin: 0;
  font-size: clamp(${font.size['2xl']}, 2.6vw, ${font.size['4xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.03em;
  line-height: ${font.leading.tight};
  color: ${color.text};
  word-break: keep-all;
`;

export const EmptyBody = styled.p`
  margin: 0;
  max-width: 42ch;
  font-size: ${font.size.base};
  color: ${color.textSecondary};
  line-height: ${font.leading.normal};
`;

/** 오른쪽 절반 — 중립 면 위에 근거 세 줄 + 빠른 시작. */
export const EmptyAside = styled.div`
  ${cardElevation('sunken')}
  display: grid;
  gap: ${space[4]};
  align-content: start;
  min-width: 0;
  padding: clamp(18px, 2.4vw, 26px);
  border-radius: ${DATA_RADIUS};
`;

export const PreviewLabel = styled.p`
  margin: 0;
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.04em;
  color: ${color.textMuted};
`;

export const PreviewList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: ${space[3]};
`;

/** 번호가 앞장서는 행. 숫자는 장식이 아니라 "세 가지"라는 사실을 형태로 말한다. */
export const PreviewItem = styled.li`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  column-gap: ${space[3]};
  row-gap: 2px;
  min-width: 0;
`;

export const PreviewMark = styled.span`
  grid-row: 1 / span 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: ${radius.pill};
  border: 1px solid ${color.border};
  background: ${color.surface};
  color: ${color.textSecondary};
  font-family: ${font.dataNumeric};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  ${font.numeric}
`;

export const PreviewTerm = styled.strong`
  min-width: 0;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  color: ${color.text};
`;

export const PreviewBody = styled.span`
  min-width: 0;
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};
  color: ${color.textMuted};
`;

export const QuickPickLabel = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${color.textSecondary};
`;

/** 칩은 폭 <180px 라 면으로 세어지지 않는다(예산 무침범). 격자로 두어 손가락 대상이 커진다. */
export const QuickPickList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(84px, 1fr));
  gap: ${space[2]};
`;

export const QuickPickItem = styled.li`
  display: grid;

  > * {
    width: 100%;
    justify-content: center;
  }
`;

export const QuickPickBlock = styled.div`
  display: grid;
  gap: ${space[2]};
  min-width: 0;
`;

/* -------------------------------------------------------------------------- */
/* 로딩 — 값을 지어내지 않고 형태로만 말한다                                     */
/* -------------------------------------------------------------------------- */

/**
 * 값이 오기 전 자리.
 *
 * 🔴 면은 `surfaceSunken` 이다 — 구 값 `surfaceMuted` 는 **흰 카드 위 1.054:1** 이라
 * 골격이 보이지 않았다(실측 2026-08-03). 보이지 않는 골격은 "로딩 중"이 아니라 "빈 화면"이다.
 * `surfaceSunken`(1.112:1)은 흰 캔버스에서 면 사다리의 유일한 진짜 계단이고 tintscan 중립 토큰이다.
 * ⚠ `surfaceMuted` 를 되돌리지 마라 — 그 토큰은 더 어둡게 내릴 수도 없다
 *   (ink 라이트에서 공통 `data-positive` 가 그 면 위 4.50:1 knife-edge — presets/sharedTokens.ts).
 */
export const SkeletonBar = styled.span`
  display: inline-block;
  width: 96px;
  height: 1em;
  border-radius: ${radius.xs};
  background: ${color.surfaceSunken};
`;

/**
 * 목록 자리의 로딩 골격. 종전에는 44px 짜리 회색 막대 세 개였다 — 실제 행과 형태가 달라
 * 값이 들어오는 순간 레이아웃이 튀었다. 지금은 **실제 행의 골격**(왼쪽 이름 덩어리 + 오른쪽 값 셋)이다.
 */
export const SkeletonList = styled.div`
  display: grid;
  gap: ${space[2]};
`;

export const SkeletonRow = styled.span`
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) repeat(3, minmax(0, 1fr));
  align-items: center;
  gap: ${space[3]};
  padding: ${space[3]} 0;
  border-bottom: 1px solid ${color.border};
`;

/** 위 `SkeletonBar` 와 같은 이유로 `surfaceSunken` 이다(구 `surfaceMuted` = 흰 카드 위 1.054:1). */
export const SkeletonCell = styled.span`
  display: block;
  height: 12px;
  border-radius: ${radius.xs};
  background: ${color.surfaceSunken};
`;

/* -------------------------------------------------------------------------- */
/* 진입 격자 · 실행 취소                                                         */
/* -------------------------------------------------------------------------- */

/**
 * 진입 격자 — 배당 캘린더 · 가계부가 **폭을 절반씩** 나눠 갖는다(2026-08-04 사용자 지시).
 *
 * ## 왜 공용 격자를 그대로 두지 않았나 (1280px 실측)
 * 공용 `PickCardGrid` 는 `auto-fill` 이라 열 수를 **폭이** 정한다. 격자 폭 1160px 이 열 최소폭
 * 280px 로 잘려 `376px × 3칸` 이 됐고, 카드는 둘뿐이라 768px 만 쓰고 오른쪽 392px 이 빈 채로
 * 남았다(1024px 에서도 314px × 3칸 중 두 칸). 여기는 카드 수가 **고정(최대 둘)** 이라 열 수를
 * 폭이 정하게 둘 이유가 없다 — 2열로 못 박으면 1280px 에서 각 572px, 1024px 에서 각 477px 이다.
 *
 * ⚠ 공용 부품은 고치지 않는다 — 커뮤니티 갤러리·빈 상태 격자가 같은 부품을 auto-fill 로 쓴다.
 *   styled() 로 감싸 넘긴 className 을 Emotion 이 부품 자체 스타일 **뒤**에 합치므로 여기 적은
 *   열 규칙이 이긴다. 간격(PICK.gap)과 목록 시맨틱은 부품 것을 그대로 쓴다.
 *
 * ⚠ 가계부가 꺼진 배포(환경변수 없음)에서는 카드가 한 장이라 **왼쪽 절반만 찬다** — 의도다.
 *   남은 한 장이 폭을 다 먹게 하면 같은 카드가 배포마다 다른 크기로 보인다.
 *
 * 접힘은 `mobileWide`(≤640px)에서 1열이다. 같은 페이지의 `GoalCard` 타일 격자가 쓰는 경계와
 * 같은 값이라, 좁은 폭에서 이 화면의 격자들이 **한 폭에서 함께** 접힌다. 641px 에서 각 열이
 * 301px 라 종전 auto-fill 이 요구하던 최소폭(280px)보다 넓다 — 어떤 폭에서도 카드가 지금보다
 * 좁아지지 않는다.
 */
export const EntryGrid = styled(PickCardGrid)`
  grid-template-columns: repeat(2, minmax(0, 1fr));

  ${media.down('mobileWide')} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

/**
 * 진입 카드(배당 캘린더 · 가계부)의 본문.
 *
 * 🔴 `PickCard` 의 `subtitle` 로 넘기지 마라 — 그 슬롯은 제목 바로 아래 붙는 짧은 캡션이라
 * 두 줄짜리 설명문에는 너무 작다. ⚠ 마진은 0 이다: `PickCard` 의 바디/액션 간격은 그 부품이 낸다.
 */
export const EntryBody = styled.p`
  margin: 0;
  max-width: 46ch;
  font-size: ${font.size.sm};
  line-height: ${font.leading.normal};
  color: ${color.textSecondary};
`;

/**
 * 진입 카드의 액션 묶음 — 버튼과 그 **아래** 사유 한 줄.
 *
 * 🔴 사유를 `PickCard` 의 `children`(본문)에 두면 버튼 **위**에 뜬다(부품이 본문 → 액션 순으로
 * 그린다). 비활성 사유는 언제나 그 버튼 곁, 그것도 아래에 있어야 읽는 순서가 맞다.
 */
export const EntryActions = styled.div`
  display: grid;
  justify-items: start;
  gap: ${space[2]};
  min-width: 0;
`;

/** 진입 카드 안, 버튼 아래 사유 한 줄(달력이 비활성일 때). 무음 비활성 금지. */
export const EntryHint = styled.p`
  margin: 0;
  font-size: ${font.size['2xs']};
  line-height: ${font.leading.snug};
  color: ${color.textMuted};
`;

/** 실행 취소 배너 내부 — 문장과 되돌리기 버튼을 한 줄에 둔다. */
export const UndoRow = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: ${space[3]};
`;

/*
 * 가정 요약(세율 입력 + 계산 조건 + 목표 조건 그룹)의 스타일은
 * `PortfolioPage/components/PortfolioAssumptions`로 옮겼다.
 *
 * 각주 묶음은 공용 `components/common/PageFooter` 로 수렴했다(2026-07-31). 로컬로 복제하지 마라.
 *
 * 구 `DDayLine`/`DDayValue`/`DDaySeparator`/`DDayTickers`(히어로 notice 안의 한 줄)는 위
 * `NextPayoutPanel` 3종으로 **대체됐다** — 같은 데이터가 작은 회색 줄에서 데크의 표제 숫자로 승격됐다.
 * 되살리지 마라: 두 표현이 공존하면 같은 날짜가 한 화면에 두 번 뜬다.
 */

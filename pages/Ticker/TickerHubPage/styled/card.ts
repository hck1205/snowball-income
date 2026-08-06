import styled from '@emotion/styled';
import { PickCard } from '@/components/common';
import { color, font, space } from '@/shared/styles';
import { ACCENT_DERIVATION } from './accent';
import { CARD_RIBBON } from './tokens';

/* -------------------------------------------------------------------------- */
/* 카드 — 고르는 면                                                             */
/* -------------------------------------------------------------------------- */

/**
 * 티커 하나의 **색 스코프**이자 격자 셀. `accent.ts` 의 파생 블록에 캡의 면색 하나를 더한다.
 *
 * ── 🔴 2026-08-03 흰 캔버스: 캡 면색을 `brandSubtle` → `surfaceSunken` 으로 내렸다 ──
 *
 * 종전 캡은 **브랜드 민트 면**이었다. 흰 배경에서 이 면이 무너뜨린 것은 셋이다.
 *  ① **색이 서로 싸운다.** 캡의 면은 brand hue 인데 그 위에 앉는 잉크(`--tk-text`)와 바로 위
 *     6px 리본은 **티커 hue** 다 — VIG 크림슨 글자가 민트 면에, NOBL 퍼플이 민트 면에 앉았다
 *     (실측 스크린샷). 카드 한 장이 두 색 축을 동시에 말하면 어느 쪽도 신호가 못 된다.
 *  ② **48px × 27장이 같은 말을 반복한다.** 캡 라벨은 카테고리명인데, 그 카드는 이미 같은 이름의
 *     섹션 제목 바로 아래 있다. 잉크는 최대인데 정보 증분이 0인 면이다.
 *  ③ 흰 캔버스에서 카드의 격은 **경계·여백**이 말한다(`shared/styles/surfaces.ts`). 면색으로
 *     말하는 장치를 카드 머리에만 남겨 두면 카드가 "민트 모자를 쓴 덩어리"로 읽힌다.
 *
 * 그래서 캡은 **중립 판(plate)** 이 됐다. 티커의 색은 리본·잉크·심볼 셋이 그대로 진다.
 *
 * 🔴 `surfaceMuted` 가 아니라 `surfaceSunken` 인 이유는 **8프리셋을 다 재 봤기 때문**이다.
 *   muted 는 흰 면 위 1.02~1.08:1 이라 vivid(1.02)·grape(1.03)·sunset(1.04) 에서 판이 통째로
 *   사라진다. sunken 은 1.11~1.22:1 로 8프리셋 전부에서 계단이 남는다.
 * 🔴 이 자리에 `surfaceHover` 충돌은 없다 — 고르는 카드의 부상은 `pickLift`(테두리·그림자·이동)라
 *   배경을 건드리지 않는다. (면을 sunken 으로 내리면 안 되는 곳은 **버튼을 품은 면**이다 —
 *   velog 라이트에서 sunken 과 surface-hover 가 같은 값(#f1f3f5)이기 때문. `FeedStates` 참고.)
 *
 * 실측 대비(티커 27종 × 8프리셋 × 라이트/다크 최악값, `test/ticker/tickerAccentContrast.test.ts`):
 * ```
 *   라이트  캡 위 잉크  4.85:1 (grape · DGRW #24703f)   ← 구 brand-subtle 5.24
 *   다크    캡 위 잉크  6.20:1 (sunset · VYM  #e0808f)  ← 구 brand-subtle 4.88  🔴 개선
 * ```
 * 즉 라이트는 여유 안에서 조금 내주고, **다크에서 가장 빠듯하던 지점이 사라졌다.**
 */
export const CardScope = styled.li`
  display: grid;
  min-width: 0;

  ${ACCENT_DERIVATION}

  /* 🔴 중립 토큰이다 — tintscan 이 이 면을 세지 않는다(그래서 이 라우트의 채도 면은 푸터 1개뿐). */
  --tk-cap-fill: ${color.surfaceSunken};
`;

/**
 * 허브가 쓰는 고르는 카드 = 공용 `PickCard` + **그 티커만의 상단 리본**.
 *
 * 리본을 의사요소로 그리는 이유가 둘이다.
 *  ① tintscan 은 DOM 만 열거한다 — 의사요소는 애초에 세어지지 않는다.
 *  ② 6px 은 면 하한(8px)보다 낮아, DOM 이었더라도 선으로 남는다. 즉 **두 겹으로 안전하다.**
 */
export const HubPickCard = styled(PickCard)`
  &::before {
    content: '';
    position: absolute;
    inset: 0 0 auto 0;
    height: ${CARD_RIBBON};
    z-index: 2;
    pointer-events: none;
    background: linear-gradient(90deg, var(--tk-ribbon-from), var(--tk-ribbon-to));
  }
`;

/**
 * 카드 제목 자리에 서는 티커 심볼. 그 티커의 색을 입는다 — 같은 티커의 상세 히어로와 색이 이어진다.
 *
 * ⚠ 이 요소가 카드 링크의 **접근 가능한 이름**이다(스트레치 컨트롤이 제목을 감싼다).
 * 심볼을 여기서 빼면 스크린리더 사용자가 카드를 티커로 구분하지 못한다.
 */
export const CardSymbol = styled.span`
  font-size: clamp(${font.size.xl}, 2vw, ${font.size['2xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.03em;
  color: var(--tk-text);
  ${font.numeric};
  overflow-wrap: anywhere;
`;

/**
 * 한글명 · 영문명 — 한 줄로 자르고 넘치면 말줄임.
 *
 * 🔴 `white-space: nowrap` 으로 자르지 마라. 부모(공용 `PickCardSubtitle`)는 격자 아이템의 기본
 * `min-width: auto` 를 갖는다 — nowrap 은 그 아이템의 **최소 크기를 글자 전체 폭으로** 만들어
 * 부모가 카드 밖으로 부푼다(실측 2026-08-03: 8장 중 7장이 카드를 넘겼다).
 * `overflow-wrap: anywhere` 가 핵심이다 — 최소 크기 계산에 반영되어 긴 영문명도 부모를 밀지 못한다.
 */
export const CardNames = styled.span`
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  min-width: 0;
  overflow: hidden;
  overflow-wrap: anywhere;
`;

export const CardBody = styled.div`
  container-type: inline-size;
  display: grid;
  gap: ${space[3]};
  min-width: 0;
`;

/**
 * 소개 한 줄.
 *
 * 🔴 종전에는 2줄 고정(min-height 로 자리를 잡아 스탯 줄을 맞췄다)이었다. 30장 × 한 줄만큼의
 * 세로가 그대로 스크롤이 되고, 어차피 대부분 잘려서 문장이 완결되지 않았다. 한 줄로 줄이고
 * 아래 지표판을 격자로 고정해 같은 정렬을 얻는다 — 정렬은 지키고 높이는 돌려받는다.
 */
export const CardTagline = styled.p`
  margin: 0;
  min-width: 0;
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};
  color: ${color.textSecondary};
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: calc(${font.size.xs} * ${font.leading.snug});
`;

/**
 * 카드 안의 지표판 — 카드 안의 **읽는 자리**다.
 *
 * 상세 히어로의 `HeroMetric` 과 같은 문법: **주역 하나 + 보조 행들**. 종전에는 배당률·운용보수·지급
 * 셋이 같은 크기로 나란했는데, 배당 소개 목록에서 먼저 읽혀야 할 숫자는 하나다 — 셋을 같은 무게로
 * 늘어놓으면 그 하나가 사라진다.
 *
 * 🔴 면이 중립(채도 0)인 것은 규율이다. 고르는 카드 안이라도 숫자가 앉는 자리에는 채도 면을 깔지
 * 않는다(SurfaceKind 2분법). 종전의 `surfaceMuted` 블록도 걷어 헤어라인만 남겼다.
 */
export const CardMetric = styled.dl`
  margin: 0;
  display: grid;
  grid-template-columns: minmax(0, auto) minmax(0, 1fr);
  align-items: center;
  gap: ${space[3]};
  padding-top: ${space[3]};
  border-top: 1px solid ${color.border};
  min-width: 0;

  @container (max-width: 210px) {
    grid-template-columns: minmax(0, 1fr);
    gap: ${space[2]};
  }
`;

export const CardMetricLead = styled.div`
  display: grid;
  gap: 1px;
  min-width: 0;
`;

export const CardMetricLabel = styled.dt`
  margin: 0;
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.medium};
  color: ${color.textMuted};
  white-space: nowrap;
`;

/**
 * 주역 지표(배당률).
 *
 * 🔴 색은 **중립 고정**이다 — 숫자에 accent·손익색은 확정 금지(색은 배지·아이콘·크롬에만).
 * 카테고리 색(`--tk-cat`)이나 티커 액센트(`--tk-text`)를 여기에 연결하지 마라.
 */
export const CardMetricValue = styled.dd`
  margin: 0;
  font-size: clamp(${font.size.xl}, 9cqi, ${font.size['3xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.03em;
  line-height: 1;
  color: ${color.text};
  ${font.numeric};
`;

/**
 * 보조 지표 행들 — 라벨 좌 · 값 우(상세의 `HeroMetricRows` 와 같은 문법).
 *
 * 🔴 왼쪽 세로 헤어라인이 **주역과 보조를 가르는 유일한 장치**다. 없으면 두 열의 글자들이 한 행처럼
 * 가로로 읽혀 "배당률 · 운용보수 0.06%" 가 한 문장이 된다(실측 2026-08-03, 1280px 카드 3열).
 */
export const CardMetricRows = styled.div`
  display: grid;
  gap: 3px;
  min-width: 0;
  padding-left: ${space[3]};
  border-left: 1px solid ${color.border};

  @container (max-width: 210px) {
    padding-left: 0;
    padding-top: ${space[2]};
    border-left: none;
    border-top: 1px solid ${color.border};
  }
`;

export const CardMetricRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${space[2]};
  min-width: 0;
`;

export const CardMetricRowLabel = styled.dt`
  margin: 0;
  flex: 0 0 auto;
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.medium};
  color: ${color.textMuted};
`;

export const CardMetricRowValue = styled.dd`
  margin: 0;
  min-width: 0;
  text-align: right;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  color: ${color.text};
  ${font.numeric};
  overflow-wrap: anywhere;
`;

/** 캡 안 라벨(카테고리명) — 좁은 카드에서 잘리지 않게 크기를 한 단 낮춘다. */
export const CapLabel = styled.span`
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.01em;
`;

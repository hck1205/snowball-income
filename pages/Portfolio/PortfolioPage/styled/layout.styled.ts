import styled from '@emotion/styled';
import { appHeaderHeight, media, space, subtleScrollbar } from '@/shared/styles';

/* -------------------------------------------------------------------------- */
/* 페이지 골격 · 라이브 리전 · 작업대 2열                                        */
/* -------------------------------------------------------------------------- */

/** 2열이 서는 최소 폭. 이 아래는 한 줄로 접힌다(레일이 표를 눌러 죽이지 않게). */
const WORKBENCH_UP = media.up('headerStack');

export const PageStack = styled.div`
  display: grid;
  gap: clamp(16px, 2.4vw, 24px);
  min-width: 0;
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

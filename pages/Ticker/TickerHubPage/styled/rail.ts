import styled from '@emotion/styled';
import {
  DATA_RADIUS,
  appHeaderHeight,
  cardElevation,
  color,
  font,
  media,
  scrollFadeRight,
  space,
  subtleScrollbar,
  zIndex
} from '@/shared/styles';
import { RAIL_COLUMN } from './tokens';

/* -------------------------------------------------------------------------- */
/* 2단 레이아웃 — 색인 레일 + 결과                                               */
/* -------------------------------------------------------------------------- */

/**
 * 상세 페이지의 `Layout` 과 같은 골격이다(좌 고정폭 레일 + 우 가변 본문, 좁으면 1열).
 * 두 지면이 같은 뼈대를 쓰는 것이 "한 제품"의 가장 값싼 증거다.
 */
export const Layout = styled.div`
  margin-top: clamp(24px, 3.5vw, 40px);
  display: grid;
  grid-template-columns: ${RAIL_COLUMN} minmax(0, 1fr);
  gap: clamp(24px, 3.5vw, 48px);
  align-items: start;

  ${media.down('layout')} {
    grid-template-columns: 1fr;
    margin-top: ${space[4]};
    gap: ${space[4]};
  }
`;

/**
 * 색인 레일 — 이 화면의 조종석.
 *
 * 데스크톱에서는 화면에 **상시 붙어 있는** 사이드바다(sticky). 검색·주기·정렬·보기·카테고리 목차가
 * 한자리에 있어, 27종을 훑는 내내 조건을 바꾸러 위로 올라갈 필요가 없다.
 * 좁은 화면에서는 헤더 바로 아래 붙는 가로 바가 된다 — 상세의 목차 바와 같은 처방이다.
 *
 * 레일이 품는 부품은 `search.ts`(검색) · `filters.ts`(주기·정렬·보기) · `categoryIndex.ts`(목차·CTA).
 */
export const IndexRail = styled.aside`
  min-width: 0;
  display: grid;
  gap: ${space[3]};

  /* 레일은 고정폭 트랙 안에 산다 — 자식 하나의 min-content 가 크면 레일 전체가 트랙을 넘친다. */
  > * {
    min-width: 0;
  }

  ${media.up('layout')} {
    position: sticky;
    /* 앱 헤더 **실측 높이** 아래에 붙는다(AppHeader 가 발행). 하드코딩하면 헤더 줄 수가 바뀔 때 어긋난다. */
    top: calc(${appHeaderHeight} + ${space[3]});
    align-self: start;
    padding: ${space[4]};
    border-radius: ${DATA_RADIUS};
    ${cardElevation('base')}
    max-height: calc(100vh - ${appHeaderHeight} - ${space[5]});
    overflow-y: auto;
    ${subtleScrollbar}
  }

  /*
   * 🔴 좁은 화면에서 **레일 전체는 여전히 고정하지 않는다.** 검색 + 칩 + 정렬/보기 + 카테고리 칩
   * 7개 + CTA 를 통째로 붙이면 390px 에서 230px 대역이라 844px 뷰포트의 27% 를 영구히 먹는다.
   * 대신 조건 부분(RailControls)만 떼어 그 안에서 고정한다(2026-08-17 사용자 요청).
   *
   * ⚠ display:contents 가 그 요청을 성립시키는 유일한 수단이다. sticky 자식은 **자기 부모
   *   상자 안에서만** 붙어 있으므로, 레일이 제 상자를 유지하면 조건 바는 레일 높이(230px)만큼
   *   스크롤하다 사라진다 — 결과 목록은 레일의 자식이 아니라 형제이기 때문이다. 상자를 지우면
   *   RailControls 가 Layout 의 직계 자식이 되어 결과 목록을 지나는 내내 붙어 있는다.
   * ⚠ 상자가 사라지므로 레일이 지던 아래 구분선도 함께 사라진다 — 그 선은 Results 가 위쪽
   *   테두리로 대신 그린다(results.ts).
   */
  ${media.down('layout')} {
    display: contents;
  }
`;

/**
 * 조건 묶음(검색 + 칩 + 정렬/보기) — **좁은 화면에서 헤더 아래 붙는 바**.
 *
 * 데스크톱에서는 상자가 아니다(`display: contents`) — 레일이 이미 그리드라 여기서 상자를 하나 더
 * 만들면 레일의 gap 리듬이 이 묶음 안팎으로 갈린다.
 *
 * 🔴 높이를 **두 줄로 묶는 것이 이 부품의 설계 조건**이다(검색 한 줄 + 가로로 미는 칩 트랙 한 줄).
 * 조건을 세로로 쌓으면 위 `IndexRail` 주석이 경고한 27% 를 그대로 되풀이한다.
 * ⚠ `zIndex.stickyAction`(10) 이다 — 헤더(30)보다 낮아 스크롤 시 헤더 뒤로 들어가고,
 *   하단 비교 바(`dropdown`, 20)보다 낮아 그 바가 위에 남는다.
 */
export const RailControls = styled.div`
  display: contents;

  ${media.down('layout')} {
    display: grid;
    gap: ${space[2]};
    position: sticky;
    top: ${appHeaderHeight};
    z-index: ${zIndex.stickyAction};
    /*
     * 면이 **불투명해야** 한다 — 아래를 지나가는 표 글자가 비치면 조건이 읽히지 않는다.
     * 좌우로 조금 넓혀 지면 가장자리까지 덮는다(그 자리를 안 덮으면 글자가 옆으로 새어 보인다).
     */
    margin: 0 calc(-1 * ${space[2]});
    padding: ${space[2]};
    background: ${color.bg};
    border-bottom: 1px solid ${color.border};
  }
`;

/**
 * 칩·정렬·보기를 **한 줄로 미는 트랙**(좁은 화면 전용). 데스크톱에서는 상자가 아니다.
 *
 * 🔴 세 묶음(배당률·지급·정렬/보기)을 세로로 쌓으면 조건 바가 세 줄 더 자란다. 가로 스크롤은
 * 모바일에서 이미 익은 문법이고, 각 묶음 앞의 라벨이 "지금 무슨 축을 보고 있는지"를 말한다.
 * ⚠ 묶음 자체는 줄바꿈하지 않는다(`flex: none` + `nowrap`) — 한 묶음이 두 줄로 접히면 트랙이
 *   두 줄이 되어 가로로 미는 의미가 사라진다.
 */
export const ControlTrack = styled.div`
  display: contents;

  ${media.down('layout')} {
    display: flex;
    align-items: center;
    gap: ${space[3]};
    overflow-x: auto;
    overscroll-behavior-x: contain;
    /* 스크롤바가 조건 바의 높이를 키우지 않게 얇은 처방을 쓴다(표들과 같은 스크롤바). */
    ${subtleScrollbar}
    ${scrollFadeRight}

    /* ⚠ 클래스를 두 번 써(&&) 명시도를 올린다 — FilterRow 가 스스로 flex-wrap: wrap 을 갖고
       있어, 명시도가 같으면 정의 순서에 승패가 걸린다(배당 목록 필터에서 실제로 그렇게 졌다). */
    && > * {
      flex: none;
      flex-wrap: nowrap;
    }
  }
`;

/** 레일 안 한 묶음(검색 / 조건 / 목차)의 제목. 좁은 화면에서는 자리를 먹으므로 감춘다. */
export const RailGroupLabel = styled.p`
  margin: 0;
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${color.textMuted};

  ${media.down('layout')} {
    display: none;
  }
`;

/** 레일 안 묶음 사이 구분선. 상세 목차의 부록 구분선과 같은 처방(글자가 아니라 선으로 가른다). */
export const RailDivider = styled.hr`
  margin: ${space[1]} 0;
  height: 1px;
  border: none;
  background: ${color.border};

  ${media.down('layout')} {
    display: none;
  }
`;

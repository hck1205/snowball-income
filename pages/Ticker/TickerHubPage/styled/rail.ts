import styled from '@emotion/styled';
import {
  DATA_RADIUS,
  appHeaderHeight,
  cardElevation,
  color,
  font,
  media,
  space,
  subtleScrollbar
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
   * 🔴 좁은 화면에서는 **고정하지 않는다.** 이 레일은 검색 + 칩 3개 + 정렬/보기 + 카테고리 칩
   * 6개 + CTA 라 390px 에서 230px 대역이다 — sticky 로 두면 844px 뷰포트의 27% 를 영구히 먹는다
   * (상세 페이지가 목차 바 3줄로 같은 사고를 겪고 칩을 한 단 줄인 이력이 있다). 여기서는 줄일 수
   * 있는 양이 아니므로 고정 자체를 포기하고, 대신 본문 맨 위에 놓아 첫 화면에서 바로 보이게 한다.
   */
  ${media.down('layout')} {
    gap: ${space[3]};
    padding-bottom: ${space[4]};
    border-bottom: 1px solid ${color.border};
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

import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import {
  DATA_RADIUS,
  appHeaderHeight,
  cardElevation,
  color,
  font,
  media,
  motion,
  pageHueMix,
  radius,
  space
} from '@/shared/styles';

/* -------------------------------------------------------------------------- */
/* 목차 레일 — 데스크톱 사이드바 / 좁은 폭 sticky 가로 칩바                        */
/* -------------------------------------------------------------------------- */

/**
 * 가이드의 목차.
 *
 * 🔴 이것이 이번 리워크의 **핵심 장치**다. 종전 가이드는 문단이 세로로만 이어져 "이 글이 몇 장인지,
 * 내가 어디쯤인지"를 말해 주는 것이 하나도 없었다(2026-08-06 사용자 지적: 다른 페이지만큼 정돈되지
 * 않았다). 티커 상세가 이미 그 문제를 목차 레일로 풀었으므로 **같은 처방**을 쓴다 — 자리·크기·활성
 * 표시 방식이 두 지면에서 같아야 사용자가 한 번만 배운다.
 *
 * ⚠ 색은 티커의 티커별 액센트(--tk-*)가 아니라 **페이지 hue**(--sb-page-hue)를 읽는다. 가이드는
 *   자기 스킨을 갖지 않는 일반 라우트이고, 그 hue 는 `shared/hooks/usePageHue` 가 발행한다.
 */
export const TocAside = styled.nav`
  position: sticky;
  /* 앱 헤더 **실측 높이** 아래에 붙는다(하드코딩하면 헤더 줄 수가 바뀔 때마다 어긋난다). */
  top: calc(${appHeaderHeight} + ${space[3]});
  align-self: start;
  min-width: 0;

  ${media.down('layout')} {
    top: ${appHeaderHeight};
    z-index: 5;
    padding: ${space[2]} 0;
    background: ${color.surfaceGlassFallback};
    border-bottom: 1px solid ${color.border};
  }

  ${media.up('layout')} {
    display: grid;
    gap: ${space[3]};
    padding: ${space[4]};
    border-radius: ${DATA_RADIUS};
    ${cardElevation('base')}
  }
`;

/** 레일 머리 — "목차" + 장 수. 좁은 폭 가로 칩바에서는 자리를 먹으므로 숨긴다. */
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
    /* 가로 스크롤 대신 줄바꿈 — 좁은 화면에서 칩이 여러 줄로 접혀 전부 보인다. */
    display: flex;
    flex-wrap: wrap;
    gap: ${space[1]};
  }
`;

/** 부록(FAQ·마무리) 앞의 구분선 — 본문 장과 부록이 한 목록 안에서 선으로 갈린다. */
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
 * 활성 항목은 **hue 파생 면 + 검증된 본문색**이다. hue 를 글자색으로 쓰지 않는 이유는
 * `shared/styles/pageHue.ts` 머리말 — 표시색(identity/accent 등)은 3:1 비텍스트 계약만 갖는다.
 * 여기 면은 14% 믹스라 흰 면에 가깝고, 그 위 text 는 이미 검증된 쌍이다.
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
  background: ${({ $active }) => ($active ? pageHueMix(14) : 'transparent')};
  color: ${({ $active }) => ($active ? color.text : color.textSecondary)};
  font-size: ${font.size.sm};
  font-weight: ${({ $active }) => ($active ? font.weight.bold : font.weight.medium)};
  line-height: ${font.leading.snug};
  transition:
    background ${motion.fast} ${motion.ease},
    color ${motion.fast} ${motion.ease};

  &:hover {
    background: ${({ $active }) => ($active ? pageHueMix(14) : color.surfaceHover)};
    color: ${color.text};
  }

  ${media.down('layout')} {
    /* 줄바꿈 칩 — 내용 폭으로 줄어 한 줄에 여러 개가 들어간다. sticky 바라 한 단 작게 잡는다. */
    width: auto;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    white-space: nowrap;
    padding: 3px ${space[2]};
    font-size: ${font.size.xs};
    border-radius: ${radius.pill};
    border: 1px solid ${({ $active }) => ($active ? pageHueMix(45, 'transparent') : color.border)};
  }
`;

/** 장 번호. 등폭 숫자라 세로로 줄이 선다 — 번호가 곧 문서의 뼈대다. */
export const TocIndex = styled.span<{ $active: boolean }>`
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0;
  color: ${({ $active }) => ($active ? color.text : color.textMuted)};
  ${font.numeric};
`;

/** 부록 항목의 표식 — 번호 자리에 서는 점(장이 아니라는 뜻을 모양으로 말한다). */
export const TocDot = styled.span<{ $active: boolean }>`
  justify-self: center;
  width: 5px;
  height: 5px;
  border-radius: ${radius.pill};
  background: ${({ $active }) => ($active ? color.textSecondary : color.borderStrong)};

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
 * 레일 바닥의 상시 CTA — 긴 글 어디에서도 다음 행동이 한 화면 안에 있다.
 * 🔴 데스크톱 전용이다. 좁은 폭 sticky 가로바에 버튼을 더하면 헤더 아래 띠가 두 줄이 된다.
 */
export const TocCta = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: ${space[2]} ${space[3]};
  border-radius: ${radius.sm};
  border: 1px solid ${pageHueMix(45, 'transparent')};
  background: transparent;
  color: ${color.text};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  text-decoration: none;
  transition: background ${motion.fast} ${motion.ease};

  &:hover,
  &:focus-visible {
    background: ${pageHueMix(14)};
  }

  ${media.down('layout')} {
    display: none;
  }
`;

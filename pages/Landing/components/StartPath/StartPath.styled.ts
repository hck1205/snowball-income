import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { DATA_RADIUS, color, font, media, motion, radius, space } from '@/shared/styles';

/* --------------------------------------------------------------------------
 * 랜딩의 **시작 경로** — 처음 온 사람이 밟는 다섯 걸음.
 *
 * 🔴 카드가 아니라 **줄**이다. 다섯이 카드로 늘어서면 "골라 보세요"가 되는데, 이 블록이 말하려는
 * 것은 선택지가 아니라 **순서**다(계좌 → 배당 → 지수추종 → 계산법 → 목표). 그래서 번호가 붙고,
 * 세로로 이어지고, 마지막 걸음이 계산기로 간다.
 * 🔴 새 틴트 면을 만들지 않는다 — 랜딩의 면 예산은 이미 마무리 패널과 푸터가 쓰고 있다.
 * -------------------------------------------------------------------------- */

export const PathList = styled.ol`
  display: grid;
  gap: ${space[2]};
  margin: 0;
  padding: 0;
  list-style: none;
  counter-reset: start-path;
`;

/**
 * 한 걸음. 번호(원)와 글이 가로로 서고, 줄 전체가 링크다.
 *
 * ⚠ 번호는 `counter` 로 그린다 — 마크업에 숫자를 적으면 순서를 바꿀 때 두 곳을 고쳐야 하고,
 *   그러다 화면의 번호와 실제 순서가 어긋난다.
 */
export const PathStep = styled.li`
  counter-increment: start-path;
  min-width: 0;
`;

export const StepLink = styled(Link)`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: ${space[3]};
  padding: ${space[4]};
  border: 1px solid ${color.border};
  border-radius: ${DATA_RADIUS};
  background: ${color.surface};
  color: ${color.text};
  text-decoration: none;
  transition:
    border-color ${motion.fast} ${motion.ease},
    background-color ${motion.fast} ${motion.ease};

  &:hover,
  &:focus-visible {
    border-color: ${color.brandBorder};
    background: ${color.surfaceHover};
  }

  /* 번호 원. 폭이 짧아(<180px) 틴트 면 예산 밖이다(색면 사다리 L1). */
  &::before {
    content: counter(start-path);
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: ${radius.pill};
    background: ${color.brandSubtle};
    color: ${color.brandText};
    font-family: ${font.dataNumeric};
    font-size: ${font.size.xs};
    font-weight: ${font.weight.bold};
  }
`;

export const StepBody = styled.span`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

export const StepTitle = styled.span`
  font-size: ${font.size.base};
  font-weight: ${font.weight.bold};
  word-break: keep-all;
`;

export const StepLede = styled.span`
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
  word-break: keep-all;

  /* 좁은 폭에서는 제목만 남긴다 — 다섯 줄이 전부 두 줄이 되면 이 블록만 화면을 다 먹는다. */
  ${media.down('mobileWide')} {
    display: none;
  }
`;

/** 오른쪽 꼬리표 — "읽기"/"계산하기". 화살표 대신 글자를 쓰는 이유는 회색조에서도 남기 때문이다. */
export const StepAction = styled.span`
  color: ${color.brandText};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  white-space: nowrap;
`;

/** 마지막 걸음(계산기)만 무게를 한 단 올린다 — 이 경로가 향하는 곳이 거기다. */
export const FinalStepLink = styled(StepLink)`
  border-color: ${color.brandBorder};
  background: ${color.brandSubtle};

  &::before {
    background: ${color.brand};
    color: ${color.onBrand};
  }
`;

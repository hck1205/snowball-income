import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { color, font, motion, radius, space } from '@/shared/styles';

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

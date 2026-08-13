import styled from '@emotion/styled';
import { DATA_RADIUS, color, font, media, radius, space, surface } from '@/shared/styles';
import { VERDICT_PAD } from './constants';

/* ── "이 종목으로 계산" — 비교 → 시뮬레이터 액션 ──────────────────────────────
   비교가 끝난 직후가 실행 의도의 정점이다(기획서 §3-2 연결②). 결론(Verdict)·표를 읽은 사용자가
   "그래서 이 종목을 계산해 보자"로 넘어가는 다리다.
   🔴 색이 유일한 채널이 되지 않는다 — 어느 종목인지는 티커 글자가 지고, 왼쪽 귀 색은 거들 뿐이다
      (덱 슬롯·표 열 머리와 같은 `assignSeries` 색을 관통시켜 화면 안에서 종목=색을 일관되게 한다).
   ────────────────────────────────────────────────────────────────────────── */

/** 읽는 면이라 채도 면을 깔지 않는다 — 가라앉은 중립 면 + 1px 테두리로 표·결론과 같은 격을 유지한다. */
export const SimulateSection = styled.section`
  ${surface(DATA_RADIUS, VERDICT_PAD)}
  display: grid;
  gap: ${space[4]};
  border: 1px solid ${color.border};
  background: ${color.surfaceSunken};
  min-width: 0;
`;

export const SimulateHead = styled.div`
  display: grid;
  gap: ${space[1]};
  min-width: 0;
`;

export const SimulateTitle = styled.h2`
  margin: 0;
  color: ${color.text};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.snug};
`;

export const SimulateLede = styled.p`
  margin: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
`;

export const SimulateList = styled.ul`
  display: grid;
  gap: ${space[2]};
  margin: 0;
  padding: 0;
  list-style: none;
  min-width: 0;
`;

/**
 * 한 종목 행 — 왼쪽에 종목 정체성(귀 + 티커 + 이름), 오른쪽에 버튼.
 * 좁은 폭에서는 버튼이 아래로 내려가 전폭이 된다(작은 화면에서 히트 영역 확보).
 */
export const SimulateItem = styled.li<{ $series: string }>`
  position: relative;
  overflow: hidden;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: ${space[2]} ${space[3]};
  padding: ${space[3]};
  padding-left: ${space[4]};
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surface};
  min-width: 0;

  /* 왼쪽 귀 — 높이는 행 전체, 폭 4px. 면이 아니라 선이라 채도 예산에 들지 않는다. */
  &::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 4px;
    background: ${({ $series }) => $series};
  }
`;

export const SimulateMeta = styled.div`
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: ${space[1]} ${space[2]};
  min-width: 0;
`;

export const SimulateTicker = styled.span`
  color: ${color.text};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.md};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.01em;
`;

export const SimulateName = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 24ch;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};

  ${media.down('mobileWide')} {
    max-width: 16ch;
  }
`;

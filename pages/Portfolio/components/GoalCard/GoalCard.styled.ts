import styled from '@emotion/styled';
import { color, elevation, font, iconFirstLineAlign, media, radius, space } from '@/shared/styles';

/**
 * 요약 카드·보유 목록 카드와 **같은 면**(surface + border + elevation + radius.xl)이다.
 * 카드 사이의 위계는 면이 아니라 **내용물**로만 만든다 — 요약(hero 숫자) > 목표(미터) > 보유 목록(표).
 *
 * 페이지의 `PortfolioPage.styled` 를 가져다 쓰지 않고 여기에 **복제**한다: 컴포넌트가 페이지 styled 를
 * 직접 import 하면 `페이지 → 컴포넌트 → 페이지` 순환이 생긴다(카피를 형제 폴더에 둔 이유와 같다).
 */
export const CardRoot = styled.section`
  min-width: 0;
  display: grid;
  gap: ${space[5]};
  align-content: start;
  padding: clamp(16px, 2.4vw, 28px);
  border: 1px solid ${color.border};
  border-radius: ${radius.xl};
  background: ${color.surface};
  box-shadow: ${elevation[1]};
`;

export const CardHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[3]};
  flex-wrap: wrap;
`;

/** 섹션 제목 + 오로라 리본(요약·보유 카드와 같은 어법). */
export const CardTitle = styled.h2`
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${space[2]};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  color: ${color.text};

  &::before {
    content: '';
    width: 4px;
    height: 16px;
    border-radius: ${radius.pill};
    background: ${color.gradientAurora};
  }
`;

/**
 * 타일 그리드. jsdom 은 `@media` 를 평가하지 않으므로 반응형 분기는 **CSS만으로** 만든다(DOM 은 한 벌).
 * 브레이크포인트는 요약 카드의 `TileGrid` 와 동일하게 맞춰 두 카드의 열이 같은 폭에서 함께 접힌다.
 */
export const TileGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${space[3]};

  ${media.down('tabletSm')} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  ${media.down('mobileWide')} {
    grid-template-columns: 1fr;
  }
`;

/**
 * 기준 안내 한 줄 — **경고가 아니라 본문**이다. 그래서 `role` 을 주지 않고(진입마다 낭독되면 소음),
 * warning/danger 톤도 쓰지 않는다. 면(surfaceSunken)으로만 한 겹 눌러 둔다.
 *
 * 문장이 길면 인라인 액션이 아래 줄로 자연스럽게 내려간다(`flex-wrap` + 텍스트의 `flex: 1 1 240px`).
 */
export const BasisNote = styled.p`
  margin: 0;
  display: flex;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: ${space[2]};
  padding: ${space[3]};
  border-radius: ${radius.md};
  background: ${color.surfaceSunken};
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};

  /* 아이콘은 문단 가운데가 아니라 **첫 줄**에 맞춘다 — 보정은 공용 유틸이 글자 크기·행간에서 계산한다. */
  svg {
    ${iconFirstLineAlign(font.size.xs, font.leading.snug)}
  }
`;

export const BasisNoteText = styled.span`
  flex: 1 1 240px;
  min-width: 0;
`;

/**
 * 도달/미도달 한 줄. **색 단독 금지** — 톤(면색)·아이콘·문장 세 겹으로 같은 사실을 말한다.
 * 대비가 검증된 쌍만 쓴다(success/successSurface · warning/warningSurface).
 */
export const StatusLine = styled.p<{ tone: 'success' | 'warning' }>`
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${space[2]};
  padding: ${space[3]};
  border-radius: ${radius.md};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  line-height: ${font.leading.snug};
  color: ${({ tone }) => (tone === 'success' ? color.success : color.warning)};
  background: ${({ tone }) => (tone === 'success' ? color.successSurface : color.warningSurface)};

  svg {
    flex: 0 0 auto;
  }
`;

/** 상태 문장 다음 줄의 행동 버튼. 좁은 폭에서는 자연스럽게 아래로 내려온다. */
export const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]};
`;

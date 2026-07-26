import styled from '@emotion/styled';
import { color, elevation, font, media, radius, space } from '@/shared/styles';

export const PageStack = styled.div`
  display: grid;
  gap: clamp(16px, 3vw, 28px);
  min-width: 0;
`;

/**
 * 히어로 — 브랜드 틴트 + 상단 오로라 리본.
 *
 * 배당 캘린더의 히어로와 **같은 모양이지만 여기서 다시 정의한다**. 페이지 간 styled를 직접 import하면
 * 두 화면이 서로의 레이아웃 변경에 묶이고(한쪽을 고치면 다른 쪽이 조용히 바뀐다) lazy 청크도 섞인다.
 */
export const PageHero = styled.header`
  display: grid;
  gap: ${space[3]};
  padding: clamp(20px, 3vw, 32px);
  border-radius: ${radius.xl};
  border: 1px solid ${color.brandBorder};
  background: ${color.brandSubtle};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0 0 auto 0;
    height: 4px;
    background: ${color.gradientAurora};
  }
`;

export const HeroTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${space[3]};
  min-width: 0;
`;

export const HeroIconBadge = styled.span`
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: ${radius.md};
  color: ${color.brandText};
  background: ${color.surface};
  border: 1px solid ${color.brandBorder};
`;

/** 이 페이지의 유일한 `<h1>`. */
export const HeroTitle = styled.h1`
  margin: 0;
  font-size: clamp(${font.size['2xl']}, 4vw, ${font.size['4xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.03em;
  line-height: ${font.leading.tight};
  color: ${color.text};
`;

export const HeroLede = styled.p`
  margin: 0;
  width: 100%;
  font-size: clamp(${font.size.base}, 2vw, ${font.size.lg});
  color: ${color.textSecondary};
  line-height: ${font.leading.snug};
`;

/** 시나리오명 · 종목 요약 · 기준일. "무엇을 근거로 계산했나"를 화면 첫 화면에서 밝힌다. */
export const AsOfLine = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  color: ${color.textMuted};
  ${font.numeric}
`;

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

/** 화면의 두 번째이자 마지막 박스 — 목표에 관한 모든 숫자가 여기 한 장에 모인다. */
export const GoalCard = styled.section`
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

/** 섹션 제목 + 오로라 리본. 카드 안에서 "여기서 시작"을 눈으로 찍는다. */
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
 * 타일 그리드. hero 슬롯(목표 타일 또는 설정 안내 패널)은 전 폭을 차지한다.
 * jsdom은 `@media`를 평가하지 않으므로 반응형 분기는 **CSS만으로** 만든다(DOM은 한 벌).
 */
export const TileGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${space[3]};

  ${media.down('mobile')} {
    grid-template-columns: 1fr;
  }
`;

export const HeroSlot = styled.div`
  grid-column: 1 / -1;
  min-width: 0;
  display: grid;
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

/** 상태 문장 다음 줄의 행동 버튼(미도달의 "조건 바꾸기"). 좁은 폭에서는 자연스럽게 아래로 내려온다. */
export const ActionRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]};
`;

/** 빈 상태도 하나의 화면이다 — 점선(미확정)에 브랜드 틴트를 얹어 "여기서 시작하라"로 읽히게 한다. */
export const EmptyStateCard = styled.section`
  display: grid;
  gap: ${space[4]};
  padding: clamp(20px, 3vw, 28px);
  border: 1px dashed ${color.brandBorder};
  border-radius: ${radius.xl};
  background: ${color.brandSubtle};
`;

export const EmptyTitle = styled.h2`
  margin: 0;
  font-size: ${font.size.lg};
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.01em;
  color: ${color.text};
`;

export const EmptyBody = styled.p`
  margin: 0;
  max-width: 52ch;
  font-size: ${font.size.sm};
  color: ${color.textSecondary};
  line-height: ${font.leading.snug};
`;

/**
 * "여기에 이런 게 보일 거예요" 예고 블록 — 장식(`aria-hidden`)이라 낭독되지 않는다.
 * 라벨을 **반드시 함께 렌더**해 로딩(값이 곧 온다)과 시각적으로 구분한다.
 */
export const PreviewBlock = styled.div`
  display: grid;
  gap: ${space[2]};
  opacity: 0.55;
`;

export const PreviewLabel = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${color.textSecondary};
`;

export const PreviewList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: ${space[2]};

  ${media.down('mobile')} {
    grid-template-columns: 1fr;
  }
`;

export const PreviewItem = styled.li`
  padding: ${space[3]};
  border: 1px dashed ${color.border};
  border-radius: ${radius.md};
  font-size: ${font.size.xs};
  color: ${color.textMuted};
`;

/** 조건 요약 — 접힘. 면(surface)을 새로 만들지 않고 왼쪽 선 하나로 "부속 정보"임을 말한다. */
export const ConditionsDetails = styled.details`
  border-left: 2px solid ${color.border};
  padding: 0 0 0 ${space[4]};
`;

export const ConditionsSummary = styled.summary`
  cursor: pointer;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${color.textSecondary};
  border-radius: ${radius.xs};

  &:hover {
    color: ${color.text};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

export const ConditionsList = styled.dl`
  margin: ${space[3]} 0 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: ${space[2]} ${space[4]};

  ${media.down('mobile')} {
    grid-template-columns: 1fr;
  }
`;

export const ConditionRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${space[2]};
  min-width: 0;
`;

export const ConditionTerm = styled.dt`
  margin: 0;
  font-size: ${font.size.xs};
  color: ${color.textMuted};
`;

export const ConditionValue = styled.dd`
  margin: 0;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${color.text};
  ${font.numeric}
`;

export const ConditionsNote = styled.p`
  margin: ${space[3]} 0 0;
  font-size: ${font.size['2xs']};
  color: ${color.textMuted};
`;

/** 각주 묶음 — 본문과 같은 무게로 나열되지 않게 한 덩어리로 눌러 둔다. */
export const FootNoteCard = styled.footer`
  display: grid;
  gap: ${space[1]};
  padding: ${space[3]} ${space[4]};
  border-left: 2px solid ${color.border};
`;

export const FootNoteTitle = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  color: ${color.textSecondary};
`;

export const FootNote = styled.p`
  margin: 0;
  font-size: ${font.size['2xs']};
  color: ${color.textMuted};
  line-height: ${font.leading.snug};
`;

import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { color, font, motion, radius, space } from '@/shared/styles';

/**
 * 첨부 섹션 조각 — `CommunityWritePage.styled.ts`에서 옮겨왔다(스타일 값 동일, 마크업/동작 변화 없음).
 */

/* ── 첨부 섹션 헤더 (제목 + "첨부" 토글) ──────────────────────────────────────
 * FormSection은 title 우측 슬롯을 지원하지 않아, 이 섹션만 헤더를 로컬로 조립한다.
 * 제목 타이포는 common FormSection.SectionTitle과 동일(lg/bold/tight/-0.01em). */
export const AttachSection = styled.section`
  display: grid;
  gap: ${space[3]};
`;

export const AttachSectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[3]};
`;

export const AttachSectionTitle = styled.h3`
  margin: 0;
  color: ${color.text};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.tight};
  letter-spacing: -0.01em;
`;

/* 첨부 상태 — 프리뷰(ready/empty)와 첨부 카드가 이 컨테이너 안에서 교체된다.
 * aria-live가 동작하려면 상태가 **같은 부모** 안에서 갈려야 한다(부모째 갈아끼우지 말 것). */
export const AttachStates = styled.div`
  display: grid;
  gap: ${space[2]};
`;

/* 첨부 카드 */
export const AttachEmpty = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[3]};
  flex-wrap: wrap;
  padding: ${space[4]};
  border-radius: ${radius.md};
  border: 1px dashed ${color.border};
  background: ${color.surfaceMuted};
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
`;

export const AttachCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${space[3]};
  padding: ${space[4]};
  border-radius: ${radius.md};
  border: 1px solid ${color.brandBorder};
  background: ${color.brandSubtle};
`;

export const AttachInfo = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;

  strong {
    color: ${color.text};
    font-size: ${font.size.base};
    font-weight: ${font.weight.bold};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    color: ${color.textSecondary};
    font-size: ${font.size.sm};
    ${font.numeric}
  }
`;

/** 프리뷰(미첨부) 상태의 좌측 정보 블록 — 첨부 카드와 같은 요약 포맷을 쓴다. */
export const AttachPreviewInfo = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
  flex: 1 1 240px;

  strong {
    color: ${color.text};
    font-size: ${font.size.sm};
    font-weight: ${font.weight.semibold};
  }

  span {
    color: ${color.textSecondary};
    font-size: ${font.size.sm};
    ${font.numeric}
  }
`;

export const AttachedHint = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  line-height: ${font.leading.normal};
  white-space: normal;
`;

/**
 * 빈 상태의 "시뮬레이터로 가기" — 시맨틱 내비게이션이라 버튼이 아닌 `Link`.
 * 시각은 공용 Button secondary sm과 동일 토큰(borderStrong/surface/text, 32px, radius.sm).
 */
export const AttachEmptyCtaLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 ${space[3]};
  border-radius: ${radius.sm};
  border: 1px solid ${color.borderStrong};
  background: ${color.surface};
  color: ${color.text};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  text-decoration: none;
  white-space: nowrap;
  transition: background ${motion.fast} ${motion.ease}, border-color ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.surfaceHover};
    border-color: ${color.brandBorder};
  }
`;

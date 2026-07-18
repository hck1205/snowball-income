import styled from '@emotion/styled';
import { color, font, motion, space } from '@/shared/styles';

/**
 * 제목 한 줄 — 클릭하면 설명이 펼쳐지는 디스클로저 버튼.
 * `Banner`의 `title` 대신 이 버튼을 본문 첫 자식으로 둬서, 제목 줄 자체가 클릭 타깃이 되게 한다.
 */
export const NoticeToggle = styled.button`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  width: 100%;
  margin: 0;
  padding: 0;
  border: none;
  background: none;
  color: ${color.text};
  font-family: inherit;
  font-size: ${font.size.md};
  font-weight: ${font.weight.semibold};
  line-height: ${font.leading.tight};
  text-align: left;
  cursor: pointer;
`;

/** 펼침 상태 표시 셰브런 — 접힘=오른쪽, 펼침=아래(90° 회전). */
export const NoticeChevron = styled.span`
  display: inline-flex;
  flex: none;
  color: ${color.textSecondary};
  transition: transform ${motion.fast} ${motion.ease};

  svg {
    width: 14px;
    height: 14px;
    stroke: currentColor;
    fill: none;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  &[data-expanded='true'] {
    transform: rotate(90deg);
  }
`;

/** 펼쳐졌을 때 나오는 설명 묶음. Banner 본문 스타일(`p` 마진/`strong`)을 그대로 상속받는다. */
export const NoticeDetail = styled.div`
  display: grid;
  gap: ${space[2]};
`;

/**
 * 각주 한 줄.
 *
 * 각주에 `textMuted`를 쓰지 않는 이유: `brandSubtle` 배경 위에서 대비가 AA(4.5:1)에 못 미친다.
 * `textSecondary`는 통과한다 (검증: `shared/styles/contrast.test.ts`).
 */
export const NoticeFootnote = styled.p`
  margin: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};
`;

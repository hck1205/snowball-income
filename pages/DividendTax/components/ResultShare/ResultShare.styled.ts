import styled from '@emotion/styled';
import { color, font, radius, shadow, space, zIndex } from '@/shared/styles';

/** 결과 공유 — 버튼과 한 줄 설명. 좁은 폭에서는 설명이 버튼 아래로 내려간다. */
export const ShareRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${space[2]} ${space[3]};
`;

export const ShareHint = styled.p`
  flex: 1 1 240px;
  margin: 0;
  font-size: ${font.size.base};
  color: ${color.textSecondary};
`;

/** 복사 결과 알림 — 커뮤니티 공유 토스트와 같은 모양(화면 위 가운데). */
export const ShareToast = styled.div`
  position: fixed;
  top: ${space[4]};
  left: 50%;
  transform: translateX(-50%);
  z-index: ${zIndex.tooltip};
  max-width: min(92vw, 420px);
  padding: ${space[3]} ${space[4]};
  border-radius: ${radius.sm};
  background: ${color.text};
  color: ${color.surface};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  box-shadow: ${shadow.e3};
`;

import styled from '@emotion/styled';
import { color, font } from '@/shared/styles';

/**
 * 배너의 껍데기(테두리/톤/닫기 버튼)는 `Banner` 프리미티브가 소유한다.
 * 여기 남은 건 이 공지에만 있는 각주 한 줄뿐이다.
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

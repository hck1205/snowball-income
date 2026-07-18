import styled from '@emotion/styled';
import { color, font, space } from '@/shared/styles';

export const Subtitle = styled.p`
  margin: 0 0 ${space[4]};
  color: ${color.textSecondary};
  font-size: ${font.size.base};
  line-height: ${font.leading.normal};
`;

/** 프로바이더 버튼 세로 스택. 버튼 자체는 공용 `SocialLoginButton`(브랜드 규정색·로고·카피). */
export const ProviderList = styled.div`
  display: grid;
  gap: ${space[2]};
`;

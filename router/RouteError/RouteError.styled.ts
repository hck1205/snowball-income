import styled from '@emotion/styled';
import { color, font, space } from '@/shared/styles';

/* --------------------------------------------------------------------------
 * 라우트 오류 화면.
 *
 * ⚠ 여기서는 **공용 히어로·카드·셸을 쓰지 않는다.** 이 화면에 왔다는 것은 무언가 정상이 아니라는
 * 뜻이고, 무거운 부품을 끌어오면 에러 화면이 다시 에러를 낼 수 있다. 토큰과 소박한 상자만 쓴다.
 * -------------------------------------------------------------------------- */

export const ErrorRoot = styled.div`
  display: grid;
  gap: ${space[3]};
  justify-items: center;
  align-content: center;
  min-height: 60vh;
  padding: ${space[6]} ${space[4]};
  text-align: center;
`;

export const ErrorTitle = styled.h1`
  margin: 0;
  font-family: ${font.display};
  font-size: clamp(${font.size.xl}, 3vw, ${font.size['3xl']});
  font-weight: ${font.weight.bold};
  letter-spacing: -0.02em;
  color: ${color.text};
  word-break: keep-all;
`;

export const ErrorBody = styled.p`
  margin: 0;
  max-width: 46ch;
  color: ${color.textSecondary};
  font-size: ${font.size.base};
  line-height: ${font.leading.relaxed};
  word-break: keep-all;
`;

export const ErrorActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: ${space[2]};
  margin-top: ${space[2]};
`;

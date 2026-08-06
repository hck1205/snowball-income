import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { color, font, space } from '@/shared/styles';

/**
 * 이 화면에만 있는 조판.
 *
 * 🔴 섹션 뼈대(제목 밑줄·부제·타일 줄·한계 판)는 여기 없다 — **`components/common/DataSection`** 이
 * 소유한다. 미국 화면·국민연금·증시 캘린더가 같은 조판을 쓴다. 여기에 다시 만들지 마라.
 */

/** 미국 화면으로 건너가는 안내 판의 본문 단락. 한 문단이 길어 읽는 폭을 따로 묶는다. */
export const BridgeBody = styled.p`
  margin: 0;
  max-width: 68ch;
  color: ${color.textSecondary};
  font-size: ${font.size.base};
  line-height: 1.75;
`;

/**
 * 미국 화면으로 가는 링크.
 *
 * ⚠ `SectionLink`(공용)는 `<a href>` 라 외부 문서용이다. 앱 안에서 옮기는 링크에 그걸 쓰면
 *   전체 새로고침이 일어난다 — 라우터 `Link` 로 둔다.
 */
export const BridgeLink = styled(Link)`
  align-self: start;
  color: ${color.brandText};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  text-decoration: none;
  border-bottom: 1px solid transparent;
  padding-top: ${space[1]};

  &:hover,
  &:focus-visible {
    border-bottom-color: currentColor;
  }
`;

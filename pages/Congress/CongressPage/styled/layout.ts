import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { color, font, radius, space } from '@/shared/styles';

/**
 * 이 화면에만 있는 조판.
 *
 * 🔴 섹션 뼈대(제목 밑줄·부제·타일 줄·한계 판)는 여기 없다 — **`components/common/DataSection`** 이
 * 소유한다. 국민연금·증시 캘린더가 같은 조판을 쓰기 때문이다. 여기에 다시 만들지 마라.
 */

/** 대한민국 국회 안내 판의 본문 단락. 한 문단이 길어 읽는 폭을 따로 묶는다. */
export const KoreaBody = styled.p`
  margin: 0;
  max-width: 68ch;
  color: ${color.textSecondary};
  font-size: ${font.size.base};
  line-height: 1.75;
`;

/**
 * 대한민국 화면으로 가는 링크.
 *
 * ⚠ `SectionLink`(공용)는 `<a href>` 라 외부 문서용이다. 앱 안에서 옮기는 링크에 그걸 쓰면
 *   전체 새로고침이 일어난다 — 라우터 `Link` 로 둔다.
 */
export const KoreaLink = styled(Link)`
  align-self: start;
  padding-top: ${space[1]};
  color: ${color.brandText};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  text-decoration: none;
  border-bottom: 1px solid transparent;

  &:hover,
  &:focus-visible {
    border-bottom-color: currentColor;
  }
`;

/**
 * 종목 표의 축 전환(거래 건수 ↔ 신고 금액).
 *
 * 🔴 두 축이 **다른 종목**을 위로 올리기 때문에 있는 컨트롤이다 — 거래가 잦은 종목과 돈이 큰
 * 종목은 같지 않다(실측: AESI 는 3건인데 신고 금액 하한이 520만 달러다).
 * ⚠ 상태는 색이 아니라 aria-pressed 와 글자 무게가 함께 말한다(색 단독 채널 금지).
 */
export const AxisRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${space[2]};
`;

export const AxisLabel = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
`;

export const AxisButton = styled.button<{ $active: boolean }>`
  padding: ${space[1]} ${space[3]};
  border: 1px solid ${({ $active }) => ($active ? color.brand : color.border)};
  border-radius: ${radius.pill};
  background: ${({ $active }) => ($active ? color.brandSubtle : color.surface)};
  color: ${({ $active }) => ($active ? color.brandText : color.textSecondary)};
  font-size: ${font.size.xs};
  font-weight: ${({ $active }) => ($active ? font.weight.semibold : font.weight.regular)};
  cursor: pointer;

  &:hover {
    border-color: ${color.brand};
  }
`;

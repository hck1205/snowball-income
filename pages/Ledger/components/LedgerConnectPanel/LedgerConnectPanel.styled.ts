import styled from '@emotion/styled';
import { color, font, media, sectionTitleFontSize, space } from '@/shared/styles';

/** §4.1 연결 전 화면. 카드가 아니라 **섹션**이다(제목 + 동일 무게 타일 2개 + 힌트). */
export const ConnectSection = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${space[4]};
  min-width: 0;
`;

export const ConnectHeading = styled.h2`
  margin: 0;
  font-size: ${sectionTitleFontSize};
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.01em;
  color: ${color.text};
`;

export const ConnectGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: ${space[4]};
  min-width: 0;

  ${media.down('mobileWide')} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

/**
 * 선택 타일의 설명문.
 *
 * 🔴 `Card` 의 `subtitle` 로 넘기지 마라 — `CardSubtitle` 은 12px/textMuted 캡션이라 두 줄짜리
 * 설명문에는 너무 작다. ⚠ `CardContainer` 는 grid 가 아니라 일반 블록이라(gap 없음) 자식 간
 * 간격은 이 마진이 만든다. 한글 산문이라 `overflow-wrap: anywhere` 는 쓰지 않는다.
 */
export const ChoiceBody = styled.p`
  margin: 0 0 ${space[4]};
  max-width: 44ch;
  font-size: ${font.size.sm};
  line-height: ${font.leading.normal};
  color: ${color.textSecondary};
`;

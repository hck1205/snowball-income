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

/**
 * 🔴 **보안 고지 — 권한을 허용하기 "전"에 읽히는 자리다.**
 *
 * 가계부는 소득·지출이라 이 앱에서 가장 민감한 데이터다. 그래서 각주(`PageFooter`)가 아니라
 * 연결 화면 **본문**에 세운다. 사용자가 "무엇을 허용하는가"를 판단하는 순간에 보여야 의미가 있다.
 *
 * ⚠ 틴트 면을 쓰지 않는다 — 이 화면에는 이미 선택지 타일 2개가 `tone="wash"` 를 쓰고 있어
 * 여기까지 칠하면 한 화면 틴트 면 상한(≤2, `npm run tintscan`)을 넘긴다. 대신 **1px 경계 + 색 있는
 * 제목**으로 무게를 만든다(`Banner` 의 info 톤을 테두리형으로 바꾼 것과 같은 처방).
 */
export const PrivacyNote = styled.section`
  display: grid;
  gap: ${space[2]};
  padding: ${space[4]};
  border: 1px solid ${color.identityBorder};
  border-radius: ${space[3]};
  min-width: 0;
`;

export const PrivacyTitle = styled.h3`
  margin: 0;
  font-size: ${font.size.md};
  font-weight: ${font.weight.semibold};
  color: ${color.identityText};
`;

/** 항목은 목록이다 — 네 문장이 서로 다른 사실이라 문단으로 뭉치면 하나도 안 읽힌다. */
export const PrivacyList = styled.ul`
  display: grid;
  gap: ${space[2]};
  margin: 0;
  padding-inline-start: ${space[4]};
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: 1.6;
`;

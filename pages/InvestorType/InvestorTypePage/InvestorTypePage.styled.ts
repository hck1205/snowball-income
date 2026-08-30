import styled from '@emotion/styled';
import { color, font, media, space } from '@/shared/styles';

/* --------------------------------------------------------------------------
 * 투자 성향 테스트 — **두 화면이 실제로 공유하는 껍데기**만 남았다(2026-08-30).
 *
 * 🔴 화면별 스타일은 각자 폴더로 갔다(components/QuizView·ResultView 의 .styled.ts). 여기 남긴
 * 둘은 문항·결과가 **같은 지면이라는 것을 말하는 값**이다 — 읽기 폭(Stack)과 면책 문구의 무게
 * (Disclaimer). 한쪽만 바뀌면 두 화면이 다른 사이트처럼 보인다.
 * ⚠ 하위 부품은 상대경로(../../InvestorTypePage.styled)로 가져간다. alias(@/...) 로 남의 내부
 *   파일을 집는 것은 구조 가드가 막는다(test/shared/structureRules.test.ts 의 INTERNAL_FILE).
 * -------------------------------------------------------------------------- */

export const Stack = styled.div`
  display: grid;
  gap: ${space[4]};
  max-width: 760px;
  margin: 0 auto;
  padding: ${space[5]} ${space[4]} ${space[8]};

  ${media.up('mobileWide')} {
    gap: ${space[5]};
  }
`;

/**
 * 이 화면이 무엇인지 말하는 한 줄.
 *
 * 🔴 2026-08-27 신설. 그전에는 화면이 진행률(1 / 12)로 **갑자기 시작**해서, 링크를 받고 들어온
 * 사람이 무엇을 하는 곳인지 알 수 없었다. 히어로를 통째로 세우지 않은 것은 의도다 — 12문항짜리
 * 흐름에서 제목이 크면 매 문항 화면 위쪽을 그만큼 잡아먹는다.
 */

/** 면책. 🔴 결과가 조언으로 읽히지 않게 하는 줄이라 지우지 마라(투자 권유 금지 규율). */
export const Disclaimer = styled.p`
  margin: 0;
  font-size: ${font.size.xs};
  line-height: 1.6;
  color: ${color.textMuted};
`;

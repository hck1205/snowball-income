import styled from '@emotion/styled';
import { color, font, media, radius, space } from '@/shared/styles';
import { MEASURE } from './metrics';

/* -------------------------------------------------------------------------- */
/* 부록 틀 — 보유 종목 / 참고 지표 / FAQ / 관련 티커가 공유하는 껍데기               */
/* -------------------------------------------------------------------------- */

/**
 * 부록 블록.
 *
 * 🔴 **카드(떠 있는 패널)를 걷어냈다.** 종전에는 셋 다 `surfaceRaised` + 그림자 패널이라
 * "화면에 raised 는 하나뿐"이라는 위계 규칙을 셋이 동시에 어기고 있었고, 본문(카드 없음)과
 * 부록(카드 셋)이 다른 문서처럼 보였다. 이제 부록도 본문과 같은 지면 위에 서고, 상단 헤어라인과
 * 라벨이 구획을 만든다 — 문서가 한 장의 종이로 읽힌다.
 */
export const Appendix = styled.section`
  scroll-margin-top: 96px;
  display: grid;
  gap: ${space[5]};
  padding-top: clamp(20px, 3vw, 28px);
  border-top: 2px solid ${color.borderStrong};

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 8px;
    border-radius: ${radius.sm};
  }

  ${media.down('layout')} {
    scroll-margin-top: 120px;
  }
`;

export const AppendixHead = styled.div`
  display: grid;
  gap: ${space[2]};
  min-width: 0;
`;

export const AppendixHeading = styled.h2`
  margin: 0;
  font-size: clamp(${font.size['2xl']}, 2.2vw, ${font.size['4xl']});
  font-weight: ${font.weight.bold};
  letter-spacing: -0.03em;
  line-height: ${font.leading.tight};
  color: ${color.text};
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

export const AppendixNote = styled.p`
  margin: 0;
  max-width: ${MEASURE};
  font-size: ${font.size.base};
  line-height: ${font.leading.snug};
  color: ${color.textMuted};
`;

import styled from '@emotion/styled';
import { color, font, media, radius, space } from '@/shared/styles';

/**
 * 삭제 대상 요약.
 *
 * `Card` 를 쓰지 않는다 — 모달 본문은 카드가 아니라 **면**이고, `Card` 안 `Card` 도 금지다.
 * 🔴 금액에 색이 없다. 구분 값은 텍스트('수입'/'지출')이고 여기서는 칩도 아이콘도 필요 없다
 * (문장 맥락이 이미 명확하다).
 */
export const TargetCard = styled.div`
  display: grid;
  gap: ${space[3]};
  padding: ${space[4]};
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surfaceSunken};
  min-width: 0;
`;

/**
 * 지울 금액을 **맨 위 큰 숫자**로 세운다(2026-08-03).
 *
 * 예전에는 날짜·구분·분류·금액 네 줄이 같은 크기로 나열돼 있었다. 파괴적 확인 화면에서 사용자가
 * 실제로 대조하는 것은 **얼마짜리 기록인가**인데, 그 값이 목록의 네 번째 줄에 숨어 있었다.
 * 🔴 색은 여전히 없다 — 크기만으로 세운다.
 */
export const TargetAmountRow = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${space[3]};
  min-width: 0;
  padding-bottom: ${space[3]};
  border-bottom: 1px solid ${color.border};
`;

export const TargetAmountLabel = styled.span`
  font-size: ${font.size.sm};
  color: ${color.textMuted};
`;

/** 🔴 금액에 색이 없다. 데이터 서체 + tabular 로만 선다. */
export const AmountValue = styled.span`
  flex: 0 0 auto;
  font-family: ${font.dataNumeric};
  font-size: ${font.size['3xl']};
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.02em;
  color: ${color.text};
  ${font.numeric}
`;

/** 나머지 세 사실(날짜·구분·분류). 정의 목록이라 스크린리더가 짝으로 읽는다. */
export const TargetList = styled.dl`
  margin: 0;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: ${space[2]} ${space[4]};
  min-width: 0;

  ${media.down('mobile')} {
    grid-template-columns: minmax(0, 1fr);
    gap: ${space[1]} 0;
  }

  dt {
    color: ${color.textMuted};
    font-size: ${font.size.sm};
  }

  dd {
    margin: 0;
    min-width: 0;
    color: ${color.text};
    font-weight: ${font.weight.medium};
    overflow-wrap: anywhere;
  }
`;

export const DialogBody = styled.p`
  margin: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.base};
  line-height: ${font.leading.relaxed};
`;

export const BannerRow = styled.span`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${space[3]};
`;

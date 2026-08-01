import styled from '@emotion/styled';
import { color, font, media, radius, space } from '@/shared/styles';

/**
 * 삭제 대상 요약.
 *
 * `Card` 를 쓰지 않는다 — 모달 본문은 카드가 아니라 **면**이고, `Card` 안 `Card` 도 금지다.
 * 🔴 금액에 색이 없다. 구분 값은 텍스트('수입'/'지출')이고 여기서는 칩도 아이콘도 필요 없다
 * (문장 맥락이 이미 명확하다).
 */
export const TargetList = styled.dl`
  margin: 0;
  padding: ${space[3]};
  border-radius: ${radius.md};
  background: ${color.surfaceSunken};
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: ${space[1]} ${space[3]};

  ${media.down('mobile')} {
    grid-template-columns: minmax(0, 1fr);
  }

  dt {
    color: ${color.textMuted};
    font-size: ${font.size.sm};
  }

  dd {
    margin: 0;
    min-width: 0;
    color: ${color.text};
    overflow-wrap: anywhere;
  }
`;

/** 금액 행만 데이터 서체. 색은 없다. */
export const AmountValue = styled.span`
  font-family: ${font.dataNumeric};
  ${font.numeric}
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

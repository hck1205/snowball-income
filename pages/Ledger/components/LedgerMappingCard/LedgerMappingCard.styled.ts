import styled from '@emotion/styled';
import { color, font, media, radius, space } from '@/shared/styles';

/** 카드 안 블록 사이 간격. `CardContainer` 는 grid 가 아니라 일반 블록이라 마진으로 준다. */
const blockGap = space[4];

export const MappingBlock = styled.div`
  margin-top: ${blockGap};
`;

/**
 * 필드 그리드. 360px 에서 셀렉트 옵션 텍스트가 길다(`A열 · 사용일자`) —
 * `minmax(0, 1fr)` 과 셀렉트의 `min-width: 0` 이 함께 있어야 문서가 넓어지지 않는다.
 */
export const MappingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${space[3]};
  min-width: 0;

  ${media.down('mobileWide')} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const PreviewBlock = styled.section`
  margin-top: ${blockGap};
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${space[2]};
  min-width: 0;
`;

export const PreviewTitle = styled.h3`
  margin: 0;
  font-size: ${font.size.base};
  font-weight: ${font.weight.bold};
  color: ${color.text};
`;

/** 🔴 읽기 실패 셀은 **danger 가 아니다** — 아직 에러가 아니라 "이 조합으로는 못 읽는다"는 사실 보고다. */
export const UnreadableText = styled.span`
  color: ${color.textMuted};
`;

/** 셀렉트 모양 스켈레톤(헤더를 읽는 동안). 🔴 셔머 없음 — 모양이 정적 단서다. */
export const SelectSkeleton = styled.span`
  display: block;
  height: 44px;
  border-radius: ${radius.md};
  background: ${color.surfaceMuted};
`;

export const ActionRow = styled.div`
  margin-top: ${blockGap};
  display: flex;
  flex-wrap: wrap;
  gap: ${space[2]};

  ${media.down('mobileWide')} {
    flex-direction: column;
    align-items: stretch;
  }
`;

/** 🔴 무음 비활성 금지 — 제출이 비활성이면 언제나 이 줄이 함께 있고 버튼이 이것을 가리킨다. */
export const ActionHint = styled.p`
  margin: ${space[2]} 0 0;
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
  color: ${color.textMuted};
`;

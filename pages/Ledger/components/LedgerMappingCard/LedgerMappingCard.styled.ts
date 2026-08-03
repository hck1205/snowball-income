import styled from '@emotion/styled';
import { color, font, media, radius, space } from '@/shared/styles';

/**
 * §4.2 열 지정.
 *
 * ## 2026-08-03 재설계
 * 예전에는 `Card` 안에 힌트 한 줄 · 배너 · 셀렉트 격자 · 미리보기 · 사유 · 버튼 여섯 블록이
 * 마진으로만 갈려 **평평하게 나열**돼 있었다. 사용자가 처음 보는 낯선 화면인데 "지금 몇 단계인가",
 * "어느 시트를 고른 것인가", "무엇을 확인해야 하는가"가 전부 같은 무게였다.
 *
 * 지금은 세 덩어리다.
 *  1. **머리말** — 절차 표시줄(2/3) + 고른 시트 이름. 카드 맨 위에서 맥락을 먼저 준다.
 *  2. **지정** — 셀렉트 격자. 자기 소제목을 갖는다.
 *  3. **확인** — 미리보기. 시트를 닮은 **틀 안에** 표를 넣어 "이건 네 시트를 읽은 결과"로 보이게 한다.
 */

/** 카드 안 블록 사이 간격. `CardContainer` 는 grid 가 아니라 일반 블록이라 마진으로 준다. */
const blockGap = space[5];

/** 머리말 — 절차 + 고른 시트. 카드 제목 바로 아래이므로 위 마진은 없다. */
export const MappingHead = styled.div`
  display: grid;
  gap: ${space[3]};
  min-width: 0;
  padding-bottom: ${space[4]};
  border-bottom: 1px solid ${color.border};
`;

/** 고른 시트 이름 줄. 🔴 파일명은 준PII 라 화면에만 그린다(저장·GA·에러 문구에 넣지 않는다). */
export const SheetLine = styled.p`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  margin: 0;
  min-width: 0;
  font-size: ${font.size.base};
  font-weight: ${font.weight.semibold};
  color: ${color.text};
  overflow-wrap: anywhere;

  svg {
    flex: 0 0 auto;
    color: ${color.textMuted};
  }
`;

export const MappingBlock = styled.section`
  margin-top: ${blockGap};
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${space[3]};
  min-width: 0;
`;

/**
 * 필드 그리드. 360px 에서 셀렉트 옵션 텍스트가 길다(`A열 · 사용일자`) —
 * `minmax(0, 1fr)` 과 셀렉트의 `min-width: 0` 이 함께 있어야 문서가 넓어지지 않는다.
 */
export const MappingGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${space[3]} ${space[4]};
  min-width: 0;

  ${media.down('mobileWide')} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

/**
 * 미리보기를 감싸는 틀. **시트를 닮게** 만든다 — 위에 캡션 줄, 아래에 표.
 * 사용자가 "이건 앱이 지어낸 값이 아니라 내 시트를 읽은 것"으로 읽어야 이 단계가 의미를 갖는다.
 */
export const PreviewFrame = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${space[3]};
  min-width: 0;
  padding: ${space[3]};
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surfaceSunken};
`;

export const PreviewTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  margin: 0;
  font-size: ${font.size.base};
  font-weight: ${font.weight.bold};
  color: ${color.text};

  svg {
    flex: 0 0 auto;
    color: ${color.textMuted};
  }
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
  padding-top: ${space[4]};
  border-top: 1px solid ${color.border};
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
  margin: ${space[4]} 0 0;
  padding-left: ${space[3]};
  border-left: 2px solid ${color.warning};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
  color: ${color.textSecondary};
`;

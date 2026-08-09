import styled from '@emotion/styled';
import { color, font, scrollFadeRight, space, stickyCellTable, stickyColumn, subtleScrollbar } from '@/shared/styles';

/* ── ④ 보유 표 (드로어 안) ─────────────────────────────────────────────────── */

/**
 * 드로어 머리의 요약 3칸. 표만 덩그러니 열리면 "누구의 언제 기준 자료인가"를 제목 한 줄이
 * 혼자 지고, 표를 스크롤하는 순간 그 맥락이 화면에서 사라진다.
 */
export const DrawerSummary = styled.dl`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${space[3]};
  margin: 0 0 ${space[4]};
  padding-bottom: ${space[4]};
  border-bottom: 1px solid ${color.border};
`;

export const DrawerSummaryItem = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

export const DrawerSummaryLabel = styled.dt`
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.medium};
  letter-spacing: 0.06em;
`;

export const DrawerSummaryValue = styled.dd`
  margin: 0;
  min-width: 0;
  overflow: hidden;
  color: ${color.text};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.md};
  font-weight: ${font.weight.bold};
  text-overflow: ellipsis;
  white-space: nowrap;
  ${font.numeric}
`;

export const TableScroller = styled.div`
  overflow-x: auto;
  overscroll-behavior-x: contain;
  min-width: 0;
  /* 앱 공용 스크롤바 — 부품마다 다른 막대가 나오지 않게 한다(scrollbarStyle.test.ts 가 잠근다). */
  ${subtleScrollbar}

  /* 끝 흐림은 앱 공통 처방이다 — 왼쪽은 아래 고정 열이 제 면으로 덮으므로 흐리지 않는다. */
  ${scrollFadeRight}
`;

export const Table = styled.table`
  width: 100%;
  min-width: 420px;
  /* 🔴 발행사 열을 고정하려면 이 표는 separate 여야 한다 — 이유는 stickyCellTable 주석. */
  ${stickyCellTable}
  font-size: ${font.size.sm};
`;

export const Th = styled.th`
  padding: ${space[2]};
  border-bottom: 1px solid ${color.border};
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.08em;
  text-align: left;
  white-space: nowrap;

  /*
   * 🔴 첫 열(발행사)은 가로로 밀어도 남는다. 이 표는 최소폭 420px 이라 드로어 폭이 좁으면
   *    반드시 밀리는데, 이름이 흘러나가면 옆의 비중·배당이 **누구 것인지** 사라진다.
   * ⚠ 머리와 값이 **같은 규칙**을 써야 한다 — 한쪽만 고치면 미는 동안 열이 어긋난다.
   */
  &:first-of-type {
    ${stickyColumn('0', true)}
  }
`;

export const ThNumeric = styled(Th)`
  text-align: right;
`;

export const Td = styled.td`
  padding: ${space[2]};
  border-bottom: 1px solid ${color.border};
  color: ${color.text};
  vertical-align: top;

  /* 🔴 첫 열(발행사)은 위 열 머리(Th)와 같은 규칙으로 고정된다 — 근거는 그 주석. */
  &:first-of-type {
    ${stickyColumn('0', true)}
  }
`;

export const TdNumeric = styled(Td)`
  text-align: right;
  font-family: ${font.dataNumeric};
  white-space: nowrap;
  ${font.numeric}
`;

export const IssuerName = styled.span`
  display: block;
  min-width: 0;
  font-weight: ${font.weight.semibold};
`;

/** 우리 유니버스에 있는 종목의 한글명. 매핑이 없으면 렌더하지 않는다. */
export const KoreanName = styled.span`
  display: block;
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
`;

/** 🔴 배당 정보가 없는 칸. **"배당 없음"이 아니라 "자료 없음"** 이다 — 모르는 것과 없는 것은 다르다. */
export const UnknownCell = styled.span`
  color: ${color.textMuted};
  font-family: ${font.sans};
  font-size: ${font.size.xs};
`;

/** 드로어 안의 보충 설명. 카드와 달리 폭·높이에 여유가 있어 문장을 그대로 둔다. */
export const DrawerNote = styled.p`
  margin: ${space[3]} 0 0;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};
`;

import styled from '@emotion/styled';
import {
  DATA_RADIUS,
  cardElevation,
  color,
  font,
  pageHue,
  space,
  subtleScrollbar,
  topRail
} from '@/shared/styles';
import { MEASURE, RAIL } from './metrics';

/* -------------------------------------------------------------------------- */
/* 표 — 문단 사이에 서는 **카드**                                                */
/* -------------------------------------------------------------------------- */

/**
 * 표 한 벌(제목 + 표 + 전제).
 *
 * 종전에는 테두리 1px 상자 안에 표만 있었고, 캡션·전제 줄이 그 밖에 흩어져 셋이 한 덩어리로
 * 읽히지 않았다. 이제 셋을 한 카드에 담고 상단에 페이지 hue 리본을 얹는다 — 이 레포의 다른
 * 데이터 카드(요약 카드·티커 상세 부록)와 같은 언어다.
 *
 * 🔴 `overflow: hidden` 은 **반경 바로 옆**에 있어야 한다. 리본은 직사각형이고 이 카드는 둥글어서,
 *   이 한 줄이 없으면 모서리에서 리본이 카드 밖으로 직진한다(shared/styles/geometry.test.ts 가
 *   .styled.ts 파일에 대해 이 계약을 잠근다 — 이 폴더는 그 감사 밖이므로 손으로 지킨다).
 */
export const TableCard = styled.figure`
  position: relative;
  margin: 0;
  display: grid;
  gap: ${space[3]};
  max-width: ${MEASURE};
  padding: clamp(16px, 2vw, 22px);
  border-radius: ${DATA_RADIUS};
  overflow: hidden;
  ${cardElevation('base')}

  &::before {
    ${topRail(RAIL)}
    background: ${pageHue};
  }
`;

/**
 * 표의 이름. `figcaption` 이라 표와 묶여 읽힌다.
 *
 * ⚠ `table > caption` 이 아니다 — 카드가 캡션·표·전제를 나란히 담아야 하는데, caption 은
 *   표 안쪽에 갇혀 이 격자에 참여하지 못한다(패딩을 손으로 흉내 내야 했던 것이 종전 코드다).
 */
export const TableCaption = styled.figcaption`
  color: ${color.text};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  line-height: ${font.leading.snug};
  word-break: keep-all;
`;

/** 좁은 폭에서 표만 가로로 흐른다 — 카드가 통째로 흐르면 리본과 전제 줄까지 따라 나간다. */
export const TableScroll = styled.div`
  overflow-x: auto;
  ${subtleScrollbar}
`;

export const Table = styled.table`
  width: 100%;
  min-width: 320px;
  border-collapse: collapse;
  text-align: left;
`;

/**
 * 열 머리 · 칸의 정렬 규칙 — **두 축**이 따로 논다.
 *
 * ① `$lead`(첫 열)는 그 줄의 **이름**이다. 값이 숫자여도 왼쪽에 남는다 — 오른쪽으로 밀면 이름과
 *    값이 표 한가운데서 마주 보고 왼쪽에 빈 도랑이 생긴다(2026-08-06 실측에서 정확히 그랬다).
 * ② `$numeric` 은 **서체**를 정한다. 등폭 숫자는 자릿수를 세로로 훑게 해 주므로 첫 열이라도 켠다.
 *    오른쪽 정렬은 첫 열이 아닌 수치 열에만 붙는다.
 *
 * 🔴 `$numeric` 을 열 번호로 짐작하지 않는다 — 가이드의 표는 절반이 산문이라 "첫 열 빼고 전부
 * 오른쪽"이면 설명 문장이 등폭 숫자로 렌더된다. 판정은 데이터를 보고 내린다(GuidePage.utils).
 */
const numericType = `
  font-family: ${font.dataNumeric};
  ${font.numeric}
`;

export const Th = styled.th<{ $numeric: boolean; $lead: boolean }>`
  padding: ${space[2]} ${space[3]};
  border-bottom: 1px solid ${color.borderStrong};
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.04em;
  white-space: nowrap;
  text-align: ${({ $numeric, $lead }) => ($numeric && !$lead ? 'right' : 'left')};
`;

export const Td = styled.td<{ $numeric: boolean; $lead: boolean }>`
  padding: ${space[3]};
  border-bottom: 1px solid ${color.border};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
  word-break: keep-all;

  /* 첫 열은 그 줄이 무엇에 대한 값인지를 말한다 — 본문색·굵게. 나머지는 값이라 한 단 낮춘다. */
  color: ${({ $lead }) => ($lead ? color.text : color.textSecondary)};
  font-weight: ${({ $lead }) => ($lead ? font.weight.semibold : font.weight.regular)};
  text-align: ${({ $numeric, $lead }) => ($numeric && !$lead ? 'right' : 'left')};
  white-space: ${({ $numeric }) => ($numeric ? 'nowrap' : 'normal')};
  ${({ $numeric }) => ($numeric ? numericType : '')}

  tr:last-of-type & {
    border-bottom: 0;
  }
`;

/** 표 아래 한 줄 — **계산 전제**를 밝히는 자리다. 전제 없는 숫자를 두지 않는다. */
export const TableNote = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};
  word-break: keep-all;
`;

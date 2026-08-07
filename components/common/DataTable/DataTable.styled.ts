import styled from '@emotion/styled';
import { color, container, font, media, motion, radius, space, subtleScrollbar } from '@/shared/styles';

export const TableWrap = styled.div`
  overflow-x: auto;
  container-type: inline-size;
  min-width: 0;
  width: 100%;
  /* 가로 스크롤이 카드 밖으로 새지 않도록 */
  overscroll-behavior-x: contain;
  /* 표는 넘칠 때 스크롤바가 **보여야** 한다(넘친다는 사실이 정보다) — 모양만 앱 공용으로. */
  ${subtleScrollbar}
`;

/**
 * 좁은 폭(<=820px)에서는 표를 행 단위 카드로 접는다. 기존 동작 그대로 유지하되
 * 컨테이너 쿼리와 미디어 쿼리를 함께 쓴다(컨테이너 미지원 폴백).
 */
const stackedTable = `
  display: block;
  min-width: 0;

  thead {
    display: none;
  }

  /* minmax(0, 1fr) — 기본 암시 트랙(auto)은 최소 크기가 min-content 라 긴 셀 하나가 카드 폭을
     래퍼(overflow-x: auto) 밖으로 밀어낸다. 보유 표에서 실제로 20~41px 가로 스크롤이 생겼던 원인이다. */
  tbody {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: ${space[2]};
  }

  tbody tr {
    display: block;
    border: 1px solid ${color.border};
    border-radius: ${radius.md};
    padding: ${space[1]} ${space[3]};
    background: ${color.surfaceMuted};
  }

  tbody tr:hover {
    background: ${color.surfaceMuted};
  }
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 720px;
  font-size: ${font.size.sm};
  ${font.numeric};

  caption {
    caption-side: top;
    text-align: left;
    padding: 0 0 ${space[2]};
    color: ${color.textMuted};
    font-size: ${font.size.xs};
  }

  tbody tr {
    transition: background-color ${motion.fast} ${motion.ease};
  }

  tbody tr:hover {
    background: ${color.surfaceHover};
  }

  ${container.down('tablet')} {
    ${stackedTable};
  }

  ${media.down('tablet')} {
    ${stackedTable};
  }
`;

export const TH = styled.th`
  text-align: right;

  /*
   * 🔴 **첫 열만 왼쪽이다**(2026-08-05 사용자 지적: "왜 리스트가 오른쪽으로 정렬되어 있는지").
   * 이 표들의 첫 열은 언제나 이름(종목·의원·발행사)이고 나머지는 숫자다. 전부 오른쪽으로 밀면
   * 숫자 기둥은 잘 맞는 대신 **이름이 오른쪽 끝에 매달려** 목록 전체가 오른쪽으로 쏠려 보인다.
   * 이름은 왼쪽에서 시작해야 눈이 세로로 훑을 수 있다.
   * ⚠ 좁은 폭(스택 레이아웃)에는 걸지 않는다 — 거기서는 각 셀이 "라벨 | 값" 2단이라 이미 맞다.
   */
  &:first-of-type {
    text-align: left;
  }
  border-bottom: 1px solid ${color.borderStrong};
  padding: ${space[2]} ${space[2]} ${space[2]};
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;
  letter-spacing: 0.02em;

  ${container.down('tablet')} {
    display: none;
  }

  ${media.down('tablet')} {
    display: none;
  }
`;

const stackedCell = `
  display: grid;
  /*
   * 🔴 **값 쪽도 줄어들 수 있어야 한다**(2026-08-07 사용자 신고: 국회 카드에서 의원 이름이 겹친다).
   *
   * 종전은 두 번째 트랙이 auto 였다. auto 트랙의 최소 크기는 min-content 라, 값이 길면 그 셀이
   * **절대 안 줄고** 라벨 트랙(1fr)을 0까지 밀어낸다 — 라벨과 값이 그 자리에서 겹쳐 보인다.
   * 이제 둘 다 minmax(0, …) 이라 긴 값은 자기 자리 안에서 말줄임으로 접힌다.
   *
   * ⚠ 라벨은 auto 로 바꿨다. 라벨은 "의원"·"매수" 같은 짧은 낱말이라 줄어들 이유가 없고,
   *   고정 자리를 가져야 값의 오른쪽 끝선이 카드 안에서 가지런하다.
   */
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: ${space[3]};
  text-align: right;
  padding: ${space[2]} ${space[1]};
  border-bottom: 1px solid ${color.border};

  /*
   * 🔴 값이 한 줄로 남고 넘치면 말줄임으로 접힌다. 전체 문자열은 화면이 툴팁으로 준다
   * (components/common/OverflowTooltip — 잘렸을 때만 뜨고 hover·클릭·키보드 전부 받는다).
   * ⚠ 자식이 있는 셀(칩 묶음 등)은 자기 규칙을 갖는다 — 여기서는 텍스트 노드만 접는다.
   */
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;

  &:last-of-type {
    border-bottom: 0;
  }

  &::before {
    content: attr(data-label);
    text-align: left;
    color: ${color.textMuted};
    font-size: ${font.size.xs};
    font-weight: ${font.weight.medium};
    /* 라벨은 절대 줄바꿈하지 않는다 — 두 줄이 되면 값과 세로 중심이 어긋난다. */
    white-space: nowrap;
  }
`;

export const TD = styled.td`
  text-align: right;

  /* 🔴 첫 열(이름)만 왼쪽 — 근거는 위 TH 주석. 머리와 값이 같은 규칙을 써야 열이 어긋나지 않는다. */
  &:first-of-type {
    text-align: left;
  }
  border-bottom: 1px solid ${color.border};
  padding: ${space[2]};
  color: ${color.text};
  white-space: nowrap;
  /*
   * 값 셀의 서체 역할을 여기서 못 박는다. 전역 규칙(globalStyles의 table/th/td)도 같은 서체를 걸지만,
   * 그건 "모든 표"에 대한 기본값이고 이 선언은 **이 셀이 데이터 숫자라는 사실**을 컴포넌트가 직접
   * 말하는 쪽이다.
   *
   * 사실 관계(주석과 코드가 어긋나지 않게 적어 둔다 — 이 파일은 css 템플릿 리터럴이라 주석에 백틱 금지):
   *  - 전역 규칙은 **th도 포함**한다 — 헤더가 예외인 게 아니다. Inter에 한글이 없어 한글 라벨이
   *    스택 다음(본문 서체)으로 폴백될 뿐이다.
   *  - globalStyles의 "button, input, select, textarea { font-family: inherit }"(표 규칙보다 앞, 명시도
   *    0,0,1)가 브라우저 기본 서체를 걷어내므로 **표 안의 버튼·입력도 부모 셀에서 Inter를 상속**받는다.
   *    전역 표 규칙이 button을 직접 나열하지 않아도 결과는 같다.
   */
  font-family: ${font.dataNumeric};
  ${font.numeric};

  /*
   * **합쳐진 칸**(column.mergeKey 로 rowSpan 이 붙은 날짜 열 등).
   *
   * 🔴 세로 가운데에 세운다 — 여러 줄을 덮는 칸이 위에 붙어 있으면 그 칸이 첫 줄에만 해당하는
   *   값으로 읽힌다. 가운데에 서야 "이 덩어리 전체의 값"이 된다(2026-08-05 사용자 지시).
   * ⚠ 가로 정렬은 그대로 첫 열 규칙을 따른다 — 병합됐다고 정렬까지 바꾸면 열이 어긋나 보인다.
   */
  &[data-merged='true'] {
    vertical-align: middle;
    white-space: nowrap;
  }

  /*
   * 🔴 **병합에 덮인 줄의 되풀이 칸.** 넓은 폭에서는 위 칸이 rowSpan 으로 덮고 있으므로 그리지
   * 않는다(display:none 이라 표의 칸 수 계산에서도 빠진다 — 여기서 visibility 를 쓰면 열이 하나
   * 더 있는 표가 되어 전부 어긋난다).
   * 좁은 폭에서 표가 **카드로 접히면** 이야기가 달라진다: 카드 한 장이 한 행이라 rowSpan 이
   * 시각적으로 아무 일도 하지 않고, 그대로 두면 둘째 줄부터 **날짜가 사라진 카드**가 된다.
   * 그래서 그 폭에서만 이 칸을 되살린다 — 병합은 화면을 정리하려고 넣은 것이지 정보를 지우려고
   * 넣은 것이 아니다.
   */
  &[data-merge-repeat='true'] {
    display: none;
  }

  ${container.down('tablet')} {
    ${stackedCell};

    &[data-merge-repeat='true'] {
      ${stackedCell};
    }
  }

  ${media.down('tablet')} {
    ${stackedCell};

    &[data-merge-repeat='true'] {
      ${stackedCell};
    }
  }
`;

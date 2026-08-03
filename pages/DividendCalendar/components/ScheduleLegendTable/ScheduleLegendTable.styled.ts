import styled from '@emotion/styled';
import { color, font, motion, radius, space, subtleScrollbar } from '@/shared/styles';

/**
 * 중립 카드(`DetailCard`) 안에 놓이는 밝은 패널 — 아젠다·미정과 같은 표면 규칙.
 * (구 설명의 "브랜드 틴트 래퍼"는 2026-07-26 평탄화로 사라졌다 — 부모는 중립 면이다.)
 *
 * 🔴 `min-width: 0` 이 없으면 표가 카드를 뚫고 문서 전체를 가로로 늘린다.
 * 부모 `DetailCard` 는 그리드고 이 요소가 그리드 아이템이다. 그리드 아이템의 자동 최소 크기는
 * min-content 이며, **`overflow: visible` 인 아이템은 그 값이 0 으로 클램프되지 않는다.**
 * 안쪽 `LegendScroll` 이 `overflow-x: auto` 라도 그건 아이템이 아니라 손자라 소용이 없다 —
 * 표의 최소폭이 그대로 이 아이템의 최소폭이 되어 트랙을 밀어낸다.
 * (같은 모양의 `PayoutScheduleStrip` 이 멀쩡한 이유는 거기선 **스크롤 래퍼 자신이**
 * 그리드 아이템이라 자동 최소 크기가 0 이기 때문이다 — 표가 아니라 배치가 갈랐다.)
 *
 * 실측(390px 뷰포트): 없을 때 문서 390 → 587(197px 초과)·카드 358 안에 details 554,
 * 있을 때 문서 390/390·스크롤러 290/344(내부 스크롤).
 * ⚠ 이 한 줄이 사라지면 `npm run overflowprobe` 가 잡는다 — 아코디언을 펼치고 재도록
 * 고쳤기 때문이다(2026-08-01). 실제로 지우고 돌려 16건 실패를 확인했다.
 */
export const LegendDetails = styled.details`
  min-width: 0;
  padding: ${space[3]} ${space[4]};
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surfaceRaised};

  &[open] > summary svg {
    transform: rotate(90deg);
  }
`;

export const LegendSummary = styled.summary`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  cursor: pointer;
  list-style: none;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${color.textSecondary};
  border-radius: ${radius.xs};

  &::-webkit-details-marker {
    display: none;
  }

  svg {
    transition: transform ${motion.fast} ${motion.ease};
  }

  &:hover {
    color: ${color.text};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

/**
 * 좁은 폭에서는 표 자체가 가로 스크롤한다(칸을 줄여 숫자를 겹치게 만들지 않는다).
 *
 * 오른쪽 가장자리 그림자가 **유일한 "더 있다" 신호**다. 320px 에서 이 상자는 344px 짜리 표의
 * 220px 만 보여 준다 — 종목 열을 빼면 12개월 중 6개월이다. 그런데 기존 어포던스는
 * `subtleScrollbar`(6px, 사실상 안 보이는 색) 하나뿐이고 터치 환경에서는 그마저 스크롤 중에만
 * 떴다 사라져, 사용자는 표가 3월에서 잘렸다고 읽는다.
 *
 * 순수 CSS 기법이다(JS·리사이즈 관찰자 없음 — 이 컴포넌트의 무상태 원칙을 지킨다):
 * 그림자 레이어는 `scroll` 로 상자에 고정하고, 같은 색 덮개 레이어는 `local` 로 내용과 함께
 * 움직인다. 끝까지 밀면 덮개가 그림자를 덮어 신호가 사라지고, 스크롤이 필요 없는 넓은 폭에서는
 * 처음부터 겹쳐 있어 아무것도 그려지지 않는다.
 */
export const LegendScroll = styled.div`
  margin-top: ${space[3]};
  overflow-x: auto;
  ${subtleScrollbar}

  background-image: linear-gradient(to left, ${color.surfaceRaised}, transparent),
    linear-gradient(to left, ${color.border}, transparent);
  background-position: right center, right center;
  background-repeat: no-repeat;
  background-size: 24px 100%, 16px 100%;
  background-attachment: local, scroll;

  /*
   * 포커스 링은 **전역 :focus-visible (globalStyles)** 이 그린다 — 여기서 다시 선언하지 않는다.
   * 이 상자는 tabIndex 0 을 갖고, 전역 규칙의 선택자 [tabindex]:not([tabindex='-1'])
   * (특이도 0,3,0)가 emotion 클래스 한 겹(0,2,0)을 항상 이긴다. 즉 여기 적었던 outline 은
   * 순서와 무관하게 죽은 선언이었고, 전역 쪽이 halo(box-shadow)까지 얹어 더 진한 링을 준다.
   * (Select·SocialLoginButton 등과 같은 레포 관례: 포커스 링은 컴포넌트가 재정의하지 않는다.)
   */
`;

/**
 * 12개월 격자. `border-collapse` 가 `collapse` 가 아니라 `separate` 인 이유는 종목 열이
 * sticky 이기 때문이다 — 병합된 테두리는 셀이 아니라 표에 그려져 가로 스크롤 때 고정 열을
 * 따라오지 않는다(선이 셀 밑에서 어긋난다). 간격 0 이라 보이는 모양은 collapse 와 같다.
 */
export const LegendTable = styled.table`
  /*
   * 폭은 **내용에서 뽑는다**. 고정 520px 최소폭은 형제 PayoutScheduleStrip 에서 옮겨온 임의의
   * 숫자였고, 이 표가 실제로 필요로 하는 최소폭(실측 344px)보다 176px 넓었다. 그 176px 는
   * 전부 좁은 화면에서 숨는 폭이 되어, 스크롤을 고쳐도 한 번에 읽히는 달 수를 깎았다.
   * 실측(390px 뷰포트, 상자 290px): 520 고정 → 12개월 중 **5개월** 노출·숨은 폭 230px /
   * min-content → **9개월**·숨은 폭 54px. 320px 에서는 3개월 → 7개월.
   *
   * 넓은 화면은 min-width 100% 가 맡는다 — 카드가 표보다 넓으면 그대로 채워 늘어난다(구
   * width 100% 와 같은 결과). 좁아지면 min-content 로 내려가고 그 지점부터 상자가 스크롤한다.
   * ⚠ min-content 구간에서는 월 머리글이 숫자와 "월" 두 줄로 접힌다 — 12칸이 **모두 같이** 접혀
   * 들쭉날쭉해지지 않고, 달을 3개월만 보여 주는 것보다 낫다고 판단했다.
   */
  min-width: 100%;
  width: min-content;
  border-collapse: separate;
  border-spacing: 0;
  font-size: ${font.size.xs};
  ${font.numeric}

  th,
  td {
    padding: ${space[1]} ${space[1]};
    text-align: center;
    color: ${color.textSecondary};
    font-weight: ${font.weight.regular};
  }

  thead th {
    color: ${color.textMuted};
    font-weight: ${font.weight.medium};
    border-bottom: 1px solid ${color.border};
  }

  tbody tr + tr td,
  tbody tr + tr th {
    border-top: 1px solid ${color.border};
  }
`;

/**
 * 종목 열 = 이 표의 닻. 가로 스크롤해도 **왼쪽에 붙어 남는다** — 12개월을 보려면 폭이 모자라
 * 반드시 스크롤해야 하는데(320px 에서 344px 중 220px 만 보인다) 이 열이 흘러나가면 지금 보는
 * 행이 어느 종목인지 알 방법이 사라진다.
 *
 * `&&` 는 오타가 아니라 필수다 — 표의 `th, td` 규칙(`.표 th`, 특이도 0,1,1)이 이 컴포넌트
 * 클래스(0,1,0)를 이기기 때문에, 없으면 아래 정렬·색·굵기가 전부 죽는다(2026-08-01 실측:
 * `text-align: center` · `rgb(73,80,87)` · `400` 으로 나와 빈 점 칸과 구분이 안 됐다).
 */
export const LegendTickerCell = styled.th`
  && {
    position: sticky;
    left: 0;
    z-index: 1;
    text-align: left;
    white-space: nowrap;
    color: ${color.text};
    font-weight: ${font.weight.semibold};
    padding-right: ${space[3]};
    /* 점들이 이 열 아래로 지나가므로 표면색이 불투명해야 한다(패널과 같은 색). */
    background: ${color.surfaceRaised};
    /* 경계선은 border 가 아니라 inset shadow — 셀 테두리는 좌우 스크롤에서 자리가 흔들린다. */
    box-shadow: inset -1px 0 0 ${color.border};
  }
`;

export const LegendTickerLabel = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
`;

/**
 * 티커 열 고정폭(아젠다·미정과 같은 6ch 규격) — 글자 수가 달라도 실측/추정 배지가 같은 선에서
 * 시작한다. 표를 세로로 훑을 때 배지가 좌우로 흔들리면 비교가 안 된다.
 */
export const LegendTickerText = styled.span`
  flex: 0 0 6ch;
  ${font.numeric}
`;

/**
 * 지급 달 점. 미지급도 자리를 지켜 줄마다 12칸이 유지된다(세로 스캔이 가능해진다).
 *
 * 🔴 지급/미지급을 **색 하나로 가르지 않는다** — 지급은 꽉 찬 10px 원(색은 티커 시리즈),
 * 미지급은 속이 빈 6px 링이다. 크기·채움·색 세 채널이 함께 말하므로 회색조로 인쇄해도 읽힌다.
 */
export const ScheduleDot = styled.span<{ $paying: boolean }>`
  display: inline-block;
  width: ${({ $paying }) => ($paying ? '10px' : '6px')};
  height: ${({ $paying }) => ($paying ? '10px' : '6px')};
  border-radius: 50%;
  background: ${({ $paying }) => ($paying ? color.brand : 'transparent')};
  box-shadow: ${({ $paying }) => ($paying ? 'none' : `inset 0 0 0 1px ${color.borderStrong}`)};
`;

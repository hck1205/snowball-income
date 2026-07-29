import styled from '@emotion/styled';
import { Select } from '@/components/common';
import { color, font, media, space } from '@/shared/styles';

/**
 * 카드 헤더의 컨트롤 줄 — 연도 선택 · 배당 합계 · 보기 전환.
 *
 * 🔴 **좁은 폭에서 연도 값이 잘리던 원인은 화살표가 아니라 flex 축소 배분이었다.**
 * 한 줄 붙박이였을 때, 폭이 모자라면 셋 중 **줄어들 수 있는 하나에게 부족분이 전부 몰렸다**:
 * 합계 라벨은 `white-space: nowrap`(자동 최소 크기 = 글자 전체 폭)이고 보기 토글도 내용 폭이라,
 * 유일하게 `min-width: 0` 인 연도 셀렉트가 전부를 떠안아 값이 오른쪽 화살표 밑으로 밀려 잘렸다.
 * 세 가지로 원인을 없앤다:
 *   ① 연도 셀렉트를 `flex: 0 0 auto` 로 고정(축소 대상에서 제외)
 *   ② 줄바꿈 허용 — 안 들어가면 잘리는 대신 아랫줄로 내려간다
 *   ③ 합계를 2줄(라벨 / 값)로 접어 가로 요구 폭 자체를 줄인다
 */
export const CashflowHeaderControls = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${space[2]};
  row-gap: ${space[2]};
  /* 줄이 카드 남은 폭을 전부 차지해야 마지막 자식(보기 토글)의 margin-left:auto 가 진짜 맨 우측이 된다.
     inline-flex(내용 폭)이던 시절엔 토글이 "컨트롤 묶음의 끝"에만 붙어 우측 정렬로 보이지 않았다. */
  flex: 1 1 auto;
  min-width: 0;
`;

/**
 * 연도 셀렉트 — **줄어들지 않는다**(위 ① 참고). 공용 `Select`(size='md') 위에 폭 정책만 얹는다.
 *
 * 화살표(chevron)는 좁은 폭에서도 **유지한다.** 숨기면 20px 을 벌 수 있지만 그건 증상 완화일 뿐이고,
 * 화살표는 "눌러서 고르는 것"임을 알리는 유일한 시각 어포던스다(테두리·면색만으로는 읽기 전용
 * 배지와 구분되지 않는다). 폭 예산은 줄바꿈과 2줄 합계만으로 320px 에서도 맞는다.
 */
export const YearSelect = styled(Select)`
  flex: 0 0 auto;
`;

/**
 * 배당 합계 — **넓은 폭에서는 한 줄**("배당 합계: 1,234,567원"), **좁은 폭에서만 두 줄**
 * (라벨 / 값)로 접는다(사용자 확정 2026-07-29).
 *
 * 전환은 **CSS 한 줄**(`strong` 을 block 으로)로 한다. 마크업을 폭에 따라 바꾸지 않으므로
 * 접근성 트리·텍스트 노드가 폭과 무관하게 하나이고, 값만 다음 줄로 내려간다.
 *
 * 전환점 `mobile`(560px)의 근거 — 카드 안쪽 폭은 `뷰포트 − 58px`(페이지 좌우 24 + 카드 테두리 2 +
 * 카드 패딩 32)이고, 컨트롤 줄이 한 줄에 요구하는 폭은 약 380px(셀렉트 116 + 합계 148 + 토글 100 +
 * gap 16)이다. 즉 **약 438px 아래에서 컨트롤이 여러 줄로 접히기 시작**한다. 두 줄 합계는 이 묶음의
 * 요구 폭을 148 → 90px 로 줄여 320px 에서도 셀렉트와 같은 줄에 남는다(116 + 8 + 90 = 214 ≤ 262).
 * 그 사이 구간에서 미리 접히는 편이 안전해 가장 가까운 토큰(`mobile`)을 골랐다 — 임의 px 금지.
 */
export const CashflowTotalLabel = styled.span`
  min-width: 0;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  line-height: ${font.leading.tight};
  color: ${color.textSecondary};
  white-space: nowrap;

  ${media.down('mobile')} {
    strong {
      display: block;
    }
  }
`;

/** 합계 금액만 도드라지게 — 라벨("배당 합계:")은 보조로 남긴다(사용자 요청 2026-07-25). */
export const CashflowTotalValue = styled.strong`
  font-family: ${font.dataNumeric};
  font-size: ${font.size.base};
  font-weight: ${font.weight.bold};
  color: ${color.text};
  ${font.numeric}
`;

export const ViewToggleGroup = styled.div`
  display: inline-flex;
  flex: 0 0 auto;
  /* 컨트롤 줄(flex:1)의 남는 공간을 왼쪽으로 몰아 토글을 줄의 실제 맨 우측에 고정한다. */
  margin-left: auto;
  border: 1px solid ${color.border};
  border-radius: ${space[2]};
  overflow: hidden;
`;

export const ViewToggleButton = styled.button<{ $active: boolean }>`
  border: 0;
  padding: ${space[1]} ${space[3]};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.medium};
  cursor: pointer;
  color: ${({ $active }) => ($active ? color.brandText : color.textSecondary)};
  background: ${({ $active }) => ($active ? color.brandSubtle : 'transparent')};

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: -2px;
  }
`;

import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { color, elevation, font, motion, radius, space } from '@/shared/styles';

/**
 * 색 사용 원칙(2026-07-25 사용자 피드백 — "너무 성의 없어 보인다"):
 * 달력 아래 목록도 달력과 같은 색 언어를 쓴다. 티커는 달력 칩과 **같은 시리즈 색 점**(tickerSeriesVar)으로
 * 잇고, 날짜는 브랜드 톤 배지로 세운다. 색은 전부 대비가 검증된 토큰 조합만 쓰고
 * (`shared/styles/contrast.test.ts`의 쌍), 의미는 언제나 텍스트가 함께 말한다.
 */
/**
 * 한 장의 **떠 있는 표면**으로 감싼다 — 맨바탕 나열은 목록이 아니라 부스러기로 읽힌다
 * (사용자 재지적 2026-07-25: "지급 일정 목록 박스에 배경이 없다").
 *
 * 감싸는 `DetailCard`가 `surfaceMuted` 라서 `surface` 는 차이가 미묘했다 → **`surfaceRaised` + 그림자**로
 * 확실히 띄운다. 안쪽 위계는 3단(래퍼 raised → 날짜 카드 surface → 종목 줄 muted)으로 갈라
 * 어느 단계도 같은 색끼리 붙지 않는다.
 */
export const AgendaRoot = styled.section`
  display: grid;
  gap: ${space[3]};
  min-width: 0;
  padding: ${space[4]};
  /*
   * 다크 프리셋에서는 brand-subtle(래퍼)과 surface-raised(패널)의 밝기 차가 작다(vivid/navy-gold dark).
   * 그래서 경계를 **면 색이 아니라 보더**가 책임진다 — borderStrong + 그림자면 두 모드 모두에서 선다.
   */
  border: 1px solid ${color.borderStrong};
  border-radius: ${radius.lg};
  background: ${color.surfaceRaised};
  box-shadow: ${elevation[1]};
`;

/**
 * 시각적으로만 숨긴다(사용자 결정 2026-07-26) — 바로 위 전환 버튼("지급 일정 목록")이 같은 말을
 * 이미 하고 있어 화면에서는 중복이다. 제목은 region 의 접근명(aria-labelledby)과 문서 개요로만 남는다.
 */
export const AgendaHeading = styled.h3`
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
`;

export const AgendaDayList = styled.ol`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: ${space[2]};
`;

/**
 * 날짜 한 덩어리 = 카드. 왼쪽 브랜드 엣지가 "여기부터 이 날짜"를 말한다.
 *
 * 달력 칸에서 눌러 들어오면 이 카드가 강조된다($highlighted). **면색 하나로는 부족하다** —
 * 다크 프리셋에서 brand-subtle과 surface 계열의 밝기 차가 작아 "어디로 왔는지"가 안 읽힌다
 * (accentAltSubtle은 velog 다크에서 surface-raised와 같은 값이라 쓰지 않는다).
 * 그래서 **외곽 brand 링 + 좌측 엣지 확대 + elevation** 세 겹으로 경계를 만든다.
 */
export const AgendaDayItem = styled.li<{ $highlighted: boolean }>`
  display: grid;
  gap: ${space[2]};
  padding: ${space[3]};
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surface};
  box-shadow: inset 3px 0 0 ${color.brand};
  min-width: 0;
  transition:
    border-color ${motion.fast} ${motion.ease},
    background ${motion.fast} ${motion.ease},
    box-shadow ${motion.fast} ${motion.ease};

  &:hover {
    border-color: ${color.brandBorder};
    box-shadow:
      inset 3px 0 0 ${color.brand},
      ${elevation[1]};
  }

  /* 프로그램 포커스(칸 클릭으로 옮겨온 포커스)엔 링을 그리지 않는다 — 강조가 이미 위치를 말한다. */
  &:focus {
    outline: none;
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }

  ${({ $highlighted }) =>
    $highlighted &&
    css`
      border-color: ${color.brand};
      background: ${color.brandSubtle};
      box-shadow:
        inset 4px 0 0 ${color.brand},
        0 0 0 2px ${color.brand},
        ${elevation[2]};
    `}
`;

export const AgendaDayLabel = styled.h4`
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${space[2]};
  flex-wrap: wrap;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
`;

/** 날짜 배지 — 브랜드 서피스 위 브랜드 텍스트(대비 검증 쌍). */
/* 날짜 배지 — 흰 카드(surface) 위 브랜드 틴트라 날짜 줄이 카드 안에서 가장 먼저 읽힌다. */
export const AgendaDateBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  padding: 2px ${space[2]};
  border: 1px solid ${color.brandBorder};
  border-radius: ${radius.pill};
  background: ${color.brandSubtle};
  color: ${color.brandText};
  ${font.numeric}
`;

export const AgendaItemList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: ${space[1]};
`;

/** 모든 줄이 같은 높이·같은 안쪽 여백 — 배지와 이름이 행마다 같은 세로선에서 시작한다. */
export const AgendaItem = styled.li`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  min-height: 32px;
  padding: ${space[1]} ${space[2]};
  border-radius: ${radius.sm};
  background: ${color.surfaceMuted};
  font-size: ${font.size.xs};
  color: ${color.textSecondary};
  transition: background ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.surfaceHover};
  }
`;

/** 티커 색 점 — 달력 칩(ChipDot)과 같은 시리즈 색이라 표↔목록을 눈으로 잇는다(장식, aria-hidden). */
export const AgendaDot = styled.span`
  display: inline-block;
  flex: 0 0 auto;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  /* 링은 점이 놓인 줄의 배경색과 같아야 점이 또렷해진다(줄 배경 = surfaceMuted). */
  box-shadow: 0 0 0 2px ${color.surfaceMuted};
`;

/**
 * 티커 열은 **고정폭**이다(유니버스 최장 5자 기준 + tabular) — 글자 수에 따라 배지가 좌우로
 * 흔들리면 목록을 세로로 훑을 수 없다.
 */
/** strong 인 이유: 항목의 핵심어(티커)라는 사실이고, 실측 배지 폐기 후 테스트가 티커를
    태그로 집는 유일한 계약이기도 하다(텍스트 이어붙기로는 한글명과 분리할 수 없다). */
export const AgendaTicker = styled.strong`
  flex: 0 0 6ch;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  color: ${color.text};
  ${font.numeric}
`;

export const AgendaName = styled.span`
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
`;

/** 비어 있음도 하나의 상태다 — 점선 패널로 "자리는 있는데 내용이 없다"를 형태로 말한다. */
export const AgendaEmpty = styled.p`
  margin: 0;
  padding: ${space[4]};
  border: 1px dashed ${color.border};
  border-radius: ${radius.md};
  background: ${color.surfaceMuted};
  font-size: ${font.size.xs};
  color: ${color.textSecondary};
  line-height: ${font.leading.snug};
`;

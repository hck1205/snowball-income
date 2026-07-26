import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { color, font, motion, radius, space } from '@/shared/styles';

/**
 * 색 사용 원칙(2026-07-25 사용자 피드백 — "너무 성의 없어 보인다"):
 * 달력 아래 목록도 달력과 같은 색 언어를 쓴다. 티커는 달력 칩과 **같은 시리즈 색 점**(tickerSeriesVar)으로
 * 잇고, 날짜는 브랜드 톤 배지로 세운다. 색은 전부 대비가 검증된 토큰 조합만 쓰고
 * (`shared/styles/contrast.test.ts`의 쌍), 의미는 언제나 텍스트가 함께 말한다.
 */
/**
 * 자체 표면이 **없다**(사용자 결정 2026-07-26 — 상세 영역 평탄화). 박스는 감싸는 `DetailCard`
 * 하나뿐이고, 라벨도 그 카드의 제목(DetailTitle) 한 곳이다 — 여기서는 region 접근명(aria-label)만 진다.
 * 위계는 면이 아니라 날짜의 브랜드 엣지와 간격이 만든다.
 */
export const AgendaRoot = styled.section`
  display: grid;
  gap: ${space[3]};
  min-width: 0;
`;

export const AgendaDayList = styled.ol`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: ${space[2]};
`;

/**
 * 날짜 한 덩어리 — **카드가 아니라 엣지 그룹**이다(평탄화 2026-07-26). 왼쪽 브랜드 엣지가
 * "여기부터 이 날짜"를 말하고, 면·보더·그림자는 두르지 않는다.
 *
 * 달력 칸에서 눌러 들어오면 강조된다($highlighted). **면색 하나로는 부족하다** —
 * 다크 프리셋에서 brand-subtle과 surface 계열의 밝기 차가 작아 "어디로 왔는지"가 안 읽힌다.
 * 그래서 **틴트 + 외곽 brand 링 + 좌측 엣지 확대** 겹으로 경계를 만든다(pitfalls 실측 유지).
 */
export const AgendaDayItem = styled.li<{ $highlighted: boolean }>`
  display: grid;
  gap: ${space[2]};
  padding: ${space[2]} ${space[2]} ${space[2]} ${space[3]};
  border-radius: ${radius.sm};
  box-shadow: inset 3px 0 0 ${color.brand};
  min-width: 0;
  transition:
    background ${motion.fast} ${motion.ease},
    box-shadow ${motion.fast} ${motion.ease};

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
      background: ${color.brandSubtle};
      box-shadow:
        inset 4px 0 0 ${color.brand},
        0 0 0 2px ${color.brand};
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

/** 줄은 면을 갖지 않는다(평탄화) — hover 틴트만 잠깐 얹는다. 세로선 정렬은 고정폭 티커 열이 만든다. */
export const AgendaItem = styled.li`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  min-height: 32px;
  padding: ${space[1]} ${space[2]};
  border-radius: ${radius.sm};
  font-size: ${font.size.xs};
  color: ${color.textSecondary};
  transition: background ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.surfaceHover};
  }
`;

/** 티커 색 점 — 티커별 시리즈 색으로 목록 행을 구분한다(장식, aria-hidden). */
export const AgendaDot = styled.span`
  display: inline-block;
  flex: 0 0 auto;
  width: 8px;
  height: 8px;
  border-radius: 50%;
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

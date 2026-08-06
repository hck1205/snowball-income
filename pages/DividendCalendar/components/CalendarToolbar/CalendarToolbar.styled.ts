import styled from '@emotion/styled';
import { color, font, iconOpticalAlign, motion, pageHue, pageHueMix, radius, space } from '@/shared/styles';

/**
 * 월 이동 묶음.
 *
 * 🔴 **2026-08-03 2차 리워크로 정렬이 바뀌었다.** 구 처방은 "달력 폭의 정중앙"이었다
 * (2026-07-25) — 툴바가 달력 카드의 전폭을 혼자 쓰던 시절의 값이다. 지금 이 묶음은 데크
 * 조작 줄의 **왼쪽 항목**이고 같은 줄 오른쪽 끝에 종목 선택 버튼이 선다. 그 안에서 다시
 * 가운데 정렬을 하면 묶음이 제 폭 안에서 떠 두 조작의 축이 어긋난다.
 *
 * 그래서 `justify-content` 는 시작 정렬이고, "이번 달" 버튼도 **흐름 안**(절대 배치 해제)이다 —
 * 절대 배치는 부모가 전폭일 때만 뜻이 있었다.
 */
export const ToolbarRoot = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: ${space[2]};
  flex-wrap: wrap;
  min-width: 0;
`;

/**
 * 월 제목의 크기. 상수로 뽑은 이유는 아래 `NavButton` 의 광학 보정이 **이 값을 기준으로** 계산되기
 * 때문이다 — 두 곳에 따로 적으면 한쪽만 바뀌었을 때 정렬이 조용히 틀어진다.
 */
const MONTH_TITLE_FONT_SIZE = `clamp(${font.size.xl}, 3vw, ${font.size['2xl']})`;

/** `min-width`+가운데 정렬로 폭을 고정한다 — 월을 넘길 때마다 제목 폭이 흔들리면 버튼이 좌우로 뛴다. */
export const MonthTitle = styled.h2`
  margin: 0;
  min-width: 9ch;
  text-align: center;
  font-size: ${MONTH_TITLE_FONT_SIZE};
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.02em;
  color: ${color.text};
  ${font.numeric}
`;

/** 원형 버튼 + 브랜드 hover — 달력의 주 조작이라 회색 사각형으로 두지 않는다. */
export const NavButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;

  /*
   * 제목(h2 = 헤딩 서체)의 **잉크 중심**에 맞춘다. 한글은 디센더가 거의 없는데 폰트가 디센더
   * 공간을 크게 잡아 라인박스 중심이 잉크 중심보다 아래에 있고, 그래서 'align-items: center'
   * 만으로는 버튼이 낮게 앉는다(실측 +2.56px@1280 / +2.41px@390).
   */
  ${iconOpticalAlign('display', MONTH_TITLE_FONT_SIZE)}
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  background: ${color.surface};
  color: ${color.textSecondary};
  cursor: pointer;
  transition:
    background ${motion.fast} ${motion.ease},
    border-color ${motion.fast} ${motion.ease},
    color ${motion.fast} ${motion.ease};

  /* 얼굴색을 따라간다 — 같은 부품이 라우트마다 다른 색으로 반응해 "여기가 어디인지"를 거든다.
     파생 면이지만 위에 얹히는 것은 아이콘(비텍스트)뿐이라 대비 검증 밖으로 나가지 않는다. */
  &:hover {
    background: ${pageHueMix(14)};
    border-color: ${pageHueMix(45, 'transparent')};
    color: ${pageHue};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

export const TodayButton = styled.button`
  /* 흐름 안의 마지막 항목이다(구 절대 배치는 툴바가 전폭이던 시절의 값 — 위 ToolbarRoot 주석 참고).
     아이콘 전용이라 정사각으로 두어 옆의 원형 이동 버튼과 크기 축이 맞는다. */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: ${space[1]};
  width: 40px;
  height: 40px;
  padding: 0;
  border: 1px solid ${color.brandBorder};
  border-radius: ${radius.pill};
  background: ${color.brandSubtle};
  color: ${color.brandText};
  font-family: inherit;
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  cursor: pointer;
  transition:
    background ${motion.fast} ${motion.ease},
    border-color ${motion.fast} ${motion.ease},
    color ${motion.fast} ${motion.ease};

  &:hover:not(:disabled) {
    background: ${color.brandSubtleHover};
  }

  /* 이미 이번 달이면 누를 이유가 없다 — 색을 빼서 "지금은 대상이 아님"을 말한다.
     면은 침강면이다: 이 버튼은 흰 데크 위에 앉으므로 muted(1.03:1)로는 원형 자체가 사라져
     "비활성"이 아니라 "없음"으로 읽힌다. 비활성도 보이는 상태여야 한다. */
  &:disabled {
    border-color: ${color.border};
    background: ${color.surfaceSunken};
    color: ${color.textMuted};
    cursor: default;
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

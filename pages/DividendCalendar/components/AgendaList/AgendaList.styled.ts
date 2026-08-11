import { css } from '@emotion/react';
import styled from '@emotion/styled';
import { color, font, media, motion, radius, space } from '@/shared/styles';

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
  gap: ${space[3]};
`;

/**
 * 날짜 한 덩어리.
 *
 * 🔴 **2026-08-02 사용자 지시로 리워크**했다 — 2026-07-26 의 "평탄화"(면·보더 없이 좌측 엣지만)를
 * 이 블록에 한해 되돌린다. 평탄한 엣지 그룹은 날짜가 여럿일 때 **어디서 끊기는지**가 간격으로만
 * 전달돼, 달력의 또렷한 칸들 바로 아래에서 목록이 미완성처럼 읽혔다.
 *
 * 면은 **중립 토큰만** 쓴다 — 감싸는 카드가 surface 라 한 단계 가라앉은 면이 "카드 안의 카드"가
 * 아니라 **묶음 판**으로 읽히고, 중립이라 tintscan 의 틴트 면 예산에도 잡히지 않는다
 * (tools/dev/tintscan.mjs 의 NEUTRAL_VARS). 색은 날짜 배지와 종목 색 막대가 진다.
 *
 * 🔴 그 "한 단계"는 2026-08-03 까지 **거짓이었다.** 판이 `surfaceMuted`, 그 위 종목 줄이 `surface`
 * 였는데 흰 캔버스 전환 이후 둘의 대비는 **1.034:1** 이다 — 판도 줄도 존재하지 않았고, 아래
 * `AgendaItem` 이 말하는 "판↔줄의 위계가 명도로 읽힌다"는 문장만 남아 있었다. 실측 후 판을 `surfaceSunken`
 * (1.112:1) 로 내려 그 문장을 사실로 만들었다. 🔴 muted 로 되돌리지 마라 — 그 토큰은 흰 면 위에서
 * 속삭임이고 더 어둡게 내릴 수도 없다(`shared/styles/surfaces.ts` 머리말).
 *
 * 달력 칸에서 눌러 들어오면 강조된다($highlighted). **면색 하나로는 부족하다** —
 * 다크 프리셋에서 brand-subtle과 surface 계열의 밝기 차가 작아 "어디로 왔는지"가 안 읽힌다.
 * 그래서 **틴트 + 외곽 brand 링 + 좌측 엣지 확대** 겹으로 경계를 만든다(pitfalls 실측 유지).
 */
export const AgendaDayItem = styled.li<{ $highlighted: boolean }>`
  display: grid;
  gap: ${space[2]};
  /*
   * 🔴 2026-08-03 2차 리워크 — **타임라인 2열**.
   *
   * 이 목록은 이제 화면의 주역 열(680px 남짓)에 산다. 날짜 배지를 종목 줄 **위에** 쌓던 구 배치는
   * 그 폭에서 오른쪽 절반이 통째로 비고, 날짜가 여럿일 때 눈이 매번 왼쪽 끝으로 되돌아와야 했다.
   * 날짜를 고정폭 왼쪽 열로 세우면 세로로 날짜 축이 서고, 오른쪽이 그 날의 종목들을 받는다.
   *
   * 1열로 접는 폭에서는 원래대로 위아래로 쌓인다(고정 열을 만들 폭이 없다).
   */
  padding: ${space[3]};

  ${media.up('tabletSm')} {
    grid-template-columns: minmax(0, 148px) minmax(0, 1fr);
    align-items: start;
    gap: ${space[3]};
  }
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surfaceSunken};
  /* 좌측 브랜드 엣지는 유지한다 — 보더와 같은 자리에 겹쳐 "여기부터 이 날짜"를 계속 말한다. */
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

/**
 * 날짜 배지 — 브랜드 서피스 위 브랜드 텍스트(대비 검증 쌍 `contrast.test.ts`).
 *
 * 2026-08-02 리워크: 알약을 한 단계 키웠다(2px/xs → 세로 6px·sm). 날짜 판이 면을 갖게 되면서
 * 예전 크기로는 배지가 판 안에서 부유물처럼 떠 보였다 — 이 줄이 판의 **머리**라는 것을 크기가 말한다.
 * ⚠ 폭이 180px 미만이라 tintscan 의 면 하한에 걸리지 않는다(그래서 브랜드 틴트를 써도 예산 밖이다).
 * ⚠ 안의 날짜 문자열은 **한 텍스트 노드**여야 한다 — 쪼개면 "7월 4일 (토)" 를 통째로 찾는 단정이 깨진다.
 */
export const AgendaDateBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  padding: ${space[1]} ${space[3]};
  border: 1px solid ${color.brandBorder};
  border-radius: ${radius.pill};
  background: ${color.brandSubtle};
  color: ${color.brandText};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.01em;
  ${font.numeric}
`;

export const AgendaItemList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: ${space[1]};
`;

/**
 * 종목 한 줄 — 2026-08-02 리워크로 **자기 면을 갖는다**(surface).
 *
 * 날짜 판이 한 단계 가라앉은 면(surfaceSunken)이 되면서, 그 위의 줄은 떠오른 면(surface)이 되어
 * 판↔줄의 위계가 명도로 읽힌다(실측 1.112:1). 둘 다 **중립 토큰**이라 틴트 면 예산과 무관하다.
 * 세로선 정렬은 여전히 고정폭 티커 열이 만든다.
 */
export const AgendaItem = styled.li`
  display: flex;
  align-items: center;
  gap: ${space[2]};
  /*
   * 🔴 이 줄이 없으면 종목명 ellipsis 가 **작동하지 않는다.** flex/grid 아이템의 기본
   * min-width 는 auto — 즉 "내용보다 작아지지 않는다" 라서, 안쪽 이름 칸에 아무리
   * text-overflow: ellipsis 를 걸어도 이 행 자체가 부풀어 열을 밀어낸다.
   * (사용자 신고 2026-08-03: "DES 위즈덤트리 미국 소형주 배당 이 넘쳐서 나온다")
   * ⚠ 지우지 마라 — 지우면 증상이 이름 칸이 아니라 **바깥 열**에서 나타나 원인을 찾기 어렵다.
   */
  min-width: 0;
  min-height: 36px;
  padding: ${space[1]} ${space[2]};
  border-radius: ${radius.sm};
  background: ${color.surface};
  font-size: ${font.size.xs};
  color: ${color.textSecondary};
  transition: background ${motion.fast} ${motion.ease};

  &:hover {
    background: ${color.surfaceHover};
  }
`;

/**
 * 티커 색 표식 — 티커별 시리즈 색으로 목록 행을 구분한다(장식, aria-hidden).
 *
 * 2026-08-02 리워크: 8px 점 → **3×18px 세로 막대**. 점은 줄이 면을 갖게 되자 부스러기처럼 보였고,
 * 막대는 줄의 왼쪽 끝을 따라 서서 **여러 줄이 쌓였을 때 색 띠가 세로로 정렬**된다 — 같은 종목이
 * 여러 날에 걸쳐 나올 때 눈으로 잇기 쉬워진다.
 * ⚠ 색은 인라인 style 로 들어온다(시리즈 CSS 변수) — 여기서 색을 정하지 마라.
 * ⚠ 폭 3px 이라 tintscan 의 면 하한(180px) 밖이다.
 */
export const AgendaDot = styled.span`
  display: inline-block;
  flex: 0 0 auto;
  width: 3px;
  height: 18px;
  border-radius: ${radius.pill};
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

/**
 * 이름의 **자리**. 이름 자체가 아니라 자리를 flex 아이템으로 세운다.
 *
 * 🔴 왜 한 겹을 더 두는가 — 이름이 실제로 잘렸을 때만 `OverflowTooltip` 이 툴팁 앵커
 * (inline-flex span)로 이름을 감싼다. 그 앵커는 `flex-grow: 0` 이라 그냥 두면
 * **감쌌을 때와 아닐 때 이름 칸의 폭이 달라진다.** 그러면 (a) 오른쪽 근거 배지가 좌우로 튀고
 * (b) 잘림 판정이 자기 결과에 영향을 받아 감쌈↔풂이 반복될 수 있다.
 * 슬롯이 두 경우의 상자를 **같게** 만들어 그 고리를 끊는다 — 지우지 마라.
 */
export const AgendaNameSlot = styled.span`
  display: flex;
  flex: 1 1 auto;
  min-width: 0;

  /* 자식은 감싼 경우(툴팁 앵커)든 아닌 경우(이름)든 슬롯을 그대로 채운다. */
  > * {
    flex: 1 1 auto;
    min-width: 0;
  }
`;

/**
 * 그 달의 예상 금액(내 배당 탭에서만). **숫자라 등폭**으로 세운다 — 여러 줄이 쌓였을 때 자릿수가
 * 세로로 맞아야 훑어 읽힌다.
 * ⚠ 추정값이라 강조색을 쓰지 않는다(본문색). 색으로 강조하면 확정된 입금액처럼 읽힌다.
 */
export const AgendaAmount = styled.span`
  flex: 0 0 auto;
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  color: ${color.text};
  ${font.numeric}
`;

export const AgendaName = styled.span`
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;

  /*
   * tabindex 는 **잘렸을 때만** 붙는다(OverflowTooltip). 즉 이 선택자는 "감춰진 글자가 있다"와
   * 정확히 같은 뜻이라, 상태 플래그를 따로 흘려보내지 않고 속성 하나로 커서 힌트를 준다.
   * 포커스 링은 전역 globalStyles 의 [tabindex]:not([tabindex='-1']) 규칙이 이미 그린다.
   */
  &[tabindex] {
    cursor: help;
  }
`;

/**
 * 비어 있음도 하나의 상태다 — 점선 패널로 "자리는 있는데 내용이 없다"를 형태로 말한다.
 * 면은 위 날짜 판과 같은 침강면이다(같은 자리에 번갈아 서므로 무게가 갈리면 안 된다).
 */
export const AgendaEmpty = styled.p`
  margin: 0;
  padding: ${space[4]};
  border: 1px dashed ${color.border};
  border-radius: ${radius.md};
  background: ${color.surfaceSunken};
  font-size: ${font.size.xs};
  color: ${color.textSecondary};
  line-height: ${font.leading.snug};
`;

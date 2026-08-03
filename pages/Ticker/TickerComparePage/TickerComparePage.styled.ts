import styled from '@emotion/styled';
import {
  DATA_RADIUS,
  PICK,
  PICK_RADIUS,
  cardElevation,
  color,
  font,
  hitAreaWithin,
  media,
  motion,
  pageHueMix,
  pressTransition,
  pressableSubtle,
  radius,
  sectionTitleFontSize,
  space,
  subtleScrollbar,
  surface
} from '@/shared/styles';

/**
 * `/ticker/compare` 의 스타일 — **2026-08-03 전면 개편**.
 *
 * ## 종전 화면의 진단 (실측 스크린샷 기준)
 * 흰 카드 셋이 세로로 같은 무게로 쌓여 있었다. 그래서 이런 일이 벌어졌다:
 *  1. **비교 대상이 화면에서 정체성을 못 가졌다.** SCHD 라는 글자가 칩 · 열 머리 · 지급월 칸
 *     **세 곳**에 나오는데 셋이 아무 시각적 연결이 없어, 눈이 매번 글자를 다시 읽어야 했다.
 *  2. **답이 맨 아래 회색 한 줄이었다.** 이 화면이 답하는 질문은 "이 조합이면 매달 들어오는가"인데
 *     그 결론이 세 번째 카드 바닥의 13px 문장이었다. 화면의 초점이 없었다.
 *  3. **표에 읽는 방향이 없었다.** 일곱 행이 같은 굵기·같은 색으로 이어져 출처(실측/가정)가
 *     배지를 하나씩 읽어야만 갈렸다.
 *  4. **빈 상태가 똑같은 사각형 열 개였다.** 무엇을 누를지 정할 근거가 라벨 한 줄뿐이었다.
 *
 * ## 이 파일이 바꾼 것 (구조 — 색이 아니라)
 *  - 선택은 칩 줄이 아니라 **정원 4자리의 덱**이다. 빈 자리가 도형으로 보인다.
 *  - **결론 블록**이 표 **위**로 올라오고, 이 화면의 유일한 hero 숫자(`font.heroNumeric`)를 갖는다.
 *  - 표는 출처별 **행 묶음** 셋으로 갈리고, 열 머리가 종목의 얼굴(귀 + 큰 티커)이 된다.
 *  - 종목 색(`assignSeries`)이 **덱 귀 → 열 머리 귀 → 지급월 마크** 세 곳을 관통한다.
 *
 * ## 규율
 * 🔴 하드코딩 hex 금지 — 토큰만. 새 색 토큰을 만들지 않는다.
 * 🔴 색이 유일한 채널이 되지 않는다 — 지급 있음/없음, 최고/최저, 자료 없음은 전부 **글자·모양**이 진다.
 * 🔴 손익색(dataPositive/Negative)을 쓰지 않는다 — 배당률이 높은 것은 이익이 아니라 사실이다.
 * 🔴 채도 **면**은 늘리지 않는다. 이 파일이 쓰는 채도는 전부 높이 6px 이하 · 폭 180px 미만의
 *    선·귀·마크(L1)다 — `tintscan` 의 면 판정(폭 180 AND 높이 8)에 걸리지 않는다.
 * ⚠ styled 템플릿 **안** 주석에 백틱을 쓰지 마라 — 템플릿이 그 자리에서 끊겨 앱이 부팅하지 않는다.
 */

/**
 * 이 화면이 새로 세우는 두 면의 패딩. `surface()` 가 이 값으로 안쪽 라운드까지 파생하므로
 * 손으로 두 번 적지 않는다(적으면 동심이 반드시 어긋난다 — `shared/styles/surfaces.ts` 머리말).
 */
const VERDICT_PAD = 'clamp(18px, 2.2vw, 26px)';
const EMPTY_PAD = 'clamp(22px, 3vw, 34px)';

/**
 * 항목(고정) 열의 폭.
 *
 * 🔴 **고정하지 않으면 좁은 폭에서 이 열이 화면의 절반을 먹는다.** 항목 이름 밑에 설명 한 줄이
 * 딸려 있어 브라우저가 그 문장을 안 접으려고 열을 계속 넓히기 때문이다(390px 실측: 약 180px).
 * 폭을 정해 두면 설명이 그 안에서 접히고, 남는 폭 전부가 **비교 대상**에게 간다.
 */
const METRIC_COLUMN_WIDTH = 'clamp(150px, 30vw, 230px)';

/** 화면 세로 리듬. 블록 사이를 종전(16~28)보다 벌려 네 덩어리가 각각 하나의 생각으로 읽히게 한다. */
export const Stack = styled.div`
  display: grid;
  gap: clamp(20px, 3.2vw, 34px);
  min-width: 0;
`;

/* ── 선택 덱 ───────────────────────────────────────────────────────────────── */

/**
 * 고르는 면(brand)이다 — 여기서 무언가를 고르면 화면이 바뀐다. 그래서 반경도 `PICK_RADIUS`(30~34)로
 * 아래 표 카드(`DATA_RADIUS` 24~28)와 갈린다.
 */
export const Deck = styled.section`
  ${cardElevation('base')}
  ${surface(PICK_RADIUS, PICK.pad)}
  display: grid;
  gap: ${space[4]};
  min-width: 0;
`;

export const DeckHead = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${space[3]};
  min-width: 0;
`;

export const DeckTitle = styled.h2`
  margin: 0;
  color: ${color.text};
  font-size: ${sectionTitleFontSize};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.01em;
`;

/**
 * 남은 자리를 **숫자로** 말한다. 아래 빈 슬롯이 같은 사실을 도형으로 말하므로 채널이 둘이다
 * (문장 하나에만 의존하던 종전보다 먼저 읽힌다).
 */
export const DeckCount = styled.p`
  margin: 0;
  color: ${color.textSecondary};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;
  ${font.numeric}
`;

/**
 * 정원 4자리. 좁은 폭에서는 두 칸씩, 넓어지면 네 칸이 한 줄에 선다 —
 * 칩이 개수만큼 흐르던 종전과 달리 **총 자리 수가 항상 보인다**.
 */
export const SlotGrid = styled.ul`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${space[2]};
  margin: 0;
  padding: 0;
  list-style: none;
  min-width: 0;

  ${media.up('tablet')} {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
`;

/**
 * 고른 종목 한 자리.
 *
 * 왼쪽 **3px 귀**가 그 종목의 시리즈 색이다(`assignSeries`). 폭 3px 이라 면이 아니라 선이고,
 * 같은 색이 아래 표 열 머리와 지급월 마크에 그대로 다시 나온다 — 색이 길찾기 단서가 되는 지점.
 * 🔴 그래도 색이 유일한 채널은 아니다: 티커 글자가 항상 함께 있다.
 */
export const Slot = styled.li<{ $series: string }>`
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: ${space[2]};
  overflow: hidden;
  padding: ${space[2]} ${space[2]} ${space[2]} ${space[3]};
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surface};
  min-width: 0;

  &::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 3px;
    background: ${({ $series }) => $series};
  }
`;

export const SlotBody = styled.div`
  display: grid;
  gap: 1px;
  min-width: 0;
`;

/** 티커는 이 자리의 이름이다 — 종전 칩(13px)보다 한 단 키워 먼저 읽히게 한다. */
export const SlotTicker = styled.span`
  color: ${color.text};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.md};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.01em;
  ${font.numeric}
`;

export const SlotName = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  line-height: ${font.leading.tight};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
`;

/**
 * 자리 비우기. 종전 `Chip` 의 × 와 **같은 일**을 하고 접근名도 같다 — 진입점이 사라지지 않는다.
 * 히트 영역은 형제 간격(8px)을 넘지 않게 넓힌다(겹치면 옆 자리가 지워진다).
 */
export const SlotRemove = styled.button`
  ${pressableSubtle}
  ${hitAreaWithin(space[2])}
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 1px solid transparent;
  border-radius: ${radius.pill};
  background: transparent;
  color: ${color.textMuted};
  cursor: pointer;
  /* 🔴 자기 transition 목록에 pressTransition 을 끼운다 — 안 끼우면 이 선언이 누름 믹스인의
     transform 전환을 통째로 덮어 버린다(test/shared/pressTransition.test.ts 가 잠근다). */
  transition:
    color ${motion.fast} ${motion.ease},
    background ${motion.fast} ${motion.ease},
    border-color ${motion.fast} ${motion.ease},
    ${pressTransition};

  &:hover {
    border-color: ${color.border};
    background: ${color.surfaceHover};
    color: ${color.text};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

/**
 * 아직 안 채운 자리. **장식이 아니라 정보다** — 몇 개를 더 넣을 수 있는지 도형으로 말한다.
 * 스크린리더에는 위 `DeckCount` 숫자가 이미 같은 사실을 말하므로 여기서는 감춘다.
 */
export const SlotGhost = styled.li`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${space[2]} ${space[3]};
  border: 1px dashed ${color.border};
  border-radius: ${radius.md};
  background: ${color.surfaceSunken};
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  min-height: 46px;
  min-width: 0;
`;

/**
 * 셀렉트 줄.
 *
 * 🔴 셀렉트를 슬롯·설명과 **한 줄에 두지 않는다**(2026-08-02 사용자 지시 — 개편에서도 유지).
 * 한 줄이면 셋이 폭을 다퉈 셀렉트가 긴 종목명을 못 담고, 고른 개수가 늘수록 셀렉트가 밀린다.
 */
export const AddRow = styled.div`
  display: grid;
  gap: ${space[2]};
  min-width: 0;
`;

export const PickerHint = styled.p`
  margin: 0;
  min-width: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
`;

/* ── 결론 블록 (지급월 커버리지) ───────────────────────────────────────────── */

/**
 * **이 화면의 초점.** 종전에는 같은 내용이 표 아래 세 번째 카드였다.
 *
 * 읽는 면(data)이라 채도 **면**을 깔지 않는다. 위계는 ①가라앉은 중립 면 ②상단 6px hue 리본
 * ③화면에서 가장 큰 숫자, 셋이 만든다. 리본은 높이 6px 이라 선이지 면이 아니다.
 */
export const Verdict = styled.section`
  position: relative;
  overflow: hidden;
  ${surface(DATA_RADIUS, VERDICT_PAD)}
  display: grid;
  gap: ${space[4]};
  border: 1px solid ${color.border};
  background: ${color.surfaceSunken};
  min-width: 0;

  &::before {
    content: '';
    position: absolute;
    inset: 0 0 auto 0;
    height: 6px;
    background: ${pageHueMix(70, 'transparent')};
  }
`;

export const VerdictHead = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: ${space[2]} ${space[4]};
  min-width: 0;
`;

export const VerdictLede = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

/**
 * 이 블록이 무엇인지. 작고 넓은 자간 — 아래 큰 숫자와 대비를 벌린다.
 *
 * 🔴 **작아 보여도 제목이라 `h2` 다.** 개편 전 이 내용은 `Card title` 을 단 세 번째 카드였고,
 * 그 제목이 문서 개요(heading outline)에 h2 로 들어가 있었다. 결론 블록으로 승격하면서 이것을
 * `p` 로 두면 **화면에서는 커지고 낭독 개요에서는 사라지는** 뒤집힌 결과가 난다 —
 * 제목 단위로 훑는 사용자에게는 커버리지 구획이 통째로 없어진 것과 같다.
 * 크기·굵기·자간은 아래에서 전부 다시 정하므로 태그를 바꿔도 보이는 모습은 그대로다.
 */
export const VerdictEyebrow = styled.h2`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  letter-spacing: 0.12em;
`;

/**
 * 화면에서 가장 큰 숫자. `font.heroNumeric` 은 **화면당 한 곳**이라는 계약이 있는 서체이고,
 * 이 화면에서 그 한 곳은 여기다(표의 숫자는 전부 `dataNumeric`).
 */
export const VerdictValue = styled.p`
  margin: 0;
  display: flex;
  align-items: baseline;
  gap: ${space[1]};
  color: ${color.text};
  font-family: ${font.heroNumeric};
  font-size: clamp(30px, 4.6vw, 44px);
  font-weight: ${font.weight.extrabold};
  line-height: 1.05;
  letter-spacing: -0.02em;
  ${font.numeric}
`;

export const VerdictUnit = styled.span`
  color: ${color.textSecondary};
  font-family: ${font.sans};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.semibold};
`;

/** 숫자가 못 하는 말(어느 달이 비었는가)을 문장이 진다. 숫자 옆에 붙어 한 호흡으로 읽힌다. */
export const VerdictSentence = styled.p`
  margin: 0;
  flex: 1 1 22ch;
  color: ${color.text};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.medium};
  line-height: ${font.leading.snug};
  min-width: 0;
`;

/**
 * 12칸 트랙. 좁은 폭에서는 6칸씩 두 줄 —
 * 가로 스크롤로 두면 "빈 달이 어디인가"를 한눈에 볼 수 없어 이 트랙의 목적이 사라진다.
 */
export const MonthTrack = styled.ul`
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: ${space[1]};
  margin: 0;
  padding: 0;
  list-style: none;
  min-width: 0;

  ${media.up('mobileWide')} {
    grid-template-columns: repeat(12, minmax(0, 1fr));
  }
`;

/**
 * 한 달.
 *
 * 🔴 **면색으로 가르지 않는다.** 종전에는 지급 있는 달이 `accentAltSubtle` 면이었는데,
 * 읽는 면에 채도면을 까는 것이라 숫자의 신뢰감과 충돌했고 회색조에서는 거의 사라졌다.
 * 지금은 ①실선 대 점선 테두리 ②상단 마크의 유무 ③글자 굵기, 셋이 함께 말한다.
 */
export const MonthCol = styled.li<{ $paid: boolean }>`
  display: grid;
  gap: ${space[1]};
  justify-items: center;
  align-content: start;
  padding: ${space[2]} 2px;
  border: 1px ${({ $paid }) => ($paid ? 'solid' : 'dashed')} ${color.border};
  border-radius: ${radius.sm};
  background: ${({ $paid }) => ($paid ? color.surface : 'transparent')};
  min-width: 0;
`;

export const MonthNum = styled.span<{ $paid: boolean }>`
  color: ${({ $paid }) => ($paid ? color.text : color.textMuted)};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.xs};
  font-weight: ${({ $paid }) => ($paid ? font.weight.bold : font.weight.regular)};
  ${font.numeric}
`;

/** 그 달에 지급하는 종목 수만큼 마크가 선다 — 개수 자체가 "얼마나 겹치는가"를 말한다. */
export const MonthMarks = styled.span`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2px;
  min-width: 0;
`;

/**
 * 종목 한 개의 마크. 높이 5px · 폭 12px — **선이지 면이 아니다**(면 하한은 폭 180 AND 높이 8).
 * 🔴 높이를 8px 이상으로 올리지 마라 — 그 순간 12칸 × 종목 수만큼의 면이 예산에 들어온다.
 */
export const MonthMark = styled.span<{ $series: string }>`
  display: block;
  width: 12px;
  height: 5px;
  border-radius: ${radius.pill};
  background: ${({ $series }) => $series};
`;

/** 마크가 못 하는 말을 글자가 한다 — 회색조·색각이상에서도 어느 종목인지 읽힌다. */
export const MonthTickers = styled.span`
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  color: ${color.textSecondary};
  font-family: ${font.sans};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.medium};
  line-height: ${font.leading.tight};
  text-align: center;
  overflow-wrap: anywhere;
`;

export const MonthGapMark = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  line-height: ${font.leading.tight};
`;

export const VerdictNotes = styled.div`
  display: grid;
  gap: ${space[1]};
  min-width: 0;
`;

export const CoverageNote = styled.p`
  margin: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
`;

/* ── 비교표 ────────────────────────────────────────────────────────────────── */

/**
 * 표가 좁은 폭에서 넘칠 때는 **가로 스크롤**로 흡수한다. 칸을 접거나 열을 감추면 비교가 깨진다 —
 * 비교표에서 열이 사라지는 것은 정보 손실이 아니라 **비교 자체의 실패**다.
 */
export const TableScroller = styled.div`
  overflow-x: auto;
  overscroll-behavior-x: contain;
  min-width: 0;
  /* 🔴 앱 공용 스크롤바 — 부품마다 다른 막대가 나오지 않게 한다(scrollbarStyle.test.ts 가 잠근다). */
  ${subtleScrollbar}
`;

export const ScrollHint = styled.p`
  margin: 0 0 ${space[2]};
  color: ${color.textMuted};
  font-size: ${font.size.xs};

  ${media.up('tablet')} {
    display: none;
  }
`;

export const Table = styled.table`
  width: 100%;
  min-width: 560px;
  border-collapse: separate;
  border-spacing: 0;
  font-size: ${font.size.sm};
`;

/**
 * 항목 열의 머리(좌상단 모서리). 가로 스크롤 중에도 항목 이름이 남도록 **고정**된다 —
 * 4종을 비교하면 표가 반드시 넘치는데, 그때 항목 이름이 밀려 나가면 숫자만 남아 읽을 수 없다.
 */
export const HeadCorner = styled.th`
  position: sticky;
  left: 0;
  z-index: 1;
  width: ${METRIC_COLUMN_WIDTH};
  min-width: ${METRIC_COLUMN_WIDTH};
  padding: ${space[2]} ${space[3]} ${space[3]};
  border-bottom: 2px solid ${color.borderStrong};
  background: ${color.surface};
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  letter-spacing: 0.1em;
  text-align: left;
  vertical-align: bottom;
  white-space: nowrap;
`;

/**
 * 종목 열의 머리 = **그 종목의 얼굴**.
 *
 * 상단 4px 귀가 덱 슬롯의 3px 귀와 같은 색이다(같은 `assignSeries` 배정). 종전 열 머리는
 * 15px 세미볼드 검정이라 카드 제목보다도 약했다 — 비교의 주어가 화면에서 가장 조용했던 셈이다.
 */
export const HeadCell = styled.th<{ $series: string }>`
  position: relative;
  padding: ${space[4]} ${space[3]} ${space[3]};
  border-bottom: 2px solid ${color.borderStrong};
  background: ${color.surface};
  color: ${color.text};
  text-align: right;
  vertical-align: bottom;

  /* 🔴 4px 짜리 귀에는 **균일 반경**만 준다 — 한쪽만 둥글게 적으면 브라우저가 비례 축소해
     선언과 다르게 그린다(test/shared/radiusShape.test.ts 가 원리와 실측 2건을 적어 뒀다). */
  &::before {
    content: '';
    position: absolute;
    inset: 0 ${space[2]} auto ${space[2]};
    height: 4px;
    border-radius: ${radius.pill};
    background: ${({ $series }) => $series};
  }
`;

export const HeadTicker = styled.span`
  display: block;
  color: ${color.text};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.xl};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.01em;
  white-space: nowrap;
  ${font.numeric}
`;

export const HeadName = styled.span`
  display: block;
  margin-left: auto;
  max-width: 16ch;
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.regular};
  line-height: ${font.leading.tight};
  white-space: normal;
`;

/**
 * 행 묶음 머리(실측 / 참고 / 계산 가정).
 *
 * 🔴 이것이 배지를 **대체하지 않는다.** 배지는 행마다 그대로 남는다 — 묶음 머리는 블록 단위 선언이고
 * 배지는 행 단위 사실이라, 하나가 잘려 인용돼도 다른 하나가 남는다. 정직성 장치는 겹치는 편이 낫다.
 */
export const GroupHead = styled.th`
  padding: ${space[5]} ${space[3]} ${space[2]};
  border-bottom: 1px solid ${color.border};
  background: ${color.surface};
  text-align: left;
  vertical-align: bottom;
`;

export const GroupTitle = styled.span`
  display: inline-block;
  color: ${color.text};
  font-size: ${font.size.md};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.01em;
`;

export const GroupDesc = styled.span`
  display: block;
  margin-top: 2px;
  max-width: 60ch;
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.regular};
  line-height: ${font.leading.snug};
`;

/** 항목 이름 칸. 가로 스크롤에서 고정된다(위 `HeadCorner` 와 같은 이유). */
export const MetricCell = styled.th`
  position: sticky;
  left: 0;
  z-index: 1;
  width: ${METRIC_COLUMN_WIDTH};
  min-width: ${METRIC_COLUMN_WIDTH};
  padding: ${space[3]};
  border-bottom: 1px solid ${color.border};
  background: ${color.surface};
  color: ${color.text};
  font-weight: ${font.weight.medium};
  text-align: left;
  vertical-align: top;
`;

export const MetricLabelRow = styled.span`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${space[1]};
  min-width: 0;
`;

export const MetricLabel = styled.span`
  color: ${color.text};
  font-size: ${font.size.base};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;
`;

export const MetricNote = styled.span`
  display: block;
  margin-top: ${space[1]};
  max-width: 100%;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.regular};
  line-height: ${font.leading.snug};
  white-space: normal;
`;

/**
 * 숫자의 출처 배지(실측 · 참고 · 계산 가정).
 *
 * 🔴 **색은 거들 뿐, 정보는 글자가 진다**(색 단독 채널 금지). 회색조로 인쇄하거나 색을 못 보는
 * 사용자에게도 "실측"·"계산 가정"이라는 **글자**와 **테두리 모양**(실선 ↔ 점선)이 남는다.
 *
 * 색 배정은 **신뢰도 순서**를 따른다 — 자의적 배색이 아니라 의미의 사다리다:
 *  - `observed`(실측)     — 시장 데이터로 확인한 값. 실선 + accent 틴트로 **가장 또렷하게**.
 *  - `reference`(참고)    — 실제 이력이지만 계산에 안 쓰는 값. 점선 + 중립. 조용히 둔다.
 *  - `assumed`(계산 가정) — 우리가 정한 값. 점선 + **warning 틴트**로 "이건 관측이 아니다"를 색으로도 말한다.
 *
 * ⚠ 세 조합 모두 `shared/styles/contrast.test.ts` 가 **이미 검증하는 쌍**만 쓴다
 *   (accent-text/accent-subtle · text-secondary/surface-muted · warning/warning-surface).
 *   새 색을 만들지 마라 — 만들면 16테마(프리셋 8 × 라이트/다크) 대비를 전부 다시 재야 한다.
 * ⚠ 배지는 폭 60px 안팎이라 면 판정(180px) 밖이다 — 개수가 늘어도 예산에 걸리지 않는다.
 */
export const BasisBadge = styled.span<{ $basis: 'observed' | 'assumed' | 'reference' }>`
  display: inline-block;
  padding: 1px ${space[1]};
  border-radius: ${radius.xs};
  font-family: ${font.sans};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;

  ${({ $basis }) => {
    if ($basis === 'observed') {
      return `
  border: 1px solid ${color.accentBorder};
  background: ${color.accentSubtle};
  color: ${color.accentText};`;
    }
    if ($basis === 'assumed') {
      return `
  border: 1px dashed ${color.warning};
  background: ${color.warningSurface};
  color: ${color.warning};`;
    }
    return `
  border: 1px dashed ${color.border};
  background: ${color.surfaceMuted};
  color: ${color.textSecondary};`;
  }}
`;

/**
 * 값 칸. **우측 정렬 + tabular** 이라 자릿수가 열을 따라 줄을 맞춘다 —
 * 좌측 정렬이던 종전에는 $33.29 와 $679.14 의 소수점이 어긋나 크기 비교가 눈으로 안 됐다.
 */
export const ValueCell = styled.td`
  padding: ${space[3]};
  border-bottom: 1px solid ${color.border};
  color: ${color.text};
  text-align: right;
  vertical-align: top;
`;

export const ValueText = styled.span`
  display: block;
  color: ${color.text};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.md};
  font-weight: ${font.weight.semibold};
  line-height: ${font.leading.snug};
  ${font.numeric}
`;

/** 값이 없는 칸. 중립 muted 로만 말한다 — 없다는 사실에 색을 칠하지 않는다. */
export const UnknownValue = styled.span`
  display: block;
  color: ${color.textMuted};
  font-family: ${font.sans};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.regular};
`;

/**
 * "가장 높음/낮음" 표식. 값 **아래 줄**로 내려왔다 — 종전에는 숫자 오른쪽에 붙어 숫자보다 넓은
 * 회색 알약이 되면서 정작 값의 우측 정렬을 깨뜨렸다.
 *
 * 🔴 **색이 유일한 채널이면 안 된다** — 화살표 글리프와 텍스트("가장 높음")가 실제로 붙는다.
 * 🔴 손익색(dataPositive/Negative)을 쓰지 않는다. 배당률이 높은 것은 이익이 아니라 **사실**이고,
 *    높다고 좋은 종목도 아니다(커버드콜은 분배율이 높은 대신 NAV 가 깎일 수 있다).
 */
export const ExtremeMark = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin-top: ${space[1]};
  color: ${color.textSecondary};
  font-family: ${font.sans};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.medium};
  white-space: nowrap;
`;

/* ── 빈 상태 ───────────────────────────────────────────────────────────────── */

/**
 * 고르는 면(brand)이라 마스코트가 사는 자리다. 종전에는 점선 상자 안에 제목 두 줄 + 사각형 열 개가
 * 전부였다 — 첫 화면인데 브랜드도 초점도 없었다.
 */
/*
 * 🔴 **점선**이다(실선이 아니다). 이 앱에서 "아직 아무것도 없다"는 점선 테두리 + 맨몸 마스코트로
 * 말한다 — 커뮤니티 피드·내가 쓴 글의 빈 상태와 같은 어휘여야 한 제품으로 읽힌다.
 * 실선 + 회색 배지였을 때는 위쪽 덱·아래 표와 같은 무게의 카드로 보여, 빈 상태라는 사실 자체가
 * 화면에서 읽히지 않았다.
 * ⚠ 저쪽 두 화면이 함께 까는 파스텔 워시(gradientHeroSoft)는 여기서 **뺀다** — 이 라우트의 색면
 * 예산은 히어로 + 공용 푸터로 이미 2/2 다(tintscan 실측). 어휘를 맞추는 값은 형태가 내고,
 * 면은 늘리지 않는다.
 */
export const EmptyBlock = styled.section`
  ${surface(PICK_RADIUS, EMPTY_PAD)}
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: ${space[3]} clamp(${space[4]}, 3vw, ${space[8]});
  border: 1px dashed ${color.border};
  background: ${color.surface};
  min-width: 0;

  ${media.down('tabletSm')} {
    grid-template-columns: minmax(0, 1fr);
    justify-items: center;
    text-align: center;
  }
`;

/** 마스코트는 배지에 가두지 않는다 — 커뮤니티 빈 상태(FeedStates.EmptyMark)와 같은 맨몸 96px 이다. */
export const EmptyGlyph = styled.span`
  display: inline-grid;
  place-items: center;
  color: ${color.identity};
`;

export const EmptyBody = styled.div`
  display: grid;
  gap: ${space[1]};
  min-width: 0;
`;

export const EmptyTitle = styled.h2`
  margin: 0;
  color: ${color.text};
  font-size: ${sectionTitleFontSize};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.01em;
`;

export const EmptyLede = styled.p`
  margin: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.base};
  line-height: ${font.leading.snug};
`;

/** 1종만 골랐을 때. 빈 상태와 같은 자리지만 **다른 말**을 한다(고른 것이 없는 척하지 않는다). */
export const PartialNotice = styled.p`
  grid-column: 1 / -1;
  margin: 0;
  padding: ${space[2]} ${space[3]};
  border: 1px dashed ${color.accentBorder};
  border-radius: ${radius.sm};
  background: ${color.surfaceSunken};
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
`;

/* ── 예시 조합 격자 ────────────────────────────────────────────────────────── */

export const SuggestSection = styled.section`
  display: grid;
  gap: ${space[4]};
  min-width: 0;
`;

export const SectionHead = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: ${space[2]} ${space[3]};
  min-width: 0;
`;

export const SectionTitle = styled.h2`
  margin: 0;
  color: ${color.text};
  font-size: ${sectionTitleFontSize};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.01em;
`;

export const SectionHint = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size.sm};
`;

/** 카드 안 커버리지 배지. 조합을 고르는 실제 근거라 제목 오른쪽에 앉힌다. */
export const CoverBadge = styled.span`
  display: inline-block;
  padding: 2px ${space[2]};
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  color: ${color.textSecondary};
  font-family: ${font.dataNumeric};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;
  ${font.numeric}
`;

export const MiniPreview = styled.div`
  display: grid;
  gap: ${space[2]};
  min-width: 0;
`;

/** 12칸 미니 트랙. 높이 6px 이라 선이다 — 카드가 열 장이어도 면 예산에 걸리지 않는다. */
export const MiniTrack = styled.span`
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 2px;
  min-width: 0;
`;

export const MiniCell = styled.span<{ $paid: boolean; $series: string }>`
  display: block;
  height: 6px;
  border-radius: ${radius.xs};
  background: ${({ $paid, $series }) => ($paid ? $series : color.surfaceMuted)};
`;

export const MiniCaption = styled.span`
  display: block;
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};
`;

/* ── 각주 ──────────────────────────────────────────────────────────────────── */

/*
 * 🔴 이 화면은 각주를 **자기 손으로 그리지 않는다.** 공용 `PageFooter` 의 `notes` 슬롯에 넣는다
 * (구 `FootBlock`/`FootNote` 는 그래서 삭제됐다). 허브·상세와 같은 자리·같은 모양으로 끝나야
 * 세 지면이 한 제품으로 읽히고, 법무 2링크도 이 지면에 함께 선다.
 */

/** 스크린리더 전용. 시각 표식(가장 높음 등)이 이미 텍스트라 여기서는 구조 설명에만 쓴다. */
export const VisuallyHidden = styled.span`
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

import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import { color, font, media, radius, shadow, space, subtleScrollbar } from '@/shared/styles';

/**
 * `/portfolio/investors` 의 스타일.
 *
 * ⚠ styled 템플릿 **안** 주석에 백틱 금지 — 템플릿이 끊겨 앱이 부팅하지 않는다.
 * 🔴 하드코딩 hex 금지 — 토큰만.
 */

export const Stack = styled.div`
  display: grid;
  gap: clamp(16px, 3vw, 28px);
  min-width: 0;
`;

/* ── 한계 고지 ─────────────────────────────────────────────────────────────── */

/**
 * 🔴 **접히지 않는다.** 13F 의 지연·범위 한계는 부가 정보가 아니라 이 데이터의 성질이다.
 * 각주로 내리거나 `details` 로 접으면 대부분의 사용자가 못 보고, 그 상태로 "버핏의 현재 포트폴리오"
 * 라고 읽는다. 화면 맨 위에 상시로 둔다.
 */
export const LimitsBlock = styled.section`
  display: grid;
  gap: ${space[2]};
  padding: ${space[4]};
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surfaceMuted};
`;

export const LimitsTitle = styled.h2`
  margin: 0;
  color: ${color.text};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
`;

/**
 * 🔴 **지연 경고 — 이 화면에서 가장 크게 말해야 하는 한 줄.**
 *
 * 아래 목록의 한 항목이었는데 2026-08-02 사용자 지시로 승격했다. 나머지 한계와 같은 크기로
 * 나열되면 사람들은 이 화면을 "지금 보유"로 읽는다 — 그 오독이 이 페이지의 유일한 실질 위험이다.
 *
 * 🔴 색이 유일한 채널이 아니다: 경고 면 + 좌측 굵은 띠 + **"지금 보유가 아닙니다"라는 글자**가
 *    함께 말한다. 회색조로 인쇄해도 굵은 제목 줄이 남는다.
 * ⚠ 색 쌍은 `contrast.test.ts` 가 이미 검증하는 warning/warningSurface 만 쓴다 — 새 색을 만들면
 *   16테마(프리셋 8 × 라이트/다크) 대비를 전부 다시 재야 한다.
 */
export const DelayNotice = styled.div`
  display: grid;
  gap: 2px;
  padding: ${space[3]};
  border: 1px solid ${color.warning};
  border-left-width: 4px;
  border-radius: ${radius.sm};
  background: ${color.warningSurface};
`;

export const DelayHeadline = styled.strong`
  display: flex;
  align-items: center;
  gap: ${space[1]};
  color: ${color.warning};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
`;

export const DelayBody = styled.p`
  margin: 0;
  color: ${color.text};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
`;

export const LimitsList = styled.ul`
  display: grid;
  gap: ${space[1]};
  margin: 0;
  padding-left: ${space[4]};
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
`;

/* ── 인물 카드 ─────────────────────────────────────────────────────────────── */

/**
 * 인물 카드 격자.
 *
 * 넓은 화면에서는 **한 줄에 두 장**이다(2026-08-02 사용자 지시) — 13명을 한 줄씩 쌓으면 스크롤만
 * 길어지고 인물끼리 비교가 안 된다. 두 장이면 도넛 두 개가 나란히 놓여 구성 차이가 바로 보인다.
 *
 * ⚠ 세 장으로 늘리지 마라 — 카드 폭이 좁아지면 `DonutLayout` 이 세로로 접혀(도넛 위, 범례 아래)
 *   카드가 되레 길어진다. 두 장이 도넛+범례를 가로로 유지하는 하한이다.
 * ⚠ 높이는 **줄에서 가장 큰 카드에 맞춘다**(2026-08-02 사용자 지시로 stretch 로 되돌림).
 *   짧은 카드 아래가 조금 비더라도 위아래 줄의 경계가 한 선으로 떨어지는 편이 낫다 —
 *   들쭉날쭉하면 격자가 어긋나 보인다. 그래서 `align-items` 를 건드리지 않고 기본값(stretch)을 쓴다.
 *   대신 카드 안의 `CardActions` 를 맨 아래로 밀어(margin-top:auto) 남는 높이를 본문이 먹게 한다.
 */
export const CardGrid = styled.ul`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${space[3]};
  margin: 0;
  padding: 0;
  list-style: none;

  /* 1024px 이상 = 헤더가 한 줄로 서는 데스크톱 대역. 이 레포에 'desktop' 키는 없고 이것이 그 경계다. */
  ${media.up('headerStack')} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const InvestorCard = styled.li`
  /* 🔴 grid 가 아니라 **flex column** 이다. 자식 수가 조건부로 달라져(옵션 배지·오래됨 배지)
     grid-template-rows 로 줄을 세면 조건이 바뀔 때마다 어긋난다. flex 면 아래 CardActions 의
     margin-top:auto 하나로 "액션은 언제나 바닥"이 성립한다. */
  display: flex;
  flex-direction: column;
  gap: ${space[3]};
  padding: ${space[4]};
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surface};
  min-width: 0;
`;

/**
 * 아바타 + 이름 블록 + (있으면) 오래됨 배지.
 * ⚠ `align-items: center` 다 — 아바타가 원형이라 baseline 정렬하면 글자보다 아래로 처진다.
 */
export const CardHead = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${space[1]} ${space[2]};
  min-width: 0;
`;

/** 이름·운용사를 한 덩어리로 묶어 아바타 옆에 세운다. */
export const HeadText = styled.div`
  display: grid;
  gap: 1px;
  min-width: 0;
`;

export const PersonName = styled.h3`
  margin: 0;
  color: ${color.text};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.01em;
`;

export const FirmName = styled.span`
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
`;

export const PersonNote = styled.p`
  margin: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
`;

/** 기준일·규모·종목 수. 🔴 기준일은 **인물마다 다르다** — 전역 하나로 뭉뚱그리면 거짓이 된다. */
export const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${space[1]} ${space[3]};
  min-width: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
`;

export const MetaValue = styled.span`
  font-family: ${font.dataNumeric};
  color: ${color.text};
  font-weight: ${font.weight.semibold};
  ${font.numeric}
`;

/**
 * 자료가 오래됐다는 표시.
 * ⚠ 경고색을 쓰되 문구가 "청산했다"가 아니라 "공시가 확인되지 않는다"까지만 말한다 — 우리가 아는
 * 것이 거기까지다. 색은 거들 뿐이고 정보는 글자가 진다.
 */
export const StaleBadge = styled.span`
  display: inline-block;
  padding: 1px ${space[2]};
  border: 1px dashed ${color.warning};
  border-radius: ${radius.xs};
  background: ${color.warningSurface};
  color: ${color.warning};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
`;

/* ── 아바타 ────────────────────────────────────────────────────────────────── */

/**
 * 인물 아바타 — **이니셜 도형**이다.
 *
 * ⚠ 사진이 아니다. 실존 인물 사진은 대부분 저작권이 있어 13명을 자유 라이선스로 채울 수 없다
 * (2026-08-02 확인). 사진처럼 보이는 자리에 가짜를 넣느니 이니셜로 정직하게 구분한다.
 * 색은 이름 해시로 고정된다(`personColorVar`) — 카드 순서가 바뀌어도 같은 사람은 같은 색이다.
 * 🔴 색만으로 사람을 구분하게 두지 않는다 — 안의 글자와 옆의 이름이 정보를 진다.
 */
export const Avatar = styled.span<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  border-radius: ${radius.pill};
  /* 시리즈 색 위에 글자를 얹지 않는다(대비가 검증 대상 밖이다) — 색은 테두리와 옅은 면으로만 쓴다. */
  border: 2px solid ${({ $color }) => $color};
  background: ${color.surfaceMuted};
  color: ${color.text};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.02em;
`;

/* ── 도넛 ──────────────────────────────────────────────────────────────────── */

/** 도넛 + 범례. 좁은 폭에서는 세로로 쌓인다. */
export const DonutLayout = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: ${space[3]};
  min-width: 0;

  ${media.down('mobileWide')} {
    grid-template-columns: minmax(0, 1fr);
    justify-items: center;
  }
`;

/**
 * 도넛 본체.
 *
 * 원 하나에 `stroke-dasharray` 를 얹어 조각을 만든다(원호 path 를 계산하지 않는다 — 근거는
 * `investorsView.ts` 의 `DonutSlice` 주석). `viewBox` 지름은 둘레가 100 이 되도록 잡는다:
 * r = 100 / 2π ≈ 15.9155. 그래야 조각 값(퍼센트)을 그대로 dasharray 에 넣을 수 있다.
 *
 * ⚠ 기본 시작점은 3시 방향이라 `transform: rotate(-90deg)` 로 12시에서 시작시킨다 —
 *   사람이 원그래프를 읽기 시작하는 자리가 위쪽이다.
 */
export const Donut = styled.svg`
  display: block;
  width: 104px;
  height: 104px;
  transform: rotate(-90deg);
  flex: 0 0 auto;
`;

export const DonutLegend = styled.ul`
  display: grid;
  gap: 2px;
  margin: 0;
  padding: 0;
  min-width: 0;
  list-style: none;
`;

export const DonutLegendItem = styled.li`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: ${space[2]};
  min-width: 0;
  font-size: ${font.size.xs};
`;

/** 🔴 색 점은 **거들 뿐**이다 — 바로 옆 글자가 같은 내용을 말한다(회색조에서도 읽힌다). */
export const LegendDot = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: ${radius.pill};
  background: ${({ $color }) => $color};
`;

export const LegendName = styled.span`
  min-width: 0;
  overflow: hidden;
  color: ${color.text};
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const LegendValue = styled.span`
  color: ${color.textSecondary};
  font-family: ${font.dataNumeric};
  ${font.numeric}
`;

/** 비중을 몰라 도넛을 못 그릴 때. 🔴 빈 원을 그리지 않는다 — 0% 로 읽힌다. */
export const DonutNote = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
`;

/**
 * 🔴 **포지션 종류 배지(풋·콜) — 이 화면의 정정 장치.**
 *
 * 풋은 보유가 아니라 하락 베팅이다. 배지가 없으면 버리의 팔란티어 66% 가 "최대 보유 종목"으로
 * 읽힌다(실제로는 정반대). 그래서 이건 장식이 아니라 **틀린 읽기를 막는 최소 장치**다.
 *
 * 🔴 색이 유일한 채널이 아니다 — 안의 글자("풋"·"콜")가 정보를 지고 색은 거든다.
 * ⚠ 손익색(dataPositive/Negative)을 쓰지 않는다. 풋이 "손실"이 아니고 콜이 "이익"도 아니다 —
 *   둘 다 그저 **포지션의 종류**다. 그래서 방향 없는 중립 강조(warning/accentAlt)로만 가른다.
 * ⚠ 두 색 쌍 모두 contrast.test.ts 가 이미 검증하는 것만 쓴다 — 새 색을 만들지 마라.
 */
export const KindBadge = styled.span<{ $kind: 'put' | 'call' }>`
  display: inline-block;
  margin-left: ${space[1]};
  padding: 0 ${space[1]};
  border-radius: ${radius.xs};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  white-space: nowrap;

  ${({ $kind }) =>
    $kind === 'put'
      ? `
  border: 1px solid ${color.warning};
  background: ${color.warningSurface};
  color: ${color.warning};`
      : `
  border: 1px dashed ${color.accentAltText};
  background: ${color.accentAltSubtle};
  color: ${color.accentAltText};`}
`;

/**
 * 옵션 설명을 여는 **원형 물음표**.
 *
 * 원래는 카드 안에 두 줄짜리 문장이었는데, 그 한 줄 때문에 옵션이 섞인 카드(마이클 버리)만
 * 세로로 길어져 2열 격자의 높이가 깨졌다(2026-08-02 사용자 지적). 아이콘은 높이를 먹지 않는다.
 *
 * ⚠ 공용 `Tooltip` 은 **포커스 가능한 트리거**를 요구한다 — 그래서 `span` 이 아니라 `button` 이다
 *   (그 부품이 hover·focus·클릭 고정·Escape 를 전부 처리한다. native title 은 터치에서 안 뜬다).
 * ⚠ 정보가 이 아이콘에만 있어서는 안 된다 — 옵션 여부는 옆의 **풋·콜 배지가 이미 글자로** 말하고,
 *   이 툴팁은 "그게 비중에 무슨 뜻인지"를 덧붙일 뿐이다.
 */
/** 드로어 안의 보충 설명. 카드와 달리 폭·높이에 여유가 있어 문장을 그대로 둔다. */
export const DrawerNote = styled.p`
  margin: ${space[3]} 0 0;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};
`;

export const KindHelpButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  background: ${color.surfaceMuted};
  color: ${color.textSecondary};
  cursor: pointer;
  font-family: inherit;
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  line-height: 1;

  &:hover {
    border-color: ${color.accentBorder};
    color: ${color.text};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

/* ── 합산 가로 막대 ────────────────────────────────────────────────────────── */

/**
 * 대가들이 함께 담은 종목 — **가로 막대**(2026-08-02 사용자 지시로 최상단 배치).
 *
 * 세로 막대가 아닌 이유: 종목 라벨이 티커+한글명이라 가로로 길다. 세로 막대는 라벨을 눕히거나
 * 잘라야 하는데, 가로 막대는 라벨을 그대로 왼쪽에 세울 수 있다.
 *
 * 🔴 막대 길이는 **신고 금액 합**이다. 비중(%)의 합이 아니다 — 규모가 1,000배 차이 나는 사람들의
 * 퍼센트를 더하면 아무 뜻이 없다(근거는 `aggregateHoldings` 주석).
 */
export const AggregateBlock = styled.section`
  display: grid;
  gap: ${space[2]};
  padding: ${space[4]};
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surface};
  min-width: 0;
`;

/**
 * 제목 줄 — 왼쪽 제목·설명, **오른쪽 위에 정렬 토글**(2026-08-02 사용자 지시).
 *
 * 토글이 제목 아래 본문 흐름에 있으면 목록의 일부처럼 보여 "이걸 눌러 순서를 바꾼다"가 안 읽힌다.
 * 카드 모서리로 빼면 컨트롤임이 자리로 드러난다.
 * ⚠ 좁은 폭에서는 세로로 접는다 — 한 줄에 두면 제목이 잘리거나 토글이 밀린다.
 */
export const AggregateHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${space[3]};
  min-width: 0;

  ${media.down('mobileWide')} {
    flex-direction: column;
    align-items: stretch;
  }
`;

/** 제목+설명 묶음. 토글과 폭을 다투지 않게 남는 폭을 전부 갖는다. */
export const AggregateHeading = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

export const AggregateTitle = styled.h2`
  margin: 0;
  color: ${color.text};
  font-size: ${font.size.md};
  font-weight: ${font.weight.bold};
`;

/** 🔴 "주식만 세었다"는 사실을 제목 바로 밑에 둔다 — 각주로 내리면 아무도 안 읽는다. */
export const AggregateSubtitle = styled.p`
  margin: 0 0 ${space[1]};
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};
`;

/**
 * 정렬 토글 — 담은 인원 ↔ 신고 금액.
 *
 * 🔴 두 기준은 **다른 이야기**를 한다. 금액 순은 규모 큰 한 사람($294.9B 켄 피셔)이 순위를 지배하고,
 * 인원 순은 "몇 명이 함께 담았나"를 말한다. 그래서 기본은 인원이다(2026-08-02 사용자 지시).
 * ⚠ 선택 상태를 색으로만 말하지 않는다 — `aria-pressed` 와 굵기·테두리가 함께 진다.
 */
export const AggregateToggle = styled.div`
  display: inline-flex;
  gap: 2px;
  padding: 2px;
  border: 1px solid ${color.border};
  border-radius: ${radius.sm};
  background: ${color.surfaceSunken};
  align-self: start;
`;

export const AggregateToggleButton = styled.button<{ $selected: boolean }>`
  padding: ${space[1]} ${space[3]};
  border: 0;
  border-radius: ${radius.xs};
  cursor: pointer;
  font-family: inherit;
  font-size: ${font.size.xs};
  background: ${({ $selected }) => ($selected ? color.surface : 'transparent')};
  color: ${({ $selected }) => ($selected ? color.text : color.textSecondary)};
  font-weight: ${({ $selected }) => ($selected ? font.weight.bold : font.weight.medium)};
  box-shadow: ${({ $selected }) => ($selected ? shadow.e1 : 'none')};

  &:hover {
    color: ${color.text};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

export const AggregateList = styled.ol`
  display: grid;
  gap: ${space[2]};
  margin: 0;
  padding: 0;
  list-style: none;
  counter-reset: rank;
`;

export const AggregateRow = styled.li`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 2px;
  min-width: 0;
`;

export const AggregateHead = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${space[2]};
  min-width: 0;
  font-size: ${font.size.xs};
`;

export const AggregateName = styled.span`
  min-width: 0;
  overflow: hidden;
  color: ${color.text};
  font-weight: ${font.weight.semibold};
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/** 🔴 금액만 보면 "한 사람이 크게"와 "여럿이 나눠"가 구분되지 않는다 — 인원 수가 그걸 가른다. */
export const AggregateMeta = styled.span`
  flex: 0 0 auto;
  color: ${color.textSecondary};
  font-family: ${font.dataNumeric};
  ${font.numeric}
`;

/** 막대가 놓이는 트랙. 값이 0이어도 트랙은 남아 "이 종목의 막대가 짧다"가 보인다. */
export const AggregateTrack = styled.div`
  position: relative;
  height: 8px;
  border-radius: ${radius.pill};
  background: ${color.surfaceSunken};
  overflow: hidden;
`;

export const AggregateBar = styled.div<{ $ratio: number; $color: string }>`
  height: 100%;
  border-radius: ${radius.pill};
  background: ${({ $color }) => $color};
  /* 0~1 을 폭으로 옮긴다. 1% 미만도 눈에 남게 최소 폭을 준다(0 은 0으로 둔다). */
  width: ${({ $ratio }) => ($ratio <= 0 ? '0' : `${Math.max(1.5, $ratio * 100)}%`)};
`;



/* ── 보유 표 ───────────────────────────────────────────────────────────────── */

export const TableScroller = styled.div`
  overflow-x: auto;
  overscroll-behavior-x: contain;
  min-width: 0;
  /* 앱 공용 스크롤바 — 부품마다 다른 막대가 나오지 않게 한다(scrollbarStyle.test.ts 가 잠근다). */
  ${subtleScrollbar}
`;

export const Table = styled.table`
  width: 100%;
  min-width: 420px;
  border-collapse: collapse;
  font-size: ${font.size.sm};
`;

export const Th = styled.th`
  padding: ${space[2]};
  border-bottom: 1px solid ${color.border};
  color: ${color.textSecondary};
  font-weight: ${font.weight.medium};
  text-align: left;
  white-space: nowrap;
`;

export const ThNumeric = styled(Th)`
  text-align: right;
`;

export const Td = styled.td`
  padding: ${space[2]};
  border-bottom: 1px solid ${color.border};
  color: ${color.text};
  vertical-align: top;
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

/* ── 접기·펼치기 ───────────────────────────────────────────────────────────── */

export const CardActions = styled.div`
  /* 🔴 카드 높이가 줄에서 가장 큰 것에 맞춰 늘어나므로(CardGrid stretch), 남는 높이를 여기가
     밀어내 액션 줄이 모든 카드에서 같은 선에 놓인다. */
  margin-top: auto;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${space[2]};

  ${media.down('mobileWide')} {
    flex-direction: column;
    align-items: stretch;
  }
`;

/**
 * 비교 화면으로 넘기는 링크.
 *
 * ⚠ 공용 `Button` 에 `as={Link}` 를 쓸 수 없다(그 컴포넌트는 `as` prop 을 받지 않는다).
 * 그래서 티커 허브가 쓰는 것과 같은 `styled(Link)` 관용구를 따른다 — 버튼처럼 보이되 실제로는
 * 링크라서 새 탭 열기·주소 복사가 그대로 된다(버튼으로 만들면 그 둘을 잃는다).
 */
export const CompareLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: ${space[1]} ${space[3]};
  border: 1px solid transparent;
  border-radius: ${radius.sm};
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  text-decoration: none;

  &:hover {
    background: ${color.surfaceHover};
    color: ${color.text};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

export const FootNote = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};
`;

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

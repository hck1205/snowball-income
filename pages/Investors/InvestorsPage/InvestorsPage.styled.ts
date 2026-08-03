import styled from '@emotion/styled';
import { Link } from 'react-router-dom';
import {
  DATA_RADIUS,
  DATA_SURFACE,
  PICK,
  cardElevation,
  color,
  font,
  media,
  nestedRadius,
  radius,
  shadow,
  space,
  subtleScrollbar
} from '@/shared/styles';

/**
 * `/portfolio/investors` 의 스타일.
 *
 * ## 이 화면의 두 면 (2026-08-03 개편 어휘)
 * - **brand 면(고르는 면)** — 인물 카드. 공용 `PickCard` 로 승격했다(레일 캡 + 부상 hover).
 *   인물 고유색은 카드 머리의 **6px 레일**과 모노그램 배지가 함께 말한다.
 * - **data 면(읽는 면)** — 합산 막대 · 한계 고지 · 보유 표 · 각주. `DATA_RADIUS`/`DATA_SURFACE`
 *   대역에 앉고 **채도면을 갖지 않는다**(색은 선·점·막대 같은 L1 파생으로만).
 *
 * ## 🔴 틴트 면 예산 (tintscan: 폭≥180 AND 높이≥8 AND 비중립 배경 = 1면, 라우트당 2면)
 * 이 화면에서 **의도적으로 세어지는 면은 지연 경고 하나뿐**이다. 그래서:
 *  - 인물 카드 캡은 `rail`(6px) 이다 — 인물마다 색이 달라 `tint` 캡은 클러스터로 접히지도 않는다
 *    (접기 조건이 "같은 배경값"이라 13색이면 13면이다).
 *  - 합산 막대 높이를 8px → **6px** 로 내렸다. 8px 은 면 하한과 같은 값이라 막대 10줄이 그대로
 *    면 10개로 세어지고 있었다(2026-08-03 발견, 기존 결함). 6px 은 하한 바로 아래다.
 *  - 오래됨 고지만 예외적으로 `warningSurface` 를 유지한다 — `warning` 텍스트가 대비 검증을 받은
 *    면이 그것뿐이라(`contrast.test.ts` 의 [warning, warning-surface]) 중립 면으로 못 내린다.
 *
 * ⚠ styled 템플릿 **안** 주석에 백틱 금지 — 템플릿이 끊겨 앱이 부팅하지 않는다.
 * 🔴 하드코딩 hex 금지 — 토큰만.
 */

export const Stack = styled.div`
  display: grid;
  gap: clamp(20px, 3.4vw, 34px);
  min-width: 0;
`;

/** 인물 카드 묶음. 머리(제목+설명)와 격자를 한 덩어리로 묶는다. */
export const PersonsSection = styled.section`
  display: grid;
  gap: ${space[4]};
  min-width: 0;
`;

/* ── 섹션 머리 ─────────────────────────────────────────────────────────────── */

/**
 * 섹션 제목 줄. 제목 왼쪽의 **3px 세로 귀**가 이 화면의 반복 신호다 —
 * 폭 3px 이라 면으로 세어지지 않으면서(L1) 섹션의 시작을 눈에 박는다.
 */
export const SectionHead = styled.div`
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

/**
 * 섹션마다 **다른 축**의 귀를 단다 — 한 화면에 세 축이 순서대로 나타나 페이지를 세 마디로 나눈다.
 *
 * 🔴 폭 3px 이라 `tintscan` 의 면 판정(폭 ≥180px) 밖이다 — 색면 사다리의 L1(파생 귀)이고
 *    개수 제한이 없다. 색이 유일한 채널도 아니다(바로 옆에 제목 글자가 있다).
 * `persons` 가 brand 축인 이유: 그 섹션만 **고르는 면**이다(카드를 누르면 화면이 바뀐다).
 */
export type SectionAxis = 'accent' | 'accentAlt' | 'brand';

const SECTION_EAR: Record<SectionAxis, string> = {
  accent: color.accent,
  accentAlt: color.accentAlt,
  brand: color.brand
};

export const SectionHeading = styled.div<{ $axis: SectionAxis }>`
  display: grid;
  gap: ${space[1]};
  min-width: 0;
  padding-left: ${space[3]};
  border-left: 3px solid ${({ $axis }) => SECTION_EAR[$axis]};
`;

export const SectionTitle = styled.h2`
  margin: 0;
  color: ${color.text};
  font-family: ${font.display};
  font-size: clamp(${font.size.lg}, 1.4vw, ${font.size['2xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.02em;
  line-height: ${font.leading.tight};
`;

export const SectionSubtitle = styled.p`
  margin: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};
`;

/* ── 지연 경고 ─────────────────────────────────────────────────────────────── */

/**
 * 🔴 **지연 경고 — 이 화면에서 가장 크게 말해야 하는 한 줄.**
 *
 * 2026-08-02 사용자 지시로 한계 목록에서 승격했다. 나머지 한계와 같은 크기로 나열되면 사람들은
 * 이 화면을 "지금 보유"로 읽는다 — 그 오독이 이 페이지의 유일한 실질 위험이다.
 * 🔴 **개편하면서 톤을 낮추지 않았다.** 오히려 아이콘을 배지로 키우고 제목 급을 한 단 올렸다.
 *
 * 🔴 색이 유일한 채널이 아니다: 경고 면 + 좌측 굵은 띠 + 경고 아이콘 + **"지금 보유가 아닙니다"**
 *    라는 글자가 함께 말한다. 회색조로 인쇄해도 굵은 제목 줄이 남는다.
 * ⚠ 색 쌍은 `contrast.test.ts` 가 검증하는 warning/warningSurface 만 쓴다.
 */
export const DelayNotice = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${space[3]};
  padding: ${DATA_SURFACE.pad};
  border: 1px solid ${color.warning};
  border-left-width: 5px;
  border-radius: ${DATA_RADIUS};
  background: ${color.warningSurface};
  min-width: 0;
`;

/** 경고 글리프 자리. 40px 정사각이라 폭 하한(180px)에 걸리지 않는다 — 색을 예산 없이 쓰는 자리(L1). */
export const DelayIcon = styled.span`
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  border-radius: ${radius.md};
  border: 1px solid ${color.warning};
  color: ${color.warning};
  background: transparent;
`;

export const DelayText = styled.div`
  display: grid;
  gap: ${space[1]};
  min-width: 0;
`;

export const DelayHeadline = styled.strong`
  color: ${color.warning};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.01em;
`;

export const DelayBody = styled.p`
  margin: 0;
  color: ${color.text};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
`;

/* ── 한계 고지 ─────────────────────────────────────────────────────────────── */

/**
 * 🔴 **접히지 않는다.** 13F 의 지연·범위 한계는 부가 정보가 아니라 이 데이터의 성질이다.
 * 각주로 내리거나 `details` 로 접으면 대부분의 사용자가 못 보고, 그 상태로 "버핏의 현재
 * 포트폴리오"라고 읽는다. 화면 위쪽에 상시로 둔다.
 *
 * 면은 **중립**이다(data 면) — 경고 면은 위의 지연 경고 하나로 충분하고, 두 개가 되면 둘 다 약해진다.
 */
export const LimitsBlock = styled.section`
  ${cardElevation('base')}
  display: grid;
  gap: ${space[4]};
  padding: ${DATA_SURFACE.pad};
  border-radius: ${DATA_RADIUS};
  min-width: 0;
`;

export const LimitsList = styled.ul`
  display: grid;
  gap: ${space[3]};
  margin: 0;
  padding: 0;
  list-style: none;

  ${media.up('headerStack')} {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: ${space[5]};
  }
`;

export const LimitsItem = styled.li`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: ${space[3]};
  min-width: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
`;

/** 항목 번호. 28px 원이라 폭 하한(180px) 밖 — 액센트 틴트를 예산 없이 쓸 수 있는 자리다. */
export const LimitsIndex = styled.span`
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  border-radius: ${radius.pill};
  background: ${color.accentSubtle};
  color: ${color.accentText};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  ${font.numeric}
`;

/* ── 합산 가로 막대 (data 면) ──────────────────────────────────────────────── */

/**
 * 대가들이 함께 담은 종목 — **가로 막대**(2026-08-02 사용자 지시로 카드보다 위).
 *
 * 세로 막대가 아닌 이유: 종목 라벨이 티커+한글명이라 가로로 길다. 세로 막대는 라벨을 눕히거나
 * 잘라야 하는데, 가로 막대는 라벨을 그대로 왼쪽에 세울 수 있다.
 *
 * 🔴 막대 길이는 **신고 금액 합**(또는 인원 수)이지 비중(%)의 합이 아니다 — 근거는
 * `aggregateHoldings` 주석.
 */
export const AggregateBlock = styled.section`
  ${cardElevation('base')}
  display: grid;
  gap: ${space[4]};
  padding: ${DATA_SURFACE.pad};
  border-radius: ${DATA_RADIUS};
  min-width: 0;
`;

/**
 * 정렬 토글 — 담은 인원 ↔ 신고 금액.
 *
 * 🔴 두 기준은 **다른 이야기**를 한다. 금액 순은 규모 큰 한 사람($294.9B 켄 피셔)이 순위를
 * 지배하고, 인원 순은 "몇 명이 함께 담았나"를 말한다. 기본은 인원이다(2026-08-02 사용자 지시).
 * ⚠ 선택 상태를 색으로만 말하지 않는다 — `aria-pressed` 와 굵기·면이 함께 진다.
 */
export const AggregateToggle = styled.div`
  display: inline-flex;
  gap: 2px;
  padding: 3px;
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  background: ${color.surfaceSunken};
  align-self: start;
  flex: 0 0 auto;
`;

export const AggregateToggleButton = styled.button<{ $selected: boolean }>`
  padding: ${space[1]} ${space[4]};
  border: 0;
  border-radius: ${radius.pill};
  cursor: pointer;
  font-family: inherit;
  font-size: ${font.size.xs};
  white-space: nowrap;
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
  gap: ${space[3]};
  margin: 0;
  padding: 0;
  list-style: none;
`;

/** 순위 · 이름/수치 · 막대. 순위 칸이 두 줄을 가로질러 서서 목록이 표처럼 정렬된다. */
export const AggregateRow = styled.li`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-rows: auto auto;
  align-items: center;
  column-gap: ${space[3]};
  row-gap: ${space[1]};
  min-width: 0;
`;

/**
 * 순위 숫자. 28px 원이라 면으로 세어지지 않는다(L1 파생 귀) — 색을 예산 없이 쓰는 자리다.
 *
 * ⚠ 축이 `accentAlt` 인 것은 이 섹션의 귀와 같은 축이기 때문이다. brand(액션 축)를 쓰지 않는 이유는
 *   이 배지가 **누를 수 없는 표면**이라서다(`contrast.test.ts` 128행 주석의 규율).
 */
export const AggregateRank = styled.span`
  grid-row: 1 / span 2;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: ${radius.pill};
  border: 1px solid ${color.accentAltBorder};
  background: ${color.accentAltSubtle};
  color: ${color.accentAltText};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  ${font.numeric}
`;

export const AggregateHead = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${space[2]};
  min-width: 0;
  font-size: ${font.size.sm};
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
  font-size: ${font.size.xs};
  ${font.numeric}
`;

/** 막대가 놓이는 트랙. 값이 0이어도 트랙은 남아 "이 종목의 막대가 짧다"가 보인다. */
export const AggregateTrack = styled.div`
  position: relative;
  /* 🔴 6px 이다. 8px 은 tintscan 의 면 하한과 **같은 값**이라 막대 10줄이 면 10개로 세어진다. */
  height: ${PICK.railHeight};
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

/* ── 인물 카드 격자 (brand 면) ─────────────────────────────────────────────── */

/**
 * 인물 카드 격자.
 *
 * 넓은 화면에서는 **한 줄에 두 장**이다(2026-08-02 사용자 지시) — 13명을 한 줄씩 쌓으면 스크롤만
 * 길어지고 인물끼리 비교가 안 된다. 두 장이면 도넛 두 개가 나란히 놓여 구성 차이가 바로 보인다.
 *
 * ⚠ 공용 `PickCardGrid` 를 쓰지 않는 이유는 그 격자가 `auto-fill` 이라 넓은 화면에서 3열이 되기
 *   때문이다. 세 장이 되면 카드 폭이 좁아져 `DonutLayout` 이 세로로 접히고(도넛 위, 범례 아래)
 *   카드가 되레 길어진다. 두 장이 도넛+범례를 가로로 유지하는 하한이다.
 * ⚠ 간격은 `space[3]`(12px) 이 아니라 `PICK.gap` 이다 — 부상 그림자(blur 12px)가 12px 간격에서
 *   옆 카드에 닿는다(`tokens.ts` PICK.gap 실측).
 */
export const CardGrid = styled.ul`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${PICK.gap};
  margin: 0;
  padding: 0;
  list-style: none;

  /* 1024px 이상 = 헤더가 한 줄로 서는 데스크톱 대역. 이 레포에 'desktop' 키는 없고 이것이 그 경계다. */
  ${media.up('headerStack')} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

/**
 * 격자 한 칸.
 *
 * 🔴 **드로어는 카드 *밖*, 이 칸 안에 있다.** `PickCard` 는 hover/focus 에서 `transform` 을 쓰므로
 * 스태킹 컨텍스트이자 `position: fixed` 자손의 컨테이닝 블록이 된다 — 카드 안에 드로어를 두면
 * 열리는 순간 전폭 패널이 카드 좌표계에 갇힌다. 이 칸은 transform 이 없어 안전하다.
 *
 * `display: grid` 인 이유: 유일한 흐름 자식(카드)이 줄 높이만큼 늘어나 위아래 줄 경계가 한 선으로
 * 떨어진다(드로어의 세 요소는 전부 `position: fixed` 라 격자 트랙을 만들지 않는다).
 */
export const CardItem = styled.li`
  display: grid;
  min-width: 0;
`;

/**
 * 인물 모노그램 — `PickCard` 의 40px 글리프 배지 안을 **가득** 채운다.
 *
 * ⚠ 사진이 아니다. 실존 인물 사진은 대부분 저작권이 있어 13명을 자유 라이선스로 채울 수 없다
 * (2026-08-02 확인). 사진처럼 보이는 자리에 가짜를 넣느니 이니셜로 정직하게 구분한다.
 *
 * 🔴 **처방 교정(2026-08-03)**: 예전에는 `background: series` 솔리드 위에 글자를 얹고 있었다 —
 * 시리즈 색은 **비텍스트 3:1 로만** 검증된 색이라(`contrast.test.ts`) 그 위의 텍스트는 대비 계약
 * 밖이었다. 지금은 *면은 16% 틴트 · 글자는 중립 `text` · 테두리만 시리즈 솔리드* 다.
 * 인물 고유색을 크게 말하는 것은 카드 머리의 6px 레일이 맡는다.
 */
export const Monogram = styled.span<{ $color: string }>`
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  border: 1px solid ${({ $color }) => $color};
  background: color-mix(in srgb, ${({ $color }) => $color} 16%, ${color.surface});
  color: ${color.text};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.02em;
`;

/**
 * 자료가 오래됐다는 표시 — **짧은 배지**.
 *
 * 🔴 두 조각으로 나눈 이유는 실측이다(2026-08-03 tintscan). 문장 전체를 경고 면에 담으면
 * 폭 534px × 높이 35px 이라 **틴트 면 하나로 세어진다**(라우트 상한 2를 히어로+지연 경고가 이미
 * 채우고 있어 즉시 초과했다). 배지는 폭 180px 미만이라 세어지지 않는다.
 * 그래서 **색은 배지가, 문장은 중립 텍스트가** 진다 — 숨긴 것은 없다.
 *
 * ⚠ 색 쌍은 warning/warningSurface 뿐이다. `warning` 텍스트가 대비 검증을 받은 면이 그것뿐이라
 *   중립 면 위로 내리면 대비 계약 밖이 된다(`contrast.test.ts` 에 [warning, surface] 쌍은 없다).
 */
export const StaleBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  padding: 2px ${space[2]};
  border: 1px dashed ${color.warning};
  border-radius: ${radius.pill};
  background: ${color.warningSurface};
  color: ${color.warning};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  white-space: nowrap;
`;

/**
 * 오래된 자료의 **문장**. 색을 뺀 자리라 위 배지가 색 신호를 지고 여기는 사실만 말한다.
 *
 * ⚠ 문구가 "청산했다"가 아니라 "공시가 확인되지 않는다"까지만 말한다 — 우리가 아는 것이 거기까지다.
 */
export const StaleLine = styled.p`
  margin: 0 0 ${space[2]};
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  line-height: ${font.leading.snug};
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
  gap: ${space[2]};
  margin-top: ${space[3]};
  min-width: 0;
`;

/** 메타 한 칸. 폭이 180px 을 넘을 수 있으므로 면은 **중립**만 쓴다(예산을 먹지 않는다). */
export const MetaChip = styled.span`
  display: inline-flex;
  align-items: baseline;
  gap: ${space[1]};
  padding: ${space[1]} ${space[3]};
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  background: ${color.surfaceSunken};
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.medium};
  white-space: nowrap;
`;

export const MetaValue = styled.span`
  font-family: ${font.dataNumeric};
  color: ${color.text};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.bold};
  ${font.numeric}
`;

/**
 * 옵션이 섞였다는 표시.
 *
 * 🔴 예전에는 `?` 툴팁 버튼이었다. `PickCard` 는 캡의 3변 bleed 때문에 `overflow: hidden` 이라
 * 말풍선(절대 배치)이 잘려 **읽을 수 없게 된다** — 그래서 설명을 감추는 대신 **글자로 상시 노출**한다.
 * 문장 전체는 드로어 안의 `DrawerNote` 가 그대로 말한다(진입점은 유지된다).
 * ⚠ 손익색을 쓰지 않는다 — 옵션은 "손실"이 아니라 포지션의 종류다.
 *
 * 🔴 `position: relative; z-index: 1` 은 장식이 아니다. `PickCard` 의 스트레치 컨트롤은
 *    의사요소(inset 0 · z-index 0)로 카드 전체를 덮으므로, 그냥 두면 이 칩 위의 마우스가
 *    **카드 버튼에 먹혀 title 말풍선이 절대 뜨지 않는다**(2026-08-03 elementFromPoint 실측 —
 *    칩 중앙을 찍으면 "OO의 보유 종목 전체 보기" 버튼이 잡혔다). 한 단 올려 보조 설명을 되살린다.
 */
export const OptionChip = styled.span`
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  padding: ${space[1]} ${space[3]};
  border: 1px dashed ${color.accentAltText};
  border-radius: ${radius.pill};
  background: ${color.accentAltSubtle};
  color: ${color.accentAltText};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  white-space: nowrap;
`;

/* ── 도넛 ──────────────────────────────────────────────────────────────────── */

/**
 * 도넛이 앉는 안쪽 면. 카드(brand) 안의 **읽는 자리**라 중립 침강면으로 눌러 둔다 —
 * 반경은 부모가 발행한 `--sb-inner-radius` 를 따라가 동심이 된다.
 */
export const DonutPanel = styled.div`
  margin-top: ${space[3]};
  padding: ${space[3]};
  border-radius: ${nestedRadius(radius.md)};
  background: ${color.surfaceSunken};
  min-width: 0;
`;

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
  gap: 3px;
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
  width: 10px;
  height: 10px;
  border-radius: ${radius.xs};
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
  font-weight: ${font.weight.semibold};
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
  /*
   * 🔴 이 배지는 도넛 범례(카드 안)와 보유 표(드로어) 양쪽에 선다. 카드 안쪽은 PickCard 의
   * 스트레치 컨트롤 의사요소가 덮고 있어, 한 단 올리지 않으면 범례에서 title 설명("하락에 거는
   * 풋옵션입니다")에 마우스가 닿지 않는다. 표 안에서는 아무 영향이 없다.
   */
  position: relative;
  z-index: 1;
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

/* ── 카드 액션 ─────────────────────────────────────────────────────────────── */

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
  gap: ${space[1]};
  padding: ${space[1]} ${space[3]};
  border: 1px solid ${color.brandBorder};
  border-radius: ${radius.pill};
  color: ${color.brandText};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  text-decoration: none;

  &:hover {
    background: ${color.brandSubtle};
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

/* ── 보유 표 (드로어 안) ───────────────────────────────────────────────────── */

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

/** 드로어 안의 보충 설명. 카드와 달리 폭·높이에 여유가 있어 문장을 그대로 둔다. */
export const DrawerNote = styled.p`
  margin: ${space[3]} 0 0;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};
`;

/* ── 각주 ──────────────────────────────────────────────────────────────────── */

/** 면책·출처. 중립 침강면이라 본문과 구분되면서 색 예산을 먹지 않는다. */
export const FootNoteBlock = styled.section`
  display: grid;
  gap: ${space[2]};
  padding: ${DATA_SURFACE.pad};
  border-radius: ${DATA_RADIUS};
  background: ${color.surfaceSunken};
  min-width: 0;
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

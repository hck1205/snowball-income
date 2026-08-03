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
 * ## 2차 개편(2026-08-03)에서 **구조로** 바꾼 것 — 색이 아니라 뼈대다
 *
 * | 자리 | 1차까지 | 지금 |
 * |---|---|---|
 * | 화면 첫 블록 | 경고 카드 + 한계 카드가 **따로 두 덩어리** | `ReadFirstBand` **한 밴드 2열** — 지연 경고가 밴드를 대표하고 한계 셋은 곁줄로 붙는다 |
 * | 합산 | 똑같은 막대 **열 줄** | `PodiumGrid`(상위 3종 타일) + `RankTable`(4~10위 표) — 한 섹션 안에 **두 밀도** |
 * | 합산 ↔ 인물 | 관계 없음 | 합산 줄마다 담은 사람 **이니셜 칩** → 누르면 그 인물의 표가 열린다 |
 * | 인물 카드 본문 | 칩 셋(기준일·규모·종목수)이 **같은 무게** + 104px 도넛 + 세로 범례 | 규모가 **30px 숫자**로 서고 기준일은 그 캡션, 구성은 **전폭 6px 스택바 + 2열 범례** |
 * | 인물 격자 | 2열 고정 | 1 → 2 → **3열** (카드가 낮아져 열세 장이 다섯 줄에 들어온다) |
 * | 빈 상태 | 없음 | `EmptyPanel` |
 *
 * ## 이 화면의 두 면
 * - **brand 면(고르는 면)** — 인물 카드(공용 `PickCard`, 레일 캡). 인물 고유색은 6px 레일과 모노그램이 진다.
 * - **data 면(읽는 면)** — 합산 타일·표·보유 표·각주. `DATA_RADIUS` 대역에 앉고 **채도면을 갖지 않는다.**
 *
 * ## 🔴 틴트 면 예산 (tintscan: 폭≥180 AND 높이≥8 AND 비중립 배경 = 1면, 라우트당 2면)
 * 실측 기준선은 **2면**(히어로 + 경고 밴드)이고 이 개편은 **한 면도 늘리지 않는다**:
 *  - 한계 목록을 경고 면 **안으로** 넣었다 — 블록이 하나 줄었지 면이 늘지 않았다.
 *  - 인물 카드 캡은 `rail`(6px). 인물마다 색이 달라 `tint` 캡은 클러스터로 접히지도 않는다.
 *  - 구성 스택바·합산 막대 높이는 `PICK.railHeight`(6px) 다. 🔴 8px 로 올리면 버리의 팔란티어
 *    조각(66% × 카드폭 344px ≈ 227px)이 폭 하한 180px 을 넘어 **그 자리에서 면이 된다.**
 *  - 이니셜 칩·순위 배지·범례 점은 전부 폭 <180px 이라 색을 예산 없이 쓴다(L1).
 *
 * ⚠ styled 템플릿 **안** 주석에 백틱 금지 — 템플릿이 끊겨 앱이 부팅하지 않는다.
 * 🔴 하드코딩 hex 금지 — 토큰만.
 */

export const Stack = styled.div`
  display: grid;
  gap: clamp(24px, 3.6vw, 40px);
  min-width: 0;
`;

/* ── 섹션 머리 ─────────────────────────────────────────────────────────────── */

export const SectionHead = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: ${space[3]};
  min-width: 0;
  padding-bottom: ${space[3]};
  /* 🔴 제목을 카드 안에 넣지 않고 **밑줄 한 선** 위에 세운다 — 섹션이 카드가 아니라
     편집 지면의 단락으로 읽히고, 아래 타일·표가 그 단락의 내용이 된다. */
  border-bottom: 1px solid ${color.border};

  ${media.down('mobileWide')} {
    flex-direction: column;
    align-items: stretch;
  }
`;

/**
 * 섹션마다 **다른 축**의 귀를 단다 — 한 화면에 축이 순서대로 나타나 페이지를 마디로 나눈다.
 * 🔴 폭 3px 이라 면 판정(폭 ≥180px) 밖이다(L1). 색이 유일한 채널도 아니다(옆에 제목 글자가 있다).
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

/**
 * 섹션 제목. 🔴 1차보다 **한 단 크고 훨씬 굵다** — 이 화면의 위계는 색이 아니라 크기 대비가 만든다
 * (`font.display` 는 Bold 한 벌만 실려 굵기로는 위계를 못 만든다 — tokens.ts 주석).
 */
export const SectionTitle = styled.h2`
  margin: 0;
  color: ${color.text};
  font-family: ${font.display};
  font-size: clamp(${font.size.xl}, 1.9vw, ${font.size['3xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.03em;
  line-height: ${font.leading.tight};
`;

export const SectionSubtitle = styled.p`
  margin: 0;
  max-width: 62ch;
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};
`;

/**
 * 블록 위의 **작은 표제**. 대문자 라벨 대신 자간을 벌린 한글 짧은 말로 쓴다 —
 * 본문(14px)과 제목(24px) 사이가 비면 위계가 두 단으로만 읽히는데, 이 11px 자간 라벨이
 * 세 번째 단을 만들어 준다.
 */
export const Eyebrow = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.14em;
`;

/* ── ① 읽기 전 고지 밴드 (지연 경고 + 한계 3항목) ──────────────────────────── */

/**
 * 🔴 **이 화면에서 가장 크게 말해야 하는 블록.**
 *
 * 2차 개편에서 지연 경고와 한계 목록을 **하나로 합쳤다.** 1차에서는 경고 카드 바로 아래에
 * 같은 폭의 중립 카드가 또 서 있어서, 눈이 두 블록을 "비슷한 고지 두 개"로 묶어 읽었다 —
 * 그러면 지연 경고의 특별함이 사라진다. 한 밴드 안에 넣고 **왼쪽 셀만 크게** 두면 밴드 전체가
 * 경고로 읽히고, 한계 셋은 그 경고의 각주 자리로 내려간다.
 *
 * 🔴 **톤을 낮춘 것이 아니라 올렸다**: 제목 lg(16px) → clamp(xl~3xl), 아이콘 40 → 52px,
 *    좌측 띠 5px 유지. 회색조로 인쇄해도 굵은 제목 줄과 경고 글리프가 남는다.
 * ⚠ 색 쌍은 `contrast.test.ts` 가 검증하는 warning/warningSurface 만 쓴다.
 * ⚠ 이 밴드가 라우트의 **두 번째이자 마지막 틴트 면**이다(첫 면은 PageHero).
 */
export const ReadFirstBand = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${space[5]};
  padding: clamp(18px, 2.2vw, 26px);
  border: 1px solid ${color.warning};
  border-left-width: 5px;
  border-radius: ${DATA_RADIUS};
  background: ${color.warningSurface};
  min-width: 0;

  ${media.up('tabletSm')} {
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
    gap: clamp(20px, 3vw, 40px);
  }
`;

export const DelayCell = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: ${space[4]};
  min-width: 0;
`;

/** 경고 글리프 자리. 52px 정사각이라 폭 하한(180px)에 걸리지 않는다 — 예산 밖의 색 자리(L1). */
export const DelayIcon = styled.span`
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 52px;
  height: 52px;
  border-radius: ${radius.lg};
  border: 2px solid ${color.warning};
  color: ${color.warning};
  background: transparent;
`;

export const DelayText = styled.div`
  display: grid;
  gap: ${space[2]};
  min-width: 0;
`;

/** 🔴 이 화면의 실질적인 첫 문장. 크기를 내리지 마라. */
export const DelayHeadline = styled.strong`
  display: block;
  color: ${color.warning};
  font-family: ${font.display};
  font-size: clamp(${font.size.xl}, 2.1vw, ${font.size['3xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.03em;
  line-height: ${font.leading.tight};
`;

export const DelayBody = styled.p`
  margin: 0;
  max-width: 46ch;
  color: ${color.text};
  font-size: ${font.size.sm};
  line-height: ${font.leading.normal};
`;

/**
 * 한계 셋이 앉는 오른쪽 셀. 넓은 폭에서는 **세로 실선**으로 갈라 두 이야기임을 밝히고,
 * 좁은 폭에서는 가로선으로 눕는다(경고 아래에 붙는 각주 모양이 된다).
 */
export const LimitsCell = styled.div`
  display: grid;
  gap: ${space[3]};
  align-content: start;
  min-width: 0;
  padding-top: ${space[4]};
  border-top: 1px solid ${color.warning};

  ${media.up('tabletSm')} {
    padding-top: 0;
    padding-left: clamp(20px, 3vw, 40px);
    border-top: 0;
    border-left: 1px solid ${color.warning};
  }
`;

/**
 * 🔴 여전히 **헤딩**이다(문서 개요에서 빠지면 안 된다). 다만 시각적으로는 이제 밴드의 부제라
 * 아이브로우 급으로 내렸다 — 경고 제목과 같은 크기로 두면 둘이 서로를 깎는다.
 */
export const LimitsHeading = styled.h2`
  margin: 0;
  color: ${color.warning};
  font-family: ${font.sans};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.14em;
`;

/**
 * 목록을 여는 한 문장("아래 세 가지를 전제로 읽어 주십시오").
 *
 * 🔴 개편에서 이 줄이 한 번 사라졌다 — 블록을 합치며 제목만 옮기고 부제를 흘렸다. 세 항목이
 * **전제**라는 사실을 말하는 것은 이 문장뿐이라(목록만 있으면 "참고 사항"으로 읽힌다) 되살렸다.
 */
export const LimitsLede = styled.p`
  margin: 0;
  color: ${color.text};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  line-height: ${font.leading.snug};
`;

export const LimitsList = styled.ul`
  display: grid;
  gap: ${space[3]};
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const LimitsItem = styled.li`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: start;
  gap: ${space[3]};
  min-width: 0;
  color: ${color.text};
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};
`;

/** 항목 번호. 22px 원이라 폭 하한(180px) 밖 — 경고 면 위에서 같은 축(warning)으로 그린다. */
export const LimitsIndex = styled.span`
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 22px;
  height: 22px;
  border-radius: ${radius.pill};
  border: 1px solid ${color.warning};
  color: ${color.warning};
  font-family: ${font.dataNumeric};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  ${font.numeric}
`;

/* ── ② 합의 보드 — 시상대 + 순위표 (data 면) ───────────────────────────────── */

export const ConsensusSection = styled.section`
  display: grid;
  gap: ${space[5]};
  min-width: 0;
`;

/**
 * 정렬 토글 — 담은 인원 ↔ 신고 금액.
 * 🔴 두 기준은 **다른 이야기**를 한다(금액 순은 규모 큰 한 사람이 순위를 지배한다).
 * ⚠ 선택을 색으로만 말하지 않는다 — `aria-pressed` 와 굵기·면이 함께 진다.
 */
export const AggregateToggle = styled.div`
  display: inline-flex;
  gap: 2px;
  padding: 3px;
  border: 1px solid ${color.border};
  border-radius: ${radius.pill};
  background: ${color.surfaceSunken};
  align-self: end;
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

/**
 * **시상대** — 상위 3종만 타일로 크게 뽑는다.
 *
 * 왜 열 줄을 다 같은 크기로 두지 않는가: 1위와 10위가 같은 높이의 줄이면 "가장 많이 겹친 종목"이
 * 목록 안에 묻힌다. 이 섹션의 질문은 *"대가들이 공통으로 무엇을 담았나"* 하나뿐이고, 그 답은
 * 사실상 상위 몇 종이다. 나머지는 표로 내려가 **밀도**를 담당한다.
 */
export const PodiumGrid = styled.ol`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${PICK.gap};
  margin: 0;
  padding: 0;
  list-style: none;

  ${media.up('mobileWide')} {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  /*
   * 🔴 넓은 폭에서는 **1위 칸을 넓힌다.** 같은 폭 타일 셋은 "상위 3종"이 아니라 "동급 3개"로
   * 읽힌다 — 순위표에서 가장 중요한 사실은 1위라는 것이고, 비대칭이 그 사실을 말한다.
   * (숫자와 색으로도 이미 말하고 있으므로 폭은 세 번째 채널이다.)
   */
  ${media.up('headerStack')} {
    grid-template-columns: 1.3fr 1fr 1fr;
  }
`;

export const PodiumTile = styled.li`
  ${cardElevation('base')}
  display: grid;
  gap: ${space[4]};
  align-content: start;
  padding: ${DATA_SURFACE.pad};
  border-radius: ${DATA_RADIUS};
  --sb-inner-radius: ${radius.sm};
  min-width: 0;
`;

export const PodiumHead = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: ${space[3]};
  min-width: 0;
`;

/**
 * 시상대 순위 숫자. 1위만 액센트 축으로 올린다 — **색이 유일한 채널이 아니다**(글자가 이미 "1"이다).
 * 폭 <180px 이라 예산 밖(L1)이고, 배경을 채우지 않아 대비 계약도 건드리지 않는다.
 */
export const PodiumRank = styled.span<{ $lead: boolean }>`
  flex: 0 0 auto;
  color: ${({ $lead }) => ($lead ? color.accentAltText : color.textMuted)};
  font-family: ${font.dataNumeric};
  font-size: clamp(${font.size['3xl']}, 3.4vw, ${font.size['5xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.05em;
  line-height: 1;
  ${font.numeric}
`;

export const PodiumNames = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

export const PodiumTicker = styled.span`
  min-width: 0;
  overflow: hidden;
  color: ${color.text};
  font-family: ${font.display};
  /* 좁은 폭에서 한 단 줄인다 — "ALPHABET INC" 같은 긴 발행사명이 3열에서 잘리던 자리다(실측). */
  font-size: clamp(${font.size.lg}, 1.6vw, ${font.size.xl});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.02em;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const PodiumKorean = styled.span`
  min-width: 0;
  overflow: hidden;
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/** 인원 수 · 금액 두 값. 🔴 금액만 보면 "한 사람이 크게"와 "여럿이 나눠"가 구분되지 않는다. */
export const PodiumMetrics = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${space[2]};
  min-width: 0;
`;

export const PodiumMetric = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

export const PodiumMetricValue = styled.span<{ $align?: 'end' }>`
  color: ${color.text};
  font-family: ${font.dataNumeric};
  font-size: ${font.size['2xl']};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.02em;
  text-align: ${({ $align }) => ($align === 'end' ? 'right' : 'left')};
  ${font.numeric}
`;

export const PodiumMetricLabel = styled.span<{ $align?: 'end' }>`
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.medium};
  letter-spacing: 0.06em;
  text-align: ${({ $align }) => ($align === 'end' ? 'right' : 'left')};
`;

/**
 * 막대 트랙.
 * 🔴 높이는 `PICK.railHeight`(6px) 다. 8px 은 tintscan 의 면 하한과 **같은 값**이라
 *    막대 열 줄이 그대로 면 열 개로 세어진다(2026-08-03 이전의 실제 결함).
 */
export const Track = styled.div`
  position: relative;
  height: ${PICK.railHeight};
  border-radius: ${radius.pill};
  background: ${color.surfaceSunken};
  overflow: hidden;
`;

export const Bar = styled.div<{ $ratio: number; $color: string }>`
  height: 100%;
  border-radius: ${radius.pill};
  background: ${({ $color }) => $color};
  /* 0~1 을 폭으로 옮긴다. 1% 미만도 눈에 남게 최소 폭을 준다(0 은 0으로 둔다). */
  width: ${({ $ratio }) => ($ratio <= 0 ? '0' : `${Math.max(1.5, $ratio * 100)}%`)};
`;

/**
 * 🔴 **합산 표와 인물 카드를 잇는 다리.** 이 줄을 담은 사람들의 이니셜이 서고, 누르면 그 사람의
 * 보유 표가 열린다. 1차까지 두 블록은 같은 화면에 있으면서 서로를 전혀 몰랐다.
 */
export const HolderStrip = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${space[1]};
  min-width: 0;
`;

/**
 * 이니셜 칩. 26px 원이라 폭 하한(180px) 밖 — 인물 고유색을 예산 없이 쓰는 자리(L1).
 *
 * 🔴 면은 **16% 틴트 · 글자는 중립** 이다. 시리즈 색은 비텍스트 3:1 로만 검증된 색이라
 * (`contrast.test.ts`) 그 위에 글자를 얹으면 대비 계약 밖이 된다 — 모노그램 배지와 같은 처방.
 */
export const HolderChip = styled.button<{ $color: string }>`
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 26px;
  height: 26px;
  padding: 0;
  border-radius: ${radius.pill};
  border: 1px solid ${({ $color }) => $color};
  background: color-mix(in srgb, ${({ $color }) => $color} 16%, ${color.surface});
  color: ${color.text};
  font-family: inherit;
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.04em;
  cursor: pointer;

  &:hover {
    background: color-mix(in srgb, ${({ $color }) => $color} 30%, ${color.surface});
  }

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 2px;
  }
`;

export const HolderCount = styled.span`
  margin-left: ${space[1]};
  color: ${color.textMuted};
  font-family: ${font.dataNumeric};
  font-size: ${font.size['2xs']};
  white-space: nowrap;
  ${font.numeric}

  /* 좁은 폭에서는 줄바꿈을 허용한다 — 이 한 줄의 nowrap 이 순위표의 최소 폭을 25px 밀어 올렸다. */
  ${media.down('mobileWide')} {
    white-space: normal;
  }
`;

/**
 * 4위 이하 — **표**다. 시상대와 같은 카드로 열 줄을 세우면 스크롤만 길어지고, 순위 하위권에서
 * 사람들이 하는 일은 "훑어 읽기"라 행 높이가 낮은 표가 맞다.
 */
export const RankTableScroller = styled.div`
  overflow-x: auto;
  overscroll-behavior-x: contain;
  min-width: 0;
  ${subtleScrollbar}
`;

export const RankTable = styled.table`
  width: 100%;
  min-width: 460px;
  border-collapse: collapse;

  /*
   * 🔴 좁은 폭에서는 하한을 **풀고 여백도 조인다.** 막대 열을 숨겨 놓고 min-width 460px 을 그대로
   * 두면 표가 여전히 460px 을 요구해 390px 화면에서 금액 열이 가로 스크롤 뒤로 숨었다
   * (2026-08-03 실측: 스크롤러 366px < 표 460px). 열을 버리는 목적은 **스크롤을 없애는 것**이지
   * 줄이는 것이 아니다. 지금은 390px 에서 네 열이 그대로 보인다(320px 은 여전히 스크롤한다 —
   * 그 폭에서는 이 레포의 다른 표도 같은 처지라 표를 더 깎지 않는다).
   */
  ${media.down('mobileWide')} {
    min-width: 0;

    th,
    td {
      padding-left: ${space[2]};
      padding-right: ${space[2]};
    }
  }
`;

export const RankTh = styled.th`
  padding: ${space[2]} ${space[3]};
  border-bottom: 1px solid ${color.border};
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.08em;
  text-align: left;
  white-space: nowrap;
`;

export const RankThNumeric = styled(RankTh)`
  text-align: right;
`;

/** 좁은 폭에서는 막대 열을 접는다 — 표를 가로로 밀게 만드느니 장식을 먼저 버린다. */
export const RankThBar = styled(RankTh)`
  width: 26%;

  ${media.down('mobileWide')} {
    display: none;
  }
`;

export const RankRow = styled.tr`
  border-bottom: 1px solid ${color.border};

  &:last-of-type {
    border-bottom: 0;
  }

  &:hover {
    background: ${color.surfaceHover};
  }
`;

export const RankTd = styled.td`
  padding: ${space[3]};
  color: ${color.text};
  vertical-align: middle;
`;

export const RankTdNumeric = styled(RankTd)`
  text-align: right;
  font-family: ${font.dataNumeric};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;
  ${font.numeric}
`;

export const RankTdBar = styled(RankTd)`
  ${media.down('mobileWide')} {
    display: none;
  }
`;

/** 순위 칸. 표에서는 숫자만 두어도 열머리가 뜻을 말한다 — 원 배지를 겹치지 않는다. */
export const RankIndex = styled.td`
  padding: ${space[3]};
  width: 1%;
  color: ${color.textMuted};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.bold};
  text-align: right;
  white-space: nowrap;
  ${font.numeric}
`;

export const RankName = styled.span`
  display: block;
  min-width: 0;
  overflow: hidden;
  color: ${color.text};
  font-weight: ${font.weight.bold};
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const RankKorean = styled.span`
  display: block;
  min-width: 0;
  overflow: hidden;
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
  text-overflow: ellipsis;
  white-space: nowrap;
`;

/* ── ③ 인물 카드 격자 (brand 면) ───────────────────────────────────────────── */

export const PersonsSection = styled.section`
  display: grid;
  gap: ${space[5]};
  min-width: 0;
`;

/**
 * 인물 카드 격자 — **1 → 2 → 3열**.
 *
 * 1차까지는 넓은 화면에서도 2열이었다. 이유는 카드 안에 104px 도넛 + 세로 범례가 있어 3열이
 * 되면 도넛과 범례가 세로로 접혀 카드가 되레 길어졌기 때문이다. 그 제약을 **구성 표현을 바꿔서**
 * 없앴다 — 전폭 스택바 + 2열 범례는 좁은 칸에서도 눕지 않는다. 그래서 13장이 5줄에 들어온다.
 *
 * ⚠ 공용 `PickCardGrid`(auto-fill)를 쓰지 않는 이유는 마지막 줄에 한 장만 남았을 때 그 카드가
 *   열 폭 전체로 늘어나 격자가 어긋나기 때문이다. 명시적 열 수가 이 화면에는 맞다.
 * ⚠ 간격은 `PICK.gap` — 부상 그림자(blur 12px)가 12px 간격에서 옆 카드에 닿는다.
 */
export const CardGrid = styled.ul`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: ${PICK.gap};
  margin: 0;
  padding: 0;
  list-style: none;

  ${media.up('tabletSm')} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  ${media.up('headerStack')} {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

/**
 * 격자 한 칸.
 *
 * 🔴 **드로어는 카드 *밖*, 이 칸 안에 있다.** `PickCard` 는 hover/focus 에서 `transform` 을 쓰므로
 * 스태킹 컨텍스트이자 `position: fixed` 자손의 컨테이닝 블록이 된다 — 카드 안에 드로어를 두면
 * 열리는 순간 전폭 패널이 카드 좌표계에 갇힌다. 이 칸은 transform 이 없어 안전하다.
 */
export const CardItem = styled.li`
  display: grid;
  min-width: 0;
`;

/**
 * 인물 모노그램 — `PickCard` 의 40px 글리프 배지 안을 **가득** 채운다.
 *
 * ⚠ 사진이 아니다. 실존 인물 사진은 대부분 저작권이 있어 13명을 자유 라이선스로 채울 수 없다.
 * 🔴 면은 16% 틴트 · 글자는 중립 `text` · 테두리만 시리즈 솔리드다 — 시리즈 색은 비텍스트 3:1
 *    로만 검증된 색이라 그 위의 텍스트는 대비 계약 밖이다(`contrast.test.ts`).
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
 * 자료가 오래됐다는 **짧은 배지**.
 * 🔴 문장 전체를 경고 면에 담으면 폭 534px 짜리 틴트 면이 되어 라우트 상한을 깬다(실측).
 *    그래서 **색은 배지가, 문장은 중립 텍스트가** 진다 — 숨긴 것은 없다.
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

/** 오래된 자료의 **문장**. ⚠ "청산했다"가 아니라 "공시가 확인되지 않는다"까지만 말한다. */
export const StaleLine = styled.p`
  margin: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
  font-weight: ${font.weight.semibold};
  line-height: ${font.leading.snug};
`;

export const PersonNote = styled.p`
  margin: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
  line-height: ${font.leading.snug};
`;

/**
 * 🔴 **카드 본문의 위계를 만드는 자리.**
 *
 * 1차까지 기준일·규모·종목 수는 **같은 크기의 칩 세 개**였다. 셋이 같은 무게면 위계가 없고,
 * 열세 장이 전부 같은 회색 덩어리로 읽힌다. 인물끼리 실제로 갈리는 값은 **규모** 하나이므로
 * 그것만 30px 숫자로 세우고, 기준일은 그 숫자의 캡션으로 붙인다(둘은 한 사실이다).
 */
export const Figure = styled.div`
  display: grid;
  gap: 2px;
  padding-top: ${space[3]};
  border-top: 1px solid ${color.border};
  min-width: 0;
`;

export const FigureValue = styled.strong`
  color: ${color.text};
  font-family: ${font.dataNumeric};
  font-size: clamp(${font.size['3xl']}, 2.6vw, ${font.size['4xl']});
  font-weight: ${font.weight.extrabold};
  letter-spacing: -0.04em;
  line-height: 1.05;
  ${font.numeric}
`;

/** 🔴 기준일은 **인물마다 다르다** — 전역 하나로 묶으면 거짓이 된다. 그래서 숫자에 붙여 둔다. */
export const FigureCaption = styled.span`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: ${space[1]};
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.medium};
`;

/** 보유 종목 수 + 옵션 표시. 규모 아래에 한 줄로 눕는 보조 사실들이다. */
export const MetaLine = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${space[2]};
  min-width: 0;
  color: ${color.textSecondary};
  font-size: ${font.size['2xs']};
`;

/**
 * 옵션이 섞였다는 표시.
 *
 * 🔴 `position: relative; z-index: 1` 은 장식이 아니다. `PickCard` 의 스트레치 컨트롤은
 *    의사요소(inset 0)로 카드 전체를 덮으므로, 그냥 두면 이 칩 위의 마우스가 카드 버튼에 먹혀
 *    `title` 말풍선이 절대 뜨지 않는다(2026-08-03 elementFromPoint 실측).
 * ⚠ 손익색을 쓰지 않는다 — 옵션은 "손실"이 아니라 포지션의 종류다.
 */
export const OptionChip = styled.span`
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: ${space[1]};
  padding: 1px ${space[2]};
  border: 1px dashed ${color.accentAltText};
  border-radius: ${radius.pill};
  background: ${color.accentAltSubtle};
  color: ${color.accentAltText};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  white-space: nowrap;
`;

/* ── 구성 스택바 + 범례 (도넛을 대체한 자리) ───────────────────────────────── */

/**
 * 🔴 **도넛을 스택바로 바꾼 이유** — 정보가 아니라 형태의 문제다.
 *
 * 104px 도넛 + 세로 범례는 카드 폭의 3분의 1을 차지하면서 카드 높이를 220px 밀어 올렸다.
 * 그래서 3열 격자가 불가능했고, 열세 장이 일곱 줄로 늘어져 **모든 카드가 똑같아 보였다.**
 * 전폭 스택바는 같은 값(상위 N종 + 그 밖)을 폭으로 말하고 높이를 6px 만 쓴다 — 카드가 낮아지고,
 * 나란히 선 세 장의 띠를 **가로로 비교**할 수 있게 된다(도넛 세 개는 비교가 안 된다).
 *
 * 🔴 정보는 하나도 줄지 않았다: 종목명과 퍼센트는 아래 범례가 그대로 글자로 말하고,
 *    풋·콜 배지도 범례에 그대로 선다. 띠는 그걸 거들 뿐이라 `aria-hidden` 이다.
 */
export const Composition = styled.div`
  display: grid;
  gap: ${space[2]};
  margin-top: ${space[3]};
  padding: ${space[3]};
  border-radius: ${nestedRadius(radius.md)};
  background: ${color.surfaceSunken};
  min-width: 0;
`;

/**
 * 스택바. 🔴 높이 6px 은 협상 대상이 아니다 — 8px 이 되는 순간 큰 조각(버리의 팔란티어 66%)이
 * 폭 180px 을 넘어 **면으로 세어진다**. 조각마다 색이 달라 클러스터로 접히지도 않는다.
 */
export const CompositionTrack = styled.div`
  display: flex;
  gap: 1px;
  height: ${PICK.railHeight};
  border-radius: ${radius.pill};
  background: ${color.surface};
  overflow: hidden;
`;

export const CompositionSegment = styled.span<{ $percent: number; $color: string }>`
  flex: 0 0 auto;
  width: ${({ $percent }) => `${Math.max(0.6, $percent)}%`};
  background: ${({ $color }) => $color};
`;

/**
 * 범례 — **2열**. 세로 한 줄이면 7항목이 카드 높이를 지배한다.
 * 🔴 색이 유일한 채널이 아니다: 이름과 퍼센트를 글자가 말하고 점은 띠와 이어 주기만 한다.
 */
export const CompositionLegend = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(126px, 1fr));
  gap: 2px ${space[3]};
  margin: 0;
  padding: 0;
  min-width: 0;
  list-style: none;
`;

export const CompositionLegendItem = styled.li`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: ${space[2]};
  min-width: 0;
  font-size: ${font.size.xs};
`;

export const LegendDot = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
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
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  ${font.numeric}
`;

/** 비중을 몰라 띠를 못 그릴 때. 🔴 빈 띠를 그리지 않는다 — 0% 로 읽힌다. */
export const CompositionNote = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size.xs};
`;

/**
 * 🔴 **포지션 종류 배지(풋·콜) — 이 화면의 정정 장치.**
 *
 * 풋은 보유가 아니라 하락 베팅이다. 배지가 없으면 버리의 팔란티어 66% 가 "최대 보유 종목"으로
 * 읽힌다(실제로는 정반대). 장식이 아니라 **틀린 읽기를 막는 최소 장치**다.
 *
 * 🔴 색이 유일한 채널이 아니다 — 안의 글자("풋"·"콜")가 정보를 진다.
 * ⚠ 손익색을 쓰지 않는다. 풋이 "손실"이 아니고 콜이 "이익"도 아니다 — 둘 다 포지션의 종류다.
 * ⚠ 두 색 쌍 모두 contrast.test.ts 가 이미 검증하는 것만 쓴다.
 */
export const KindBadge = styled.span<{ $kind: 'put' | 'call' }>`
  /*
   * 🔴 이 배지는 카드 범례와 보유 표(드로어) 양쪽에 선다. 카드 안쪽은 PickCard 의 스트레치 컨트롤
   * 의사요소가 덮고 있어, 한 단 올리지 않으면 범례에서 title 설명에 마우스가 닿지 않는다.
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

/**
 * 비교 화면으로 넘기는 링크.
 * ⚠ 공용 `Button` 에 `as={Link}` 를 쓸 수 없다 — 버튼처럼 보이되 실제로는 링크라서
 *   새 탭 열기·주소 복사가 그대로 된다(버튼으로 만들면 그 둘을 잃는다).
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

/* ── ④ 보유 표 (드로어 안) ─────────────────────────────────────────────────── */

/**
 * 드로어 머리의 요약 3칸. 표만 덩그러니 열리면 "누구의 언제 기준 자료인가"를 제목 한 줄이
 * 혼자 지고, 표를 스크롤하는 순간 그 맥락이 화면에서 사라진다.
 */
export const DrawerSummary = styled.dl`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${space[3]};
  margin: 0 0 ${space[4]};
  padding-bottom: ${space[4]};
  border-bottom: 1px solid ${color.border};
`;

export const DrawerSummaryItem = styled.div`
  display: grid;
  gap: 2px;
  min-width: 0;
`;

export const DrawerSummaryLabel = styled.dt`
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.medium};
  letter-spacing: 0.06em;
`;

export const DrawerSummaryValue = styled.dd`
  margin: 0;
  min-width: 0;
  overflow: hidden;
  color: ${color.text};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.md};
  font-weight: ${font.weight.bold};
  text-overflow: ellipsis;
  white-space: nowrap;
  ${font.numeric}
`;

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
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.08em;
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
  font-weight: ${font.weight.semibold};
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

/* ── ⑤ 빈 상태 · 각주 ──────────────────────────────────────────────────────── */

/**
 * 🔴 **빈 상태** — 1차까지 없던 화면이다.
 *
 * 면은 **중립**이다. 예산이 이미 2면(히어로 + 경고 밴드)으로 차 있어 brand 틴트 면을 세울 수 없다.
 * 대신 마스코트 라인아트가 `color.identity` 로 서서 "고장이 아니라 비어 있음"을 말한다
 * (BrandGlyph 는 브랜드 표면 전용이고 빈 상태가 그 자리다 — 데이터 표면엔 쓰지 않는다).
 */
export const EmptyPanel = styled.section`
  display: grid;
  justify-items: center;
  gap: ${space[3]};
  padding: clamp(32px, 6vw, 64px) ${DATA_SURFACE.pad};
  border: 1px dashed ${color.border};
  border-radius: ${DATA_RADIUS};
  background: ${color.surfaceSunken};
  text-align: center;
  color: ${color.identity};
`;

/**
 * 빈 상태 제목 — 전 화면 공통 곡선 `clamp(2xl, 2.6vw, 4xl)`(20~30px).
 * 종전 `sectionTitleFontSize`(16~18px)는 카드 제목과 같은 단이라, 화면에 이 문장 하나뿐인
 * 상황에서도 아무것도 앞서 읽히지 않았다. 시뮬레이터·캘린더·포트폴리오의 빈 상태와 같은 단으로 맞춘다.
 */
export const EmptyTitle = styled.h2`
  margin: 0;
  color: ${color.text};
  font-family: ${font.display};
  font-size: clamp(${font.size['2xl']}, 2.6vw, ${font.size['4xl']});
  font-weight: ${font.weight.bold};
  letter-spacing: -0.02em;
`;

export const EmptyBody = styled.p`
  margin: 0;
  max-width: 40ch;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
`;

/** 합산할 것이 없을 때. 표 자리에 빈 표를 세우지 않는다. */
export const InlineEmpty = styled.p`
  margin: 0;
  padding: ${space[6]} 0;
  color: ${color.textMuted};
  font-size: ${font.size.sm};
  text-align: center;
`;

/**
 * 면책·출처. 🔴 카드에서 **선 하나**로 내렸다 — 이 줄은 읽히는 것이 아니라 있어야 하는 것이고,
 * 침강 카드로 두면 화면 끝에 또 하나의 블록이 서서 마지막 인상이 회색 상자가 된다.
 */
export const FootNoteRow = styled.div`
  display: grid;
  gap: ${space[1]};
  padding-top: ${space[4]};
  border-top: 1px solid ${color.border};
  min-width: 0;
`;

export const FootNote = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
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

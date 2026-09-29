import styled from '@emotion/styled';
import {
  DATA_RADIUS,
  PICK,
  PICK_RADIUS,
  cardElevation,
  color,
  font,
  hitAreaWithin,
  inputSurface,
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
 * `/ticker/overlap` 의 스타일 — **종목 비교(`/ticker/compare`)와 같은 문법**을 쓴다.
 *
 * - 고르는 면(검색·바구니)은 brand 면: `PICK_RADIUS` + `cardElevation('base')`.
 * - 결론(중복률)은 비교 화면의 결론 블록과 같은 모양: 가라앉은 중립 면 + 상단 6px hue 리본 + 화면 유일 hero 숫자.
 * - 종목 색은 `assignSeries` 한 벌이 바구니 귀 → 매트릭스 머리 → 종목 행의 점 세 곳을 관통한다.
 *
 * 🔴 하드코딩 hex 금지 — 토큰만. 새 색 토큰을 만들지 않는다.
 * 🔴 색이 유일한 채널이 되지 않는다 — 중복률 증감은 부호 글자가, 보유 여부는 점의 채움/테두리 + 낭독 문구가 진다.
 * 🔴 손익색(dataPositive/Negative)을 쓰지 않는다 — 겹침이 느는 것은 손실이 아니라 사실이다.
 *    "몰림"은 warning 계열 하나로만 말한다.
 * ⚠ styled 템플릿 안 주석에 백틱을 쓰지 마라 — 템플릿이 그 자리에서 끊긴다.
 */

const VERDICT_PAD = 'clamp(18px, 2.2vw, 26px)';

/* ── 화면 골격 ─────────────────────────────────────────────────────────────── */

export const Stack = styled.div`
  display: grid;
  gap: clamp(20px, 3.2vw, 34px);
  min-width: 0;
`;

/**
 * 고르기(왼쪽) ↔ 바구니·결론(오른쪽). 좁은 폭에서는 위아래로 쌓인다 —
 * 그때는 바구니·결론이 **먼저** 온다: 담은 결과가 먼저 보여야 "담을 때마다 바뀐다"가 읽힌다.
 */
export const Workbench = styled.div`
  display: grid;
  gap: clamp(16px, 2.4vw, 24px);
  min-width: 0;

  ${media.up('layout')} {
    grid-template-columns: minmax(300px, 380px) minmax(0, 1fr);
    align-items: start;
  }
`;

export const PickerColumn = styled.div`
  order: 2;
  min-width: 0;

  ${media.up('layout')} {
    order: 1;
    position: sticky;
    top: ${space[4]};
  }
`;

export const ResultColumn = styled.div`
  order: 1;
  display: grid;
  gap: clamp(16px, 2.4vw, 24px);
  min-width: 0;

  ${media.up('layout')} {
    order: 2;
  }
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

/* ── 고르는 면(검색 · 바구니) ───────────────────────────────────────────────── */

export const PickSurface = styled.section`
  ${cardElevation('base')}
  ${surface(PICK_RADIUS, PICK.pad)}
  display: grid;
  gap: ${space[4]};
  min-width: 0;
`;

export const SurfaceHead = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${space[3]};
  min-width: 0;
`;

export const SurfaceTitle = styled.h2`
  margin: 0;
  color: ${color.text};
  font-size: ${sectionTitleFontSize};
  font-weight: ${font.weight.bold};
  letter-spacing: -0.01em;
`;

export const SurfaceCount = styled.p`
  margin: 0;
  color: ${color.textSecondary};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;
  ${font.numeric}
`;

export const SearchInput = styled.input`
  ${inputSurface}

  &:focus-visible {
    outline: 2px solid ${color.focusRing};
    outline-offset: 1px;
  }
`;

export const PickerHint = styled.p`
  margin: 0;
  min-width: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
`;

export const ListTitle = styled.h3`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  letter-spacing: 0.12em;
`;

export const CandidateList = styled.ul`
  display: grid;
  gap: ${space[2]};
  margin: 0;
  padding: 0;
  list-style: none;
  min-width: 0;
`;

export const CandidateItem = styled.li<{ $inBasket: boolean }>`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: ${space[1]} ${space[3]};
  padding: ${space[2]} ${space[2]} ${space[2]} ${space[3]};
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${({ $inBasket }) => ($inBasket ? color.surfaceSunken : color.surface)};
  min-width: 0;
`;

export const CandidateBody = styled.div`
  display: grid;
  gap: 1px;
  min-width: 0;
`;

export const CandidateTicker = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${space[2]};
  color: ${color.text};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.md};
  font-weight: ${font.weight.bold};
  letter-spacing: 0.01em;
  ${font.numeric}
`;

export const CandidateName = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  line-height: ${font.leading.tight};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
`;

export const CandidateActions = styled.div`
  display: grid;
  justify-items: end;
  gap: ${space[1]};
`;

/**
 * "담으면 몇 %p" 미리보기. 늘면 warning 계열, 줄거나 그대로면 중립 — 부호는 글자로 함께 붙는다.
 * 높이 20px 안팎의 알약이라 면이 아니다(tintscan 면 판정 밖).
 */
export const PreviewChip = styled.span<{ $tone: 'up' | 'down' | 'flat' }>`
  padding: 1px ${space[2]};
  border-radius: ${radius.pill};
  font-family: ${font.dataNumeric};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  white-space: nowrap;
  ${font.numeric}
  color: ${({ $tone }) => ($tone === 'up' ? color.warning : color.textSecondary)};
  background: ${({ $tone }) => ($tone === 'up' ? color.warningSurface : color.surfaceMuted)};
`;

export const UnavailableTag = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  white-space: nowrap;
`;

/** 종목 색 점. 채움 = 보유, 테두리만 = 미보유. 뜻은 늘 낭독 문구가 함께 진다. */
export const SeriesDot = styled.span<{ $series: string; $off?: boolean }>`
  display: inline-block;
  flex: none;
  width: 10px;
  height: 10px;
  border-radius: ${radius.pill};
  background: ${({ $series, $off }) => ($off ? 'transparent' : $series)};
  box-shadow: ${({ $off }) => ($off ? `inset 0 0 0 1.5px ${color.borderStrong}` : 'none')};
`;

/* ── 바구니 ───────────────────────────────────────────────────────────────── */

export const SlotGrid = styled.ul`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${space[2]};
  margin: 0;
  padding: 0;
  list-style: none;
  min-width: 0;

  ${media.up('mobileWide')} {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
`;

/** 담은 ETF 한 자리 — 비교 화면의 슬롯과 같은 모양(왼쪽 3px 귀가 종목 색). */
export const Slot = styled.li<{ $series: string }>`
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: ${space[1]};
  overflow: hidden;
  padding: ${space[2]} ${space[1]} ${space[2]} ${space[3]};
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surface};
  min-width: 0;
  animation: overlap-slot-in ${motion.base} ${motion.ease};

  &::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 3px;
    background: ${({ $series }) => $series};
  }

  @keyframes overlap-slot-in {
    from {
      opacity: 0;
      transform: scale(0.94);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const SlotBody = styled.div`
  display: grid;
  gap: 1px;
  min-width: 0;
`;

export const SlotTicker = styled.span`
  color: ${color.text};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.md};
  font-weight: ${font.weight.bold};
  ${font.numeric}
`;

export const SlotMeta = styled.span`
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  line-height: ${font.leading.tight};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
`;

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

/* ── 결론(중복률) ─────────────────────────────────────────────────────────── */

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

export const VerdictBody = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: ${space[4]} clamp(16px, 3vw, 28px);
  min-width: 0;

  ${media.down('mobile')} {
    grid-template-columns: minmax(0, 1fr);
    justify-items: start;
  }
`;

/** 링 게이지. 값은 옆 숫자가 말하고, 링은 크기 감각만 준다(그래서 낭독에서 감춘다). */
export const Gauge = styled.div`
  position: relative;
  width: clamp(120px, 18vw, 148px);
  aspect-ratio: 1;
  max-width: 100%;

  svg {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg);
  }
`;

export const GaugeTrack = styled.circle`
  fill: none;
  stroke: ${color.progressTrack};
`;

export const GaugeFill = styled.circle<{ $high: boolean }>`
  fill: none;
  stroke: ${({ $high }) => ($high ? color.warning : color.brand)};
  stroke-linecap: round;
  transition:
    stroke-dashoffset 600ms cubic-bezier(0.2, 0.8, 0.2, 1),
    stroke ${motion.base} ${motion.ease};

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const GaugeCenter = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  text-align: center;
`;

export const VerdictEyebrow = styled.h2`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  font-weight: ${font.weight.semibold};
  letter-spacing: 0.12em;
`;

/** 화면에서 가장 큰 숫자 — 이 화면에서 heroNumeric 의 한 곳은 여기다. */
export const VerdictValue = styled.p`
  margin: 0;
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 2px;
  color: ${color.text};
  font-family: ${font.heroNumeric};
  font-size: clamp(24px, 3.2vw, 32px);
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

export const VerdictText = styled.div`
  display: grid;
  gap: ${space[2]};
  justify-items: start;
  min-width: 0;
`;

/** 방금 한 동작과 그 결과. 값이 바뀔 때마다 다시 튀어나오도록 호출부가 key 를 바꾼다. */
export const DeltaChip = styled.p<{ $tone: 'up' | 'down' | 'flat' }>`
  margin: 0;
  padding: 2px ${space[3]};
  border-radius: ${radius.pill};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  ${font.numeric}
  color: ${({ $tone }) => ($tone === 'up' ? color.warning : color.textSecondary)};
  background: ${({ $tone }) => ($tone === 'up' ? color.warningSurface : color.surface)};
  border: 1px solid ${({ $tone }) => ($tone === 'up' ? 'transparent' : color.border)};
  animation: overlap-delta-in ${motion.base} ${motion.ease};

  @keyframes overlap-delta-in {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const VerdictSentence = styled.p`
  margin: 0;
  color: ${color.text};
  font-size: ${font.size.lg};
  font-weight: ${font.weight.medium};
  line-height: ${font.leading.snug};
  min-width: 0;
`;

export const VerdictNote = styled.p`
  margin: 0;
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
  line-height: ${font.leading.normal};
  min-width: 0;
`;

export const StatGrid = styled.dl`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: ${space[2]};
  margin: 0;
  min-width: 0;

  ${media.down('mobile')} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const Stat = styled.div`
  display: grid;
  gap: 2px;
  padding: ${space[2]} ${space[3]};
  border: 1px solid ${color.border};
  border-radius: ${radius.md};
  background: ${color.surface};
  min-width: 0;

  dt {
    color: ${color.textMuted};
    font-size: ${font.size['2xs']};
  }

  dd {
    margin: 0;
    color: ${color.text};
    font-family: ${font.dataNumeric};
    font-size: ${font.size.lg};
    font-weight: ${font.weight.bold};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    ${font.numeric}
  }
`;

/* ── 매트릭스 ─────────────────────────────────────────────────────────────── */

export const MatrixScroller = styled.div`
  overflow-x: auto;
  ${subtleScrollbar}
  min-width: 0;
`;

export const MatrixTable = styled.table`
  border-collapse: separate;
  border-spacing: ${space[1]};
  margin: 0 calc(-1 * ${space[1]});
`;

export const MatrixHead = styled.th<{ $series: string }>`
  padding: ${space[1]} ${space[2]};
  color: ${color.textSecondary};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  text-align: left;
  white-space: nowrap;
  ${font.numeric}

  &::before {
    content: '';
    display: inline-block;
    width: 8px;
    height: 8px;
    margin-right: 6px;
    border-radius: ${radius.pill};
    background: ${({ $series }) => $series};
  }
`;

/**
 * 짝 한 칸. 진하기가 겹침 크기다(최대 45% 섞음 — 그 위로 가면 다크 테마에서 글자 대비가 무너진다).
 * 칸 폭이 180px 미만이라 tintscan 의 면이 아니다.
 */
export const MatrixCell = styled.td<{ $intensity: number }>`
  min-width: 72px;
  height: 52px;
  padding: ${space[1]} ${space[2]};
  border-radius: ${radius.sm};
  background: ${({ $intensity }) =>
    `color-mix(in srgb, ${color.warning} ${Math.round(Math.min(0.45, Math.max(0, $intensity)) * 100)}%, ${color.surface})`};
  color: ${color.text};
  text-align: center;
  vertical-align: middle;
  transition: background ${motion.base} ${motion.ease};

  strong {
    display: block;
    font-family: ${font.dataNumeric};
    font-size: ${font.size.md};
    font-weight: ${font.weight.bold};
    ${font.numeric}
  }

  span {
    color: ${color.textSecondary};
    font-size: ${font.size['2xs']};
  }
`;

export const MatrixSelf = styled.td`
  min-width: 72px;
  height: 52px;
  border-radius: ${radius.sm};
  background: ${color.surfaceSunken};
  color: ${color.textMuted};
  font-size: ${font.size['2xs']};
  text-align: center;
`;

export const SectionHint = styled.p`
  margin: ${space[3]} 0 0;
  color: ${color.textSecondary};
  font-size: ${font.size.xs};
  line-height: ${font.leading.normal};
`;

export const EmptyNote = styled.p`
  margin: 0;
  color: ${color.textMuted};
  font-size: ${font.size.sm};
  line-height: ${font.leading.snug};
`;

/* ── 종목별 중복 ──────────────────────────────────────────────────────────── */

export const StockList = styled.ul`
  display: grid;
  gap: ${space[1]};
  margin: 0;
  padding: 0;
  list-style: none;
  min-width: 0;
`;

/** 겹치는 종목은 가라앉은 면으로 한 덩어리가 되고, 한 곳에만 있는 종목은 면 없이 그 아래 선다. */
export const StockRow = styled.li<{ $shared: boolean }>`
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) auto minmax(72px, 1fr) 60px;
  align-items: center;
  gap: ${space[3]};
  padding: ${space[2]} ${space[3]};
  border-radius: ${radius.md};
  background: ${({ $shared }) => ($shared ? color.surfaceSunken : 'transparent')};
  min-width: 0;

  ${media.down('mobile')} {
    grid-template-columns: minmax(0, 1fr) auto 56px;
  }
`;

export const StockName = styled.div`
  display: grid;
  gap: 1px;
  min-width: 0;

  strong {
    color: ${color.text};
    font-size: ${font.size.sm};
    font-weight: ${font.weight.semibold};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    color: ${color.textMuted};
    font-family: ${font.dataNumeric};
    font-size: ${font.size['2xs']};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    ${font.numeric}
  }
`;

export const HolderDots = styled.span`
  display: inline-flex;
  gap: 3px;
`;

export const ExposureBar = styled.span`
  display: block;
  height: 6px;
  overflow: hidden;
  border-radius: ${radius.pill};
  background: ${color.progressTrack};

  ${media.down('mobile')} {
    display: none;
  }
`;

export const ExposureFill = styled.span<{ $shared: boolean; $ratio: number }>`
  display: block;
  width: ${({ $ratio }) => `${Math.round(Math.min(1, Math.max(0, $ratio)) * 1000) / 10}%`};
  height: 100%;
  border-radius: ${radius.pill};
  background: ${({ $shared }) => ($shared ? color.warning : color.textMuted)};
  transition: width 500ms cubic-bezier(0.2, 0.8, 0.2, 1);

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const ExposureValue = styled.span`
  color: ${color.text};
  font-family: ${font.dataNumeric};
  font-size: ${font.size.sm};
  font-weight: ${font.weight.semibold};
  text-align: right;
  ${font.numeric}
`;

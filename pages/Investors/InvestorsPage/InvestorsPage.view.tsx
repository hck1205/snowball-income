import { useId, useState } from 'react';
import { AlertTriangle, Users } from 'lucide-react';
import { Button, PageHero, SideDrawer, Tooltip } from '@/components/common';
import { CHART_SERIES_VARS, color } from '@/shared/styles';
import { INVESTORS_COPY } from '../copy';
import {
  DONUT_CIRCUMFERENCE,
  aggregateHoldings,
  buildDonutSlices,
  comparableTickers,
  formatUsdCompact,
  monogram,
  personColorVar
} from '../utils';
import type { AggregateSort, AggregatedHolding, InvestorCardModel, InvestorHoldingRow } from '../utils';
import type { InvestorsViewProps } from './InvestorsPage.types';
import {
  AggregateBar,
  AggregateBlock,
  AggregateHead,
  AggregateHeader,
  AggregateHeading,
  AggregateList,
  AggregateMeta,
  AggregateName,
  AggregateRow,
  AggregateSubtitle,
  AggregateTitle,
  AggregateToggle,
  AggregateToggleButton,
  AggregateTrack,
  Avatar,
  CardActions,
  CardGrid,
  CardHead,
  CompareLink,
  DelayBody,
  DelayHeadline,
  DelayNotice,
  Donut,
  DonutLayout,
  DonutLegend,
  DonutLegendItem,
  DonutNote,
  DrawerNote,
  FirmName,
  HeadText,
  KindBadge,
  LegendDot,
  LegendName,
  LegendValue,
  FootNote,
  InvestorCard,
  LimitsBlock,
  LimitsList,
  LimitsTitle,
  MetaRow,
  MetaValue,
  IssuerName,
  KoreanName,
  KindHelpButton,
  PersonName,
  PersonNote,
  Stack,
  StaleBadge,
  Table,
  TableScroller,
  Td,
  TdNumeric,
  Th,
  ThNumeric,
  UnknownCell,
  VisuallyHidden
} from './InvestorsPage.styled';

const copy = INVESTORS_COPY;

/** 비교 화면으로 넘길 때 담는 종목 수. 비교 화면 상한(4종)과 같게 둔다. */
const COMPARE_LIMIT = 4;

/**
 * 도넛에 이름을 붙여 그리는 조각 수. 나머지는 "그 밖" 한 조각으로 합친다.
 *
 * 6종인 이유는 팔레트가 8색이라 8을 넘기면 색이 되돌아 같은 색 조각이 두 개 생기고, 범례가
 * 카드 높이를 지배하기 시작하기 때문이다. 상위 6종이면 대개 신고분의 절반 이상이 덮인다.
 */
const DONUT_SLICE_LIMIT = 6;

/** 합산 막대에 세우는 종목 수. 10줄이면 화면 한 눈에 들어오고 그 아래는 꼬리가 길어 의미가 옅다. */
const AGGREGATE_LIMIT = 10;

/**
 * 🔴 포지션 종류 배지. 주식에는 붙이지 않는다 — 기본값에 이름표를 달면 옵션 배지가 묻힌다.
 * 이 배지가 없으면 풋(하락 베팅)이 "최대 보유 종목"으로 읽힌다(2026-08-02 마이클 버리 실측).
 */
function KindMark({ kind }: { kind: InvestorHoldingRow['kind'] }) {
  if (kind === 'share') return null;
  const mark = copy.kind[kind];
  return (
    <KindBadge $kind={kind} title={mark.description}>
      {mark.label}
    </KindBadge>
  );
}

/**
 * 보유 종목 표 — **드로어 안**에서 연다(2026-08-02 사용자 지시).
 *
 * 카드 안에서 접었다 펴던 것을 옮긴 이유: 카드가 2열 격자라 표가 펼쳐지면 그 카드만 세로로 길어져
 * 옆 카드와 어긋나고 격자가 깨졌다. 드로어는 카드 높이를 **전혀 건드리지 않는다**.
 *
 * ⚠ 껍데기를 새로 만들지 않는다 — 공용 `SideDrawer` 를 쓴다. 이 레포는 드로어 껍데기를 복제했다가
 *   `useOverlayEscape` 를 빠뜨려 중첩 Escape 스택 밖으로 나간 이력이 있다(PickerDrawer 주석).
 * ⚠ `dimBelow="always"` — "열어서 보고 돌아온다"는 한 갈래 동선이다(설정 드로어의 딤 OFF 정책은
 *   "만지면서 결과를 본다"는 그 화면만의 것이다).
 */
function HoldingsTable({ card }: { card: InvestorCardModel }) {
  return (
    <TableScroller>
      <Table>
        <caption>
          <VisuallyHidden>{copy.holdings.caption(card.person)}</VisuallyHidden>
        </caption>
        <thead>
          <tr>
            <Th scope="col">{copy.holdings.issuerHeader}</Th>
            <ThNumeric scope="col">{copy.holdings.weightHeader}</ThNumeric>
            <ThNumeric scope="col">{copy.holdings.dividendHeader}</ThNumeric>
          </tr>
        </thead>
        <tbody>
          {card.holdings.map((row) => (
            <tr key={`${row.cusip}:${row.kind}`}>
              <Td>
                <IssuerName>
                  {row.ticker ?? row.issuer}
                  <KindMark kind={row.kind} />
                </IssuerName>
                {/* 매핑된 종목만 한글명을 안다. 없으면 공시 이름 하나로 끝낸다. */}
                {row.koreanName ? <KoreanName>{row.koreanName}</KoreanName> : null}
              </Td>
              <TdNumeric>{row.weightPercent === null ? '-' : `${row.weightPercent.toFixed(1)}%`}</TdNumeric>
              <TdNumeric>
                {/* 🔴 매핑이 없으면 "배당 없음"이 아니라 "자료 없음"이다 — 모르는 것과 없는 것은 다르다. */}
                {row.dividendYieldPercent === null ? (
                  <UnknownCell title={copy.holdings.notInUniverseHint}>{copy.holdings.notInUniverse}</UnknownCell>
                ) : (
                  `${row.dividendYieldPercent.toFixed(2)}%`
                )}
              </TdNumeric>
            </tr>
          ))}
        </tbody>
      </Table>
    </TableScroller>
  );
}

/**
 * 대가들이 함께 담은 종목 — 화면 최상단의 가로 막대(2026-08-02 사용자 지시).
 *
 * 🔴 막대는 **신고 금액 합**이지 비중(%)의 합이 아니다. 그리고 **주식 보유분만** 센다 —
 * 근거는 `aggregateHoldings` 주석(풋을 보유로 세면 방향이 뒤집힌다).
 */
function AggregateChart({ rows }: { rows: readonly AggregatedHolding[] }) {
  if (rows.length === 0) return <DonutNote>{copy.aggregate.empty}</DonutNote>;

  return (
    <AggregateList>
      {rows.map((row, index) => (
        <AggregateRow key={row.cusip}>
          <AggregateHead>
            <AggregateName>
              {row.label}
              {row.koreanName ? ` · ${row.koreanName}` : ''}
            </AggregateName>
            {/* 🔴 금액만으로는 "한 사람이 크게"와 "여럿이 나눠"가 구분되지 않는다 — 인원 수를 함께 말한다. */}
            <AggregateMeta>
              {formatUsdCompact(row.totalValueUsd)} · {copy.aggregate.holderCount(row.holderCount)}
            </AggregateMeta>
          </AggregateHead>
          <AggregateTrack>
            <AggregateBar
              $ratio={row.ratio}
              $color={CHART_SERIES_VARS[index % CHART_SERIES_VARS.length] ?? color.accent}
            />
          </AggregateTrack>
        </AggregateRow>
      ))}
    </AggregateList>
  );
}

/**
 * 상위 보유 비중 도넛 + 범례.
 *
 * 🔴 **표를 펼치지 않아도 보인다.** 이 화면에서 사람들이 알고 싶은 것은 "무엇을 얼마나 들었나"인데,
 * 그게 접힌 표 안에만 있으면 열세 장의 카드가 전부 똑같아 보인다(2026-08-02 사용자 지시).
 * 표는 배당률까지 보고 싶을 때 여는 것으로 남는다.
 *
 * 🔴 색이 유일한 채널이 아니다 — 범례가 종목명과 퍼센트를 **글자로** 말하고, 도넛은 그것을 거든다.
 * 그래서 도넛 자체는 `aria-hidden` 이다(범례가 같은 내용을 이미 읽어 준다 — 두 번 읽히면 소음이다).
 */
function HoldingsDonut({ card }: { card: InvestorCardModel }) {
  const slices = buildDonutSlices(card.holdings, {
    seriesVars: CHART_SERIES_VARS,
    maxSlices: DONUT_SLICE_LIMIT,
    restLabel: copy.donut.restLabel,
    restColorVar: color.border
  });

  // 비중을 하나도 모르면 빈 도넛을 그리지 않는다 — 없는 것을 그리면 0% 로 읽힌다.
  if (slices.length === 0 || (slices.length === 1 && slices[0]?.key === '__rest__')) {
    return <DonutNote>{copy.donut.unavailable}</DonutNote>;
  }

  return (
    <DonutLayout>
      {/* viewBox 반지름 15.9155 = 100/2π → 둘레가 정확히 100 이라 조각 값이 곧 퍼센트다. */}
      <Donut viewBox="0 0 40 40" role="presentation" aria-hidden focusable={false}>
        {slices.map((slice) => (
          <circle
            key={slice.key}
            cx="20"
            cy="20"
            r="15.9155"
            fill="none"
            stroke={slice.colorVar}
            strokeWidth="7"
            strokeDasharray={`${slice.dash} ${DONUT_CIRCUMFERENCE - slice.dash}`}
            strokeDashoffset={-slice.offset}
          />
        ))}
      </Donut>

      <DonutLegend aria-label={copy.donut.ariaLabel(card.person)}>
        {slices.map((slice) => (
          <DonutLegendItem key={`${slice.key}:${slice.kind}`}>
            <LegendDot $color={slice.colorVar} aria-hidden />
            <LegendName>
              {slice.label}
              <KindMark kind={slice.kind} />
            </LegendName>
            <LegendValue>{slice.percent.toFixed(1)}%</LegendValue>
          </DonutLegendItem>
        ))}
      </DonutLegend>
    </DonutLayout>
  );
}

function InvestorEntry({ card }: { card: InvestorCardModel }) {
  const [isOpen, setIsOpen] = useState(false);
  const drawerId = useId();
  const tickers = comparableTickers(card, COMPARE_LIMIT);
  const hasOptions = card.holdings.some((row) => row.kind !== 'share');

  return (
    <InvestorCard>
      <CardHead>
        {/* ⚠ 사진이 아니라 이니셜 도형이다 — 사유는 Avatar 주석. */}
        <Avatar $color={personColorVar(card.person, CHART_SERIES_VARS)} aria-hidden>
          {monogram(card.person)}
        </Avatar>
        <HeadText>
          <PersonName>{card.person}</PersonName>
          <FirmName>{card.firm}</FirmName>
        </HeadText>
        {/* ⚠ "청산했다"가 아니라 "공시가 확인되지 않는다"까지만 말한다 — 아는 것이 거기까지다. */}
        {card.isStale ? <StaleBadge>{copy.card.stale}</StaleBadge> : null}
      </CardHead>

      <PersonNote>{card.note}</PersonNote>

      <MetaRow>
        {/* 🔴 기준일은 인물마다 다르다. 전역 하나로 묶지 마라. */}
        <span>{copy.card.asOf(card.reportDate)}</span>
        <span>
          {copy.card.totalValue('')}
          <MetaValue>{formatUsdCompact(card.totalValueUsd)}</MetaValue>
        </span>
        <span>{copy.card.holdingCount(card.totalHoldingCount, card.holdings.length)}</span>
        {/* 🔴 높이를 먹지 않는 자리에 둔다 — 문장으로 두면 이 카드만 길어져 2열 격자가 깨진다. */}
        {hasOptions ? (
          <Tooltip content={copy.kind.mixedNote}>
            <KindHelpButton type="button" aria-label={copy.kind.mixedNoteLabel}>
              ?
            </KindHelpButton>
          </Tooltip>
        ) : null}
      </MetaRow>

      <HoldingsDonut card={card} />

      <CardActions>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          aria-expanded={isOpen}
          aria-controls={drawerId}
          onClick={() => setIsOpen(true)}
        >
          {copy.card.open}
        </Button>

        {/* 매핑된 종목이 2개 이상일 때만 — 비교는 2종부터 성립한다. */}
        {tickers.length >= 2 ? (
          <CompareLink to={`/ticker/compare?t=${tickers.join(',')}`}>{copy.holdings.compareAction}</CompareLink>
        ) : null}
      </CardActions>

      {/* 🔴 드로어는 카드 높이를 건드리지 않는다 — 2열 격자가 흔들리지 않는 이유가 이것이다. */}
      <SideDrawer
        id={drawerId}
        side="right"
        isOpen={isOpen}
        title={copy.holdings.caption(card.person)}
        closeLabel={copy.card.close}
        onClose={() => setIsOpen(false)}
        width="min(520px, 94vw)"
        dimBelow="always"
      >
        <HoldingsTable card={card} />
        {/* 드로어 안은 폭·높이에 여유가 있어 문장 그대로 둔다 — 카드에서만 아이콘으로 접었다. */}
        {hasOptions ? <DrawerNote>{copy.kind.mixedNote}</DrawerNote> : null}
      </SideDrawer>
    </InvestorCard>
  );
}

export default function InvestorsView({ viewModel }: InvestorsViewProps) {
  /* 🔴 기본은 **담은 인원 수**다(2026-08-02 사용자 지시) — 금액 순은 규모 큰 한 사람이 순위를 지배한다. */
  const [sort, setSort] = useState<AggregateSort>('holders');
  const aggregated = aggregateHoldings(viewModel.cards, AGGREGATE_LIMIT, sort);

  return (
    <Stack>
      <PageHero
        icon={<Users size={20} strokeWidth={1.8} aria-hidden focusable={false} />}
        title={copy.hero.title}
        titleAs="h1"
        lede={copy.hero.lede}
      />

      {/*
        🔴 지연 경고는 목록에서 **꺼내** 맨 위에 세운다(2026-08-02 사용자 지시).
        나머지 한계와 같은 크기로 나열되면 이 화면이 "지금 보유"로 읽힌다 — 그게 유일한 실질 위험이다.
        색은 거들 뿐이고, 굵은 제목 줄과 경고 아이콘이 회색조에서도 남는다.
      */}
      <DelayNotice>
        <DelayHeadline>
          <AlertTriangle size={16} strokeWidth={1.8} aria-hidden focusable={false} />
          {copy.limits.delayHeadline}
        </DelayHeadline>
        <DelayBody>{copy.limits.delayBody}</DelayBody>
      </DelayNotice>

      {/* 🔴 접지 않는다 — 이 데이터의 성질이라 상시로 보여야 한다. */}
      <LimitsBlock aria-labelledby="investor-limits">
        <LimitsTitle id="investor-limits">{copy.limits.title}</LimitsTitle>
        <LimitsList>
          {copy.limits.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </LimitsList>
      </LimitsBlock>

      {/*
        🔴 합산 막대는 **개별 카드보다 위**다(2026-08-02 사용자 지시). 열세 명을 각각 보기 전에
        "이 사람들이 공통으로 담은 것"을 먼저 보는 것이 이 화면의 첫 질문이다.
      */}
      <AggregateBlock aria-labelledby="investor-aggregate">
        <AggregateHeader>
          <AggregateHeading>
            <AggregateTitle id="investor-aggregate">{copy.aggregate.title}</AggregateTitle>
            <AggregateSubtitle>{copy.aggregate.subtitle}</AggregateSubtitle>
          </AggregateHeading>

          {/* 두 기준은 **다른 이야기**를 한다 — 하나를 다른 하나의 근사로 읽지 않게 이름을 그대로 쓴다. */}
          <AggregateToggle role="group" aria-label={copy.aggregate.sortLabel}>
          <AggregateToggleButton
            type="button"
            $selected={sort === 'holders'}
            aria-pressed={sort === 'holders'}
            onClick={() => setSort('holders')}
          >
            {copy.aggregate.sortHolders}
          </AggregateToggleButton>
          <AggregateToggleButton
            type="button"
            $selected={sort === 'value'}
            aria-pressed={sort === 'value'}
            onClick={() => setSort('value')}
          >
            {copy.aggregate.sortValue}
          </AggregateToggleButton>
          </AggregateToggle>
        </AggregateHeader>

        <AggregateChart rows={aggregated} />
      </AggregateBlock>

      <CardGrid>
        {viewModel.cards.map((card) => (
          <InvestorEntry key={card.cik} card={card} />
        ))}
      </CardGrid>

      <FootNote>{copy.footnote.source(viewModel.generatedAt)}</FootNote>
      <FootNote>{copy.footnote.disclaimer}</FootNote>
    </Stack>
  );
}

import { useCallback, useId, useMemo, useState } from 'react';
import { AlertTriangle, Users } from 'lucide-react';
import { BrandGlyph, Button, PageFooter, PageHero, PickCard, SideDrawer } from '@/components/common';
import { assignSeries } from '@/shared/lib/tickerSeries';
import { CHART_SERIES_VARS, ICON, color } from '@/shared/styles';
import { INVESTORS_COPY } from '../copy';
import {
  aggregateHoldings,
  buildDonutSlices,
  comparableTickers,
  cssVarName,
  formatUsdCompact,
  monogram,
  personColorVar
} from '../utils';
import type {
  AggregateHolder,
  AggregateSort,
  AggregatedHolding,
  InvestorCardModel,
  InvestorHoldingRow
} from '../utils';
import type { InvestorsViewProps } from './InvestorsPage.types';
import {
  AggregateToggle,
  AggregateToggleButton,
  Bar,
  CardGrid,
  CardItem,
  CompareLink,
  Composition,
  CompositionLegend,
  CompositionLegendItem,
  CompositionNote,
  CompositionSegment,
  CompositionTrack,
  ConsensusSection,
  DelayBody,
  DelayCell,
  DelayHeadline,
  DelayIcon,
  DelayText,
  DrawerNote,
  DrawerSummary,
  DrawerSummaryItem,
  DrawerSummaryLabel,
  DrawerSummaryValue,
  EmptyBody,
  EmptyPanel,
  EmptyTitle,
  Eyebrow,
  Figure,
  FigureCaption,
  FigureValue,
  FootNote,
  FootNoteRow,
  HolderChip,
  HolderCount,
  HolderStrip,
  InlineEmpty,
  IssuerName,
  KindBadge,
  KoreanName,
  LegendDot,
  LegendName,
  LegendValue,
  LimitsCell,
  LimitsHeading,
  LimitsIndex,
  LimitsItem,
  LimitsLede,
  LimitsList,
  MetaLine,
  Monogram,
  OptionChip,
  PersonNote,
  PersonsSection,
  PodiumGrid,
  PodiumHead,
  PodiumKorean,
  PodiumMetric,
  PodiumMetricLabel,
  PodiumMetricValue,
  PodiumMetrics,
  PodiumNames,
  PodiumRank,
  PodiumTicker,
  PodiumTile,
  RankIndex,
  RankKorean,
  RankName,
  RankRow,
  RankTable,
  RankTableScroller,
  RankTd,
  RankTdBar,
  RankTdNumeric,
  RankTh,
  RankThBar,
  RankThNumeric,
  ReadFirstBand,
  SectionHead,
  SectionHeading,
  SectionSubtitle,
  SectionTitle,
  Stack,
  StaleBadge,
  StaleLine,
  Table,
  TableScroller,
  Td,
  TdNumeric,
  Th,
  ThNumeric,
  Track,
  UnknownCell,
  VisuallyHidden
} from './styled';

const copy = INVESTORS_COPY;

/** 비교 화면으로 넘길 때 담는 종목 수. 비교 화면 상한(4종)과 같게 둔다. */
const COMPARE_LIMIT = 4;

/**
 * 구성 띠에 이름을 붙여 그리는 조각 수. 나머지는 "그 밖" 한 조각으로 합친다.
 *
 * 6종인 이유는 팔레트가 8색이라 8을 넘기면 색이 되돌아 같은 색 조각이 두 개 생기고, 범례가
 * 카드 높이를 지배하기 시작하기 때문이다. 상위 6종이면 대개 신고분의 절반 이상이 덮인다.
 */
const COMPOSITION_SLICE_LIMIT = 6;

/** 합산에 세우는 종목 수. 상위 3종은 시상대 타일, 나머지는 표로 내려간다. */
const AGGREGATE_LIMIT = 10;

/** 시상대에 타일로 올리는 종목 수. 4위부터는 밀도가 다른 표가 받는다. */
const PODIUM_SIZE = 3;

/**
 * 인물 이름 → 고유색.
 *
 * 🔴 **한 함수로 묶는 이유는 색이 이 화면의 길찾기 단서이기 때문이다**(2026-08-03 2차 개편).
 * 합산 줄의 이니셜 칩과 그 사람 카드 머리의 6px 레일이 **같은 색**이어야 "이 칩이 저 카드"로
 * 읽힌다. 두 자리가 각자 색을 계산하면 언젠가 반드시 갈린다.
 */
type PersonColor = (person: string) => string;

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
 * 🔴 **합산 줄과 인물 카드를 잇는 다리**(2026-08-03 2차 개편).
 *
 * 1차까지 이 두 블록은 같은 화면에 있으면서 서로를 전혀 몰랐다 — "6명이 담았다"를 보고도 *누가*
 * 담았는지 알려면 카드 열세 장을 눈으로 훑어야 했다. 이니셜 칩이 그 여섯 명의 이름을 지고,
 * 누르면 그 사람의 보유 표가 곧바로 열린다(드로어는 인물 카드가 소유하고 열림만 위에서 온다).
 *
 * ⚠ 색은 페이지가 배정한 인물 고유색이라 그 사람 카드 머리의 6px 레일과 **같은 색**이다 —
 *   칩과 카드가 눈으로 이어진다. 그래도 색이 유일한 채널은 아니다: 칩 안에 이니셜이 있고
 *   `aria-label` 이 이름을 그대로 읽는다(팔레트 8색 < 인물 13명이라 색은 반드시 겹친다).
 */
function HolderChips({
  holders,
  colorOf,
  onOpen
}: {
  holders: readonly AggregateHolder[];
  colorOf: PersonColor;
  onOpen: (cik: string) => void;
}) {
  return (
    <HolderStrip>
      {holders.map((holder) => (
        <HolderChip
          key={holder.cik}
          type="button"
          $color={colorOf(holder.person)}
          title={holder.person}
          aria-label={copy.aggregate.openHolder(holder.person)}
          onClick={() => onOpen(holder.cik)}
        >
          {monogram(holder.person)}
        </HolderChip>
      ))}
      <HolderCount>{copy.aggregate.holderCount(holders.length)}</HolderCount>
    </HolderStrip>
  );
}

/**
 * **합의 보드** — 대가들이 함께 담은 종목.
 *
 * 🔴 밀도를 **둘로 나눈다**(2026-08-03 2차 개편). 1차까지는 열 줄이 전부 같은 크기의 막대였고,
 * 그래서 1위와 10위가 같은 무게로 읽혔다. 이 섹션의 질문은 *"공통으로 무엇을 담았나"* 하나뿐이라
 * 답에 해당하는 상위 3종은 **타일로 크게**, 나머지는 훑어 읽는 **표로 촘촘하게** 둔다.
 *
 * 🔴 막대 길이는 **신고 금액 합**(또는 인원 수)이지 비중(%)의 합이 아니다 — 근거는
 * `aggregateHoldings` 주석(규모가 1,000배 차이 나는 사람들의 퍼센트를 더하면 뜻이 없다).
 */
function ConsensusBoard({
  rows,
  sortLabel,
  personColorOf,
  onOpenPerson
}: {
  rows: readonly AggregatedHolding[];
  /** 지금 켜진 정렬 기준의 이름. 🔴 시상대 캡션이 이 값을 말해야 타일과 문장이 어긋나지 않는다. */
  sortLabel: string;
  personColorOf: PersonColor;
  onOpenPerson: (cik: string) => void;
}) {
  /* 🔴 종목 색은 `assignSeries` 가 준다 — 한 화면 안에서 같은 색이 두 번 나오면 "이 색이 그 종목"
     이라는 단서가 거짓말이 된다(index % 8 을 손으로 쓰던 자리를 이 단일 원천으로 옮겼다). */
  const seriesByLabel = useMemo(() => assignSeries(rows.map((row) => row.label)), [rows]);
  const colorFor = (label: string) => seriesByLabel.get(label) ?? color.accent;

  if (rows.length === 0) return <InlineEmpty>{copy.aggregate.empty}</InlineEmpty>;

  const podium = rows.slice(0, PODIUM_SIZE);
  const rest = rows.slice(PODIUM_SIZE);

  return (
    <>
      <Eyebrow>{copy.aggregate.podiumCaption(sortLabel)}</Eyebrow>

      <PodiumGrid>
        {podium.map((row, index) => (
          <PodiumTile key={row.cusip}>
            <PodiumHead>
              {/* 순위는 숫자가 스스로 말한다 — 1위만 색을 한 단 올리되 색이 유일한 채널은 아니다. */}
              <PodiumRank $lead={index === 0} aria-label={copy.aggregate.rankLabel(index + 1)}>
                {index + 1}
              </PodiumRank>
              <PodiumNames>
                <PodiumTicker>{row.label}</PodiumTicker>
                {row.koreanName ? <PodiumKorean>{row.koreanName}</PodiumKorean> : null}
              </PodiumNames>
            </PodiumHead>

            <PodiumMetrics>
              <PodiumMetric>
                <PodiumMetricValue>{row.holderCount}</PodiumMetricValue>
                <PodiumMetricLabel>{copy.aggregate.holdersHeader}</PodiumMetricLabel>
              </PodiumMetric>
              <PodiumMetric>
                <PodiumMetricValue $align="end">{formatUsdCompact(row.totalValueUsd)}</PodiumMetricValue>
                <PodiumMetricLabel $align="end">{copy.aggregate.valueHeader}</PodiumMetricLabel>
              </PodiumMetric>
            </PodiumMetrics>

            <Track aria-hidden>
              <Bar $ratio={row.ratio} $color={colorFor(row.label)} />
            </Track>

            <HolderChips holders={row.holders} colorOf={personColorOf} onOpen={onOpenPerson} />
          </PodiumTile>
        ))}
      </PodiumGrid>

      {rest.length > 0 ? (
        <RankTableScroller>
          <RankTable>
            <caption>
              <VisuallyHidden>{copy.aggregate.tableCaption}</VisuallyHidden>
            </caption>
            <thead>
              <tr>
                <RankTh scope="col">{copy.aggregate.rankHeader}</RankTh>
                <RankTh scope="col">{copy.aggregate.tickerHeader}</RankTh>
                <RankTh scope="col">{copy.aggregate.holdersOfLabel}</RankTh>
                <RankThNumeric scope="col">{copy.aggregate.valueHeader}</RankThNumeric>
                <RankThBar scope="col">{copy.aggregate.barHeader}</RankThBar>
              </tr>
            </thead>
            <tbody>
              {rest.map((row, index) => (
                <RankRow key={row.cusip}>
                  <RankIndex>{index + PODIUM_SIZE + 1}</RankIndex>
                  <RankTd>
                    <RankName>{row.label}</RankName>
                    {row.koreanName ? <RankKorean>{row.koreanName}</RankKorean> : null}
                  </RankTd>
                  <RankTd>
                    <HolderChips holders={row.holders} colorOf={personColorOf} onOpen={onOpenPerson} />
                  </RankTd>
                  <RankTdNumeric>{formatUsdCompact(row.totalValueUsd)}</RankTdNumeric>
                  <RankTdBar>
                    <Track aria-hidden>
                      <Bar $ratio={row.ratio} $color={colorFor(row.label)} />
                    </Track>
                  </RankTdBar>
                </RankRow>
              ))}
            </tbody>
          </RankTable>
        </RankTableScroller>
      ) : null}
    </>
  );
}

/**
 * 상위 보유 구성 — **전폭 스택바 + 2열 범례**(2026-08-03 2차 개편에서 도넛을 대체).
 *
 * 🔴 정보는 하나도 줄지 않았다. 종목명·퍼센트·풋콜 배지는 범례가 **글자로** 그대로 말하고,
 * 띠는 그것을 거들 뿐이라 `aria-hidden` 이다(같은 내용이 두 번 읽히면 소음이다).
 * 바꾼 것은 **형태**다 — 도넛+세로범례가 카드 높이를 220px 밀어 올려 3열 격자를 막고 있었고,
 * 원 열세 개는 나란히 놓아도 서로 비교되지 않는다. 띠는 가로로 비교된다.
 *
 * 🔴 상위 N종을 100% 로 다시 나누지 않는다 — 남는 몫은 "그 밖" 조각으로 정직하게 남긴다.
 */
function CompositionBar({ card }: { card: InvestorCardModel }) {
  const slices = buildDonutSlices(card.holdings, {
    seriesVars: CHART_SERIES_VARS,
    maxSlices: COMPOSITION_SLICE_LIMIT,
    restLabel: copy.donut.restLabel,
    restColorVar: color.border
  });

  // 비중을 하나도 모르면 빈 띠를 그리지 않는다 — 없는 것을 그리면 0% 로 읽힌다.
  if (slices.length === 0 || (slices.length === 1 && slices[0]?.key === '__rest__')) {
    return (
      <Composition>
        <CompositionNote>{copy.donut.unavailable}</CompositionNote>
      </Composition>
    );
  }

  return (
    <Composition>
      <Eyebrow>{copy.card.compositionLabel}</Eyebrow>

      <CompositionTrack aria-hidden>
        {slices.map((slice) => (
          <CompositionSegment key={slice.key} $percent={slice.percent} $color={slice.colorVar} />
        ))}
      </CompositionTrack>

      <CompositionLegend aria-label={copy.donut.ariaLabel(card.person)}>
        {slices.map((slice) => (
          <CompositionLegendItem key={`${slice.key}:${slice.kind}`}>
            <LegendDot $color={slice.colorVar} aria-hidden />
            <LegendName>
              {slice.label}
              <KindMark kind={slice.kind} />
            </LegendName>
            <LegendValue>{slice.percent.toFixed(1)}%</LegendValue>
          </CompositionLegendItem>
        ))}
      </CompositionLegend>
    </Composition>
  );
}

/**
 * 보유 종목 표 — **드로어 안**에서 연다.
 *
 * 카드 안에서 접었다 펴던 것을 옮긴 이유: 카드가 격자라 표가 펼쳐지면 그 카드만 세로로 길어져
 * 옆 카드와 어긋나고 격자가 깨졌다. 드로어는 카드 높이를 **전혀 건드리지 않는다**.
 *
 * ⚠ 껍데기를 새로 만들지 않는다 — 공용 `SideDrawer` 를 쓴다(복제했다가 `useOverlayEscape` 를
 *   빠뜨려 중첩 Escape 스택 밖으로 나간 이력이 있다).
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
 * 인물 한 장 — **고르는 면(brand)** 이다. 공용 `PickCard` 로 그린다.
 *
 * ## 🔴 2차 개편에서 바꾼 것은 위계다
 * 1차까지 카드 본문은 *설명 문장 → 칩 세 개(기준일·규모·종목수) → 도넛 패널* 이었고 셋의 무게가
 * 같았다. 위계가 없으면 열세 장이 전부 같은 회색 덩어리로 읽힌다. 지금은:
 *   ① 이름(제목)  ② **신고 금액 30px 숫자**(인물끼리 실제로 갈리는 유일한 값)
 *   ③ 그 숫자의 캡션인 기준일  ④ 종목 수·옵션 표시 한 줄  ⑤ 구성 띠
 * 기준일이 캡션이 된 것은 강등이 아니다 — 규모와 기준일은 **한 사실**이라("언제 기준의 얼마인가")
 * 붙어 있는 편이 정확하다. 🔴 인물마다 다른 값이므로 전역 하나로 묶는 것은 여전히 금지다.
 *
 * ## 드로어의 열림은 위에서 온다
 * 합산 보드의 이니셜 칩도 같은 드로어를 열어야 하므로 열림 상태는 페이지가 갖는다. 다만 드로어
 * **자체는 이 칸이 소유한다** — `PickCard` 는 hover 에서 `transform` 을 쓰므로 카드 안에 두면
 * `position: fixed` 패널이 카드 좌표계에 갇힌다.
 *
 * ## 카드 안에 버튼을 넣는 자리
 * 카드 전체를 덮는 스트레치 컨트롤 **위**로 뜨는 슬롯은 `titleRight` 와 `actions` 뿐이다.
 */
function InvestorEntry({
  card,
  personColorOf,
  isOpen,
  onOpen,
  onClose
}: {
  card: InvestorCardModel;
  personColorOf: PersonColor;
  isOpen: boolean;
  onOpen: (cik: string) => void;
  onClose: () => void;
}) {
  const drawerId = useId();
  const tickers = comparableTickers(card, COMPARE_LIMIT);
  const hasOptions = card.holdings.some((row) => row.kind !== 'share');
  const personColor = personColorOf(card.person);

  return (
    <CardItem>
      <PickCard
        as="div"
        titleAs="h3"
        title={card.person}
        subtitle={card.firm}
        ariaLabel={copy.card.openFor(card.person)}
        onClick={() => onOpen(card.cik)}
        cap={{
          kind: 'rail',
          axis: 'scoped',
          scopedVar: cssVarName(personColor),
          /* ⚠ BrandGlyph 를 쓰지 않는다 — 여기서 글리프의 목적은 브랜드가 아니라 **인물 구분**이다. */
          glyph: <Monogram $color={personColor}>{monogram(card.person)}</Monogram>
        }}
        /* ⚠ "청산했다"가 아니라 "공시가 확인되지 않는다"까지만 말한다 — 아는 것이 거기까지다.
           배지는 색 신호만 지고, 문장은 아래 본문에 중립 텍스트로 그대로 남는다. */
        titleRight={
          card.isStale ? (
            <StaleBadge>
              <AlertTriangle size={ICON.xs} strokeWidth={ICON.stroke} aria-hidden focusable={false} />
              {copy.card.staleBadge}
            </StaleBadge>
          ) : undefined
        }
        actions={
          <>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              aria-expanded={isOpen}
              aria-controls={drawerId}
              onClick={() => onOpen(card.cik)}
            >
              {copy.card.open}
            </Button>

            {/* 매핑된 종목이 2개 이상일 때만 — 비교는 2종부터 성립한다. */}
            {tickers.length >= 2 ? (
              <CompareLink to={`/ticker/compare?t=${tickers.join(',')}`}>{copy.holdings.compareAction}</CompareLink>
            ) : null}
          </>
        }
      >
        <PersonNote>{card.note}</PersonNote>

        {/* 🔴 배지만 남기고 이 문장을 지우지 마라 — 배지는 색을, 이 줄은 사실을 진다. */}
        {card.isStale ? <StaleLine>{copy.card.stale}</StaleLine> : null}

        <Figure>
          <FigureValue>{formatUsdCompact(card.totalValueUsd)}</FigureValue>
          {/*
            🔴 기준일은 인물마다 다르다. 전역 하나로 묶지 마라.
            ⚠ 라벨과 기준일을 **각자의 span** 으로 나눈다 — 한 노드에 이어 붙이면 "2026-03-31 기준"
              이라는 사실이 다른 글자와 섞인 문자열이 되어 따로 집어낼 수 없다(테스트도 사용자도).
          */}
          <FigureCaption>
            <span>{copy.card.valueLabel}</span>
            <span aria-hidden>·</span>
            <span>{copy.card.asOf(card.reportDate)}</span>
          </FigureCaption>
        </Figure>

        <MetaLine>
          <span>{copy.card.holdingCount(card.totalHoldingCount, card.holdings.length)}</span>
          {/* 🔴 옵션 혼재는 글자로 상시 노출한다 — 말풍선은 카드의 overflow 에 잘린다(카피 주석 참고). */}
          {hasOptions ? <OptionChip title={copy.kind.mixedNote}>{copy.kind.mixedChip}</OptionChip> : null}
        </MetaLine>

        <CompositionBar card={card} />
      </PickCard>

      {/* 🔴 카드 밖이다 — 위 주석의 컨테이닝 블록 함정. */}
      <SideDrawer
        id={drawerId}
        side="right"
        isOpen={isOpen}
        title={copy.holdings.caption(card.person)}
        closeLabel={copy.card.close}
        onClose={onClose}
        width="min(520px, 94vw)"
        dimBelow="always"
      >
        {/* 표를 스크롤하면 제목이 눈에서 사라진다 — 누구의 언제 기준 자료인지 요약이 함께 선다. */}
        <DrawerSummary>
          <DrawerSummaryItem>
            <DrawerSummaryLabel>{copy.holdings.summaryAsOf}</DrawerSummaryLabel>
            <DrawerSummaryValue>{card.reportDate}</DrawerSummaryValue>
          </DrawerSummaryItem>
          <DrawerSummaryItem>
            <DrawerSummaryLabel>{copy.holdings.summaryValue}</DrawerSummaryLabel>
            <DrawerSummaryValue>{formatUsdCompact(card.totalValueUsd)}</DrawerSummaryValue>
          </DrawerSummaryItem>
          <DrawerSummaryItem>
            <DrawerSummaryLabel>{copy.holdings.summaryCount}</DrawerSummaryLabel>
            <DrawerSummaryValue>{card.totalHoldingCount}</DrawerSummaryValue>
          </DrawerSummaryItem>
        </DrawerSummary>

        <HoldingsTable card={card} />
        {/* 드로어 안은 폭·높이에 여유가 있어 문장 그대로 둔다 — 카드에서는 짧은 표시로 접었다. */}
        {hasOptions ? <DrawerNote>{copy.kind.mixedNote}</DrawerNote> : null}
      </SideDrawer>
    </CardItem>
  );
}

export default function InvestorsView({ viewModel }: InvestorsViewProps) {
  /* 🔴 기본은 **담은 인원 수**다 — 금액 순은 규모 큰 한 사람이 순위를 지배한다. */
  const [sort, setSort] = useState<AggregateSort>('holders');
  /**
   * 열려 있는 인물의 cik.
   *
   * 🔴 드로어 상태를 카드에서 **페이지로 올렸다**(2026-08-03 2차 개편). 합산 보드의 이니셜 칩이
   * 같은 드로어를 열어야 하기 때문이다 — 이 한 줄이 "합산 표 ↔ 인물 카드" 관계를 성립시킨다.
   * 한 번에 하나만 열린다는 뜻이기도 하다(예전에는 카드마다 독립이라 여러 장이 동시에 열릴 수 있었다).
   */
  const [openCik, setOpenCik] = useState<string | null>(null);
  const closeDrawer = useCallback(() => setOpenCik(null), []);

  /**
   * 🔴 인물 색은 **화면 전체가 한 번에** 배정한다(`assignSeries`).
   *
   * 종전에는 이름 해시 한 겹(`personColorVar`)이라 열세 명 중 여럿이 같은 색을 받았다. 색이
   * 단순한 장식이던 시절엔 허용된 트레이드오프였지만, 이제 색이 **"이 칩이 저 카드"** 라는
   * 길찾기 단서를 지므로 같은 색이 여럿이면 그 단서가 거짓말이 된다. 두 겹 배정은 집합 안에서
   * 충돌을 피한다(팔레트가 8색이라 13명째부터는 어쩔 수 없이 겹치고, 그때는 이니셜이 가른다).
   * ⚠ 팔레트에 없는 이름이 들어오면 예전 규칙으로 떨어진다 — 색이 빈 칩을 만들지 않는다.
   */
  const personColors = useMemo(
    () => assignSeries(viewModel.cards.map((card) => card.person)),
    [viewModel.cards]
  );
  const personColorOf = useCallback<PersonColor>(
    (person) => personColors.get(person) ?? personColorVar(person, CHART_SERIES_VARS),
    [personColors]
  );

  const aggregated = aggregateHoldings(viewModel.cards, AGGREGATE_LIMIT, sort);
  const isEmpty = viewModel.cards.length === 0;

  return (
    <Stack>
      <PageHero
        icon={<Users size={ICON.xl} strokeWidth={ICON.stroke} aria-hidden focusable={false} />}
        title={copy.hero.title}
        titleAs="h1"
        lede={copy.hero.lede}
        /* 출처·수집일은 히어로의 근거 줄이 갖는다 — 각주 두 줄이 화면 맨 아래 회색으로 묻히던 자리다. */
        meta={copy.footnote.source(viewModel.generatedAt)}
      />

      {/*
        🔴 지연 경고와 한계 고지를 **한 밴드**로 합쳤다(2026-08-03 2차 개편).
        나란히 선 두 블록은 서로의 무게를 깎는다 — 하나로 묶고 왼쪽 셀만 크게 두면 밴드 전체가
        경고로 읽힌다. 톤은 낮추지 않았다: 제목을 lg → clamp(xl~3xl) 로 올렸고 글리프도 키웠다.
        색은 거들 뿐이고, 굵은 제목 줄과 경고 아이콘이 회색조에서도 남는다.
      */}
      <ReadFirstBand>
        <DelayCell>
          <DelayIcon aria-hidden>
            <AlertTriangle size={ICON.xl} strokeWidth={ICON.stroke} focusable={false} />
          </DelayIcon>
          <DelayText>
            <DelayHeadline>{copy.limits.delayHeadline}</DelayHeadline>
            <DelayBody>{copy.limits.delayBody}</DelayBody>
          </DelayText>
        </DelayCell>

        {/* 🔴 접지 않는다 — 이 데이터의 성질이라 상시로 보여야 한다. */}
        <LimitsCell>
          <LimitsHeading id="investor-limits">{copy.limits.title}</LimitsHeading>
          {/* 🔴 이 줄이 세 항목을 "전제"로 규정한다 — 목록만 두면 참고 사항으로 읽힌다. */}
          <LimitsLede>{copy.limits.subtitle}</LimitsLede>
          <LimitsList aria-labelledby="investor-limits">
            {copy.limits.items.map((item, index) => (
              <LimitsItem key={item}>
                <LimitsIndex aria-hidden>{index + 1}</LimitsIndex>
                <span>{item}</span>
              </LimitsItem>
            ))}
          </LimitsList>
        </LimitsCell>
      </ReadFirstBand>

      {isEmpty ? (
        <EmptyPanel>
          {/* 빈 상태 마스코트는 96 — 다른 화면의 빈 상태와 같은 계단을 쓴다. */}
          <BrandGlyph size={96} />
          <EmptyTitle>{copy.empty.title}</EmptyTitle>
          <EmptyBody>{copy.empty.body}</EmptyBody>
        </EmptyPanel>
      ) : (
        <>
          {/*
            🔴 합산은 **개별 카드보다 위**다. 열세 명을 각각 보기 전에 "이 사람들이 공통으로 담은 것"을
            먼저 보는 것이 이 화면의 첫 질문이고, 그 답에서 인물 카드로 건너뛸 수 있어야 한다.
          */}
          <ConsensusSection aria-labelledby="investor-aggregate">
            <SectionHead>
              <SectionHeading $axis="accentAlt">
                <SectionTitle id="investor-aggregate">{copy.aggregate.title}</SectionTitle>
                {/* 🔴 "주식만 세었다"는 사실을 제목 바로 밑에 둔다 — 각주로 내리면 아무도 안 읽는다. */}
                <SectionSubtitle>{copy.aggregate.subtitle}</SectionSubtitle>
              </SectionHeading>

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
            </SectionHead>

            <ConsensusBoard
              rows={aggregated}
              sortLabel={sort === 'holders' ? copy.aggregate.sortHolders : copy.aggregate.sortValue}
              personColorOf={personColorOf}
              onOpenPerson={setOpenCik}
            />
          </ConsensusSection>

          <PersonsSection aria-labelledby="investor-persons">
            <SectionHead>
              <SectionHeading $axis="brand">
                <SectionTitle id="investor-persons">{copy.persons.title}</SectionTitle>
                <SectionSubtitle>{copy.persons.subtitle}</SectionSubtitle>
              </SectionHeading>
            </SectionHead>

            <CardGrid>
              {viewModel.cards.map((card) => (
                <InvestorEntry
                  key={card.cik}
                  card={card}
                  personColorOf={personColorOf}
                  isOpen={openCik === card.cik}
                  onOpen={setOpenCik}
                  onClose={closeDrawer}
                />
              ))}
            </CardGrid>
          </PersonsSection>
        </>
      )}

      <FootNoteRow>
        <FootNote>{copy.footnote.disclaimer}</FootNote>
      </FootNoteRow>

      {/* 🔴 이 화면에만 푸터가 없었다(2026-08-04 실측: 21개 라우트 중 여기만 근거 없는 결손).
          사용자 지시 "모든 페이지에 footer가 존재하게 해줘" — 셸의 슬롯으로 착지하므로
          여기 두어도 `<main>` 밖에 서고 contentinfo 랜드마크가 살아 있다. */}
      <PageFooter />
    </Stack>
  );
}

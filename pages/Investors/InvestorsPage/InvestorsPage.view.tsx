import { useId, useState } from 'react';
import { AlertTriangle, Users } from 'lucide-react';
import { Button, PageHero, PickCard, SideDrawer } from '@/components/common';
import { CHART_SERIES_VARS, ICON, color } from '@/shared/styles';
import { INVESTORS_COPY } from '../copy';
import {
  DONUT_CIRCUMFERENCE,
  aggregateHoldings,
  buildDonutSlices,
  comparableTickers,
  cssVarName,
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
  AggregateList,
  AggregateMeta,
  AggregateName,
  AggregateRank,
  AggregateRow,
  AggregateToggle,
  AggregateToggleButton,
  AggregateTrack,
  CardGrid,
  CardItem,
  CompareLink,
  DelayBody,
  DelayHeadline,
  DelayIcon,
  DelayNotice,
  DelayText,
  Donut,
  DonutLayout,
  DonutLegend,
  DonutLegendItem,
  DonutNote,
  DonutPanel,
  DrawerNote,
  FootNote,
  FootNoteBlock,
  IssuerName,
  KindBadge,
  KoreanName,
  LegendDot,
  LegendName,
  LegendValue,
  LimitsBlock,
  LimitsIndex,
  LimitsItem,
  LimitsList,
  MetaChip,
  MetaRow,
  MetaValue,
  Monogram,
  OptionChip,
  PersonNote,
  PersonsSection,
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
 * 대가들이 함께 담은 종목 — 인물 카드 **위**의 가로 막대(2026-08-02 사용자 지시).
 *
 * 🔴 막대는 **신고 금액 합**(또는 인원 수)이지 비중(%)의 합이 아니다. 그리고 **주식 보유분만**
 * 센다 — 근거는 `aggregateHoldings` 주석(풋을 보유로 세면 방향이 뒤집힌다).
 *
 * 순위 숫자를 함께 세우는 이유: 막대 길이만으로는 3위와 4위가 눈으로 안 갈린다(정렬 기준을
 * 바꿨을 때 순서가 실제로 바뀌었는지도 순위가 있어야 보인다).
 */
function AggregateChart({ rows }: { rows: readonly AggregatedHolding[] }) {
  if (rows.length === 0) return <DonutNote>{copy.aggregate.empty}</DonutNote>;

  return (
    <AggregateList>
      {rows.map((row, index) => (
        <AggregateRow key={row.cusip}>
          <AggregateRank aria-label={copy.aggregate.rankLabel(index + 1)}>{index + 1}</AggregateRank>
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

/**
 * 인물 한 장 — **고르는 면(brand)** 이다. 공용 `PickCard` 로 그린다.
 *
 * ## 이 카드가 PickCard 인 이유
 * 판정 기준은 한 줄이다: *"여기서 무언가를 고르면 화면이 바뀌는가."* 인물을 고르면 그 사람의 신고
 * 보유가 옆 패널로 열린다 — 그래서 프리셋 카드·티커 허브 카드와 같은 급이다.
 *
 * ## 색을 다루는 방식
 * - 인물 고유색(`personColorVar`, 이름 해시)은 카드 머리의 **6px 레일**이 말한다. 레일은 높이 6px
 *   이라 틴트 면 예산에 세어지지 않는다(`tintscan` 하한 8px).
 * - 🔴 **틴트 캡을 쓸 수 없다.** 캡을 면으로 올리면 인물마다 색이 달라 클러스터 접기(같은 배경값)가
 *   먹지 않는다 — 카드 열세 장이 면 열세 개가 된다.
 * - 모노그램 배지는 *시리즈 16% 틴트 면 + 중립 글자 + 시리즈 테두리* 다(`Monogram` 주석의 처방 교정).
 *
 * ## 🔴 드로어는 카드 **밖**에 있다
 * `PickCard` 는 hover/focus 에서 `transform` 을 쓰므로 `position: fixed` 자손의 컨테이닝 블록이
 * 된다. 드로어를 카드 안에 두면 열리는 순간 전폭 패널이 카드 좌표계에 갇힌다. 그래서 격자 칸
 * (`CardItem`)이 카드와 드로어를 형제로 갖는다.
 *
 * ## 카드 안에 버튼을 넣는 자리
 * 카드 전체를 덮는 스트레치 컨트롤 **위**로 뜨는 슬롯은 `titleRight` 와 `actions` 뿐이다.
 * children 에 버튼을 넣으면 카드 클릭에 먹힌다 — 그래서 표 열기·비교 링크는 `actions` 에 있다.
 */
function InvestorEntry({ card }: { card: InvestorCardModel }) {
  const [isOpen, setIsOpen] = useState(false);
  const drawerId = useId();
  const tickers = comparableTickers(card, COMPARE_LIMIT);
  const hasOptions = card.holdings.some((row) => row.kind !== 'share');
  const personColor = personColorVar(card.person, CHART_SERIES_VARS);

  return (
    <CardItem>
      <PickCard
        as="div"
        titleAs="h3"
        title={card.person}
        subtitle={card.firm}
        ariaLabel={copy.card.openFor(card.person)}
        onClick={() => setIsOpen(true)}
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
              onClick={() => setIsOpen(true)}
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
        {/* 🔴 배지만 남기고 이 문장을 지우지 마라 — 배지는 색을, 이 줄은 사실을 진다. */}
        {card.isStale ? <StaleLine>{copy.card.stale}</StaleLine> : null}

        <PersonNote>{card.note}</PersonNote>

        <MetaRow>
          {/* 🔴 기준일은 인물마다 다르다. 전역 하나로 묶지 마라. */}
          <MetaChip>{copy.card.asOf(card.reportDate)}</MetaChip>
          <MetaChip>
            {copy.card.totalValue('')}
            <MetaValue>{formatUsdCompact(card.totalValueUsd)}</MetaValue>
          </MetaChip>
          <MetaChip>{copy.card.holdingCount(card.totalHoldingCount, card.holdings.length)}</MetaChip>
          {/* 🔴 옵션 혼재는 글자로 상시 노출한다 — 말풍선은 카드의 overflow 에 잘린다(카피 주석 참고). */}
          {hasOptions ? <OptionChip title={copy.kind.mixedNote}>{copy.kind.mixedChip}</OptionChip> : null}
        </MetaRow>

        <DonutPanel>
          <HoldingsDonut card={card} />
        </DonutPanel>
      </PickCard>

      {/* 🔴 카드 밖이다 — 위 주석의 컨테이닝 블록 함정. */}
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
        {/* 드로어 안은 폭·높이에 여유가 있어 문장 그대로 둔다 — 카드에서는 짧은 표시로 접었다. */}
        {hasOptions ? <DrawerNote>{copy.kind.mixedNote}</DrawerNote> : null}
      </SideDrawer>
    </CardItem>
  );
}

export default function InvestorsView({ viewModel }: InvestorsViewProps) {
  /* 🔴 기본은 **담은 인원 수**다(2026-08-02 사용자 지시) — 금액 순은 규모 큰 한 사람이 순위를 지배한다. */
  const [sort, setSort] = useState<AggregateSort>('holders');
  const aggregated = aggregateHoldings(viewModel.cards, AGGREGATE_LIMIT, sort);

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
        🔴 지연 경고는 목록에서 **꺼내** 맨 위에 세운다(2026-08-02 사용자 지시).
        나머지 한계와 같은 크기로 나열되면 이 화면이 "지금 보유"로 읽힌다 — 그게 유일한 실질 위험이다.
        색은 거들 뿐이고, 굵은 제목 줄과 경고 아이콘이 회색조에서도 남는다.
      */}
      <DelayNotice>
        <DelayIcon aria-hidden>
          <AlertTriangle size={ICON.xl} strokeWidth={ICON.stroke} focusable={false} />
        </DelayIcon>
        <DelayText>
          <DelayHeadline>{copy.limits.delayHeadline}</DelayHeadline>
          <DelayBody>{copy.limits.delayBody}</DelayBody>
        </DelayText>
      </DelayNotice>

      {/* 🔴 접지 않는다 — 이 데이터의 성질이라 상시로 보여야 한다. */}
      <LimitsBlock aria-labelledby="investor-limits">
        <SectionHead>
          <SectionHeading $axis="accent">
            <SectionTitle id="investor-limits">{copy.limits.title}</SectionTitle>
            <SectionSubtitle>{copy.limits.subtitle}</SectionSubtitle>
          </SectionHeading>
        </SectionHead>

        <LimitsList>
          {copy.limits.items.map((item, index) => (
            <LimitsItem key={item}>
              <LimitsIndex aria-hidden>{index + 1}</LimitsIndex>
              <span>{item}</span>
            </LimitsItem>
          ))}
        </LimitsList>
      </LimitsBlock>

      {/*
        🔴 합산 막대는 **개별 카드보다 위**다(2026-08-02 사용자 지시). 열세 명을 각각 보기 전에
        "이 사람들이 공통으로 담은 것"을 먼저 보는 것이 이 화면의 첫 질문이다.
      */}
      <AggregateBlock aria-labelledby="investor-aggregate">
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

        <AggregateChart rows={aggregated} />
      </AggregateBlock>

      <PersonsSection aria-labelledby="investor-persons">
        <SectionHead>
          <SectionHeading $axis="brand">
            <SectionTitle id="investor-persons">{copy.persons.title}</SectionTitle>
            <SectionSubtitle>{copy.persons.subtitle}</SectionSubtitle>
          </SectionHeading>
        </SectionHead>

        <CardGrid>
          {viewModel.cards.map((card) => (
            <InvestorEntry key={card.cik} card={card} />
          ))}
        </CardGrid>
      </PersonsSection>

      <FootNoteBlock>
        <FootNote>{copy.footnote.disclaimer}</FootNote>
      </FootNoteBlock>
    </Stack>
  );
}

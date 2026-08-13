import { useCallback, useMemo, useState } from 'react';
import { AlertTriangle, Users } from 'lucide-react';
import { BrandGlyph, PageFooter, PageHero, TickerSelectorBar } from '@/components/common';
import { useCompareSelection } from '@/pages/Ticker/hooks';
import { assignSeries } from '@/shared/lib/tickerSeries';
import { CHART_SERIES_VARS, ICON } from '@/shared/styles';
import { INVESTORS_COPY } from '../copy';
import { aggregateHoldings, personColorVar } from '../utils';
import type { AggregateSort, PersonColor } from '../utils';
import { ConsensusBoard, InvestorCard } from './components';
import type { InvestorsViewProps } from './InvestorsPage.types';
import {
  AggregateToggle,
  AggregateToggleButton,
  CardGrid,
  ConsensusSection,
  DelayBody,
  DelayCell,
  DelayHeadline,
  DelayIcon,
  DelayText,
  EmptyBody,
  EmptyPanel,
  EmptyTitle,
  FootNote,
  FootNoteRow,
  LimitsCell,
  LimitsHeading,
  LimitsIndex,
  LimitsItem,
  LimitsLede,
  LimitsList,
  PersonsSection,
  ReadFirstBand,
  SectionHead,
  SectionHeading,
  SectionSubtitle,
  SectionTitle,
  Stack
} from './styled';

const copy = INVESTORS_COPY;

/** 합산에 세우는 종목 수. 상위 3종은 시상대 타일, 나머지는 표로 내려간다(그 분할은 ConsensusBoard 가 안다). */
const AGGREGATE_LIMIT = 10;

/**
 * 인물 카드 격자의 **최대 열 수**(넓은 폭). 등장 연출의 계단 지연을 이 값으로 나눈다 —
 * 🔴 격자(CardGrid)의 3열과 **같은 값이어야** 계단이 줄 단위로 맞는다.
 */
const PERSON_CARD_COLUMNS = 3;

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

  /* 하단 선택 바용. 담기는 인물 카드의 보유 표(드로어)에서 하고, 상태는 sessionStorage 한 곳에 있다. */
  const compare = useCompareSelection('investors');

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
              {viewModel.cards.map((card, index) => (
                <InvestorCard
                  key={card.cik}
                  card={card}
                  personColorOf={personColorOf}
                  isOpen={openCik === card.cik}
                  onOpen={setOpenCik}
                  onClose={closeDrawer}
                  /* 🔴 지연은 **열 위치**로 준다(카드 번호가 아니라) — 번호에 비례하면 열세 번째
                     카드가 1초 뒤에 뜬다. 격자 최대 열 수(3)로 나눈 나머지가 그 줄 안의 자리다. */
                  revealDelay={(index % PERSON_CARD_COLUMNS) * 70}
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

      {/*
        🔴 하단 바는 **이 화면에 한 장뿐**이다. 인물 카드마다 그리면 열세 장이 같은 자리에 겹친다
           (`position: fixed` 라 겹친 사실이 화면에 드러나지도 않는다 — 마지막 것만 보인다).
        ⚠ 선택이 비면 컴포넌트가 스스로 `null` 을 낸다.
      */}
      <TickerSelectorBar
        selected={compare.selected}
        max={compare.max}
        min={compare.min}
        href={compare.href}
        onRemove={compare.remove}
        onClear={compare.clear}
      />
    </Stack>
  );
}

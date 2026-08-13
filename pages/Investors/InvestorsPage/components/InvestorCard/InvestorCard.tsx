/**
 * ── 인물 카드 (`/portfolio/investors` 의 세 번째 섹션) ────────────────────────
 *
 * 대가 한 명의 카드와 그 카드가 여는 보유 표 드로어 — **카드 · 구성 띠 · 보유 표 · 포지션 배지**가
 * 한 벌이라 한 파일에 산다(따로 떼면 넷이 서로의 내부 규칙을 import 하게 된다).
 * 2026-08-06 에 페이지 뷰(771줄)에서 떼어 냈다. 옮긴 것은 자리뿐이고 동작·주석은 그대로다.
 *
 * 🔴 드로어는 **카드 밖**(CardItem 안)이다 — PickCard 가 hover 에서 transform 을 쓰므로 그 안에 두면
 * position: fixed 패널이 카드 좌표계에 갇힌다. 이 규칙은 CardItem·CardReveal 주석과 한 벌이다.
 */
import { useId } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button, PickCard, SideDrawer, TickerSelectorCheckbox, TickerSelectorUnknown } from '@/components/common';
import { useCompareSelection } from '@/pages/Ticker/hooks';
import type { CompareSelection } from '@/pages/Ticker/hooks';
import { investorAvatar } from '@/shared/constants/investors';
import { useRevealOnScroll } from '@/shared/hooks';
import { CHART_SERIES_VARS, ICON, color } from '@/shared/styles';
import { INVESTORS_COPY } from '../../../copy';
import { buildDonutSlices, comparableTickers, cssVarName, formatUsdCompact, monogram } from '../../../utils';
import type { InvestorCardModel, InvestorHoldingRow, PersonColor } from '../../../utils';
import {
  Avatar,
  CardItem,
  CardReveal,
  CompareLink,
  Composition,
  CompositionLegend,
  CompositionLegendItem,
  CompositionNote,
  CompositionSegment,
  CompositionTrack,
  DrawerNote,
  DrawerSummary,
  DrawerSummaryItem,
  DrawerSummaryLabel,
  DrawerSummaryValue,
  Eyebrow,
  Figure,
  FigureCaption,
  FigureValue,
  IssuerName,
  KindBadge,
  KoreanName,
  LegendDot,
  LegendName,
  LegendValue,
  MetaLine,
  Monogram,
  OptionChip,
  PersonNote,
  StaleBadge,
  StaleLine,
  StaleNotice,
  Table,
  TableScroller,
  Td,
  TdNumeric,
  Th,
  ThNumeric,
  UnknownCell,
  VisuallyHidden
} from '../../styled';

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
function HoldingsTable({ card, compare }: { card: InvestorCardModel; compare: CompareSelection }) {
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
            <ThNumeric scope="col">{copy.holdings.compareHeader}</ThNumeric>
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
              <TdNumeric>
                {/*
                  🔴 티커를 모르는 줄은 체크박스를 **아예 두지 않는다**(꺼진 채로도 아니다).
                     바로 왼쪽 칸이 이미 "자료 없음"이라고 같은 사실을 말하고 있어서, 꺼진 체크박스를
                     덧붙이면 한 줄에서 같은 말을 두 번 하게 된다.
                  ⚠ 풋·콜 줄에도 체크박스를 둔다 — 담기는 그 **종목의 배당 자료**를 비교 표로 가져가는
                     동작이고, 포지션 방향은 왼쪽 칸의 KindMark 가 이미 말한다.
                */}
                {row.ticker === null ? (
                  <TickerSelectorUnknown reason={copy.holdings.compareUnavailable} />
                ) : (
                  <TickerSelectorCheckbox
                    ticker={row.ticker}
                    checked={compare.isSelected(row.ticker)}
                    disabled={compare.isDisabled(row.ticker)}
                    disabledReason={copy.holdings.compareUnavailable}
                    onToggle={compare.toggle}
                  />
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
export default function InvestorCard({
  card,
  personColorOf,
  isOpen,
  onOpen,
  onClose,
  revealDelay
}: {
  card: InvestorCardModel;
  personColorOf: PersonColor;
  isOpen: boolean;
  onOpen: (cik: string) => void;
  onClose: () => void;
  /** 같은 줄 안에서의 계단 지연(ms). 카드 번호가 아니라 **열 위치**로 준다(CardReveal 주석). */
  revealDelay: number;
}) {
  /* 화면에 들어올 때 오른쪽에서 밀려 들어온다. 한 번만 켜지고, 움직임 축소 설정이면 즉시 켜진다. */
  const reveal = useRevealOnScroll<HTMLDivElement>();
  const drawerId = useId();
  const tickers = comparableTickers(card, COMPARE_LIMIT);
  /*
   * 종목 비교 선택(기획서 연결①). 상태는 sessionStorage 한 곳에 있으므로, 카드마다 이 훅을 불러도
   * **모든 카드가 같은 선택을 본다** — 버핏 카드에서 둘, 켄 피셔 카드에서 하나를 담을 수 있다.
   * 하단 바는 `InvestorsPage.view` 가 한 번만 그린다(카드마다 그리면 열세 개가 겹친다).
   */
  const compare = useCompareSelection('investors');
  const hasOptions = card.holdings.some((row) => row.kind !== 'share');
  const personColor = personColorOf(card.person);

  return (
    <CardItem>
      {/* 🔴 연출 껍질은 **카드만** 감싼다 — 아래 드로어는 이 밖에 남는다(CardReveal 주석). */}
      <CardReveal ref={reveal.ref} $shown={reveal.shown} $delay={revealDelay}>
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
          /*
           * 🔴 사진은 **큰 자리**를 받는다(2026-08-05 사용자 지시). 40px 아이콘 자리에 얼굴을 넣었더니
           * 누구인지 알아볼 수 없어 사진을 넣은 의미가 사라졌다 — 이 화면에서 카드를 고르는 단서는
           * 이름보다 얼굴이 먼저다. 크기 정의·상한은 `PICK.glyphSizeLg`(112px).
           * ⚠ 명단에 사진 없는 사람이 생기면 그 자리는 같은 크기의 모노그램으로 떨어진다 —
           *   격자에서 카드 머리 높이가 흔들리지 않는 것이 더 중요하다.
           */
          glyphSize: 'lg',
          /* 🔴 얼굴은 **원형**이다(2026-08-06 사용자 지시). 프로필이라는 뜻이 모양에 실려 있고,
             사각 크롭은 배경·어깨가 함께 들어와 얼굴이 덜 도드라진다. 사진이 없어 모노그램으로
             떨어질 때도 같은 원이라 격자 머리 줄의 모양이 흔들리지 않는다. */
          glyphShape: 'circle',
          /* 🔴 사진과 이름을 **한 줄**에 세운다(2026-08-06 사용자 지시). 얼굴과 이름이 나란히 있어야
             "이 얼굴이 이 사람"이 한 번에 읽히고, 카드 머리가 두 줄에서 한 줄로 줄어 격자가 짧아진다. */
          glyphInline: true,
          glyph: investorAvatar(card.cik) ? (
            <Avatar $color={personColor} src={investorAvatar(card.cik) as string} alt="" loading="lazy" decoding="async" />
          ) : (
            <Monogram $color={personColor}>{monogram(card.person)}</Monogram>
          )
        }}
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

            {/*
              매핑된 종목이 2개 이상일 때만 — 비교는 2종부터 성립한다.
              🔴 `?from=investors` 는 **측정용**이다(2026-08-13). 이 링크는 원래부터 있었지만 출처를
                 싣지 않아, 비교 화면 도착이 어느 유입 화면 덕인지 셀 수 없었다. 담기(체크박스)와
                 같은 `from` 을 쓴다 — 둘은 같은 화면이 만든 이동이고, 나누면 이 화면의 기여가 반씩 접힌다.
            */}
            {tickers.length >= 2 ? (
              <CompareLink to={`/ticker/compare?t=${tickers.join(',')}&from=investors`}>
                {copy.holdings.compareAction}
              </CompareLink>
            ) : null}
          </>
        }
      >
        {/*
          🔴 자료가 오래됐다는 표시는 **이름·회사명 바로 아래**다(2026-08-06 사용자 지시).
          종전에는 `titleRight` 라 제목 줄 오른쪽 끝에 떨어져 있었는데, 사진이 112px 로 커지면서
          그 자리가 카드 머리의 반대쪽 끝이 되어 누구 이야기인지와 멀어졌다. 여기로 내리면
          "이 사람 · 이 회사 · 그런데 공시가 오래됐다"가 한 덩어리로 읽힌다.
          ⚠ "청산했다"가 아니라 "공시가 확인되지 않는다"까지만 말한다 — 아는 것이 거기까지다.
          🔴 배지만 남기고 문장을 지우지 마라 — 배지는 색을, 아래 줄은 사실을 진다.
        */}
        {card.isStale ? (
          <StaleNotice>
            <StaleBadge>
              <AlertTriangle size={ICON.xs} strokeWidth={ICON.stroke} aria-hidden focusable={false} />
              {copy.card.staleBadge}
            </StaleBadge>
            <StaleLine>{copy.card.stale}</StaleLine>
          </StaleNotice>
        ) : null}

        <PersonNote>{card.note}</PersonNote>

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
      </CardReveal>

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

        <HoldingsTable card={card} compare={compare} />
        {/* 드로어 안은 폭·높이에 여유가 있어 문장 그대로 둔다 — 카드에서는 짧은 표시로 접었다. */}
        {hasOptions ? <DrawerNote>{copy.kind.mixedNote}</DrawerNote> : null}
      </SideDrawer>
    </CardItem>
  );
}

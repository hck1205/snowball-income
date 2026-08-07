/**
 * ── 합의 보드 (`/portfolio/investors` 의 두 번째 섹션) ─────────────────────────
 *
 * "대가들이 함께 담은 종목" 한 덩어리 — **담은 사람 칩 + 시상대 3장 + 4위 이하 표**.
 * 2026-08-06 에 페이지 뷰(771줄)에서 이 파일로 떼어 냈다. 옮긴 것은 자리뿐이고 동작·주석은 그대로다.
 *
 * 🔴 이 컴포넌트는 **드로어를 열 줄만 안다**(`onOpenPerson`) — 드로어 자체는 인물 카드가 소유하고
 * 열림 상태는 페이지가 갖는다. 그래야 칩과 카드가 같은 드로어를 공유하면서도 서로를 모른다.
 */
import { useMemo } from 'react';
import { OverflowTooltip } from '@/components/common';
import { assignSeries } from '@/shared/lib/tickerSeries';
import { color } from '@/shared/styles';
import { INVESTORS_COPY } from '../../../copy';
import { formatUsdCompact, monogram } from '../../../utils';
import type { AggregateHolder, AggregatedHolding, PersonColor } from '../../../utils';
import { investorAvatar } from '@/shared/constants/investors';
import {
  Bar,
  Eyebrow,
  HolderChip,
  HolderChipPhoto,
  HolderCount,
  HolderStrip,
  InlineEmpty,
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
  RankTdTicker,
  RankTh,
  RankThBar,
  RankThIndex,
  RankThNumeric,
  RankThTicker,
  Track,
  VisuallyHidden
} from '../../styled';

const copy = INVESTORS_COPY;

/** 시상대에 타일로 올리는 종목 수. 4위부터는 밀도가 다른 표가 받는다. */
const PODIUM_SIZE = 3;

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
      {holders.map((holder) => {
        const avatar = investorAvatar(holder.cik);
        return (
          <HolderChip
            key={holder.cik}
            type="button"
            $color={colorOf(holder.person)}
            title={holder.person}
            aria-label={copy.aggregate.openHolder(holder.person)}
            onClick={() => onOpen(holder.cik)}
          >
            {/* 얼굴이 있으면 얼굴, 없으면 이니셜 — 어느 쪽이든 칸 크기는 같다(칩 주석 참고). */}
            {avatar ? (
              <HolderChipPhoto src={avatar} alt="" loading="lazy" decoding="async" draggable={false} />
            ) : (
              monogram(holder.person)
            )}
          </HolderChip>
        );
      })}
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
export default function ConsensusBoard({
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
                <RankThIndex scope="col">{copy.aggregate.rankHeader}</RankThIndex>
                <RankThTicker scope="col">{copy.aggregate.tickerHeader}</RankThTicker>
                <RankTh scope="col">{copy.aggregate.holdersOfLabel}</RankTh>
                <RankThNumeric scope="col">{copy.aggregate.valueHeader}</RankThNumeric>
                <RankThBar scope="col">{copy.aggregate.barHeader}</RankThBar>
              </tr>
            </thead>
            <tbody>
              {rest.map((row, index) => (
                <RankRow key={row.cusip}>
                  <RankIndex>{index + PODIUM_SIZE + 1}</RankIndex>
                  {/*
                    🔴 종목 열은 고정 폭(116px)이라 이름이 자주 잘린다 — 잘린 것을 되찾을 길이
                    반드시 있어야 한다(2026-08-07 사용자 지시). `OverflowTooltip` 은 **실제로
                    잘렸을 때만** 뜨고 hover·클릭·키보드를 모두 받는다 — 모바일은 호버가 없으므로
                    클릭 경로가 여기서는 유일한 길이다.
                    ⚠ 두 줄을 각각 감싼다. 티커와 한글명은 서로 다른 문자열이고 잘리는 시점도 다르다.
                  */}
                  <RankTdTicker>
                    <OverflowTooltip text={row.label}>
                      <RankName />
                    </OverflowTooltip>
                    {row.koreanName ? (
                      <OverflowTooltip text={row.koreanName}>
                        <RankKorean />
                      </OverflowTooltip>
                    ) : null}
                  </RankTdTicker>
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

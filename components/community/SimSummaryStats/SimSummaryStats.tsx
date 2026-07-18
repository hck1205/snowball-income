import { formatSummaryKRW } from '@/shared/utils';
import type { SimSummaryStatsProps } from './SimSummaryStats.types';
import { buildContextItems, formatMultiple, toContributionMultiple } from './SimSummaryStats.utils';
import {
  BadgeRow,
  CardStack,
  ContextLine,
  HeroLabel,
  HeroValue,
  RowCluster,
  RowHero,
  StatChain,
  StatDot,
  StatLabel,
  StatValue,
  TargetBadge
} from './SimSummaryStats.styled';

/**
 * 게시 시점 시뮬 요약 숫자(§H) — 카드 프리뷰(card)·글쓰기 첨부(attach)·리스트 행(row)
 * 세 화면이 **같은 필드·같은 포맷터**를 공유한다(§G): "글쓰기에서 본 숫자 = 카드에서 보이는 숫자".
 * 저장값은 재계산하지 않고, 투입 대비 배수만 표시 시점에 파생한다.
 */
export default function SimSummaryStats({ summary, variant }: SimSummaryStatsProps) {
  const dividend = formatSummaryKRW(summary.finalMonthlyDividend);
  const asset = formatSummaryKRW(summary.finalAssetValue);
  const multiple = toContributionMultiple(summary);

  if (variant === 'card') {
    // 조건 컨텍스트 줄 — 결과가 나온 전제(초기·월·기간·티커/목표)를 가장 약한 위계로(§2·§5).
    const contextItems = buildContextItems(summary);

    return (
      <CardStack>
        <HeroLabel>월 배당(세후)</HeroLabel>
        <HeroValue>{dividend}</HeroValue>
        {summary.targetReachedInYears !== null ? (
          <BadgeRow>
            <TargetBadge>{`${summary.targetReachedInYears}년차 목표 달성`}</TargetBadge>
          </BadgeRow>
        ) : null}
        <StatChain>
          <StatLabel>최종 자산</StatLabel>
          <StatValue>{asset}</StatValue>
          {multiple !== null ? (
            <>
              <StatDot aria-hidden="true">·</StatDot>
              <StatLabel>투입 대비</StatLabel>
              <StatValue>{formatMultiple(multiple)}</StatValue>
            </>
          ) : null}
        </StatChain>
        {contextItems.length > 0 ? <ContextLine>{contextItems.join(' · ')}</ContextLine> : null}
      </CardStack>
    );
  }

  if (variant === 'row') {
    // 리스트 행 숫자 클러스터(B안 §3-4) — 카드 3층을 hero만 축소해 옮긴다. 배지·hero 라벨·보조 체인은 카드와 동일 카피·분기.
    return (
      <RowCluster>
        <HeroLabel>월 배당(세후)</HeroLabel>
        <RowHero>{dividend}</RowHero>
        {summary.targetReachedInYears !== null ? (
          <BadgeRow>
            <TargetBadge>{`${summary.targetReachedInYears}년차 목표 달성`}</TargetBadge>
          </BadgeRow>
        ) : null}
        <StatChain>
          <StatLabel>최종 자산</StatLabel>
          <StatValue>{asset}</StatValue>
          {multiple !== null ? (
            <>
              <StatDot aria-hidden="true">·</StatDot>
              <StatLabel>투입 대비</StatLabel>
              <StatValue>{formatMultiple(multiple)}</StatValue>
            </>
          ) : null}
        </StatChain>
      </RowCluster>
    );
  }

  // attach — 글쓰기 첨부 한 줄(월 배당 · 자산 · n년, 배수 없음).
  return (
    <StatChain>
      <StatLabel>월 배당</StatLabel>
      <StatValue>{dividend}</StatValue>
      <StatDot aria-hidden="true">·</StatDot>
      <StatLabel>자산</StatLabel>
      <StatValue>{asset}</StatValue>
      <StatDot aria-hidden="true">·</StatDot>
      <StatValue>{`${summary.durationYears}년`}</StatValue>
    </StatChain>
  );
}

import { formatKRW } from '@/shared/utils';
// 부모 배럴(../../index.ts)을 경유하면 PdfReportDocument ↔ 하위 컴포넌트 순환이 된다 — 상대 경로로 직접 가져온다.
import {
  BrandIcon,
  BrandRow,
  BrandWordmark,
  CoverRibbon,
  CoverSubtitle,
  CoverTimestamp,
  CoverTitle,
  HeroGrid,
  HeroLabel,
  HeroTile,
  HeroValue,
  Narrative,
  Page,
  StackRow,
  TargetBadge
} from '../../PdfReportDocument.styled';
import { buildCoverNarrative, buildCoverSubtitle } from '../../PdfReportDocument.utils';
import { PdfPageFooter } from '../PdfPageFooter';
import type { PdfCoverPageProps } from './PdfCoverPage.types';

/** ── 1. 표지 + 핵심 지표 ───────────────────────────────────────────── */
function PdfCoverPage({ report, title, generatedLabel, themeVars }: PdfCoverPageProps) {
  const { outcome, target } = report;

  return (
    <Page data-pdf-page="cover" style={themeVars}>
      <CoverRibbon aria-hidden="true" />
      <BrandRow>
        <BrandIcon src="/app_icon.png" alt="" />
        <BrandWordmark>스노우볼 인컴</BrandWordmark>
      </BrandRow>

      <StackRow>
        <CoverTitle>{title}</CoverTitle>
        <CoverSubtitle>{buildCoverSubtitle(report)}</CoverSubtitle>
        <CoverTimestamp>{generatedLabel}</CoverTimestamp>
      </StackRow>

      <HeroGrid>
        <HeroTile wide>
          <HeroLabel>최종 자산 가치</HeroLabel>
          <HeroValue hero>{formatKRW(outcome.finalAssetValue)}</HeroValue>
        </HeroTile>
        <HeroTile>
          <HeroLabel>마지막 해 월평균 배당(세후)</HeroLabel>
          <HeroValue>{formatKRW(outcome.finalMonthlyAverageDividend)}</HeroValue>
        </HeroTile>
        <HeroTile>
          <HeroLabel>누적 순배당(세후)</HeroLabel>
          <HeroValue>{formatKRW(outcome.cumulativeNetDividend)}</HeroValue>
        </HeroTile>
        <HeroTile wide>
          <HeroLabel>투입 원금</HeroLabel>
          <HeroValue>{formatKRW(outcome.totalContribution)}</HeroValue>
        </HeroTile>
      </HeroGrid>

      {/* 목표 배지는 목표가 실제로 설정됐을 때만. target=0에 "1년차 달성"을 찍는 함정을 원천 차단한다. */}
      {target.hasTarget ? (
        <TargetBadge reached={target.reachedInYears !== null}>
          {target.reachedInYears !== null ? `${target.reachedInYears}년차 목표 달성` : '기간 내 미달성'}
        </TargetBadge>
      ) : null}

      <Narrative>{buildCoverNarrative(report)}</Narrative>
      <PdfPageFooter title={title} label="1" />
    </Page>
  );
}

export default PdfCoverPage;

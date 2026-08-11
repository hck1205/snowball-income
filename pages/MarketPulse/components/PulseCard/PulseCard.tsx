import { useMemo } from 'react';
import { ResponsiveEChart } from '@/components/common';
import { ZONE_LABEL } from '@/shared/lib/marketPulse';
import { getChartTheme } from '@/shared/styles';
import { MARKET_PULSE_COPY as copy, PULSE_EXPLAIN } from '../../copy';
import { ZONE_VISUAL, buildPulseChartOption, chartHeightOf, formatPulseDate, formatPulseValue } from '../../utils';
import { useElementWidth } from './PulseCard.utils';
import { BandScale } from '../BandScale';
import {
  CardFoot,
  CardHead,
  CardLabel,
  CardMeaning,
  CardNote,
  CardRoot,
  CardValue,
  ChartSlot,
  CompareItem,
  CompareLabel,
  CompareRow,
  CompareValue,
  ExplainBody,
  ExplainDetails,
  ExplainRow,
  ExplainSummary,
  ExplainTerm,
  MissingBox,
  PulseItem,
  ValueRow,
  ZoneTag
} from './PulseCard.styled';
import type { PulseCardProps } from './PulseCard.types';

/**
 * 지표 한 장.
 *
 * 구성: 제목·구간 배지 → 접힌 설명 → 값 → 구간 스케일 → 그래프(축·기준선) → 정의 → 기준일·출처.
 *
 * 🔴 설명 아코디언은 **제목 바로 밑**이다(2026-08-09 사용자 지시). 접혀 있으므로 훑을 때는
 *    한 줄만 차지하고, 궁금하면 숫자를 해석하기 **전에** 열어 볼 수 있다.
 */
export function PulseCard({ indicator }: PulseCardProps) {
  const visual = ZONE_VISUAL[indicator.zone];
  const explain = PULSE_EXPLAIN[indicator.id];

  const chartHeight = chartHeightOf(indicator);
  /*
   * 그래프 자리의 폭. 공포탐욕 다이얼은 이 값으로 라벨 거리·글자 크기를 좁힌다 — 좁은 화면에서
   * 픽셀 고정 거리가 칸을 벗어나던 문제(2026-08-10)의 해결점이라, 폭이 바뀌면 옵션을 다시 만든다.
   */
  const [chartSlotRef, chartWidth] = useElementWidth<HTMLDivElement>();

  /*
   * 🔴 `getChartTheme()` 은 DOM 의 CSS 변수를 읽는다 — 테마(밝게/어둡게·프리셋)가 바뀌면 값도
   *    바뀐다. 모듈 최상위에서 한 번 읽어 두면 첫 테마의 색이 영원히 굳는다.
   */
  const option = useMemo(
    /* 게이지 반지름이 보는 것과 같은 기준 — 컨테이너의 **짧은 변**이다. */
    () => buildPulseChartOption(indicator, getChartTheme(), chartWidth > 0 ? Math.min(chartWidth, chartHeight) : undefined),
    [chartHeight, chartWidth, indicator]
  );

  const observation = indicator.observation;

  return (
    <PulseItem>
      <CardRoot $tone={visual.tone} $weight={visual.weight} aria-labelledby={`pulse-${indicator.id}`}>
        <CardHead>
          <CardLabel id={`pulse-${indicator.id}`}>{indicator.label}</CardLabel>
          {/* 🔴 구간을 글자로 말한다 — 테두리 색만으로는 색각 이상 사용자에게 전달되지 않는다. */}
          <ZoneTag $tone={visual.tone}>{ZONE_LABEL[indicator.zone]}</ZoneTag>
        </CardHead>

        {/*
          🔴 **제목 바로 밑**이다(2026-08-09 사용자 지시). 숫자를 보기 **전에** "이게 무엇을 재는
             값인지"를 열어 볼 수 있어야 한다 — 카드 맨 아래에 두면 이미 숫자를 나름대로 해석한
             뒤에야 설명을 만나게 된다. 이 화면에서는 그 순서가 뒤집히면 안 된다.
          🔴 네이티브 `<details>` 를 쓴다 — 키보드·스크린리더·브라우저 검색이 전부 공짜로 따라오고,
             JS 아코디언이 흔히 놓치는 `aria-expanded`·포커스 순서를 브라우저가 맡는다.
        */}
        {explain ? (
          <ExplainDetails>
            <ExplainSummary>{copy.explainToggle}</ExplainSummary>
            <ExplainBody>
              <ExplainRow>
                <ExplainTerm>{copy.explainWhat}</ExplainTerm>
                <p>{explain.what}</p>
              </ExplainRow>
              <ExplainRow>
                <ExplainTerm>{copy.explainRead}</ExplainTerm>
                <p>{explain.read}</p>
              </ExplainRow>
              <ExplainRow>
                {/* 🔴 이 칸이 이 아코디언의 존재 이유다 — 지표가 못 하는 일을 먼저 말해 준다. */}
                <ExplainTerm>{copy.explainLimit}</ExplainTerm>
                <p>{explain.limit}</p>
              </ExplainRow>
            </ExplainBody>
          </ExplainDetails>
        ) : null}

        {observation ? (
          <>
            {/*
              🔴 기준선 대비 위치(`against`)를 여기서 **지웠다**(2026-08-09 사용자 지적: 중복).
                 그래프가 이미 `장기 평균 20` 이라고 선 옆에 적고 있어서, 같은 말을 값 옆에서
                 한 번 더 하고 있었다. 남긴 것은 그래프가 말하지 못하는 사실(`note`)뿐이다.
            */}
            {/*
              🔴 공포탐욕지수만 큰 값을 여기서 그리지 않는다 — 다이얼 한가운데가 이미 점수와
                 등급 이름을 쓴다(gauge-grade 예제 구조). 둘 다 두면 같은 숫자가 한 화면에
                 두 번, 그것도 다른 정밀도(63.69 vs 64)로 보인다.
            */}
            <ValueRow>
              {indicator.id === 'fear-greed' ? null : <CardValue>{formatPulseValue(indicator)}</CardValue>}
              {indicator.note ? <CardNote>{indicator.note}</CardNote> : null}
            </ValueRow>

            {/* 이름 붙은 구간이 있는 지표만 그린다 — 없으면 이 컴포넌트가 스스로 빠진다. */}
            <BandScale indicatorId={indicator.id} value={observation.value} label={indicator.label} />

            {/* 출처가 과거 값을 함께 준 지표(공포탐욕지수)만 이 줄이 선다. */}
            {indicator.comparisons && indicator.comparisons.length > 0 ? (
              <CompareRow>
                {indicator.comparisons.map((item) => (
                  <CompareItem key={item.label}>
                    <CompareLabel>{item.label}</CompareLabel>
                    <CompareValue>{item.value.toFixed(indicator.precision)}</CompareValue>
                  </CompareItem>
                ))}
              </CompareRow>
            ) : null}

            {option ? (
              <ChartSlot ref={chartSlotRef} $height={chartHeight} role="img" aria-label={copy.chartLabel(indicator.label)}>
                <ResponsiveEChart option={option} />
              </ChartSlot>
            ) : null}
          </>
        ) : (
          /* 🔴 못 받은 값을 마지막 값이나 0 으로 메우지 않는다 — 사유를 그대로 말한다. */
          <MissingBox>
            {copy.unavailable}
            {indicator.unavailableReason ? ` (${indicator.unavailableReason})` : ''}
          </MissingBox>
        )}

        {/*
          🔴 정의 한 줄은 **설명이 없는 지표에만** 남긴다. 아코디언의 '무엇을 재나' 칸이 같은
             이야기를 더 자세히 하고 있어, 둘 다 있으면 카드가 같은 말을 두 번 한다.
        */}
        {explain ? null : <CardMeaning>{indicator.meaning}</CardMeaning>}

        <CardFoot>
          {observation ? <span>{`${copy.asOfPrefix} ${formatPulseDate(observation.asOf)}`}</span> : null}
          <span>{`${copy.sourcePrefix} ${indicator.source}`}</span>
        </CardFoot>
      </CardRoot>
    </PulseItem>
  );
}

export default PulseCard;

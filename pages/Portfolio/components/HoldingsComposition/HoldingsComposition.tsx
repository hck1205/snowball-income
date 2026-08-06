import { useMemo } from 'react';
import { PORTFOLIO_COPY } from '../../copy';
import type { HoldingsCompositionProps } from './HoldingsComposition.types';
import { buildCompositionSlices, buildConicStops } from './HoldingsComposition.utils';
import {
  CompositionRoot,
  DonutCenter,
  DonutCenterLabel,
  DonutCenterValue,
  DonutDisc,
  DonutFrame,
  LegendBlock,
  LegendDot,
  LegendItem,
  LegendList,
  LegendName,
  LegendTitle,
  LegendValue
} from './HoldingsComposition.styled';

const copy = PORTFOLIO_COPY;

/**
 * 요약 카드 안의 **비중 도넛 + 범례**.
 *
 * ## 이 블록이 하는 약속
 * 조각 색 = 보유 표의 종목 귀 색 = 호버 면색. 셋 다 `assignSeries` 한 함수에서 나온다
 * (`shared/lib/tickerSeries`). "이 색이 곧 그 종목"이 이번 개편의 길찾기 단서이고, 화면 안에서
 * 같은 색이 두 종목을 가리키는 순간 그 단서는 거짓말이 된다 — 그래서 배정 함수가 집합 내 충돌을 피한다.
 *
 * ## 접근성
 * 🔴 도넛 자체는 **장식**(`aria-hidden`)이다. 같은 사실을 범례가 **이름 + 퍼센트 글자**로 말하므로
 * 스크린리더에는 범례만 읽힌다(원판을 읽어 줄 방법도 없고, 두 번 읽히면 소음이다).
 * 색은 결코 단독 채널이 아니다 — 회색조로 인쇄해도 범례의 순서·숫자로 비중이 그대로 읽힌다.
 */
export default function HoldingsComposition({ rows, title }: HoldingsCompositionProps) {
  const slices = useMemo(() => buildCompositionSlices(rows), [rows]);
  const stops = useMemo(() => buildConicStops(slices), [slices]);

  /* 조각이 하나도 없으면(수량 미입력·계산 제외) 빈 도넛을 그리지 않는다 — 0% 원판은 오류로 읽힌다. */
  if (slices.length === 0) return null;

  const countedTickers = rows.filter((row) => (row.weightPercent ?? 0) > 0).length;

  return (
    <CompositionRoot>
      <DonutFrame>
        <DonutDisc aria-hidden style={{ background: `conic-gradient(${stops})` }} />
        <DonutCenter aria-hidden>
          <DonutCenterValue>{countedTickers}</DonutCenterValue>
          {/* 🔴 '보유 종목'이 아니다 — 이 숫자는 비중이 잡힌 종목만 센다(근거는 카피 주석). */}
          <DonutCenterLabel>{copy.summary.composition.centerLabel}</DonutCenterLabel>
        </DonutCenter>
      </DonutFrame>

      <LegendBlock>
        <LegendTitle>{title}</LegendTitle>
        <LegendList>
          {slices.map((slice) => {
            const percentText = copy.summary.composition.percent(slice.percent);

            return (
              <LegendItem key={slice.label}>
                <LegendDot aria-hidden style={{ background: slice.paint }} />
                <LegendName>{slice.label}</LegendName>
                <LegendValue>{percentText}</LegendValue>
              </LegendItem>
            );
          })}
        </LegendList>
      </LegendBlock>
    </CompositionRoot>
  );
}

import { memo, useId } from 'react';
import { MARKET_INDEX_COPY } from '@/shared/constants/marketIndex';
import { formatChangePercent } from '@/shared/utils';
import { useMarketIndicesViewAtomValue } from '@/jotai';
import type { MarketIndexRow } from './MarketIndexStrip.types';
import { buildMarketIndexRows, formatIndexValue } from './MarketIndexStrip.utils';
import {
  Change,
  ChangeMuted,
  Header,
  Item,
  List,
  Message,
  Meta,
  Name,
  Root,
  SkeletonBar,
  StaleMark,
  Title,
  Value,
  ValueMuted,
  VisuallyHidden
} from './MarketIndexStrip.styled';

/**
 * 셀 3종 — 로딩 / 결손(이 지수만 못 받음) / 값.
 *
 * 어느 분기에서도 지수명과 셀 자리는 그대로 남는다. 그리드 5칸의 정렬이 존재해서 칸이 빠지면 다른 지수가
 * 자리를 옮겨 "이 지수는 원래 없다"로 읽히기 때문이다(환율 위젯이 변동률을 흔적 없이 생략하는 것과 반대 —
 * 그쪽은 인라인 한 줄이라 요소가 빠져도 레이아웃이 안 흔들린다).
 */
function IndexCell({ row, isLoading }: { row: MarketIndexRow; isLoading: boolean }) {
  if (isLoading) {
    return (
      <Item>
        <Name>{row.label}</Name>
        <SkeletonBar w="4.5em" aria-hidden="true" />
        <SkeletonBar w="3em" aria-hidden="true" />
      </Item>
    );
  }

  if (row.price === null) {
    return (
      <Item>
        <Name>{row.label}</Name>
        <ValueMuted aria-hidden="true">{MARKET_INDEX_COPY.dash}</ValueMuted>
        <ChangeMuted aria-hidden="true">{MARKET_INDEX_COPY.quoteUnavailableShort}</ChangeMuted>
        <VisuallyHidden>{MARKET_INDEX_COPY.quoteUnavailable}</VisuallyHidden>
      </Item>
    );
  }

  return (
    <Item>
      <Name>{row.label}</Name>
      <Value>
        {formatIndexValue(row.price)}
        <VisuallyHidden>{MARKET_INDEX_COPY.unit}</VisuallyHidden>
      </Value>
      {row.change ? (
        <>
          <Change aria-hidden="true" $direction={row.change.direction}>
            {formatChangePercent(row.change)}
          </Change>
          <VisuallyHidden>{MARKET_INDEX_COPY.changeAria(row.change)}</VisuallyHidden>
        </>
      ) : (
        <>
          <ChangeMuted aria-hidden="true">{MARKET_INDEX_COPY.dash}</ChangeMuted>
          <VisuallyHidden>{MARKET_INDEX_COPY.changeUnknown}</VisuallyHidden>
        </>
      )}
    </Item>
  );
}

/**
 * 주요 지수 스트립 (표시 전용) — 국내외 지수 5종의 현재가와 전일 대비 변동률.
 *
 * ## 쓰는 법 (5단계 랜딩 담당자용)
 * ```tsx
 * import MarketIndexStrip from '@/components/MarketIndexStrip';
 * import { useMarketIndicesSync } from '@/jotai';
 *
 * function LandingPage() {
 *   useMarketIndicesSync();   // 🔴 조회 드라이버는 "페이지"가 한 번만 부른다
 *   return <MarketIndexStrip />;
 * }
 * ```
 * - **프롭이 없다.** 이 부품은 `marketIndicesViewAtom` 을 구독만 하고 조회를 하지 않는다(환율 위젯과 같은 모델).
 * - 🔴 **드라이버를 안 부르면 영원히 스켈레톤이다.** 부품 안에서 부르면 두 곳에 놓았을 때 중복 조회가 된다.
 * - ⚠ **현재 어떤 페이지에도 붙어 있지 않다** — 최종 자리는 랜딩 히어로 하단이고 그 랜딩이 아직 없다.
 *   그래서 지금은 실제 화면에서 안 보이는 것이 정상이고, 동작은 `MarketIndexStrip.test.tsx` 가 상태별로 보여 준다.
 * - 배경이 **투명**하다. 어떤 면 위에 놓아도 되지만, 셀이 자기 배경(surfaceMuted)을 갖는 이유가 대비 검증이라
 *   셀 배경만은 바꾸지 말 것(styled 주석 참고).
 *
 * ## 상태 6종
 * loading(지수명은 실제 텍스트, 값·변동률만 스켈레톤) · success · stale(값 유지 + 업데이트 실패 표식) ·
 * error(목록 대신 한 줄 안내, 제목은 유지) · 부분 실패(자리 유지 + "불러오지 못함") ·
 * 전일값만 없음(값은 표시, 변동률 자리에 대시).
 *
 * 참고 시세라 시뮬레이션 입력·저장 payload·공유 URL 어디에도 들어가지 않는다.
 */
function MarketIndexStripComponent() {
  const view = useMarketIndicesViewAtomValue();
  const titleId = useId();

  const snapshot = view.status === 'success' || view.status === 'stale' ? view.snapshot : null;
  const isLoading = view.status === 'loading';
  // 순수·초경량(5칸)이라 useMemo 를 쓰지 않는다.
  const rows = buildMarketIndexRows(snapshot);

  return (
    <Root aria-labelledby={titleId} aria-busy={isLoading}>
      <Header>
        <Title id={titleId}>{MARKET_INDEX_COPY.title}</Title>
        <Meta>
          {MARKET_INDEX_COPY.meta}
          {view.status === 'stale' ? <StaleMark>{MARKET_INDEX_COPY.stale}</StaleMark> : null}
        </Meta>
      </Header>

      {view.status === 'error' ? (
        <Message>{MARKET_INDEX_COPY.failure}</Message>
      ) : (
        <List>
          {rows.map((row) => (
            <IndexCell key={row.symbol} row={row} isLoading={isLoading} />
          ))}
        </List>
      )}
    </Root>
  );
}

const MarketIndexStrip = memo(MarketIndexStripComponent);

export default MarketIndexStrip;

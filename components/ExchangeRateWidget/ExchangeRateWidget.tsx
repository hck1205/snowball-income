import { memo } from 'react';
import { useFxViewAtomValue } from '@/jotai';
import { formatAsOfDate, formatKrwRate } from './ExchangeRateWidget.utils';
import {
  AsOf,
  Disclaimer,
  Header,
  Message,
  Rate,
  RateLine,
  RateValue,
  Root,
  SkeletonBar,
  StaleMark,
  Title
} from './ExchangeRateWidget.styled';

const WIDGET_LABEL = '오늘의 원 달러 환율';
const WIDGET_TITLE = '원↔달러 환율';
const DISCLAIMER = '계산은 원화 기준이에요 · 결과 표시만 달러로 바꿀 수 있어요';
const FAILURE_MESSAGE = '환율을 불러오지 못했어요';

/**
 * 금일 원↔달러 환율 위젯 (표시 전용, Option A).
 *
 * 설정 드로어에 얹는 참고용 카드 — 타이틀로 "환율 위젯"임을 드러내고, 서버 프록시 `/api/fx` 의 값을
 * 그대로 그린다. 계산 엔진과 완전히 분리돼 있어(엔진에 아무것도 넘기지 않는다) 저장·공유·시뮬레이션 결과에
 * 영향이 없다.
 *
 * 조회는 이 컴포넌트가 하지 않는다 — 상태 계층의 드라이버(`useFxRateSync`, `pages/Main` 에서 1회 마운트)가
 * 조회하고 위젯은 `fxViewAtom` 을 **구독만** 한다. 결과 패널의 원↔달러 표시 토글과 같은 값을 공유하므로
 * fetch 가 중복되지 않고, 이 위젯이 언마운트돼도(모바일 드로어 접힘) 달러 표시가 죽지 않는다.
 */
function ExchangeRateWidgetComponent() {
  const view = useFxViewAtomValue();
  const hasRate = view.status === 'success' || view.status === 'stale';

  return (
    <Root aria-label={WIDGET_LABEL} aria-busy={view.status === 'loading'}>
      <Header>
        <Title>{WIDGET_TITLE}</Title>
      </Header>

      {view.status === 'loading' ? (
        <>
          <RateLine>
            <SkeletonBar w="7.5em" aria-hidden="true" />
            <SkeletonBar w="6em" aria-hidden="true" />
          </RateLine>
          <Disclaimer>{DISCLAIMER}</Disclaimer>
        </>
      ) : null}

      {hasRate ? (
        <>
          <RateLine>
            <Rate>
              $1 ≈ <RateValue>{formatKrwRate(view.rate.rate)}</RateValue>원
            </Rate>
            <AsOf>
              {formatAsOfDate(view.rate.asOf)} 기준
              {view.status === 'stale' ? <StaleMark> · 업데이트 실패</StaleMark> : null}
            </AsOf>
          </RateLine>
          <Disclaimer>{DISCLAIMER}</Disclaimer>
        </>
      ) : null}

      {view.status === 'error' ? <Message>{FAILURE_MESSAGE}</Message> : null}
    </Root>
  );
}

const ExchangeRateWidget = memo(ExchangeRateWidgetComponent);

export default ExchangeRateWidget;

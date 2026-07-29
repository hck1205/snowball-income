import { memo } from 'react';
import { computeFxChange, type FxChange } from '@/shared/lib/fx';
import { formatChangePercent } from '@/shared/utils';
import { useFxViewAtomValue } from '@/jotai';
import { formatAsOfDate, formatKrwRate } from './ExchangeRateWidget.utils';
import {
  AsOf,
  Change,
  ChangeLabel,
  ChangeValue,
  Disclaimer,
  Header,
  Message,
  Rate,
  RateGroup,
  RateLine,
  RateValue,
  Root,
  SkeletonBar,
  StaleMark,
  Title,
  VisuallyHidden
} from './ExchangeRateWidget.styled';

const WIDGET_LABEL = '오늘의 원 달러 환율';
const WIDGET_TITLE = '원↔달러 환율';
const DISCLAIMER = '계산은 원화 기준입니다 · 결과 표시만 달러로 바꿀 수 있습니다';
const FAILURE_MESSAGE = '환율을 불러오지 못했습니다';

/**
 * 비교 기준은 국내 증권 앱 관용 표기인 "전일 대비"로 통일한다 — 실제 비교 대상이 전일 *종가*라는 사실은
 * 계약 주석(`shared/lib/fx`)에 있고, 화면 문구를 "전일 종가 대비"로 늘리지 않는다.
 */
const CHANGE_LABEL = '전일 대비';

/** 색·부호가 말하는 방향을 문장으로 옮긴다(색은 단독 채널이 될 수 없다). */
const changeAria = (change: FxChange): string =>
  change.direction === 'flat'
    ? '전일 대비 변동 없음'
    : `전일 대비 ${Math.abs(change.percent).toFixed(2)}% ${change.direction === 'up' ? '상승' : '하락'}`;

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
  /*
   * 순수·초경량이라 useMemo 를 쓰지 않는다. `null` 이면 전일 종가가 없다는 뜻이고, 그건 **정상 경로**다
   * (전일값을 안 주는 폴백 공급자가 이겼거나 구버전 엣지 캐시) — 0% 로 위장하지 말고 그냥 생략한다.
   */
  const change = hasRate ? computeFxChange(view.rate.rate, view.rate.previousClose) : null;

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
            <RateGroup>
              <Rate>
                $1 ≈ <RateValue>{formatKrwRate(view.rate.rate)}</RateValue>원
              </Rate>
              {change ? (
                <>
                  <Change aria-hidden="true">
                    <ChangeLabel>{CHANGE_LABEL}</ChangeLabel>
                    <ChangeValue $direction={change.direction}>{formatChangePercent(change)}</ChangeValue>
                  </Change>
                  <VisuallyHidden>{changeAria(change)}</VisuallyHidden>
                </>
              ) : null}
            </RateGroup>
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

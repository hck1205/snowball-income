import { memo } from 'react';
import { ToggleField } from '@/components/common';
import { DISPLAY_CURRENCY_COPY } from '@/shared/constants';
import { ANALYTICS_EVENT, trackEvent } from '@/shared/lib/analytics';
import { Caption, Root } from './CurrencyToggleField.styled';
import { buildCurrencyCaption } from './CurrencyToggleField.utils';
import type { CurrencyToggleFieldProps } from './CurrencyToggleField.types';

/**
 * 표시 통화(원↔달러) 전환 행.
 *
 * 자리는 **투자 설정 카드 안**, "배당 재투자" 바로 아래다(사용자 지정).
 * 생김새는 같은 카드의 "빠른 추정 보기"/"그래프 나누어 보기"와 통일한다 — 그래서 라벨 줄을 직접
 * 조립하지 않고 그 둘과 **같은 `ToggleField`** 를 쓴다(보이는 라벨 + 우측 스위치).
 * 값이 두 개인 모드 스위치지만, 켜짐이 달러라는 사실은 라벨과 접근명·캡션이 말한다.
 *
 * ⚠ 이 컨트롤이 `components/`(재사용) 레이어에 있는 이유: `components/InvestmentSettings` 가 쓰므로
 *   `pages/Main` 안에 두면 컴포넌트가 페이지를 import 하는 역방향 의존이 된다.
 * ⚠ 트레이드오프: 좌패널은 ≤960px 에서 드로어로 접히므로 모바일에서는 드로어를 열어야 전환할 수 있다.
 *
 * 계산은 언제나 원화다 — 이 토글은 **결과 표시**만 바꾼다(입력 필드·PDF·커뮤니티는 원화 고정).
 */
function CurrencyToggleFieldComponent({ display, onChangeCurrency }: CurrencyToggleFieldProps) {
  /* `preferred`(선호)는 캡션이 쓴다 — 토글의 체크는 **적용 통화**를 따라간다(환율 실패 시 꺼진 채로 보인다). */
  const { currency, canUseUsd, status } = display;
  const caption = buildCurrencyCaption(display);

  return (
    /* section 이 아니라 group — 설정 카드 안에 랜드마크를 하나 더 만들지 않는다. */
    <Root role="group" aria-label="결과 표시 통화">
      <ToggleField
        label={DISPLAY_CURRENCY_COPY.label}
        /* 켜짐이 달러라는 사실은 라벨("달러로 표시")과 접근명, 그리고 아래 캡션이 말한다. */
        accessibleName={DISPLAY_CURRENCY_COPY.toggleAccessibleName}
        /* 환율이 없으면(loading·error) 켤 수 없다 — 켜도 원화로 떨어져 전환이 무반응처럼 보인다. */
        disabled={!canUseUsd}
        checked={currency === 'USD'}
        onChange={(event) => {
          const { checked } = event.target;
          trackEvent(ANALYTICS_EVENT.TOGGLE_CHANGED, {
            field_name: 'displayCurrency',
            value: checked,
            /* stale(갱신 실패한 옛 환율)에서 켜는 비율을 본다. */
            fx_status: status
          });
          onChangeCurrency(checked ? 'USD' : 'KRW');
        }}
      />
      {/*
       * 항상 마운트하고 내용만 교체한다 — 조건부 마운트하면 loading→success 전이가 낭독되지 않는다.
       * 비활성 사유가 컨트롤과 같은 group 안, DOM 상 인접(토글 줄 바로 아래)에 있다.
       */}
      <Caption role="status">{caption}</Caption>
    </Root>
  );
}

const CurrencyToggleField = memo(CurrencyToggleFieldComponent);

export default CurrencyToggleField;

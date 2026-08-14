import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import FxSensitivityNote from '@/pages/Main/components/FxSensitivityNote';
import { SIMULATOR_COPY } from '@/shared/constants';
import { buildFxSensitivityModel, FX_SENSITIVITY_PERCENT } from '@/shared/lib/snowball';

/**
 * **환율을 입력받지 않는 대신 성질을 말한다**는 계약 (2026-08-14).
 *
 * 엔진은 가격 단위에 척도 불변이라 환율 하나를 곱해도 결과가 그대로다. 결과를 실제로 바꾸려면
 * 매수·평가 두 환율이 필요한데, 그건 사용자에게 **20년 뒤 환율을 찍으라**는 요구가 된다 —
 * 이 사이트가 지키려는 톤과 정면으로 어긋난다. 그래서 배율이라는 성질을 드러내서 전달한다.
 */
describe('buildFxSensitivityModel', () => {
  it('해외 상장이 하나라도 있으면 안내를 낸다', () => {
    const model = buildFxSensitivityModel({ tickers: ['SCHD', '458730.KS'], fxRate: 1350 });

    expect(model.visible).toBe(true);
    expect(model.foreignTickerCount).toBe(1);
  });

  it('🔴 국내 상장만 담겼으면 내지 않는다 — 맞지 않는 경고는 다른 경고의 신뢰까지 깎는다', () => {
    const model = buildFxSensitivityModel({ tickers: ['458730.KS', '161510.KS'], fxRate: 1350 });

    expect(model.visible).toBe(false);
  });

  it('비어 있으면 내지 않는다', () => {
    expect(buildFxSensitivityModel({ tickers: [], fxRate: 1350 }).visible).toBe(false);
  });

  it('세율과 **같은 근거**로 판정한다 — 두 곳이 갈리면 모순된 화면이 된다', () => {
    // `.KQ` 도 국내다(isKoreanListedTicker 와 같은 규칙).
    expect(buildFxSensitivityModel({ tickers: ['123456.KQ'], fxRate: null }).visible).toBe(false);
  });
});

describe('FxSensitivityNote', () => {
  it('민감도와 "기본값을 두지 않았다"를 함께 말한다', () => {
    render(<FxSensitivityNote tickers={['SCHD']} fxRate={1352} />);

    expect(screen.getByText(SIMULATOR_COPY.fxSensitivity.title)).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, element) =>
          element?.textContent?.includes(SIMULATOR_COPY.fxSensitivity.closing) === true
          && element.tagName.toLowerCase() === 'p'
      )
    ).toBeInTheDocument();
  });

  it('현재 환율 실값을 함께 보여 준다', () => {
    render(<FxSensitivityNote tickers={['SCHD']} fxRate={1352} />);

    expect(screen.getByText(/1,352원/)).toBeInTheDocument();
  });

  it('환율 조회가 실패해도 민감도 문장은 남는다 — 그 문장은 환율값 없이도 참이다', () => {
    render(<FxSensitivityNote tickers={['SCHD']} fxRate={null} />);

    expect(screen.getByText(SIMULATOR_COPY.fxSensitivity.title)).toBeInTheDocument();
    expect(screen.queryByText(/원$/)).not.toBeInTheDocument();
  });

  it('국내 상장만이면 아무것도 그리지 않는다', () => {
    const { container } = render(<FxSensitivityNote tickers={['458730.KS']} fxRate={1352} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('🔴 방향을 말하지 않는다 — "이득/유리" 류 표현이 없어야 한다', () => {
    // 이 안내의 목적은 방향 제시가 아니라 "결과가 그만큼 흔들린다"는 사실이다.
    const text = `${SIMULATOR_COPY.fxSensitivity.title} ${SIMULATOR_COPY.fxSensitivity.body(
      FX_SENSITIVITY_PERCENT
    )} ${SIMULATOR_COPY.fxSensitivity.closing}`;

    for (const banned of ['유리', '이득', '기회', '전망', '예상됩니다']) {
      expect(text, banned).not.toContain(banned);
    }
  });
});

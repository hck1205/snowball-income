import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MarketPulseView from '@/pages/MarketPulse/MarketPulsePage/MarketPulsePage.view';
import { MARKET_PULSE_COPY } from '@/pages/MarketPulse/copy';

/**
 * 시장 온도 → 시뮬레이터 연결(기획서 연결⑤).
 *
 * 🔴 넛지는 지표 상태와 무관하게 늘 보인다 — 지표를 못 받아도 "타이밍보다 기간"은 참이고, 막다른
 * 화면 대신 다음 걸음을 준다. 그래서 `loading` 으로 렌더해도 시뮬레이터 링크가 있어야 한다.
 * 🔴 문구가 매수 타이밍을 권하지 않는다는 것은 `test/shared/copyTone`·설계 규율이 따로 지킨다 —
 * 여기서는 **연결이 실제로 이어지는가**(링크가 /simulator 로 가는가)만 잠근다.
 */

describe('시장 온도 → 시뮬레이터 연결', () => {
  it('상태와 무관하게 시뮬레이터로 가는 넛지가 있다', () => {
    render(
      <MemoryRouter>
        <MarketPulseView state={{ status: 'loading' }} onReload={() => {}} />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: MARKET_PULSE_COPY.simulatorNudge.title })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: new RegExp(MARKET_PULSE_COPY.simulatorNudge.cta) })).toHaveAttribute(
      'href',
      '/simulator'
    );
  });
});

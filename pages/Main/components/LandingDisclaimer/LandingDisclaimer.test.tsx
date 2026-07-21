import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import LandingDisclaimer from './LandingDisclaimer';

/**
 * 랜딩 하단 상시 고지. 네이버 재검수·일반 방문자가 URL 만 열어도 상호작용 없이 곧바로
 * "무료 계산기 · 비자문(참고용) · 비영리(무광고)"를 알 수 있어야 한다. 그래서 렌더 직후,
 * 아무 클릭·펼치기 없이 문구가 보이는지만 검증한다(반응형 @media 는 jsdom 미평가라 다루지 않는다).
 */
describe('LandingDisclaimer — 상시 고지(상호작용 없이 노출)', () => {
  it('렌더 직후 클릭·펼치기 없이 핵심 고지 문구가 보인다', () => {
    render(<LandingDisclaimer />);

    // 문구가 길어 정확일치는 취약 → 핵심 구절 부분매칭으로 가시성만 단정.
    expect(screen.getByText(/무료 배당 재투자 시뮬레이션/)).toBeInTheDocument();
    expect(screen.getByText(/투자 자문이 아니며/)).toBeInTheDocument();
    expect(screen.getByText(/비영리 개인 프로젝트/)).toBeInTheDocument();
  });

  it('고지는 aria-label "사이트 고지"를 가진 contentinfo 랜드마크다', () => {
    render(<LandingDisclaimer />);

    const footer = screen.getByRole('contentinfo', { name: /사이트 고지/ });
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveTextContent(/투자 자문이 아니며/);
  });
});

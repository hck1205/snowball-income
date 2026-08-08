import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LedgerSignInPanel } from '@/pages/Ledger/components';
import { LEDGER_COPY } from '@/pages/Ledger/copy';

/**
 * 앱 로그인 게이트의 **조판 계약**(2026-08-08 사용자 지시로 재배치).
 *
 * 요구는 셋이었다: 카드는 가운데 · 글은 왼쪽에서 시작 · 그 왼쪽이 로그인 버튼과 같은 자리.
 * 셋을 한 열(`SignInColumn`)로 묶어 풀었고, 여기서 잠그는 것은 **그 구조가 유지되는가**다 —
 * 픽셀은 테스트가 볼 수 없지만 "제목·문장·버튼이 한 부모 안에 있다"는 사실은 볼 수 있다.
 *
 * ⚠ Emotion 클래스나 계산된 스타일을 단정하지 않는다(이 레포의 금지 규칙). 대신 사용자가 읽는
 *   것과 DOM 관계만 본다.
 */

const copy = LEDGER_COPY.signIn;

const renderPanel = () => {
  const onSignIn = vi.fn();
  render(<LedgerSignInPanel headingId="signin-heading" onSignIn={onSignIn} />);
  return { onSignIn };
};

describe('읽히는 것', () => {
  it('제목과 설명이 선다', () => {
    renderPanel();

    expect(screen.getByRole('heading', { name: copy.heading })).toBeInTheDocument();
    expect(screen.getByText(copy.body)).toBeInTheDocument();
  });

  it('제공자 셋이 전부 있다 (없는 선택지가 조용히 사라지지 않는다)', () => {
    renderPanel();

    expect(screen.getByRole('button', { name: /Google/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /네이버/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /카카오/ })).toBeInTheDocument();
  });

  it('제목이 섹션의 이름이 된다 (aria-labelledby)', () => {
    renderPanel();

    expect(screen.getByRole('region', { name: copy.heading })).toBeInTheDocument();
  });
});

describe('조판 — 제목·문장·버튼이 한 열을 공유한다', () => {
  it('⭐ 셋이 같은 부모 안에 있다 (왼쪽 시작점이 갈리지 않는다)', () => {
    renderPanel();

    const heading = screen.getByRole('heading', { name: copy.heading });
    const body = screen.getByText(copy.body);
    const googleButton = screen.getByRole('button', { name: /Google/ });

    /* 제목 줄 → 열 / 문장 → 열 / 버튼 → 버튼묶음 → 열. 셋의 조상 중 하나가 같아야 한다. */
    const column = body.parentElement;
    expect(column).not.toBeNull();
    expect(column?.contains(heading)).toBe(true);
    expect(column?.contains(googleButton)).toBe(true);
  });

  it('🔴 배지는 제목 **뒤**에 온다 (오른쪽에 서려면 DOM 순서가 먼저다)', () => {
    renderPanel();

    const heading = screen.getByRole('heading', { name: copy.heading });
    const headRow = heading.parentElement;

    expect(headRow).not.toBeNull();
    expect(headRow?.firstElementChild).toBe(heading);
    expect(headRow?.children.length).toBe(2);
  });

  it('배지는 장식이라 접근성 트리에 오르지 않는다', () => {
    renderPanel();

    const heading = screen.getByRole('heading', { name: copy.heading });
    const glyph = heading.parentElement?.lastElementChild;

    expect(glyph).toHaveAttribute('aria-hidden');
  });
});

import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'jotai/react';
import { createStore } from 'jotai/vanilla';
import type { Session } from '@supabase/supabase-js';
import { CommunityAuthProvider } from '@/components/community';
import { sessionAtom } from '@/jotai/community';
import { useLedgerAppAuth } from '@/pages/Ledger/hooks';
import { baseViewModel, renderLedgerView } from './ledgerFixtures';

/**
 * `/ledger` **앱 로그인 게이트** 계약.
 *
 * 🔴 검증하는 명제는 하나다 — **앱 신원과 구글 시트 권한은 다른 층이고 중첩되지 않는다.**
 *  - 비로그인: 시트 연결 화면을 아예 그리지 않고 로그인부터 시킨다.
 *  - 구글로 로그인: 로그인은 통과했지만 **시트 접근 동의는 따로** 받는다("왜 또?"에 대한 답이 화면에 있다).
 *  - 네이버·카카오로 로그인: 구글 로그인 사용자와 **완전히 같은 화면**으로 간다(로그인을 갈아타지 않는다).
 *
 * 🔴 기대 문자열은 전부 리터럴이다(`LEDGER_COPY` 재사용은 동어반복이라 회귀를 못 잡는다).
 */

/* ── ① 화면: 세션 상태를 뷰 모델로 스텁해 사용자가 보는 것을 검증한다 ───────────────── */

describe('/ledger 앱 로그인 게이트 — 비로그인', () => {
  const signedOut = () =>
    baseViewModel({ appAuth: { isReady: true, isLoggedIn: false }, state: 'disconnected', rows: [] });

  it('로그인 유도 화면이 서고, 구글·네이버·카카오 세 갈래를 모두 제시한다', () => {
    renderLedgerView(signedOut());

    expect(screen.getByRole('heading', { level: 1, name: 'Hungry Hippo 가계부' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '가계부를 열려면 먼저 로그인합니다' })).toBeInTheDocument();
    expect(
      screen.getByText(
        '구글·네이버·카카오 중 어느 계정으로 로그인해도 됩니다. 로그인한 다음 단계에서 기록할 구글 시트를 고릅니다.'
      )
    ).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /Google 계정으로 계속하기/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /네이버로 계속하기/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /카카오로 계속하기/ })).toBeInTheDocument();
  });

  it('🔴 로그인 전에는 시트 연결 화면을 아예 그리지 않는다 — 물어볼 대상이 아직 없다', () => {
    renderLedgerView(signedOut());

    expect(screen.queryByRole('button', { name: '시트 고르기' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '새 시트 만들기' })).not.toBeInTheDocument();
    expect(screen.queryByText('가계부를 시작하는 방법을 고릅니다')).not.toBeInTheDocument();
  });

  it('제공자를 고르면 그 제공자로 앱 로그인을 시작한다', async () => {
    const user = userEvent.setup();
    const { handlers } = renderLedgerView(signedOut());

    await user.click(screen.getByRole('button', { name: /Google 계정으로 계속하기/ }));
    expect(handlers.onSignIn).toHaveBeenCalledWith('google');

    await user.click(screen.getByRole('button', { name: /카카오로 계속하기/ }));
    expect(handlers.onSignIn).toHaveBeenCalledWith('kakao');
  });

  it('🔴 연결된 채로 헤더에서 로그아웃해도 히어로에 쓰기 액션이 남지 않는다', () => {
    // 연결 상태(`connected`)를 유지한 채 세션만 빠진 순간 — 로그인 안내 위에 "항목 추가"가 뜨면 안 된다.
    renderLedgerView(baseViewModel({ appAuth: { isReady: true, isLoggedIn: false }, state: 'connected' }));

    expect(screen.getByRole('heading', { level: 2, name: '가계부를 열려면 먼저 로그인합니다' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '항목 추가' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '연결된 구글 시트를 새 탭에서 열기' })).not.toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    // 연결 요약(시트 이름)도 남지 않는다 — 볼 자격을 확인하는 중이다.
    expect(screen.queryByText(/우리집 가계부/)).not.toBeInTheDocument();
  });

  it('세션을 확인하는 동안에는 로그인 화면을 성급히 보여주지 않는다', () => {
    renderLedgerView(baseViewModel({ appAuth: { isReady: false, isLoggedIn: false }, state: 'disconnected' }));

    expect(screen.getByRole('region', { name: '로그인 상태를 확인하는 중입니다', busy: true })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Google 계정으로 계속하기/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '시트 고르기' })).not.toBeInTheDocument();
  });
});

describe('/ledger 앱 로그인 게이트 — 로그인 후', () => {
  const signedIn = () =>
    baseViewModel({ appAuth: { isReady: true, isLoggedIn: true }, state: 'disconnected', rows: [] });

  it('곧바로 시트 연결 화면으로 가고 로그인 버튼은 사라진다', () => {
    renderLedgerView(signedIn());

    expect(screen.getByRole('button', { name: '시트 고르기' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '새 시트 만들기' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Google 계정으로 계속하기/ })).not.toBeInTheDocument();
  });

  it('🔴 "이미 로그인했는데 왜 또?" — 시트 접근이 별개 권한임을 한 줄로 설명한다', () => {
    renderLedgerView(signedIn());

    expect(
      screen.getByText(
        '앱 로그인은 사용자를 확인하는 절차이고 시트 접근은 별개의 구글 권한이라, 구글 계정으로 로그인했더라도 시트 접근 동의는 따로 받습니다.'
      )
    ).toBeInTheDocument();
  });

  it('앱 로그인 계층이 없는 배포에서는 게이트도 그 설명도 없다 — 없는 절차를 설명하지 않는다', () => {
    renderLedgerView(baseViewModel({ appAuth: null, state: 'disconnected', rows: [] }));

    expect(screen.getByRole('button', { name: '시트 고르기' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Google 계정으로 계속하기/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/앱 로그인은 사용자를 확인하는 절차이고/)).not.toBeInTheDocument();
  });
});

/* ── ② 신원 층: 어느 제공자로 로그인했든 게이트 판정이 같은가 ─────────────────────── */

/**
 * 세션 스텁. `useLedgerAppAuth` 가 보는 것은 **세션의 존재**뿐이고 제공자는 보지 않는다 —
 * 이 테스트가 잠그는 것이 바로 그 사실이다(네이버 사용자를 구글로 갈아태우지 않는다).
 */
const sessionOf = (provider: string): Session =>
  ({
    access_token: `token-${provider}`,
    token_type: 'bearer',
    expires_in: 3600,
    refresh_token: `refresh-${provider}`,
    user: { id: `user-${provider}`, app_metadata: { provider }, user_metadata: {}, aud: 'authenticated' }
  }) as unknown as Session;

function GateProbe() {
  const { gate } = useLedgerAppAuth();
  return (
    <p data-testid="gate">
      {gate === null ? 'none' : `${gate.isReady ? 'ready' : 'checking'}:${gate.isLoggedIn ? 'in' : 'out'}`}
    </p>
  );
}

const renderGate = (session: Session | null) => {
  const store = createStore();
  store.set(sessionAtom, session);
  return render(
    <Provider store={store}>
      <CommunityAuthProvider>
        <GateProbe />
      </CommunityAuthProvider>
    </Provider>
  );
};

describe('/ledger 앱 신원 — 제공자와 무관하다', () => {
  it.each(['google', 'naver', 'kakao'])('%s 로 로그인한 세션은 게이트를 그대로 통과한다', async (provider) => {
    renderGate(sessionOf(provider));

    await waitFor(() => expect(screen.getByTestId('gate')).toHaveTextContent('ready:in'));
  });

  it('세션이 없으면 로그인부터 요구한다', async () => {
    renderGate(null);

    await waitFor(() => expect(screen.getByTestId('gate')).toHaveTextContent('ready:out'));
  });

  it('🔴 앱 로그인 계층이 없는 배포(Provider 없음)에서는 게이트 자체가 없다 — 죽은 로그인 버튼을 만들지 않는다', () => {
    const store = createStore();
    render(
      <Provider store={store}>
        <GateProbe />
      </Provider>
    );

    expect(screen.getByTestId('gate')).toHaveTextContent('none');
  });
});

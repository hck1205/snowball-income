import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { LoginModal, LOGIN_FAILURE_COPY } from '@/components/community/LoginModal';

/**
 * LoginModal 은 네이버를 **config-gated**로 노출한다(`isNaverEnabled`). 실 배포값은 env 이므로,
 * 활성/비활성 두 경로를 검증하려고 supabase 배럴의 `isNaverEnabled` 만 토글 가능한 getter 로 목한다
 * (LoginModal 은 이 배럴에서 값 하나 + 타입 하나만 쓰고, CommunityModal/SocialLoginButton 은
 * supabase 를 import 하지 않으므로 이 목이 다른 모듈을 오염시키지 않는다).
 *
 * 규칙(사용자 리포트 "네이버 버튼이 사라졌어" 반영):
 * - 네이버 버튼은 **항상 렌더**된다(구글/카카오는 늘 보이는데 네이버만 사라지면 회귀로 인지).
 * - env 설정(isNaverEnabled) + 검수 통과(NAVER_UNDER_REVIEW=false) → 활성, 클릭이 onSelectProvider('naver').
 * - env 미설정 → "준비 중"(pending, aria-disabled + 배지), 클릭은 에러 없이 무동작.
 * - env 있으나 네이버 앱 심사 통과 전(NAVER_UNDER_REVIEW=true) → "검수중"(pending), 클릭 무동작.
 * - 순서: **구글 → 네이버 → 카카오** (상태 무관).
 */
const naverGate = vi.hoisted(() => ({ enabled: false, underReview: false }));

vi.mock('@/shared/lib/supabase', () => ({
  get isNaverEnabled() {
    return naverGate.enabled;
  },
  get NAVER_UNDER_REVIEW() {
    return naverGate.underReview;
  },
  // 실 로직은 oauthFailure.test.ts 가 커버한다. 여기선 배너 렌더 두 분기를 결정적으로 몰기 위한 최소 목.
  selectOAuthFailureGuidance: (f: { inAppBrowser: string }) =>
    f.inAppBrowser !== 'none' ? 'in-app-browser' : 'generic'
}));

const { login } = COMMUNITY_COPY;

// 네이버 라벨은 접근명에 배지가 붙을 수 있어 부분일치로 잡는다(SocialLoginButton 관례와 동일).
const naverButton = () => screen.getByRole('button', { name: new RegExp(login.naver) });
const follows = (before: Element, after: Element) =>
  Boolean(before.compareDocumentPosition(after) & Node.DOCUMENT_POSITION_FOLLOWING);

beforeEach(() => {
  naverGate.enabled = false;
  naverGate.underReview = false;
});

describe('LoginModal — 네이버 config gate', () => {
  it('네이버 미설정(isNaverEnabled=false)이면 버튼을 숨기지 않고 "준비 중"으로 노출한다', () => {
    render(<LoginModal onClose={vi.fn()} onSelectProvider={vi.fn()} />);

    expect(screen.getByRole('button', { name: login.google })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: login.kakao })).toBeInTheDocument();

    const naver = naverButton();
    expect(naver).toBeInTheDocument();
    expect(naver).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText(login.naverPendingBadge)).toBeInTheDocument();
  });

  it('준비 중(미설정) 네이버 버튼 클릭은 에러 없이 무동작 — onSelectProvider를 부르지 않는다', async () => {
    const onSelectProvider = vi.fn();
    render(<LoginModal onClose={vi.fn()} onSelectProvider={onSelectProvider} />);

    await userEvent.click(naverButton());
    expect(onSelectProvider).not.toHaveBeenCalled();
  });

  it('네이버 활성 + 검수 통과(NAVER_UNDER_REVIEW=false)면 준비중이 아니고, 클릭이 onSelectProvider("naver")를 부른다', async () => {
    naverGate.enabled = true;
    naverGate.underReview = false;
    const onSelectProvider = vi.fn();
    render(<LoginModal onClose={vi.fn()} onSelectProvider={onSelectProvider} />);

    const naver = naverButton();
    expect(naver).not.toHaveAttribute('aria-disabled');
    expect(screen.queryByText(login.naverPendingBadge)).toBeNull();
    expect(screen.queryByText(login.naverReviewBadge)).toBeNull();

    await userEvent.click(naver);
    expect(onSelectProvider).toHaveBeenCalledWith('naver');
  });

  it('네이버 활성이어도 검수중(NAVER_UNDER_REVIEW=true)이면 "검수중"으로 노출하고 클릭은 무동작', async () => {
    naverGate.enabled = true;
    naverGate.underReview = true;
    const onSelectProvider = vi.fn();
    render(<LoginModal onClose={vi.fn()} onSelectProvider={onSelectProvider} />);

    const naver = naverButton();
    expect(naver).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText(login.naverReviewBadge)).toBeInTheDocument();

    await userEvent.click(naver);
    expect(onSelectProvider).not.toHaveBeenCalled();
  });
});

describe('LoginModal — 버튼 순서 구글 → 네이버 → 카카오', () => {
  it('네이버 비활성(준비중)이어도 세 버튼이 구글 → 네이버 → 카카오 순이다', () => {
    render(<LoginModal onClose={vi.fn()} onSelectProvider={vi.fn()} />);

    const google = screen.getByRole('button', { name: login.google });
    const naver = naverButton();
    const kakao = screen.getByRole('button', { name: login.kakao });

    expect(follows(google, naver)).toBe(true);
    expect(follows(naver, kakao)).toBe(true);
  });

  it('네이버 활성 시에도 순서는 동일하다', () => {
    naverGate.enabled = true;
    render(<LoginModal onClose={vi.fn()} onSelectProvider={vi.fn()} />);

    const google = screen.getByRole('button', { name: login.google });
    const naver = naverButton();
    const kakao = screen.getByRole('button', { name: login.kakao });

    expect(follows(google, naver)).toBe(true);
    expect(follows(naver, kakao)).toBe(true);
  });
});

describe('LoginModal — 직전 로그인 실패 안내(무음 실패 금지)', () => {
  const failure = (overrides: Record<string, unknown> = {}) => ({
    provider: 'kakao',
    reason: 'no_session' as const,
    attempts: 1,
    inAppBrowser: 'none' as const,
    contextSwitched: false,
    ...overrides
  });

  it('failure 가 없으면 실패 배너를 렌더하지 않는다', () => {
    render(<LoginModal onClose={vi.fn()} onSelectProvider={vi.fn()} />);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.queryByText(LOGIN_FAILURE_COPY.title)).toBeNull();
  });

  it('인앱 브라우저 실패면 "다른 브라우저로 열기" 안내를 role=alert 로 띄운다', () => {
    render(<LoginModal onClose={vi.fn()} onSelectProvider={vi.fn()} failure={failure({ inAppBrowser: 'kakaotalk' })} />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(LOGIN_FAILURE_COPY.title);
    expect(alert).toHaveTextContent(LOGIN_FAILURE_COPY.inAppBrowser);
  });

  it('일반 실패면 재시도 안내를 띄운다', () => {
    render(<LoginModal onClose={vi.fn()} onSelectProvider={vi.fn()} failure={failure()} />);
    expect(screen.getByRole('alert')).toHaveTextContent(LOGIN_FAILURE_COPY.generic);
  });

  it('실패 안내가 있어도 프로바이더 버튼은 그대로 눌러 재시도할 수 있다', async () => {
    const onSelectProvider = vi.fn();
    render(
      <LoginModal onClose={vi.fn()} onSelectProvider={onSelectProvider} failure={failure({ inAppBrowser: 'kakaotalk' })} />
    );
    await userEvent.click(screen.getByRole('button', { name: login.kakao }));
    expect(onSelectProvider).toHaveBeenCalledWith('kakao');
  });
});

describe('LoginModal — 프로바이더 선택 / pending', () => {
  it('구글 클릭이 onSelectProvider("google")을 부른다', async () => {
    const onSelectProvider = vi.fn();
    render(<LoginModal onClose={vi.fn()} onSelectProvider={onSelectProvider} />);
    await userEvent.click(screen.getByRole('button', { name: login.google }));
    expect(onSelectProvider).toHaveBeenCalledWith('google');
  });

  it('카카오 클릭이 onSelectProvider("kakao")을 부른다', async () => {
    const onSelectProvider = vi.fn();
    render(<LoginModal onClose={vi.fn()} onSelectProvider={onSelectProvider} />);
    await userEvent.click(screen.getByRole('button', { name: login.kakao }));
    expect(onSelectProvider).toHaveBeenCalledWith('kakao');
  });

  it('pending(로그인 진행 중)이면 프로바이더 버튼이 실제로 비활성이다', () => {
    naverGate.enabled = true;
    render(<LoginModal onClose={vi.fn()} onSelectProvider={vi.fn()} pending />);
    expect(screen.getByRole('button', { name: login.google })).toBeDisabled();
    expect(screen.getByRole('button', { name: login.kakao })).toBeDisabled();
    expect(naverButton()).toBeDisabled();
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { ANALYTICS_EVENT } from '@/shared/lib/analytics';
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
// 외부열기 버튼의 계측(CTA_CLICK) 발화를 관측하려는 spy. ANALYTICS_EVENT 상수는 실값을 유지해야
// 컴포넌트가 참조하는 CTA_CLICK 키가 살아 있으므로 importActual 로 나머지는 그대로 둔다.
const trackEventSpy = vi.hoisted(() => vi.fn());
vi.mock('@/shared/lib/analytics', async (importActual) => ({
  ...(await importActual<typeof import('@/shared/lib/analytics')>()),
  trackEvent: trackEventSpy
}));

vi.mock('@/shared/lib/supabase', () => ({
  get isNaverEnabled() {
    return naverGate.enabled;
  },
  get NAVER_UNDER_REVIEW() {
    return naverGate.underReview;
  },
  // 실 로직은 oauthFailure.test.ts 가 커버한다. 여기선 배너 렌더 두 분기를 결정적으로 몰기 위한 최소 목.
  selectOAuthFailureGuidance: (f: { inAppBrowser: string }) =>
    f.inAppBrowser !== 'none' ? 'in-app-browser' : 'generic',
  // 선제 안내 판정용 — 실 detectInAppBrowser 와 동일 로직으로 재현한다(카카오톡만이 아니라 네이버/인스타
  // 등 다른 인앱도 잡아야 "kakaotalk → 외부열기 버튼 있음 / 다른 인앱 → 배너만" 을 검증할 수 있다).
  detectInAppBrowser: (ua: string) => {
    const s = (ua ?? '').toLowerCase();
    if (s.includes('kakaotalk')) return 'kakaotalk';
    if (s.includes('naver(inapp')) return 'naver';
    if (s.includes('line/') || s.includes('line(')) return 'line';
    if (s.includes('instagram')) return 'instagram';
    if (s.includes('fban/') || s.includes('fbav/')) return 'facebook';
    return 'none';
  },
  // 클릭 핸들러 안에서만 호출돼 렌더 시엔 안 죽지만, 외부열기 버튼을 클릭하는 테스트에서 목에 없으면
  // `undefined is not a function` 으로 크래시한다(전체치환 목이라 importActual 폴백이 없음).
  buildKakaoOpenExternalUrl: (href: string) => `kakaotalk://web/openExternal?url=${encodeURIComponent(href)}`
}));

const { login } = COMMUNITY_COPY;

// 네이버 라벨은 접근명에 배지가 붙을 수 있어 부분일치로 잡는다(SocialLoginButton 관례와 동일).
const naverButton = () => screen.getByRole('button', { name: new RegExp(login.naver) });
const follows = (before: Element, after: Element) =>
  Boolean(before.compareDocumentPosition(after) & Node.DOCUMENT_POSITION_FOLLOWING);

beforeEach(() => {
  naverGate.enabled = false;
  naverGate.underReview = false;
  trackEventSpy.mockClear();
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

describe('LoginModal — 인앱 브라우저 선제 안내(무한 루프 차단)', () => {
  const KAKAO_UA =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 KAKAOTALK 10.5.0';

  // navigator.userAgent·clipboard 는 jsdom 에서 그대로 못 덮으므로 defineProperty 로 심고 정리한다.
  const setUserAgent = (value: string) =>
    Object.defineProperty(navigator, 'userAgent', { value, configurable: true });

  afterEach(() => {
    delete (navigator as unknown as Record<string, unknown>).userAgent;
    delete (navigator as unknown as Record<string, unknown>).clipboard;
  });

  const NAVER_UA =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 NAVER(inapp; search; 1234; 12.0.0)';
  const INSTAGRAM_UA =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Instagram 300.0.0';

  const inAppBanner = () => screen.getByRole('status', { name: '인앱 브라우저 로그인 안내' });
  const copyButton = () => screen.getByRole('button', { name: LOGIN_FAILURE_COPY.copyLink });
  const openExternalButton = () =>
    screen.queryByRole('button', { name: LOGIN_FAILURE_COPY.openExternal });

  it('카카오톡 인앱 UA 면 모달 열자마자(실패 기록 없이) 안내 배너 + 링크 복사 버튼을 띄운다', () => {
    setUserAgent(KAKAO_UA);
    render(<LoginModal onClose={vi.fn()} onSelectProvider={vi.fn()} />);

    const banner = inAppBanner();
    expect(banner).toHaveTextContent(LOGIN_FAILURE_COPY.inAppPreemptiveTitle);
    // 카카오톡 인앱은 2FA(기기 인증) 케이스를 명시하는 전용 카피를 보인다(generic 인앱 문구가 아님).
    expect(banner).toHaveTextContent(LOGIN_FAILURE_COPY.inAppKakao2fa);
    expect(copyButton()).toBeInTheDocument();
    // 선제 안내는 alert 가 아니라 status(polite) — 자동 낭독으로 방해하지 않는다.
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('일반 브라우저(인앱 아님) UA 면 선제 안내가 뜨지 않고 기존 동작 그대로다', () => {
    setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Safari/605.1.15');
    render(<LoginModal onClose={vi.fn()} onSelectProvider={vi.fn()} />);

    expect(screen.queryByRole('status', { name: '인앱 브라우저 로그인 안내' })).toBeNull();
    expect(screen.queryByRole('button', { name: LOGIN_FAILURE_COPY.copyLink })).toBeNull();
    // 로그인 버튼은 정상 노출.
    expect(screen.getByRole('button', { name: login.google })).toBeInTheDocument();
  });

  it('링크 복사 버튼을 누르면 clipboard.writeText(현재 URL) 호출 + 복사 완료 피드백을 보인다', async () => {
    setUserAgent(KAKAO_UA);
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    render(<LoginModal onClose={vi.fn()} onSelectProvider={vi.fn()} />);
    await userEvent.click(copyButton());

    expect(writeText).toHaveBeenCalledWith(window.location.href);
    expect(await screen.findByText(LOGIN_FAILURE_COPY.copyLinkDone)).toBeInTheDocument();
  });

  it('clipboard 가 없으면(미지원) 복사 실패 폴백 안내를 보인다', async () => {
    setUserAgent(KAKAO_UA);
    render(<LoginModal onClose={vi.fn()} onSelectProvider={vi.fn()} />);

    await userEvent.click(copyButton());
    expect(await screen.findByText(LOGIN_FAILURE_COPY.copyLinkFailed)).toBeInTheDocument();
  });

  it('인앱 UA 에서도 로그인 버튼은 그대로 눌러 시도할 수 있다', async () => {
    setUserAgent(KAKAO_UA);
    const onSelectProvider = vi.fn();
    render(<LoginModal onClose={vi.fn()} onSelectProvider={onSelectProvider} />);

    await userEvent.click(screen.getByRole('button', { name: login.kakao }));
    expect(onSelectProvider).toHaveBeenCalledWith('kakao');
  });

  it('인앱 UA + 인앱 실패 기록이 함께 있으면 선제 안내만 남기고 중복 실패 배너는 접는다', () => {
    setUserAgent(KAKAO_UA);
    render(
      <LoginModal
        onClose={vi.fn()}
        onSelectProvider={vi.fn()}
        failure={{
          provider: 'kakao',
          reason: 'no_session',
          attempts: 1,
          inAppBrowser: 'kakaotalk',
          contextSwitched: true
        }}
      />
    );

    expect(inAppBanner()).toBeInTheDocument();
    // 같은 인앱 안내가 두 번 뜨지 않도록 실패 배너(role=alert)는 접힌다.
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('카카오톡 인앱 UA 면 "외부 브라우저로 열기" 버튼을 띄우고, 클릭 시 카카오 공식 스킴으로 이동한다', async () => {
    setUserAgent(KAKAO_UA);
    // 네비 seam = window.location.assign. jsdom 에선 assign 이 non-configurable 이라 vi.spyOn 이
    // "Cannot redefine property" 로 실패한다(실측). location 자체를 configurable 한 스텁으로 통째 교체하고
    // afterEach 에서 원복한다. href 는 원본 값을 유지해 스킴 인코딩 단정이 실제 URL 을 반영하게 한다.
    const realLocation = window.location;
    const href = realLocation.href;
    const assign = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...realLocation, href, assign },
      configurable: true,
      writable: true
    });

    render(<LoginModal onClose={vi.fn()} onSelectProvider={vi.fn()} />);

    const openExternal = openExternalButton();
    expect(openExternal).toBeInTheDocument();

    await userEvent.click(openExternal as HTMLElement);
    expect(assign).toHaveBeenCalledWith('kakaotalk://web/openExternal?url=' + encodeURIComponent(href));
    // 클릭 시 CTA 계측이 발화한다(cta_name: 'open_external_browser').
    expect(trackEventSpy).toHaveBeenCalledWith(ANALYTICS_EVENT.CTA_CLICK, { cta_name: 'open_external_browser' });

    Object.defineProperty(window, 'location', { value: realLocation, configurable: true, writable: true });
  });

  it('카카오톡이 아닌 인앱(네이버)에서는 배너·링크복사는 있되 "외부 브라우저로 열기" 버튼은 없다', () => {
    setUserAgent(NAVER_UA);
    render(<LoginModal onClose={vi.fn()} onSelectProvider={vi.fn()} />);

    // 인앱이므로 선제 배너와 링크 복사는 노출된다.
    const banner = inAppBanner();
    expect(banner).toBeInTheDocument();
    expect(copyButton()).toBeInTheDocument();
    // 네이버 등 비카카오 인앱은 generic 인앱 문구를 쓴다 — 카카오 2FA(기기 인증) 전용 문구는 안 쓴다.
    expect(banner).toHaveTextContent(LOGIN_FAILURE_COPY.inAppBrowser);
    expect(banner).not.toHaveTextContent(LOGIN_FAILURE_COPY.inAppKakao2fa);
    // 카카오 공식 스킴은 카카오톡 전용이라 다른 인앱엔 외부열기 버튼이 없다.
    expect(openExternalButton()).toBeNull();
  });

  it('인스타그램 인앱에서도 외부열기 버튼은 없다(카카오톡 한정)', () => {
    setUserAgent(INSTAGRAM_UA);
    render(<LoginModal onClose={vi.fn()} onSelectProvider={vi.fn()} />);

    expect(inAppBanner()).toBeInTheDocument();
    expect(openExternalButton()).toBeNull();
  });

  it('일반 브라우저(인앱 아님)에는 외부열기 버튼이 없다', () => {
    setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Safari/605.1.15');
    render(<LoginModal onClose={vi.fn()} onSelectProvider={vi.fn()} />);

    expect(openExternalButton()).toBeNull();
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

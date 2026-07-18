import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { COMMUNITY_COPY } from '@/shared/constants/community';
import { LoginModal } from '@/components/community/LoginModal';

/**
 * LoginModal 은 네이버를 **config-gated**로 노출한다(`isNaverEnabled`). 실 배포값은 env 이므로,
 * 활성/비활성 두 경로를 검증하려고 supabase 배럴의 `isNaverEnabled` 만 토글 가능한 getter 로 목한다
 * (LoginModal 은 이 배럴에서 값 하나 + 타입 하나만 쓰고, CommunityModal/SocialLoginButton 은
 * supabase 를 import 하지 않으므로 이 목이 다른 모듈을 오염시키지 않는다).
 *
 * 규칙(사용자 리포트 "네이버 버튼이 사라졌어" 반영):
 * - 네이버 버튼은 **항상 렌더**된다(구글/카카오는 늘 보이는데 네이버만 사라지면 회귀로 인지).
 * - env 설정(isNaverEnabled) → 활성, 클릭이 onSelectProvider('naver').
 * - env 미설정 → "준비 중"(pending, aria-disabled + 배지), 클릭은 에러 없이 무동작.
 * - 순서: **구글 → 네이버 → 카카오** (env 유무와 무관).
 */
const naverGate = vi.hoisted(() => ({ enabled: false }));

vi.mock('@/shared/lib/supabase', () => ({
  get isNaverEnabled() {
    return naverGate.enabled;
  }
}));

const { login } = COMMUNITY_COPY;

// 네이버 라벨은 접근명에 배지가 붙을 수 있어 부분일치로 잡는다(SocialLoginButton 관례와 동일).
const naverButton = () => screen.getByRole('button', { name: new RegExp(login.naver) });
const follows = (before: Element, after: Element) =>
  Boolean(before.compareDocumentPosition(after) & Node.DOCUMENT_POSITION_FOLLOWING);

beforeEach(() => {
  naverGate.enabled = false;
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

  it('네이버 활성이면 준비중이 아니고, 클릭이 onSelectProvider("naver")를 부른다 (구글·카카오와 같은 경로)', async () => {
    naverGate.enabled = true;
    const onSelectProvider = vi.fn();
    render(<LoginModal onClose={vi.fn()} onSelectProvider={onSelectProvider} />);

    const naver = naverButton();
    expect(naver).not.toHaveAttribute('aria-disabled');
    expect(screen.queryByText(login.naverPendingBadge)).toBeNull();

    await userEvent.click(naver);
    expect(onSelectProvider).toHaveBeenCalledWith('naver');
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

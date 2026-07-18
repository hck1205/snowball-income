import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SocialLoginButton } from '@/components/community/SocialLoginButton';
import { COMMUNITY_COPY } from '@/shared/constants/community';

const { login } = COMMUNITY_COPY;

describe('SocialLoginButton — 프로바이더별 렌더', () => {
  it('구글 버튼은 정본 카피를 접근명으로 노출한다(로고는 접근명에 안 들어간다)', () => {
    render(<SocialLoginButton provider="google" onClick={vi.fn()} />);
    expect(screen.getByRole('button', { name: login.google })).toBeInTheDocument();
  });

  it('카카오 버튼은 정본 카피를 접근명으로 노출한다', () => {
    render(<SocialLoginButton provider="kakao" onClick={vi.fn()} />);
    expect(screen.getByRole('button', { name: login.kakao })).toBeInTheDocument();
  });

  it('네이버 버튼은 정본 카피를 노출한다', () => {
    render(<SocialLoginButton provider="naver" onClick={vi.fn()} />);
    // 준비중이면 "준비 중" 배지가 접근명에 붙을 수 있어 부분일치로 잡는다.
    expect(screen.getByRole('button', { name: new RegExp(login.naver) })).toBeInTheDocument();
  });
});

describe('SocialLoginButton — 클릭', () => {
  it('구글 클릭이 onClick을 부른다', async () => {
    const onClick = vi.fn();
    render(<SocialLoginButton provider="google" onClick={onClick} />);
    await userEvent.click(screen.getByRole('button', { name: login.google }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('카카오 클릭이 onClick을 부른다', async () => {
    const onClick = vi.fn();
    render(<SocialLoginButton provider="kakao" onClick={onClick} />);
    await userEvent.click(screen.getByRole('button', { name: login.kakao }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe('SocialLoginButton — 네이버 준비중 상태', () => {
  it('준비중이면 aria-disabled + "준비 중" 배지를 노출한다', () => {
    render(<SocialLoginButton provider="naver" pending onClick={vi.fn()} />);
    const button = screen.getByRole('button', { name: new RegExp(login.naver) });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText(login.naverPendingBadge)).toBeInTheDocument();
  });

  it('준비중이어도 클릭은 유지된다(안내 노출용) — onClick을 부른다', async () => {
    const onClick = vi.fn();
    render(<SocialLoginButton provider="naver" pending onClick={onClick} />);
    await userEvent.click(screen.getByRole('button', { name: new RegExp(login.naver) }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('준비중 버튼을 클릭하면 준비중 안내(naverPending)를 띄운다 — 무음 아님', async () => {
    render(<SocialLoginButton provider="naver" pending onClick={vi.fn()} />);
    // 클릭 전에는 안내가 없다.
    expect(screen.queryByText(login.naverPending)).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: new RegExp(login.naver) }));
    expect(screen.getByText(login.naverPending)).toBeInTheDocument();
  });

  it('호출부가 describedById로 자기 안내를 소유하면 내부 안내는 띄우지 않는다', async () => {
    render(<SocialLoginButton provider="naver" pending describedById="notice-1" onClick={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: new RegExp(login.naver) }));
    expect(screen.queryByText(login.naverPending)).toBeNull();
  });

  it('describedById가 aria-describedby로 연결된다', () => {
    render(
      <SocialLoginButton provider="naver" pending describedById="notice-1" onClick={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: new RegExp(login.naver) })).toHaveAttribute(
      'aria-describedby',
      'notice-1'
    );
  });
});

describe('SocialLoginButton — disabled(로그인 진행 중)', () => {
  it('disabled면 버튼이 비활성이고 클릭해도 onClick을 부르지 않는다', async () => {
    const onClick = vi.fn();
    render(<SocialLoginButton provider="google" disabled onClick={onClick} />);
    const button = screen.getByRole('button', { name: login.google });
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});

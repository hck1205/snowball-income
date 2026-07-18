import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CommunityProfileView from '@/pages/Community/CommunityProfilePage/CommunityProfilePage.view';
import type { CommunityProfileViewModel } from '@/pages/Community/CommunityProfilePage/CommunityProfilePage.types';
import { COMMUNITY_COPY } from '@/shared/constants/community';

/**
 * 프로필 뷰(v2 — 프로필 사진 제거판)의 표시 계약을 주입한 viewModel 로 확인한다.
 * 구조: 닉네임 카드 + 그 아래 회원 탈퇴 아코디언(기본 접힘). 아바타 UI 는 존재하지 않는다.
 * 로직(검증·요청)은 훅 테스트에서 별도로 다룬다.
 */

const p = COMMUNITY_COPY.profile;

const nickname = (over: Partial<CommunityProfileViewModel['nickname']> = {}) => ({
  value: '스노우볼러',
  onChange: vi.fn(),
  status: 'idle' as const,
  error: null,
  saved: false,
  canSave: false,
  onSave: vi.fn(),
  ...over
});

const deletion = (over: Partial<CommunityProfileViewModel['deletion']> = {}) => ({
  open: false,
  submitting: false,
  error: null,
  onStart: vi.fn(),
  onCancel: vi.fn(),
  onConfirm: vi.fn(),
  ...over
});

const makeVM = (over: Partial<CommunityProfileViewModel> = {}): CommunityProfileViewModel => ({
  authReady: true,
  isLoggedIn: true,
  onLogin: vi.fn(),
  nickname: nickname(),
  deletion: deletion(),
  ...over
});

const renderView = (vm: CommunityProfileViewModel) => render(<CommunityProfileView viewModel={vm} />);

describe('CommunityProfileView — 게이트', () => {
  it('authReady 전에는 로딩을 보여준다', () => {
    renderView(makeVM({ authReady: false }));
    expect(screen.getByText(p.loading)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: p.title })).not.toBeInTheDocument();
  });

  it('비로그인 딥링크면 표준 소셜 로그인 버튼(구글/카카오)을 보여준다', () => {
    renderView(makeVM({ isLoggedIn: false }));
    expect(screen.getByText(p.loginGateTitle)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: COMMUNITY_COPY.login.google })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: COMMUNITY_COPY.login.kakao })).toBeInTheDocument();
  });

  it('게이트의 구글 버튼 클릭이 onLogin("google")을 부른다', async () => {
    const onLogin = vi.fn();
    renderView(makeVM({ isLoggedIn: false, onLogin }));
    await userEvent.click(screen.getByRole('button', { name: COMMUNITY_COPY.login.google }));
    expect(onLogin).toHaveBeenCalledWith('google');
  });
});

describe('CommunityProfileView — 닉네임 카드 / 이메일 미노출', () => {
  it('현재 닉네임을 프리필한다', () => {
    renderView(makeVM());
    expect(screen.getByRole('textbox', { name: p.nicknameLabel })).toHaveValue('스노우볼러');
  });

  it('OAuth 이메일 주소를 화면에 렌더하지 않는다', () => {
    renderView(makeVM());
    expect(screen.queryByText((content) => /@/.test(content))).toBeNull();
  });

  it("닉네임 입력은 '내 계정' 섹션 안에 있고, 그 섹션의 유일한 버튼은 저장이다", () => {
    renderView(makeVM({ nickname: nickname({ canSave: true }) }));

    const account = screen.getByRole('region', { name: p.accountSectionLabel });
    expect(within(account).getByRole('textbox', { name: p.nicknameLabel })).toBeInTheDocument();

    const buttons = within(account).getAllByRole('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveAccessibleName(p.nicknameSave);
    // 회원 탈퇴 액션은 이 섹션에 없다(별도 아코디언).
    expect(within(account).queryByRole('button', { name: p.dangerCta })).toBeNull();
  });

  it('변경 전(canSave=false)에는 저장이 비활성이다', () => {
    renderView(makeVM({ nickname: nickname({ canSave: false }) }));
    expect(screen.getByRole('button', { name: p.nicknameSave })).toBeDisabled();
  });

  it('변경되면 저장이 활성이다', () => {
    renderView(makeVM({ nickname: nickname({ canSave: true }) }));
    expect(screen.getByRole('button', { name: p.nicknameSave })).toBeEnabled();
  });

  it('길이 에러를 aria-invalid + role="alert" + 설명 연결로 표시한다', () => {
    renderView(makeVM({ nickname: nickname({ canSave: true, error: p.errorNicknameLength }) }));
    const input = screen.getByRole('textbox', { name: p.nicknameLabel });
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent(p.errorNicknameLength);
    expect(input).toHaveAccessibleDescription(p.errorNicknameLength);
  });

  it('성공 피드백을 role="status"로 알린다', () => {
    renderView(makeVM({ nickname: nickname({ saved: true }) }));
    const statuses = screen.getAllByRole('status');
    expect(statuses.some((el) => el.textContent?.includes(p.nicknameSaved))).toBe(true);
  });
});

describe('CommunityProfileView — 아바타 UI 부재(v2)', () => {
  it('프로필 사진 썸네일(img)을 어디에도 렌더하지 않는다', () => {
    renderView(makeVM());
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('파일 업로드 입력이 존재하지 않는다', () => {
    const { container } = renderView(makeVM());
    expect(container.querySelector('input[type="file"]')).toBeNull();
  });
});

describe('CommunityProfileView — 회원 탈퇴 아코디언', () => {
  it('기본은 접힘 — 헤더 aria-expanded=false, 패널은 region + data-open=false', () => {
    renderView(makeVM());

    const header = screen.getByRole('button', { expanded: false });
    expect(header).toHaveTextContent(p.dangerTitle);
    expect(header).toHaveTextContent(p.dangerBody);

    const region = screen.getByRole('region', { name: /회원 탈퇴/ });
    expect(region).toHaveAttribute('data-open', 'false');
    // 헤더의 aria-controls 가 이 패널을 가리킨다.
    expect(header).toHaveAttribute('aria-controls', region.id);
  });

  it('헤더를 클릭하면 펼쳐지고(aria-expanded=true), 탈퇴 버튼이 패널에 노출된다', async () => {
    const user = userEvent.setup();
    renderView(makeVM());

    await user.click(screen.getByRole('button', { expanded: false }));

    const header = screen.getByRole('button', { expanded: true });
    expect(header).toBeInTheDocument();

    const region = screen.getByRole('region', { name: /회원 탈퇴/ });
    expect(region).toHaveAttribute('data-open', 'true');
    expect(within(region).getByRole('button', { name: p.dangerCta })).toBeInTheDocument();
  });

  it('탈퇴 버튼을 누르면 다이얼로그 진입(onStart)을 호출한다', async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    renderView(makeVM({ deletion: deletion({ onStart }) }));

    await user.click(screen.getByRole('button', { expanded: false }));
    const region = screen.getByRole('region', { name: /회원 탈퇴/ });
    await user.click(within(region).getByRole('button', { name: p.dangerCta }));

    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('deletion.open 이면 탈퇴 다이얼로그를 띄운다', () => {
    renderView(makeVM({ deletion: deletion({ open: true }) }));
    expect(screen.getByRole('dialog', { name: p.deleteTitle })).toBeInTheDocument();
  });
});

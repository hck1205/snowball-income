import { afterEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NaverLoginErrorBanner } from '@/pages/Community/CommunityLayout/components/NaverLoginErrorBanner';
import { COMMUNITY_COPY } from '@/shared/constants/community';

/**
 * M1 — 네이버 로그인 실패 표면화(무음 실패 제거).
 *
 * 콜백 실패는 `?naverLogin=failed` 를 달고 커뮤니티 페이지로 착지한다(naver.ts appendNaverLoginError).
 * 사용자 관점에서 (1) 그 플래그로 오면 에러가 보이고, (2) 닫으면 URL 에서 플래그가 사라지고,
 * (3) 일반 방문엔 아무것도 안 뜬다 — 이 세 가지를 사용자 행동으로 고정한다.
 *
 * vitest 는 커뮤니티 env 를 비워 두므로(isNaverEnabled=false) 실제 콜백을 태울 수 없다 →
 * 실패 파라미터를 URL 에 직접 주입해 착지 상태를 재현한다.
 */
const setUrl = (path: string) => {
  window.history.replaceState({}, '', path);
};

afterEach(() => {
  setUrl('/community');
});

describe('NaverLoginErrorBanner', () => {
  it('?naverLogin=failed 로 착지하면 실패 사유를 에러로 노출한다', async () => {
    setUrl('/community?naverLogin=failed');
    render(<NaverLoginErrorBanner />);

    const alert = await screen.findByRole('alert');
    // 원인(네이버 로그인)이 제목으로, 재사용 정본 문구가 본문으로 보인다.
    expect(alert).toHaveTextContent('네이버 로그인');
    expect(alert).toHaveTextContent(COMMUNITY_COPY.common.genericError);
  });

  it('닫으면 배너가 사라지고 URL 에서 naverLogin 플래그만 스트립된다', async () => {
    setUrl('/community?sort=recent&naverLogin=failed');
    render(<NaverLoginErrorBanner />);

    await screen.findByRole('alert');
    await userEvent.click(screen.getByRole('button', { name: COMMUNITY_COPY.common.close }));

    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
    expect(window.location.search).not.toContain('naverLogin');
    // 다른 파라미터는 보존한다.
    expect(new URLSearchParams(window.location.search).get('sort')).toBe('recent');
  });

  it('플래그가 없는 일반 방문에는 아무것도 렌더하지 않는다', () => {
    setUrl('/community');
    const { container } = render(<NaverLoginErrorBanner />);
    expect(screen.queryByRole('alert')).toBeNull();
    expect(container).toBeEmptyDOMElement();
  });
});

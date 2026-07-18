import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CommunityNavLink } from '@/components/community/CommunityNavLink';

/**
 * 게이팅 OFF — 기본 테스트 env는 VITE_SUPABASE_* 가 비어 isCommunityEnabled=false 다.
 * 이때 대시보드 헤더의 커뮤니티 진입점은 아무것도 렌더하지 않아야 한다.
 */
describe('CommunityNavLink (커뮤니티 비활성)', () => {
  it('진입 링크를 렌더하지 않는다', () => {
    const { container } = render(
      <MemoryRouter>
        <CommunityNavLink />
      </MemoryRouter>
    );

    expect(container).toBeEmptyDOMElement();
  });
});

import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SimulatorHeader from './SimulatorHeader';

/**
 * 헤더의 **랜드마크·제목 계약**을 고정한다.
 *
 * 이 헤더는 전폭 sticky 바이고 페이지의 유일한 `banner`다. 워드마크가 `brandAs="h1"`로 페이지
 * 제목을 겸하므로 h1은 정확히 1개여야 한다 — 예전 `Main.shared.styled`에 소비처 0인 `HeaderTitle`
 * (`styled.h1`)이 남아 있어 h1 중복 사고의 씨앗이었다(그래서 삭제했다).
 *
 * 레이아웃(sticky·그리드 정렬·모바일 토글의 display 전환)은 jsdom이 @media도 스태킹도 평가하지
 * 않아 **테스트로 잡히지 않는다** — 실브라우저 육안 확인 몫이다. 여기서는 DOM 계약만 단정한다.
 */
const renderHeader = (props: Parameters<typeof SimulatorHeader>[0] = {}) =>
  render(
    <MemoryRouter>
      <SimulatorHeader {...props} />
    </MemoryRouter>
  );

describe('SimulatorHeader', () => {
  it('banner 랜드마크가 정확히 하나다', () => {
    renderHeader();

    expect(screen.getAllByRole('banner')).toHaveLength(1);
  });

  it('워드마크가 페이지의 유일한 h1이다', () => {
    renderHeader({ actions: <button type="button">더보기</button> });

    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent('Snowball Income');
  });

  it('leading·status·actions 슬롯의 내용을 모두 헤더 안에 렌더한다', () => {
    renderHeader({
      leading: (
        <button type="button" aria-label="설정 열기">
          설정 열기
        </button>
      ),
      status: <span>저장 중</span>,
      actions: (
        <button type="button" aria-label="더보기">
          ⋯
        </button>
      )
    });

    const banner = screen.getByRole('banner');
    expect(within(banner).getByRole('button', { name: '설정 열기' })).toBeInTheDocument();
    expect(within(banner).getByText('저장 중')).toBeInTheDocument();
    expect(within(banner).getByRole('button', { name: '더보기' })).toBeInTheDocument();
  });

  it('actions가 없으면 우측 액션 영역을 렌더하지 않는다 (빈 슬롯이 남지 않는다)', () => {
    renderHeader();

    const banner = screen.getByRole('banner');
    // 액션 영역이 렌더되지 않으므로 헤더 안에 버튼이 하나도 없다(nav는 링크만 렌더한다).
    expect(within(banner).queryAllByRole('button')).toHaveLength(0);
  });
});

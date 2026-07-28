import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
import PageHero from './PageHero';

describe('PageHero', () => {
  it('제목을 기본으로 h2 로 그린다 — h1 은 헤더 워드마크가 갖는다', () => {
    render(createElement(PageHero, { title: '배당 시뮬레이터' }));

    expect(screen.getByRole('heading', { level: 2, name: '배당 시뮬레이터' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  });

  it('워드마크가 h1 이 아닌 페이지에서는 제목을 h1 로 올릴 수 있다', () => {
    render(createElement(PageHero, { title: '내 포트폴리오', titleAs: 'h1' }));

    expect(screen.getByRole('heading', { level: 1, name: '내 포트폴리오' })).toBeInTheDocument();
  });

  it('리드와 근거(meta)를 그린다', () => {
    render(
      createElement(PageHero, {
        title: '배당 시뮬레이터',
        lede: '포트폴리오와 투자 조건을 넣으면 장기 배당 현금흐름을 계산합니다.',
        meta: '달러로 표시 중 · 1,382원 기준'
      })
    );

    expect(screen.getByText('포트폴리오와 투자 조건을 넣으면 장기 배당 현금흐름을 계산합니다.')).toBeInTheDocument();
    expect(screen.getByText('달러로 표시 중 · 1,382원 기준')).toBeInTheDocument();
  });

  it('리드·근거·액션은 값이 없으면 아예 그리지 않는다 — 빈 자리를 남기지 않는다', () => {
    const { container } = render(createElement(PageHero, { title: '배당 시뮬레이터' }));

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(container.querySelectorAll('p')).toHaveLength(0);
  });

  it('액션 슬롯의 버튼을 그대로 노출한다', () => {
    render(
      createElement(PageHero, {
        title: '배당 시뮬레이터',
        actions: createElement('button', { type: 'button' }, '투자 설정')
      })
    );

    expect(screen.getByRole('button', { name: '투자 설정' })).toBeInTheDocument();
  });

  it('아이콘은 장식이라 접근성 트리에 남지 않는다', () => {
    const { container } = render(
      createElement(PageHero, {
        title: '배당 시뮬레이터',
        icon: createElement('img', { src: 'wallet.svg', alt: '지갑' })
      })
    );

    // 그려지긴 하되(시각 장식) 배지가 aria-hidden 이라 제목 옆에서 함께 낭독되지 않는다.
    expect(container.querySelector('img')).not.toBeNull();
    expect(screen.queryByRole('img', { name: '지갑' })).not.toBeInTheDocument();
  });
});
